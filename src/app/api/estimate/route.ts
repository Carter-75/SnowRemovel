import { NextResponse } from "next/server";

import { computeEstimate } from "@/lib/estimate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Database functions for address discount tracking
const getAddressKey = (address: string) => `discount:${address.toLowerCase().trim()}`;

const getAddressDiscount = async (address: string): Promise<{ timestamp: number; expired: boolean } | null> => {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  try {
    const { kv } = await import("@vercel/kv");
    const data = await kv.get<{ timestamp: number; expired: boolean }>(getAddressKey(address));
    return data;
  } catch {
    return null;
  }
};

const setAddressDiscount = async (address: string, timestamp: number) => {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return;
  }
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(getAddressKey(address), { timestamp, expired: false });
  } catch {
    // Ignore storage errors
  }
};

const markAddressExpired = async (address: string) => {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return;
  }
  try {
    const { kv } = await import("@vercel/kv");
    const existing = await getAddressDiscount(address);
    if (existing) {
      await kv.set(getAddressKey(address), { ...existing, expired: true });
    }
  } catch {
    // Ignore storage errors
  }
};

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

  // Check if this address already has discount tracking
  const existingDiscount = await getAddressDiscount(address);
  let timestampToUse = Date.now();
  let discountExpired = false;

  if (existingDiscount) {
    timestampToUse = existingDiscount.timestamp;
    discountExpired = existingDiscount.expired;

    // Check if discount time has expired (10 minutes = 600 seconds)
    const elapsed = Math.floor((Date.now() - existingDiscount.timestamp) / 1000);
    if (elapsed >= 600 && !existingDiscount.expired) {
      await markAddressExpired(address);
      discountExpired = true;
    }
  } else {
    // First time for this address - store it
    await setAddressDiscount(address, timestampToUse);
  }

  const estimate = await computeEstimate(address, Boolean(body.urgentService));
  if (!estimate) {
    return NextResponse.json({ error: "No parcel geometry found for that address." }, { status: 404 });
  }

  return NextResponse.json({
    ...estimate,
    timestamp: timestampToUse,
    discountExpired,
  });
}
