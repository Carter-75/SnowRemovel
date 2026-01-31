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
                key: "Permissions-Policy",
                value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
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
