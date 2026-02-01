const envNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Read environment variables at runtime instead of module load time
const getEnvConfig = () => ({
  BASE_RATE_PER_SQFT: envNumber(process.env.SNOW_BASE_RATE_PER_SQFT, 0.06),
  RATE_PER_1000_SQFT: envNumber(process.env.SNOW_RATE_PER_1000_SQFT, 0.02),
  SHORT_JOB_MAX_SQFT: envNumber(process.env.SNOW_SHORT_JOB_MAX_SQFT, 450),
  PARCEL_LAYER_URL:
    process.env.PARCEL_LAYER_URL ??
    "https://services3.arcgis.com/n6uYoouQZW75n5WI/arcgis/rest/services/Wisconsin_Statewide_Parcels/FeatureServer/0",
  ORS_API_KEY: process.env.ORS_API_KEY ?? "",
  DRIVE_ORIGIN_ADDRESS: process.env.DRIVE_ORIGIN_ADDRESS ?? "401 Gillette St, La Crosse, WI 54603",
  DRIVE_PER_MILE_RATE: envNumber(process.env.DRIVE_PER_MILE_RATE, 1.5),
  DRIVE_HOURLY_RATE: envNumber(process.env.DRIVE_HOURLY_RATE, 15),
  DRIVE_FREE_MINUTES: envNumber(process.env.DRIVE_FREE_MINUTES, 15),
  SERVICE_AREA_SQRT_FACTOR: envNumber(process.env.SNOW_SERVICE_AREA_SQRT_FACTOR, 5),
});

const metersToSquareFeet = (sqMeters: number) => sqMeters * 10.7639;

const haversineMiles = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusMiles = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(h));
};

const fetchOrsRouteSummary = async (
  origin: { lat: number; lon: number },
  destination: { lat: number; lon: number },
  apiKey: string
) => {
  if (!apiKey) {
    return { summary: null, status: "Missing ORS_API_KEY" };
  }

  const orsUrl = new URL("https://api.openrouteservice.org/v2/directions/driving-car");
  orsUrl.searchParams.set("start", `${origin.lon},${origin.lat}`);
  orsUrl.searchParams.set("end", `${destination.lon},${destination.lat}`);

  const orsResponse = await fetch(orsUrl.toString(), {
    headers: {
      Authorization: apiKey,
      Accept: "application/json",
      "User-Agent": "CarterSnowRemoval/1.0 (contact: cartermoyer75@gmail.com)",
    },
    cache: "no-store",
  });

  if (!orsResponse.ok) {
    let errorBody = "";
    try {
      errorBody = (await orsResponse.text()).trim();
    } catch {
      // Ignore response parsing errors.
    }
    return {
      summary: null,
      status: `ORS ${orsResponse.status} ${orsResponse.statusText}${errorBody ? `: ${errorBody}` : ""}`,
    };
  }

  const orsData = (await orsResponse.json()) as {
    features?: Array<{ properties?: { summary?: { distance?: number; duration?: number } } }>;
  };
  const summary = orsData.features?.[0]?.properties?.summary ?? null;
  return { summary, status: summary ? "OK" : "ORS missing summary" };
};

const fetchOsrmRouteSummary = async (origin: { lat: number; lon: number }, destination: { lat: number; lon: number }) => {
  const osrmUrl = new URL(
    `https://router.project-osrm.org/route/v1/driving/${origin.lon},${origin.lat};${destination.lon},${destination.lat}`
  );
  osrmUrl.searchParams.set("overview", "false");
  osrmUrl.searchParams.set("alternatives", "false");

  const osrmResponse = await fetch(osrmUrl.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "CarterSnowRemoval/1.0 (contact: cartermoyer75@gmail.com)",
    },
    cache: "no-store",
  });

  if (!osrmResponse.ok) {
    let errorBody = "";
    try {
      errorBody = (await osrmResponse.text()).trim();
    } catch {
      // Ignore response parsing errors.
    }
    return {
      summary: null,
      status: `OSRM ${osrmResponse.status} ${osrmResponse.statusText}${errorBody ? `: ${errorBody}` : ""}`,
    };
  }

  const osrmData = (await osrmResponse.json()) as {
    routes?: Array<{ distance?: number; duration?: number }>;
    code?: string;
  };
  const route = osrmData.routes?.[0];
  const summary = route?.distance && route?.duration ? { distance: route.distance, duration: route.duration } : null;
  return { summary, status: summary ? "OK" : `OSRM response code ${osrmData.code ?? "unknown"}` };
};

const ringArea = (ring: number[][]) => {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
};

const polygonArea = (rings: number[][][]) => {
  let total = 0;
  for (const ring of rings) {
    total += ringArea(ring);
  }
  return Math.abs(total);
};

const smallestParcelAreaSqMeters = (features: Array<{ geometry?: { rings?: number[][][] } }>) => {
  let smallest = Number.POSITIVE_INFINITY;
  for (const feature of features) {
    const rings = feature.geometry?.rings;
    if (!rings || !rings.length) {
      continue;
    }
    const area = polygonArea(rings);
    if (area > 0 && area < smallest) {
      smallest = area;
    }
  }

  return Number.isFinite(smallest) ? smallest : null;
};

