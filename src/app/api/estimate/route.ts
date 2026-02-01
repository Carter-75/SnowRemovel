import { NextResponse } from "next/server";

import { computeEstimate } from "@/lib/estimate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ADDRESS_RETENTION_MS, ESTIMATE_RATE_LIMIT, ESTIMATE_RATE_WINDOW_MS, MAX_ADDRESS_LENGTH, DISCOUNT_WINDOW_SECONDS } from "@/lib/constants";

// Database functions for address discount tracking
const getAddressKey = (address: string) => `discount:${address.toLowerCase().trim()}`;

const getAddressDiscount = async (address: string): Promise<{ timestamp: number; expired: boolean } | null> => {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  try {
    const { kv } = await import("@vercel/kv");
    const data = await kv.get<{ timestamp: number; expired: boolean }>(getAddressKey(address));
    
    // Auto-cleanup: Delete records older than 3 years
    if (data && Date.now() - data.timestamp > ADDRESS_RETENTION_MS) {
      await kv.del(getAddressKey(address));
      return null;
    }
    
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
    const threeYearsSeconds = Math.floor(ADDRESS_RETENTION_MS / 1000);
    await kv.set(getAddressKey(address), { timestamp, expired: false }, { ex: threeYearsSeconds });
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
  const rateLimit = await checkRateLimit(`estimate:${clientIp}`, ESTIMATE_RATE_LIMIT, ESTIMATE_RATE_WINDOW_MS);
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

  const body = (await request.json()) as { address?: string; urgentService?: boolean; consentToStorage?: boolean };
  const address = body.address?.trim() ?? "";
  const consentToStorage = Boolean(body.consentToStorage);
  
  if (!address) {
    return NextResponse.json({ error: "Address is required." }, { status: 400 });
  }
  if (address.length > MAX_ADDRESS_LENGTH) {
    return NextResponse.json({ error: "Address is too long." }, { status: 400 });
  }

  if (!consentToStorage) {
    return NextResponse.json({ error: "Consent to address storage is required." }, { status: 400 });
  }

  // Check if this address already has discount tracking
  const existingDiscount = await getAddressDiscount(address);
  let timestampToUse = Date.now();
  let discountExpired = false;

  if (existingDiscount) {
    timestampToUse = existingDiscount.timestamp;
    discountExpired = existingDiscount.expired;

    // Check if discount time has expired
    const elapsed = Math.floor((Date.now() - existingDiscount.timestamp) / 1000);
    if (elapsed >= DISCOUNT_WINDOW_SECONDS && !existingDiscount.expired) {
      await markAddressExpired(address);
      discountExpired = true;
    }
  } else {
    // First time for this address - store it (only with consent)
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
