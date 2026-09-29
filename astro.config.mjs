import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE y BASE permiten publicar en una dirección temporal de GitHub Pages
// (p. ej. https://usuario.github.io/redcaenn) antes de conectar redcaenn.com.
export default defineConfig({
  site: process.env.SITE || 'https://redcaenn.com',
  base: process.env.BASE || '/',
  trailingSlash: 'always',
  // La barra de herramientas de desarrollo se animaba en cada página de la vista previa.
  devToolbar: { enabled: false },
  build: { format: 'directory' },
  integrations: [sitemap({ filter: (p) => !p.includes('/404') })],
  // Direcciones del sitio anterior (WordPress) que ya circulan.
  redirects: {
    '/inicio': '/',
    '/home': '/',
    '/acuerdos-de-colaboracion': '/vinculacion/',
  },
});
