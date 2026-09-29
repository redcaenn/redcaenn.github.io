// Trae las fotos de la carpeta compartida de Google Drive «Fotos del sitio».
//
// Adentro hay una subcarpeta por evento o acuerdo cuyo nombre empieza con su id
// («e0004 Sesión inaugural», «a0002 Firma en la ENFT»). Cada foto que los investigadores
// dejan ahí se reduce a 2000 px, pierde sus metadatos (incluida la ubicación GPS), recibe
// un nombre estable (fotos/drive/e0004-01.jpg) y una fila en datos/fotos.csv con una
// descripción y un crédito automáticos. Si la pestaña «fotos» de la hoja trae una fila con
// el mismo archivo, su descripción y su crédito mandan.
//
// Necesita GOOGLE_ACCESS_TOKEN (solo lectura de Drive) y GOOGLE_FOTOS_FOLDER_ID.
// Solo escribe dentro de fotos/drive/: las fotos subidas a mano en fotos/ no se tocan.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { DATOS, RAIZ, leerTabla } from './leer.mjs';

const token = process.env.GOOGLE_ACCESS_TOKEN;
const carpeta = process.env.GOOGLE_FOTOS_FOLDER_ID;
if (!token || !carpeta) {
  console.log('Fotos de Drive: no configurado (falta la carpeta o el acceso de Google). No se cambió nada.');
  process.exit(0);
}

const DIR = path.join(RAIZ, 'fotos', 'drive');
const MAPA = path.join(DATOS, '_fotos_drive.json'); // id de Drive → nombre estable en el sitio
const CSV = path.join(DATOS, 'fotos.csv');
const LADO = 2000;

const api = async (url) => {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`Google Drive respondió ${r.status} en ${String(url).split("?")[0]}: ${await r.text()}`);
  return r;
};

async function listar(q, campos) {
  const todos = [];
  let pagina = '';
  do {
    const u = new URL('https://www.googleapis.com/drive/v3/files');
    u.search = new URLSearchParams({
      q,
      fields: `nextPageToken, files(${campos})`,
      pageSize: '1000',
      orderBy: 'createdTime',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      ...(pagina && { pageToken: pagina }),
    });
    const j = await (await api(u)).json();
    todos.push(...j.files);
    pagina = j.nextPageToken;
  } while (pagina);
  return todos;
}

// Registros que pueden tener fotos, con su título para la descripción automática
const titulos = new Map(
  [...leerTabla('eventos').filas, ...leerTabla('acuerdos').filas].map((f) => [f.id, f.titulo.replace(/\[EJEMPLO\]\s*/g, '')]),
);

const mapa = fs.existsSync(MAPA) ? JSON.parse(fs.readFileSync(MAPA, 'utf8')) : {};
const vistos = new Set();
const nuevas = [];
const avisos = [];

// Confirmar que la cuenta de servicio ve la carpeta (si no está compartida, Drive la mostraría vacía sin avisar)
{
  const r = await fetch(`https://www.googleapis.com/drive/v3/files/${carpeta}?fields=name,mimeType&supportsAllDrives=true`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) {
    console.error(`No se puede abrir la carpeta de fotos (${r.status}). Compártela con la cuenta de servicio como Lector.`);
    process.exit(1);
  }
  const c = await r.json();
  console.log(`Carpeta de fotos: «${c.name}»`);
}

const subcarpetas = await listar(`'${carpeta}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`, 'id, name');

