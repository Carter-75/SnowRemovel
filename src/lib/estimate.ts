const envNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
};

const BASE_RATE_PER_SQFT = envNumber(process.env.SNOW_BASE_RATE_PER_SQFT, 0.06);
const RATE_PER_1000_SQFT = envNumber(process.env.SNOW_RATE_PER_1000_SQFT, 0.02);
const SHORT_JOB_MAX_SQFT = envNumber(process.env.SNOW_SHORT_JOB_MAX_SQFT, 450);
const PARCEL_LAYER_URL =
  process.env.PARCEL_LAYER_URL ??
  "https://services3.arcgis.com/n6uYoouQZW75n5WI/arcgis/rest/services/Wisconsin_Statewide_Parcels/FeatureServer/0";
const ORS_API_KEY = process.env.ORS_API_KEY ?? "";
const DRIVE_ORIGIN_ADDRESS =
  process.env.DRIVE_ORIGIN_ADDRESS ?? "401 Gillette St, La Crosse, WI 54603";
const DRIVE_MPG = envNumber(process.env.DRIVE_MPG, 30);
const DRIVE_GAS_PRICE = envNumber(process.env.DRIVE_GAS_PRICE, 3.5);
const DRIVE_WEAR_RATE = envNumber(process.env.DRIVE_WEAR_RATE, 0.1);
const DRIVE_PER_MILE_RATE = envNumber(process.env.DRIVE_PER_MILE_RATE, 1.5);
const DRIVE_HOURLY_RATE = envNumber(process.env.DRIVE_HOURLY_RATE, 15);
const DRIVE_FREE_MINUTES = envNumber(process.env.DRIVE_FREE_MINUTES, 15);
const DRIVE_HALF_UPFRONT_MINUTES = envNumber(process.env.DRIVE_HALF_UPFRONT_MINUTES, 30);
const DRIVE_FULL_UPFRONT_MINUTES = envNumber(process.env.DRIVE_FULL_UPFRONT_MINUTES, 60);
const SERVICE_AREA_SQRT_FACTOR = envNumber(process.env.SNOW_SERVICE_AREA_SQRT_FACTOR, 5);

const metersToSquareFeet = (sqMeters: number) => sqMeters * 10.7639;

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
  const destination = await geocodeAddress(address);
  if (!destination) {
    return null;
  }

  if (!PARCEL_LAYER_URL) {
    return null;
  }

  const parcelUrl = new URL(`${PARCEL_LAYER_URL.replace(/\/$/, "")}/query`);
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
  const areaSqFt = Math.sqrt(rawSqFt) * SERVICE_AREA_SQRT_FACTOR;
  const sizeFactor = Math.log10(areaSqFt / 1000 + 1);
  const dynamicRate = BASE_RATE_PER_SQFT + sizeFactor * RATE_PER_1000_SQFT;
  const basePrice = areaSqFt * dynamicRate;
  const upchargeAmount = urgentService ? basePrice * 0.1 : 0;
  const price = basePrice + upchargeAmount;
  const jobType = areaSqFt <= SHORT_JOB_MAX_SQFT ? "Short job" : "Long job";

  let driveFee = 0;
  let driveMiles = 0;
  let driveMinutes = 0;
  let roundTripMiles = 0;
  let roundTripMinutes = 0;
  let upfrontFee = 0;
  let driveFeeStatus: string | null = null;
  if (ORS_API_KEY) {
    const origin = await geocodeAddress(DRIVE_ORIGIN_ADDRESS);
    if (origin) {
      const orsUrl = new URL("https://api.openrouteservice.org/v2/directions/driving-car");
      orsUrl.searchParams.set("start", `${origin.lon},${origin.lat}`);
      orsUrl.searchParams.set("end", `${destination.lon},${destination.lat}`);

      const orsResponse = await fetch(orsUrl.toString(), {
        headers: {
          Authorization: ORS_API_KEY,
          Accept: "application/json",
          "User-Agent": "CarterSnowRemoval/1.0 (contact: cartermoyer75@gmail.com)",
        },
        cache: "no-store",
      });

      if (orsResponse.ok) {
        const orsData = (await orsResponse.json()) as {
          features?: Array<{ properties?: { summary?: { distance?: number; duration?: number } } }>;
        };
        const summary = orsData.features?.[0]?.properties?.summary;
        if (summary?.distance && summary?.duration) {
          driveMiles = summary.distance / 1609.34;
          driveMinutes = summary.duration / 60;
          roundTripMiles = driveMiles * 2;
          roundTripMinutes = driveMinutes * 2;
          if (driveMinutes > DRIVE_FREE_MINUTES) {
            const gasPerMile = DRIVE_GAS_PRICE / DRIVE_MPG;
            const perMileCost = Math.max(DRIVE_PER_MILE_RATE, gasPerMile + DRIVE_WEAR_RATE);
            const oneWayCost = driveMiles * perMileCost;
            const roundTripHours = (summary.duration * 2) / 3600;
            const timePay = roundTripHours * DRIVE_HOURLY_RATE;
            driveFee = Math.max(oneWayCost * 1.5, timePay);
          }
          if (driveMinutes >= DRIVE_FULL_UPFRONT_MINUTES) {
            upfrontFee = (price + driveFee) / 2;
          } else if (driveMinutes >= DRIVE_HALF_UPFRONT_MINUTES) {
            upfrontFee = driveFee / 2;
          }
        } else {
          driveFeeStatus = "Routing data missing; travel fee not applied.";
        }
      } else {
        let statusDetail = `Routing request failed (${orsResponse.status} ${orsResponse.statusText}).`;
        try {
          const errorText = await orsResponse.text();
          if (errorText.trim()) {
            statusDetail = `${statusDetail} ${errorText.trim()}`;
          }
        } catch {
          // Ignore response parsing errors.
        }
        driveFeeStatus = `${statusDetail} Travel fee not applied.`;
      }
    } else {
      driveFeeStatus = "Origin address could not be geocoded; travel fee not applied.";
    }
  } else {
    driveFeeStatus = "Missing ORS_API_KEY; travel fee not applied.";
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
    upfrontFee: Number(upfrontFee.toFixed(2)),
    driveFeeStatus,
  };
};