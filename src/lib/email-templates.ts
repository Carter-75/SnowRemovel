import { BUSINESS_ADDRESS, BUSINESS_EMAIL, BUSINESS_PHONE } from "./constants";

/**
 * Email template for customer payment confirmation
 */
export function getCustomerPaymentEmail(params: {
  customerName: string;
  serviceDatetime: string;
  serviceAddress: string;
  finalPrice: number;
  urgentService: boolean;
  emergencyWaiver: boolean;
}): string {
  const { customerName, serviceDatetime, serviceAddress, finalPrice, urgentService, emergencyWaiver } = params;

  const urgencyNote = urgentService
    ? "A 10% convenience upcharge was applied for urgent service (requested within 3 days)."
    : "";
  
  const emergencyNote = emergencyWaiver
    ? "You acknowledged the emergency service waiver and agreed to immediate service."
    : "";

  return `
    <h2>Snow Removal Service Confirmed</h2>
    <p>Hello ${customerName},</p>
    <p>Your payment has been received. Your snow removal service is scheduled for:</p>
    <p style="font-size:14pt;"><strong>${serviceDatetime}</strong></p>
    <p><strong>Service Address:</strong> ${serviceAddress}</p>
    <p><strong>Total Paid:</strong> $${finalPrice.toFixed(2)}</p>
    ${urgencyNote ? `<p>${urgencyNote}</p>` : ""}
    ${emergencyNote ? `<p>${emergencyNote}</p>` : ""}
    <hr />
    <p style="font-size:12pt;font-weight:700;">BUYER'S RIGHT TO CANCEL: You may cancel this transaction at any time prior to midnight of the third business day after the date of this transaction by delivering or mailing a signed and dated notice to ${BUSINESS_ADDRESS}.</p>
    <p>Cancellation requests may also be sent by email to ${BUSINESS_EMAIL} or by text to ${BUSINESS_PHONE}, and must be received before the scheduled service day.</p>
    <hr />
    <p style="font-size:10pt;color:#666;">This email serves as your receipt. Please retain it for your records.</p>
  `;
}

/**
 * Email template for provider notification of new booking
 */
export function getProviderNotificationEmail(params: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceDatetime: string;
  serviceAddress: string;
  finalPrice: number;
  basePrice: number;
  driveFee: number;
  driveMiles: number;
  driveMinutes: number;
  discountPercent: number;
  urgentService: boolean;
  emergencyWaiver: boolean;
  sqft: number;
  jobType: string;
}): string {
  const {
    customerName,
    customerEmail,
    customerPhone,
    serviceDatetime,
    serviceAddress,
    finalPrice,
    basePrice,
    driveFee,
    driveMiles,
    driveMinutes,
    discountPercent,
    urgentService,
    emergencyWaiver,
    sqft,
    jobType,
  } = params;

  return `
    <h2>New Snow Removal Booking</h2>
    <h3>Customer Information</h3>
    <p><strong>Name:</strong> ${customerName}</p>
    <p><strong>Email:</strong> ${customerEmail}</p>
    <p><strong>Phone:</strong> ${customerPhone}</p>
    <hr />
    <h3>Service Details</h3>
    <p><strong>Scheduled:</strong> ${serviceDatetime}</p>
    <p><strong>Address:</strong> ${serviceAddress}</p>
    <p><strong>Property Size:</strong> ${sqft} sq ft (${jobType})</p>
    <hr />
    <h3>Pricing Breakdown</h3>
    <p><strong>Base Price:</strong> $${basePrice.toFixed(2)}</p>
    <p><strong>Drive Fee:</strong> $${driveFee.toFixed(2)} (${driveMiles.toFixed(1)} mi, ${driveMinutes.toFixed(0)} min one-way)</p>
    <p><strong>Discount:</strong> ${discountPercent}%</p>
    ${urgentService ? `<p><strong>Urgency Upcharge:</strong> 10% (service within 3 days)</p>` : ""}
    <p style="font-size:14pt;"><strong>Total Paid:</strong> $${finalPrice.toFixed(2)}</p>
    <hr />
    <h3>Special Flags</h3>
    <p><strong>Urgent Service:</strong> ${urgentService ? "YES" : "No"}</p>
    <p><strong>Emergency Waiver:</strong> ${emergencyWaiver ? "YES - Customer agreed to immediate service" : "No"}</p>
  `;
}
