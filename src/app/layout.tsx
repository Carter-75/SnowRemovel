import "./globals.css";
import "bulma/css/bulma.min.css";

import { headers } from "next/headers";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Carter Moyer Snow Removal",
  description:
    "Reliable, shovel-based snow removal for driveways and walkways. Local college student offering fast, friendly service.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js"
          strategy="afterInteractive"
          nonce={nonce}
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js"
          strategy="afterInteractive"
          nonce={nonce}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}


