import { NextResponse } from "next/server";
import Stripe from "stripe";

import { computeEstimate } from "@/lib/estimate";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

const calculateDiscountPercent = (timestamp: number) => {
  const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);
  if (Number.isNaN(elapsedSeconds) || elapsedSeconds >= 600) {
    return 0;
  }
  if (elapsedSeconds <= 300) {
    return 15 - (elapsedSeconds / 300) * 5;
  }
  return Math.max(0, 10 - ((elapsedSeconds - 300) / 300) * 10);
};

export async function POST(request: Request) {
  if (!STRIPE_SECRET_KEY || !BASE_URL) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    address?: string;
    timeframe?: string;
    urgentService?: boolean;
    estimateTimestamp?: number;
  };

  if (!body.name || !body.address) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const estimate = await computeEstimate(body.address, Boolean(body.urgentService));
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
    customer_email: body.email || undefined,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Snow removal service",
            description: `Snow removal for ${body.address}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${BASE_URL}/?payment=success`,
    cancel_url: `${BASE_URL}/?payment=cancel`,
    metadata: {
      name: body.name,
      address: body.address,
      timeframe: body.timeframe ?? "",
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