for (const sub of subcarpetas) {
  const id = sub.name.trim().match(/^([ea]\d{4})\b/i)?.[1]?.toLowerCase();
  if (!id) {
    avisos.push(`La carpeta «${sub.name}» no empieza con un id de evento o acuerdo (p. ej. «e0004 …»); se ignoró.`);
    continue;
  }
  if (!titulos.has(id)) {
    avisos.push(`La carpeta «${sub.name}» es de ${id}, que no existe en eventos ni acuerdos; se ignoró.`);
    continue;
  }
  const archivos = await listar(
    `'${sub.id}' in parents and trashed = false and mimeType contains 'image/'`,
    'id, name, mimeType, md5Checksum, thumbnailLink, owners(displayName), lastModifyingUser(displayName)',
  );
  for (const a of archivos) {
    vistos.add(a.id);
    const previo = mapa[a.id];
    if (previo && previo.registro === id && previo.md5 === a.md5Checksum && fs.existsSync(path.join(DIR, previo.archivo))) continue;

    // Nombre estable: se conserva si la foto ya existía; si es nueva, el siguiente número libre del registro
    let archivo = previo?.registro === id ? previo.archivo : null;
    if (!archivo) {
      const usados = new Set(Object.values(mapa).filter((m) => m.registro === id).map((m) => m.archivo));
      let n = 1;
      while (usados.has(`${id}-${String(n).padStart(2, '0')}.jpg`)) n++;
      archivo = `${id}-${String(n).padStart(2, '0')}.jpg`;
    }
    if (previo && previo.archivo !== archivo) fs.rmSync(path.join(DIR, previo.archivo), { force: true });

    let original = Buffer.from(await (await api(`https://www.googleapis.com/drive/v3/files/${a.id}?alt=media&supportsAllDrives=true`)).arrayBuffer());
    let imagen;
    try {
      imagen = await procesar(original);
    } catch {
      // HEIC de iPhone y otros formatos que no se pueden leer: se usa la vista previa que genera Drive
      if (!a.thumbnailLink) {
        avisos.push(`«${a.name}» (${sub.name}) no se pudo convertir y Drive no ofrece vista previa; se omitió.`);
        vistos.delete(a.id);
        continue;
      }
      original = Buffer.from(await (await api(a.thumbnailLink.replace(/=s\d+$/, `=s${LADO}`))).arrayBuffer());
      imagen = await procesar(original);
    }
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(path.join(DIR, archivo), imagen);
    mapa[a.id] = {
      archivo,
      registro: id,
      md5: a.md5Checksum,
      credito: a.owners?.[0]?.displayName || a.lastModifyingUser?.displayName || '',
    };
    nuevas.push(`${archivo}  ←  ${sub.name} / ${a.name}`);
  }
}

// Reduce, endereza según la orientación de la cámara y quita todos los metadatos (EXIF, GPS)
function procesar(buf) {
  return sharp(buf, { failOn: 'error' })
    .rotate()
    .resize({ width: LADO, height: LADO, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
}

// Fotos borradas de Drive (o movidas a otra carpeta): salen del sitio
const retiradas = [];
for (const [idDrive, m] of Object.entries(mapa)) {
  if (vistos.has(idDrive)) continue;
  fs.rmSync(path.join(DIR, m.archivo), { force: true });
  retiradas.push(m.archivo);
  delete mapa[idDrive];
}

// datos/fotos.csv: filas de la hoja (mandan) + filas automáticas de Drive
const { filas } = leerTabla('fotos');
const deLaHoja = filas.filter((f) => !f.archivo.startsWith('drive/') || Object.values(mapa).some((m) => `drive/${m.archivo}` === f.archivo));
const porArchivo = new Map(deLaHoja.map((f) => [f.archivo, f]));
const numero = (a) => +a.match(/-(\d+)\.jpg$/)[1];
const automaticas = Object.values(mapa)
  .sort((x, y) => x.archivo.localeCompare(y.archivo))
  .map((m) => {
    const archivo = `drive/${m.archivo}`;
    const hoja = porArchivo.get(archivo);
    porArchivo.delete(archivo);
    return {
      archivo,
      registro: m.registro,
      descripcion: hoja?.descripcion || `${titulos.get(m.registro)} — foto ${numero(m.archivo)}`,
      credito: hoja?.credito || m.credito,
    };
  });
const filasFinales = [...porArchivo.values(), ...automaticas];
const celda = (v) => (/[",\n\r]/.test(v ?? '') ? `"${String(v).replace(/"/g, '""')}"` : (v ?? ''));
const columnas = ['archivo', 'registro', 'descripcion', 'credito'];
fs.writeFileSync(CSV, [columnas.join(','), ...filasFinales.map((f) => columnas.map((c) => celda(f[c])).join(','))].join('\n') + '\n');
fs.writeFileSync(MAPA, JSON.stringify(Object.fromEntries(Object.entries(mapa).sort(([, a], [, b]) => a.archivo.localeCompare(b.archivo))), null, 2) + '\n');

// Resumen (también se agrega a la propuesta de cambios)
const lineas = [];
if (nuevas.length) lineas.push(`Fotos nuevas o actualizadas desde Drive: ${nuevas.length}`, ...nuevas.map((x) => `  + ${x}`));
if (retiradas.length) lineas.push(`Fotos retiradas (ya no están en Drive): ${retiradas.length}`, ...retiradas.map((x) => `  - ${x}`));
for (const a of avisos) lineas.push(`Aviso: ${a}`);
console.log(lineas.length ? lineas.join('\n') : 'Fotos de Drive: sin cambios.');
