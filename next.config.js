/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID: process.env.STRIPE_BASIC_PRICE_ID,
    NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
    NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  },
  experimental: {
    instrumentationHook: false,
  },
  // Skip API route validation during build
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
}

module.exports = nextConfig
