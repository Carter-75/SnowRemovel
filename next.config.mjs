import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: __dirname,
    },
    async headers() {
        const isProduction = process.env.NODE_ENV === "production";
        const headers = [
            {
                key: "Referrer-Policy",
                value: "origin-when-cross-origin",
            },
            {
                key: "X-Content-Type-Options",
                value: "nosniff",
            },
            {
                key: "X-Frame-Options",
                value: "DENY",
            },
            {
                key: "Permissions-Policy",
                value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
            },
            {
                key: "Content-Security-Policy",
                value: [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval
                    "style-src 'self' 'unsafe-inline'", // Inline styles for animation
                    "img-src 'self' data: https:",
                    "font-src 'self' data:",
                    "connect-src 'self' https://api.stripe.com https://nominatim.openstreetmap.org https://api.openrouteservice.org https://router.project-osrm.org https://services3.arcgis.com",
                    "frame-src https://checkout.stripe.com",
                    "object-src 'none'",
                    "base-uri 'self'",
                    "form-action 'self'",
                ].join("; "),
            },
        ];

        if (isProduction) {
            headers.push({
                key: "Strict-Transport-Security",
                value: "max-age=63072000; includeSubDomains; preload",
            });
        }

        return [
            {
                source: "/(.*)",
                headers,
            },
        ];
    },
};

export default nextConfig;
