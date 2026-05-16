import { defineConfig } from 'astro/config';

// Build 100% estático para Cloudflare Pages: sin adapter, sin SSR.
// La salida en dist/ se despliega directamente como sitio estático.
export default defineConfig({
  output: 'static',
});
