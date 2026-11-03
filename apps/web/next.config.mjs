/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double WebSocket mounting during development
  transpilePackages: ["@mafia/shared", "@mafia/game-rules"]
};

export default nextConfig;

