import { NextResponse } from "next/server";

import { computeEstimate } from "@/lib/estimate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const PARCEL_LAYER_URL = process.env.PARCEL_LAYER_URL ?? "";

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit(`estimate:${clientIp}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } }
    );
  }

  if (!PARCEL_LAYER_URL) {
    return NextResponse.json(
      { error: "Parcel data endpoint is not configured." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as { address?: string; urgentService?: boolean };
  if (!body.address) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 });
  }
  const estimate = await computeEstimate(body.address, Boolean(body.urgentService));
  if (!estimate) {
    return NextResponse.json({ error: "No parcel geometry found for that address." }, { status: 404 });
  }

  return NextResponse.json({
    ...estimate,
    timestamp: Date.now(),
  });
}
