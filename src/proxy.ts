import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedFrameAncestors = [
  "'self'",
  "https://carter-portfolio.fyi",
  "https://www.carter-portfolio.fyi",
  "https://carter-portfolio.vercel.app",
  "https://*.vercel.app",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
];

const createNonce = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const buildCsp = (nonce: string) => {
  const frameAncestors = allowedFrameAncestors.join(" ");
  const isProduction = process.env.NODE_ENV === "production";
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "https://cdnjs.cloudflare.com",
    "https://vercel.live", // Vercel Live preview/feedback tools (always needed)
  ];
  
  const connectSrc = [
    "'self'",
    "https://vercel.live",
    "wss://ws-us3.pusher.com", // Vercel Live WebSocket connections
  ];
  
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `frame-ancestors ${frameAncestors}`,
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://cdnjs.cloudflare.com https://r2cdn.perplexity.ai",
    `connect-src ${connectSrc.join(" ")}`,
    "form-action 'self' https://checkout.stripe.com",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
};

export function proxy(_request: NextRequest) {
  const nonce = createNonce();
  const isProduction = process.env.NODE_ENV === "production";
  const response = NextResponse.next();
  
  // Set security headers
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  
  if (isProduction) {
    response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
