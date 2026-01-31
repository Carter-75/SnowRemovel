import { NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM = process.env.RESEND_FROM ?? "";
const RESEND_TO = process.env.RESEND_TO ?? "";

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
  upfrontFee: number;
  timestamp: number;
};

export async function POST(request: Request) {
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

  if (!body.name || !body.address) {
    return NextResponse.json({ error: "Name and address are required." }, { status: 400 });
  }

  const termsPath = path.join(process.cwd(), "public", "legal", "terms.pdf");
  const cancelPath = path.join(process.cwd(), "public", "legal", "right-to-cancel.pdf");
  const [termsPdf, cancelPdf] = await Promise.all([
    readFile(termsPath),
    readFile(cancelPath),
  ]);

  const estimate = body.estimate ?? null;
  const subject = "Snow Removel";

  const html = `
    <h2>Snow Removal Request</h2>
    <p><strong>Name:</strong> ${body.name}</p>
    <p><strong>Email:</strong> ${body.email || "(not provided)"}</p>
    <p><strong>Address:</strong> ${body.address}</p>
    <p><strong>Timeframe:</strong> ${body.timeframe || "(not provided)"}</p>
    <p><strong>Details:</strong> ${body.details || "(none)"}</p>
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
      <p><strong>Base price:</strong> $${estimate.price.toFixed(2)} (${estimate.jobType})</p>
      <p><strong>Dynamic rate:</strong> $${estimate.rate.toFixed(4)} per sq ft</p>
      <p><strong>Drive fee:</strong> $${estimate.driveFee.toFixed(2)} (${estimate.driveMiles.toFixed(
            2
          )} mi, ${estimate.driveMinutes.toFixed(0)} min one-way)</p>
      <p><strong>Round trip:</strong> ${estimate.roundTripMiles.toFixed(2)} mi, ${estimate.roundTripMinutes.toFixed(
            0
          )} min</p>
      <p><strong>Upfront due:</strong> $${estimate.upfrontFee.toFixed(2)}</p>
      <p><strong>Discount:</strong> ${body.discountPercent ?? 0}%</p>
      <p><strong>Final price:</strong> $${body.totalWithDrive?.toFixed(2) ?? estimate.price.toFixed(2)}</p>
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

  if (body.email) {
    const travelFeeNote = estimate?.driveFee && estimate.driveFee > 0
      ? "A travel fee applies based on distance and time."
      : "No travel fee applies."
    const urgencyNote = body.urgentService
      ? "A convenience upcharge applies for urgent service."
      : "No urgency upcharge applies."
    const customerHtml = `
      <h2>Snow Removal Request Received</h2>
      <p>Thanks ${body.name}, I received your request. Your estimated total is below.</p>
      <p><strong>Total estimate:</strong> $${body.totalWithDrive?.toFixed(2) ?? estimate?.price.toFixed(2)}</p>
      <p>This total includes snow removal service and any applicable travel fee.</p>
      <p>${travelFeeNote} ${urgencyNote}</p>
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
        to: [body.email],
        html: customerHtml,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}