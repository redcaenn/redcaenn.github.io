// Después de construir: borra de dist/ las fotos originales que ninguna página usa.
// Astro copia cada foto de /fotos tal cual además de sus versiones reducidas; sin este paso
// el sitio crecería 3–4 MB por foto y pronto pasaría el límite recomendado de GitHub Pages (1 GB).
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');
const ASSETS = path.join(DIST, '_astro');
if (!fs.existsSync(ASSETS)) process.exit(0);

function archivos(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? archivos(p) : [p];
  });
}

const textos = archivos(DIST)
  .filter((f) => /\.(html|css|js|xml|json)$/.test(f))
  .map((f) => fs.readFileSync(f, 'utf8'))
  .join('\n');

let borrados = 0;
let bytes = 0;
for (const f of fs.readdirSync(ASSETS)) {
  if (!/\.(jpe?g|png|webp|avif|gif|tiff?)$/i.test(f)) continue;
  if (textos.includes(f)) continue;
  const ruta = path.join(ASSETS, f);
  bytes += fs.statSync(ruta).size;
  fs.unlinkSync(ruta);
  borrados++;
}
if (borrados) console.log(`Fotos originales sin usar retiradas del sitio: ${borrados} (${(bytes / 1e6).toFixed(1)} MB)`);
