import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: __dirname,
    },
    // Security headers are handled by middleware (src/proxy.ts)
    // This avoids duplication and potential conflicts
};

export default nextConfig;
