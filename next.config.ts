/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/termos', destination: '/terms', permanent: true },
      { source: '/privacidade', destination: '/privacy', permanent: true },
    ];
  },
};

module.exports = nextConfig;
