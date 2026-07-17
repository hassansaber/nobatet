/** @type {import('next').NextConfig} */
const nextConfig = {
  // برای wildcard subdomain روی Liara / reverse proxy
  poweredByHeader: false,
  // تصاویر آپلودشده (رسید کارت‌به‌کارت، لوگو) — بعداً دامنه storage اضافه می‌شود
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
