import { NextResponse } from "next/server";

const BASE_RATE_PER_SQFT = Number.parseFloat(process.env.SNOW_BASE_RATE_PER_SQFT ?? "0.06");
const RATE_PER_1000_SQFT = Number.parseFloat(process.env.SNOW_RATE_PER_1000_SQFT ?? "0.02");
const SHORT_JOB_MAX_SQFT = Number.parseFloat(process.env.SNOW_SHORT_JOB_MAX_SQFT ?? "450");
const PARCEL_LAYER_URL =
  process.env.PARCEL_LAYER_URL ??
  "https://gis.lacrossecounty.org/gisserver/rest/services/ParcelLayers/Landnav_OwnerParcel_SpatialView/FeatureServer/0";

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

export async function POST(request: Request) {
  if (!PARCEL_LAYER_URL) {
    return NextResponse.json(
      { error: "Parcel data endpoint is not configured." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as { address?: string };
  if (!body.address) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 });
  }

  const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
  geocodeUrl.searchParams.set("format", "json");
  geocodeUrl.searchParams.set("limit", "1");
  geocodeUrl.searchParams.set("q", body.address);

  const geocodeResponse = await fetch(geocodeUrl.toString(), {
    headers: {
      "User-Agent": "CarterSnowRemoval/1.0 (contact: cartermoyer75@gmail.com)",
    },
    cache: "no-store",
  });

  if (!geocodeResponse.ok) {
    return NextResponse.json({ error: "Unable to locate that address." }, { status: 400 });
  }

  const geocodeData = (await geocodeResponse.json()) as Array<{ lat: string; lon: string }>;
  if (!geocodeData.length) {
    return NextResponse.json({ error: "No match found for that address." }, { status: 404 });
  }

  const { lat, lon } = geocodeData[0];

  const parcelUrl = new URL(`${PARCEL_LAYER_URL.replace(/\/$/, "")}/query`);
  parcelUrl.searchParams.set("geometry", `${lon},${lat}`);
  parcelUrl.searchParams.set("geometryType", "esriGeometryPoint");
  parcelUrl.searchParams.set("inSR", "4326");
  parcelUrl.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  parcelUrl.searchParams.set("outFields", "*");
  parcelUrl.searchParams.set("returnGeometry", "true");
  parcelUrl.searchParams.set("outSR", "3857");
  parcelUrl.searchParams.set("f", "json");

  const parcelResponse = await fetch(parcelUrl.toString(), { cache: "no-store" });
  if (!parcelResponse.ok) {
    return NextResponse.json({ error: "Unable to fetch parcel data." }, { status: 400 });
  }

  const parcelData = (await parcelResponse.json()) as {
    features?: Array<{ geometry?: { rings?: number[][][] } }>;
  };

  const geometry = parcelData.features?.[0]?.geometry?.rings;
  if (!geometry) {
    return NextResponse.json({ error: "No parcel geometry found for that address." }, { status: 404 });
  }

  const areaSqMeters = polygonArea(geometry);
  const areaSqFt = metersToSquareFeet(areaSqMeters);
  const dynamicRate = BASE_RATE_PER_SQFT + (areaSqFt / 1000) * RATE_PER_1000_SQFT;
  const price = areaSqFt * dynamicRate;
  const jobType = areaSqFt <= SHORT_JOB_MAX_SQFT ? "Short job" : "Long job";

  return NextResponse.json({
    sqft: Number(areaSqFt.toFixed(1)),
    price: Number(price.toFixed(2)),
    rate: Number(dynamicRate.toFixed(4)),
    jobType,
    timestamp: Date.now(),
  });
}
