/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '', // 多谱基座：无 basePath，clanId 即 URL 第一段
  images: {
    unoptimized: true,
  },
};
module.exports = nextConfig;