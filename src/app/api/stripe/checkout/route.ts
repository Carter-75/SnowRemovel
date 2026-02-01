import { NextResponse } from "next/server";
import Stripe from "stripe";

import { computeEstimate } from "@/lib/estimate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeName, sanitizeEmail, sanitizeText, redactAddress } from "@/lib/input-sanitize";
import { CHECKOUT_RATE_LIMIT, CHECKOUT_RATE_WINDOW_MS, DISCOUNT_WINDOW_SECONDS, DISCOUNT_FIRST_PHASE_SECONDS, DISCOUNT_MAX_PERCENT, DISCOUNT_MIN_PERCENT } from "@/lib/constants";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

const isAllowedBaseUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:") {
      return true;
    }
    return parsed.hostname === "localhost";
  } catch {
    return false;
  }
};

const calculateDiscountPercent = (timestamp: number) => {
  const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (Number.isNaN(elapsedSeconds) || elapsedSeconds >= DISCOUNT_WINDOW_SECONDS) {
    return 0;
  }
  if (elapsedSeconds <= DISCOUNT_FIRST_PHASE_SECONDS) {
    return DISCOUNT_MAX_PERCENT - (elapsedSeconds / DISCOUNT_FIRST_PHASE_SECONDS) * (DISCOUNT_MAX_PERCENT - DISCOUNT_MIN_PERCENT);
  }
  return Math.max(0, DISCOUNT_MIN_PERCENT - ((elapsedSeconds - DISCOUNT_FIRST_PHASE_SECONDS) / DISCOUNT_FIRST_PHASE_SECONDS) * DISCOUNT_MIN_PERCENT);
};

const parseLocalDateTimeParts = (value: string) => {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) {
    return null;
  }
  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return { year, month, day, hours, minutes };
};

const resolveUrgentFromTimeframe = (timeframe: string, timezoneOffsetMinutes?: number) => {
  if (!timeframe) {
    return false;
  }
  const parts = parseLocalDateTimeParts(timeframe);
  if (!parts) {
    return false;
  }
  const offsetMinutes =
    typeof timezoneOffsetMinutes === "number" && Number.isFinite(timezoneOffsetMinutes)
      ? Math.max(-840, Math.min(840, timezoneOffsetMinutes))
      : 0;
  const utcMillis =
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hours, parts.minutes, 0, 0) +
    offsetMinutes * 60 * 1000;
  if (utcMillis <= Date.now()) {
    return false;
  }
  const localNowMs = Date.now() - offsetMinutes * 60 * 1000;
  const localReqMs = utcMillis - offsetMinutes * 60 * 1000;
  const nowLocal = new Date(localNowMs);
  const reqLocal = new Date(localReqMs);
  const nowDayStartUtc = Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), nowLocal.getUTCDate());
  const reqDayStartUtc = Date.UTC(reqLocal.getUTCFullYear(), reqLocal.getUTCMonth(), reqLocal.getUTCDate());
  const diffDays = Math.ceil((reqDayStartUtc - nowDayStartUtc) / (24 * 60 * 60 * 1000));
  return diffDays <= 3;
};

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(`checkout:${clientIp}`, CHECKOUT_RATE_LIMIT, CHECKOUT_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } }
    );
  }

  if (!STRIPE_SECRET_KEY || !BASE_URL || !isAllowedBaseUrl(BASE_URL)) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    address?: string;
    timeframe?: string;
    urgentService?: boolean;
    timezoneOffsetMinutes?: number;
    estimateTimestamp?: number;
  };

  const name = sanitizeName(body.name ?? '', 120);
  const address = sanitizeText(body.address ?? '', 200);
  const timeframe = sanitizeText(body.timeframe ?? '', 200);
  const email = sanitizeEmail(body.email ?? '');
  const timezoneOffsetMinutes =
    typeof body.timezoneOffsetMinutes === "number" ? body.timezoneOffsetMinutes : undefined;

  if (!name || !address) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const urgentService =
    resolveUrgentFromTimeframe(timeframe, timezoneOffsetMinutes) || Boolean(body.urgentService);

  const estimate = await computeEstimate(address, urgentService);
  if (!estimate) {
    return NextResponse.json({ error: "Unable to compute estimate." }, { status: 400 });
  }

  const discountPercent = body.estimateTimestamp
    ? calculateDiscountPercent(body.estimateTimestamp)
    : 0;
  const subtotal = estimate.price;
  const discountAmount = subtotal * (discountPercent / 100);
  const totalWithDrive = subtotal - discountAmount + estimate.driveFee;

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });

  const amountCents = Math.max(1, Math.round(totalWithDrive * 100));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email || undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Shovler Inc. - Snow removal service",
            description: `Shovler Inc. snow removal for ${address}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    custom_text: {
      submit: {
        message: "Shovler Inc. will process your payment securely with Stripe.",
      },
    },
    success_url: `${BASE_URL}/?payment=success`,
    cancel_url: `${BASE_URL}/?payment=cancel`,
    metadata: {
      name,
      address: redactAddress(address), // Store redacted version in Stripe
      fullAddressHash: await hashAddressForLookup(address), // Store hash for lookup
      timeframe,
      discountPercent: discountPercent.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      basePrice: estimate.basePrice.toFixed(2),
      urgencyFee: estimate.upchargeAmount.toFixed(2),
      driveFee: estimate.driveFee.toFixed(2),
      urgentService: estimate.upchargeApplied ? "true" : "false",
      grossTotal: totalWithDrive.toFixed(2),
    },
  });

  return NextResponse.json({ url: session.url });
}

// Helper to hash address for webhook lookup without storing plaintext
async function hashAddressForLookup(address: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(address.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}