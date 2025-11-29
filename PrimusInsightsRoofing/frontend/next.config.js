/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Suppress hydration warnings caused by browser extensions
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules/ },
    ];
    return config;
  },
}

module.exports = nextConfig
