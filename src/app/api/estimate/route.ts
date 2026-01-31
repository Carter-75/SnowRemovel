import { NextResponse } from "next/server";

import { computeEstimate } from "@/lib/estimate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const parcelLayerUrl = process.env.PARCEL_LAYER_URL ?? "";
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(`estimate:${clientIp}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } }
    );
  }

  if (!parcelLayerUrl) {
    return NextResponse.json(
      { error: "Parcel data endpoint is not configured." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as { address?: string; urgentService?: boolean };
  const address = body.address?.trim() ?? "";
  if (!address) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 });
  }
  if (address.length > 200) {
    return NextResponse.json({ error: "Address is too long." }, { status: 400 });
  }
  const estimate = await computeEstimate(address, Boolean(body.urgentService));
  if (!estimate) {
    return NextResponse.json({ error: "No parcel geometry found for that address." }, { status: 404 });
  }

  return NextResponse.json({
    ...estimate,
    timestamp: Date.now(),
  });
}
