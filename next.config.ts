import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La landing pública (HTML estático en public/landing) se muestra en la raíz "/".
  // El botón "Plataforma" de la landing lleva a /login.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/landing/index.html" }],
    };
  },
};

export default nextConfig;
