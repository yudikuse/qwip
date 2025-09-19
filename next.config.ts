/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Mata definitivamente o fluxo antigo:
      { source: '/anuncio/novo', destination: '/anunciar', permanent: true },
      { source: '/anuncio/criar', destination: '/anunciar', permanent: true },
      { source: '/anunciar/novo', destination: '/anunciar', permanent: true },
    ];
  },
};

module.exports = nextConfig;
