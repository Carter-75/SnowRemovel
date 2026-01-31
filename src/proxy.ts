import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedFrameAncestors = [
  "'self'",
  "https://carter-portfolio.fyi",
  "https://www.carter-portfolio.fyi",
  "https://carter-portfolio.vercel.app",
  "https://*.vercel.app",
  "http://localhost:3000",
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
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `frame-ancestors ${frameAncestors}`,
    `script-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://cdnjs.cloudflare.com",
    "connect-src 'self'",
    "form-action 'self' https://checkout.stripe.com",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");
};

export function proxy(_request: NextRequest) {
  const nonce = createNonce();
  const response = NextResponse.next();
  response.headers.set("x-nonce", nonce);
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
