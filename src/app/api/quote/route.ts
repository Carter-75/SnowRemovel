import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { BUSINESS_EMAIL, BUSINESS_PHONE } from "@/lib/constants";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM ?? "";
const RESEND_TO = process.env.RESEND_TO ?? "";

const normalizeText = (value: string | undefined, maxLength: number) =>
  (value ?? "").trim().slice(0, maxLength);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const toNumber = (value: number | undefined, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

const normalizeEstimate = (estimate?: EstimatePayload | null): EstimatePayload | null => {
  if (!estimate) {
    return null;
  }

  return {
    sqft: toNumber(estimate.sqft),
    price: toNumber(estimate.price),
    rate: toNumber(estimate.rate),
    jobType: normalizeText(estimate.jobType, 60) || "Unknown",
    driveFee: toNumber(estimate.driveFee),
    driveMiles: toNumber(estimate.driveMiles),
    driveMinutes: toNumber(estimate.driveMinutes),
    roundTripMiles: toNumber(estimate.roundTripMiles),
    roundTripMinutes: toNumber(estimate.roundTripMinutes),
    timestamp: toNumber(estimate.timestamp),
  };
};

type EstimatePayload = {
  sqft: number;
  price: number;
  rate: number;
  jobType: string;
  driveFee: number;
  driveMiles: number;
  driveMinutes: number;
  roundTripMiles: number;
  roundTripMinutes: number;
  timestamp: number;
};

export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateLimit = await checkRateLimit(`quote:${clientIp}`, 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString() } }
    );
  }

  if (!RESEND_API_KEY || !RESEND_FROM || !RESEND_TO) {
    return NextResponse.json({ error: "Email service is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    address?: string;
    timeframe?: string;
    details?: string;
    estimate?: EstimatePayload | null;
    discountPercent?: number;
    totalWithDrive?: number | null;
    agreedToTerms?: boolean;
    downloadedTerms?: boolean;
    emergencyWaiver?: boolean;
    urgentService?: boolean;
  };

  const name = normalizeText(body.name, 120);
  const email = normalizeText(body.email, 254);
  const address = normalizeText(body.address, 200);
  const timeframe = normalizeText(body.timeframe, 200);
  const details = normalizeText(body.details, 1000);

  if (!name || !address) {
    return NextResponse.json({ error: "Name and address are required." }, { status: 400 });
  }

  const estimate = normalizeEstimate(body.estimate);
  const discountPercent = Number.isFinite(body.discountPercent) ? body.discountPercent : 0;
  const totalWithDrive = Number.isFinite(body.totalWithDrive) ? body.totalWithDrive : null;

  const termsPath = path.join(process.cwd(), "public", "legal", "terms.pdf");
  const cancelPath = path.join(process.cwd(), "public", "legal", "right-to-cancel.pdf");
  const [termsPdf, cancelPdf] = await Promise.all([
    readFile(termsPath),
    readFile(cancelPath),
  ]);

  const subject = "Snow Removel";

  const html = `
    <h2>Snow Removal Request</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${email ? escapeHtml(email) : "(not provided)"}</p>
    <p><strong>Address:</strong> ${escapeHtml(address)}</p>
    <p><strong>Timeframe:</strong> ${timeframe ? escapeHtml(timeframe) : "(not provided)"}</p>
    <p><strong>Details:</strong> ${details ? escapeHtml(details) : "(none)"}</p>
    <p><strong>Agreed to Terms:</strong> ${body.agreedToTerms ? "Yes" : "No"}</p>
    <p><strong>Downloaded Terms:</strong> ${body.downloadedTerms ? "Yes" : "No"}</p>
    <p><strong>Emergency Waiver:</strong> ${body.emergencyWaiver ? "Yes" : "No"}</p>
    <p><strong>Urgent service (10% upcharge):</strong> ${body.urgentService ? "Yes" : "No"}</p>
    <hr />
    <h3>Estimate</h3>
    ${
      estimate
        ? `
      <p><strong>Driveway size:</strong> ${estimate.sqft} sq ft</p>
      <p><strong>Base price:</strong> $${estimate.price.toFixed(2)} (${escapeHtml(estimate.jobType)})</p>
      <p><strong>Dynamic rate:</strong> $${estimate.rate.toFixed(4)} per sq ft</p>
      <p><strong>Drive fee:</strong> $${estimate.driveFee.toFixed(2)} (${estimate.driveMiles.toFixed(
        2
          )} mi, ${estimate.driveMinutes.toFixed(0)} min one-way)</p>
      <p><strong>Round trip:</strong> ${estimate.roundTripMiles.toFixed(2)} mi, ${estimate.roundTripMinutes.toFixed(
        0
          )} min</p>
      <p><strong>Discount:</strong> ${discountPercent}%</p>
      <p><strong>Final price:</strong> $${totalWithDrive?.toFixed(2) ?? estimate.price.toFixed(2)}</p>
      `
        : "<p>No estimate provided.</p>"
    }
    <hr />
    <p>Attached are the Terms & Conditions and the Right to Cancel notice for your records.</p>
  `;

  const payload = {
    from: RESEND_FROM,
    to: [RESEND_TO],
    subject,
    html,
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
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Unable to send email." }, { status: 500 });
  }

  if (email && isValidEmail(email)) {
    const travelFeeNote = estimate?.driveFee && estimate.driveFee > 0
      ? "A travel fee applies based on distance and time."
      : "No travel fee applies."
    const urgencyNote = body.urgentService
      ? "A convenience upcharge applies for urgent service."
      : "No urgency upcharge applies."
    const customerHtml = `
      <h2>Snow Removal Request Received</h2>
      <p>Thanks ${escapeHtml(name)}, I received your request. Your estimated total is below.</p>
      <p><strong>Total estimate:</strong> $${totalWithDrive?.toFixed(2) ?? estimate?.price.toFixed(2)}</p>
      <p>This total includes snow removal service and any applicable travel fee.</p>
      <p>${travelFeeNote} ${urgencyNote}</p>
      <p>If you need to cancel before the scheduled service day, email ${BUSINESS_EMAIL} or text ${BUSINESS_PHONE}.</p>
      <p>Attached are your Terms & Conditions and two copies of the Right to Cancel notice for your records.</p>
    `;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        to: [email],
        html: customerHtml,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}