const geocodeAddress = async (address: string) => {
  const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
  geocodeUrl.searchParams.set("format", "json");
  geocodeUrl.searchParams.set("limit", "1");
  geocodeUrl.searchParams.set("q", address);

  const geocodeResponse = await fetch(geocodeUrl.toString(), {
    headers: {
      "User-Agent": "CarterSnowRemoval/1.0 (contact: cartermoyer75@gmail.com)",
    },
    cache: "no-store",
  });

  if (!geocodeResponse.ok) {
    return null;
  }

  const geocodeData = (await geocodeResponse.json()) as Array<{ lat: string; lon: string }>;
  if (!geocodeData.length) {
    return null;
  }

  return {
    lat: Number.parseFloat(geocodeData[0].lat),
    lon: Number.parseFloat(geocodeData[0].lon),
  };
};

export const computeEstimate = async (address: string, urgentService: boolean) => {
  const config = getEnvConfig();
  
  const destination = await geocodeAddress(address);
  if (!destination) {
    return null;
  }

  if (!config.PARCEL_LAYER_URL) {
    return null;
  }

  const parcelUrl = new URL(`${config.PARCEL_LAYER_URL.replace(/\/$/, "")}/query`);
  parcelUrl.searchParams.set("geometry", `${destination.lon},${destination.lat}`);
  parcelUrl.searchParams.set("geometryType", "esriGeometryPoint");
  parcelUrl.searchParams.set("inSR", "4326");
  parcelUrl.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  parcelUrl.searchParams.set("outFields", "*");
  parcelUrl.searchParams.set("returnGeometry", "true");
  parcelUrl.searchParams.set("outSR", "3857");
  parcelUrl.searchParams.set("distance", "10");
  parcelUrl.searchParams.set("units", "esriSRUnit_Meter");
  parcelUrl.searchParams.set("f", "json");

  const parcelResponse = await fetch(parcelUrl.toString(), { cache: "no-store" });
  if (!parcelResponse.ok) {
    return null;
  }

  const parcelData = (await parcelResponse.json()) as {
    features?: Array<{ geometry?: { rings?: number[][][] } }>;
  };

  const areaSqMeters = parcelData.features
    ? smallestParcelAreaSqMeters(parcelData.features)
    : null;

  if (!areaSqMeters) {
    return null;
  }
  const rawSqFt = metersToSquareFeet(areaSqMeters);
  const areaSqFt = Math.sqrt(rawSqFt) * config.SERVICE_AREA_SQRT_FACTOR;
  const sizeFactor = Math.log10(areaSqFt / 1000 + 1);
  const dynamicRate = config.BASE_RATE_PER_SQFT + sizeFactor * config.RATE_PER_1000_SQFT;
  const basePrice = areaSqFt * dynamicRate;
  const upchargeAmount = urgentService ? basePrice * 0.1 : 0;
  const price = basePrice + upchargeAmount;
  const jobType = areaSqFt <= config.SHORT_JOB_MAX_SQFT ? "Short job" : "Long job";

  let driveFee = 0;
  let driveMiles = 0;
  let driveMinutes = 0;
  let roundTripMiles = 0;
  let roundTripMinutes = 0;
  const origin = await geocodeAddress(config.DRIVE_ORIGIN_ADDRESS);
  if (origin) {
    let summary = null as null | { distance?: number; duration?: number };

    const orsResult = await fetchOrsRouteSummary(origin, destination, config.ORS_API_KEY);
    summary = orsResult.summary;

    if (!summary) {
      const osrmResult = await fetchOsrmRouteSummary(origin, destination);
      summary = osrmResult.summary;
    }

    if (summary?.distance && summary?.duration) {
      const straightLineMiles = haversineMiles(origin, destination);
      driveMiles = straightLineMiles;
      driveMinutes = summary.duration / 60;
      roundTripMiles = driveMiles * 2;
      roundTripMinutes = driveMinutes * 2;
      if (driveMinutes > config.DRIVE_FREE_MINUTES) {
        const mileageFee = driveMiles * config.DRIVE_PER_MILE_RATE;
        const timeFee = (roundTripMinutes * config.DRIVE_HOURLY_RATE) / 60;
        driveFee = Math.max(mileageFee, timeFee);
      }
    }
  }

  return {
    sqft: Number(areaSqFt.toFixed(1)),
    price: Number(price.toFixed(2)),
    basePrice: Number(basePrice.toFixed(2)),
    upchargeAmount: Number(upchargeAmount.toFixed(2)),
    upchargeApplied: urgentService,
    rate: Number(dynamicRate.toFixed(4)),
    jobType,
    driveFee: Number(driveFee.toFixed(2)),
    driveMiles: Number(driveMiles.toFixed(2)),
    driveMinutes: Number(driveMinutes.toFixed(1)),
    roundTripMiles: Number(roundTripMiles.toFixed(2)),
    roundTripMinutes: Number(roundTripMinutes.toFixed(1)),
  };
};