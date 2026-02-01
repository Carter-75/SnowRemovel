import { NextResponse } from "next/server";
import Stripe from "stripe";
import path from "path";
import { readFile } from "fs/promises";

import {
  calculateIncrementalEstimate,
  calculateYtdTaxSummary,
  formatCurrency,
  taxConstants,
} from "@/lib/financial-engine";
import { loadFinancialState, persistFinancialState } from "@/lib/financial-store";
import { logger } from "@/lib/logger";
import { BUSINESS_ADDRESS, BUSINESS_EMAIL, BUSINESS_PHONE } from "@/lib/constants";
import { getCustomerPaymentEmail, getProviderNotificationEmail } from "@/lib/email-templates";
import { validateEnvironment } from "@/lib/env-validation";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM ?? "";
const RESEND_TO = process.env.RESEND_TO ?? "";
const BUSINESS_ADDRESS_VALUE =
  process.env.BUSINESS_ADDRESS ??
  process.env.DRIVE_ORIGIN_ADDRESS ??
  BUSINESS_ADDRESS;

const parseNumber = (value?: string | null) => {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const sendResendEmail = async (payload: {
  to: string[];
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to send email.");
  }
};

export async function POST(request: Request) {
  // Validate environment on first webhook call
  try {
    validateEnvironment();
  } catch (error) {
    logger.error("Environment validation failed", { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return NextResponse.json({ error: "Service configuration error." }, { status: 500 });
  }

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    logger.error("Stripe webhook endpoint called but credentials not configured");
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  if (!signature) {
    logger.webhookFailure("Missing Stripe signature header");
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.webhookFailure("Invalid Stripe signature", {
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    if (!RESEND_API_KEY || !RESEND_FROM || !RESEND_TO) {
      logger.error("Checkout completed but email service not configured", {
        eventId: event.id,
        sessionId: (event.data.object as Stripe.Checkout.Session).id,
      });
      return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status && session.payment_status !== "paid") {
      logger.warn("Checkout session completed but payment not confirmed", {
        eventId: event.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
      });
      return NextResponse.json({ received: true });
    }
    const paymentId =
      (typeof session.payment_intent === "string" && session.payment_intent) || session.id;
    const metadata = session.metadata ?? {};

    const gross = Number(((session.amount_total ?? 0) / 100).toFixed(2));
    const basePrice = parseNumber(metadata.basePrice);
    const urgencyFee = parseNumber(metadata.urgencyFee);
    const driveFee = parseNumber(metadata.driveFee);
    const discountAmount = parseNumber(metadata.discountAmount);
    const timeframe = metadata.timeframe ?? "";
    const urgentService = metadata.urgentService === "true";
    const resolvedBasePrice =
      basePrice > 0 ? basePrice : Math.max(0, gross - driveFee - urgencyFee + discountAmount);

    const previousState = await loadFinancialState();
    const existingStatus = previousState.eventStatus[event.id];
    if (existingStatus?.emailSent) {
      return NextResponse.json({ received: true });
    }

    const previousGross = previousState.ytdGross ?? 0;
    const ytdAlreadyUpdated = previousState.processedEventIds.includes(event.id);
    const grossBase = ytdAlreadyUpdated ? previousGross : Number((previousGross + gross).toFixed(2));
    const incremental = calculateIncrementalEstimate(previousGross, gross);
    const ytdSummary = calculateYtdTaxSummary(grossBase);
    const marginalRatePercent = Math.round(ytdSummary.federalMarginalRate * 100);

    if (!ytdAlreadyUpdated) {
      const updatedState = {
        ...previousState,
        ytdGross: grossBase,
        updatedAt: new Date().toISOString(),
        processedEventIds: [...previousState.processedEventIds, event.id],
        transactions: [
          ...previousState.transactions,
          {
            id: paymentId,
            createdAt: new Date().toISOString(),
            gross,
            basePrice: resolvedBasePrice,
            driveFee,
            urgencyFee,
            discountAmount,
          },
        ],
        eventStatus: {
          ...previousState.eventStatus,
          [event.id]: { emailSent: false, updatedAt: new Date().toISOString() },
        },
      };

      await persistFinancialState(updatedState);
    }

    const discountLine = discountAmount > 0
      ? `<p><strong>Discount applied:</strong> ${formatCurrency(discountAmount)}</p>`
      : "";

    const ownerHtml = `
      <h2>Owner's Financial Breakdown</h2>
      <h3>Current Payment Details</h3>
      <p><strong>Gross received:</strong> ${formatCurrency(gross)}</p>
      <p><strong>Base price:</strong> ${formatCurrency(resolvedBasePrice)}</p>
      <p><strong>Drive fee:</strong> ${formatCurrency(driveFee)}</p>
      <p><strong>Urgency fee:</strong> ${formatCurrency(urgencyFee)}</p>
      ${discountLine}
      <hr />
      <h3>Current Estimate for THIS Payment</h3>
      <p><strong>Estimated net after taxes:</strong> ${formatCurrency(incremental.netAfterTaxes)}</p>
      <p><strong>Estimated taxes for this payment:</strong> ${formatCurrency(
        incremental.incrementalTotalTax
      )}</p>
      <p>Self-employment: ${formatCurrency(incremental.incrementalSeTax)} | Federal: ${formatCurrency(
        incremental.incrementalFederalTax
      )} | State: ${formatCurrency(incremental.incrementalStateTax)}</p>
      <hr />
      <h3>Running YTD Totals</h3>
      <p><strong>Total gross YTD:</strong> ${formatCurrency(ytdSummary.grossYtd)}</p>
      <p><strong>Total SE tax owed YTD:</strong> ${formatCurrency(ytdSummary.seTax)}</p>
      <p><strong>Total federal tax owed YTD:</strong> ${formatCurrency(
        ytdSummary.federalTaxAfterCredits
      )}</p>
      <p><strong>Total state tax owed YTD:</strong> ${formatCurrency(
        ytdSummary.stateTaxAfterCredits
      )}</p>
      <p><strong>Total tax owed YTD:</strong> ${formatCurrency(ytdSummary.totalTaxAfterCredits)}</p>
      <p><strong>Current marginal bracket:</strong> You are currently in the ${marginalRatePercent}% Federal Bracket.</p>
      <h3>Applied Deductions & Credits</h3>
      <ul>
        <li>Federal Standard Deduction: ${formatCurrency(taxConstants.FEDERAL_STANDARD_DEDUCTION)}</li>
        <li>American Opportunity Tax Credit (AOTC): ${formatCurrency(taxConstants.AOTC_CREDIT)}</li>
        <li>WI Rent Credit: ${formatCurrency(taxConstants.WI_RENT_CREDIT)}</li>
      </ul>
      <p><em>THIS IS A PRELIMINARY ESTIMATE FOR TRACKING PURPOSES AND DOES NOT CONSTITUTE OFFICIAL TAX ADVICE.</em></p>
    `;

    await sendResendEmail({
      to: [RESEND_TO],
      subject: "Owner's Financial Breakdown - Payment Received",
      html: ownerHtml,
    });

    logger.info("Payment processed successfully", {
      eventId: event.id,
      sessionId: session.id,
      paymentId,
      gross,
      customerEmail: session.customer_email || 'none',
    });

    if (session.customer_email) {
      const termsPath = path.join(process.cwd(), "public", "legal", "terms.pdf");
      const cancelPath = path.join(process.cwd(), "public", "legal", "right-to-cancel.pdf");
      const [termsPdf, cancelPdf] = await Promise.all([
        readFile(termsPath),
        readFile(cancelPath),
      ]);

      const customerHtml = getCustomerPaymentEmail({
        customerName: metadata.customerName ?? "Customer",
        serviceDatetime: timeframe || "TBD",
        serviceAddress: metadata.address || metadata.redactedAddress || "Your service address",
        finalPrice: gross,
        urgentService,
        emergencyWaiver: metadata.emergencyWaiver === "true",
      });

      await sendResendEmail({
        to: [session.customer_email],
        subject: "Payment Confirmation - Snow Removal",
        html: customerHtml,
        attachments: [
          {
            filename: "terms.pdf",
            content: termsPdf.toString("base64"),
          },
          {
            filename: "right-to-cancel-copy-1.pdf",
            content: cancelPdf.toString("base64"),
          },
          {
            filename: "right-to-cancel-copy-2.pdf",
            content: cancelPdf.toString("base64"),
          },
        ],
      });
    }

    const latestState = await loadFinancialState();
    if (!latestState.eventStatus[event.id]?.emailSent) {
      await persistFinancialState({
        ...latestState,
        eventStatus: {
          ...latestState.eventStatus,
          [event.id]: { emailSent: true, updatedAt: new Date().toISOString() },
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}