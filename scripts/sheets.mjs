// Descarga la hoja de Google (privada) y la guarda como CSV en /datos.
//
// Necesita:
//   GOOGLE_SHEET_ID      el identificador de la hoja (lo que va entre /d/ y /edit en su dirección)
// y una de estas dos formas de acceso:
//   GOOGLE_ACCESS_TOKEN  permiso temporal de solo lectura. En GitHub lo entrega Google sin ninguna llave
//                        (Workload Identity Federation, ver .github/workflows/sincronizar.yml). Es la forma normal.
//   GOOGLE_SERVICE_ACCOUNT_JSON  archivo de llave de la cuenta de servicio (solo si alguna vez se usa desde otra máquina)
//
// Cada pestaña se llama como un archivo de /datos, con o sin acentos
// (productos, eventos, acuerdos, divulgación, personas, normales, líneas, obra colectiva, fotos, retirados).
// Los encabezados también pueden llevar ñ y acentos (año, título, línea…).
// Solo se copian las columnas del esquema: cualquier otra columna de la hoja (correos, notas internas)
// se ignora y nunca llega al repositorio.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { TABLAS } from './esquema.mjs';
import { DATOS, normalizarEncabezado, visible } from './leer.mjs';

const hoja = process.env.GOOGLE_SHEET_ID;
const llaveJSON = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
const tokenDirecto = process.env.GOOGLE_ACCESS_TOKEN;

if (!hoja || (!llaveJSON && !tokenDirecto)) {
  console.log('La sincronización con Google Sheets no está configurada (falta el identificador de la hoja o el acceso de Google). No se cambió nada.');
  process.exit(0);
}

const b64url = (b) => Buffer.from(b).toString('base64url');

async function token() {
  const llave = JSON.parse(llaveJSON);
  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const cuerpo = b64url(
    JSON.stringify({
      iss: llave.client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: ahora,
      exp: ahora + 600,
    }),
  );
  const firma = crypto.createSign('RSA-SHA256').update(`${cabecera}.${cuerpo}`).sign(llave.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${cabecera}.${cuerpo}.${firma}` }),
  });
  if (!r.ok) throw new Error(`Google rechazó la llave de la cuenta de servicio (${r.status}): ${await r.text()}`);
  return (await r.json()).access_token;
}

// Fechas escritas como 26/11/2025 o 2025/11/26 → 2025-11-26
function normalizarFecha(v) {
  let m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = v.match(/^(\d{4})\/(\d{1,2})(?:\/(\d{1,2}))?$/);
  if (m) return [m[1], m[2].padStart(2, '0'), m[3]?.padStart(2, '0')].filter(Boolean).join('-');
  return v;
}

const celdaCSV = (v) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

const t = tokenDirecto || (await token());
const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${hoja}?fields=sheets.properties.title`, {
  headers: { Authorization: `Bearer ${t}` },
});
if (!r.ok) {
  const texto = await r.text();
  if (texto.includes('Office file'))
    throw new Error('El identificador es de un archivo de Excel (.xlsx) abierto en Drive, no de una hoja de Google. En Drive: Archivo → Guardar como Hojas de cálculo de Google, compartir esa copia con la cuenta de servicio y usar su identificador.');
  throw new Error(`No se pudo abrir la hoja (${r.status}). ¿Está compartida con la cuenta de servicio como Lector? ${texto}`);
}
// Pestañas por su nombre interno: "Divulgación" → divulgacion, "Obra colectiva" → obra_colectiva
const pestanas = new Map((await r.json()).sheets.map((s) => [normalizarEncabezado(s.properties.title), s.properties.title]));

// Primero se leen y revisan todas las pestañas; solo si todas están bien se escriben los archivos.
const salidas = [];
for (const [nombre, def] of Object.entries(TABLAS)) {
  if (!pestanas.has(nombre)) {
    console.log(`· ${visible(nombre)}: no hay pestaña con ese nombre en la hoja; se conserva datos/${def.archivo}`);
    continue;
  }
  const rv = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${hoja}/values/${encodeURIComponent(pestanas.get(nombre))}?valueRenderOption=FORMATTED_VALUE`,
    { headers: { Authorization: `Bearer ${t}` } },
  );
  if (!rv.ok) throw new Error(`No se pudo leer la pestaña ${nombre} (${rv.status})`);
  const valores = (await rv.json()).values ?? [];
  if (!valores.length) {
    console.log(`· ${nombre}: pestaña vacía; se conserva datos/${def.archivo}`);
    continue;
  }
  const encabezados = valores[0].map(normalizarEncabezado);
  const permitidas = Object.keys(def.columnas);
  const ignoradas = encabezados.filter((h) => h && !def.columnas[h]);
  const indices = permitidas.map((c) => encabezados.indexOf(c));
  const faltan = permitidas.filter((c, i) => indices[i] === -1 && def.columnas[c].req);
  if (faltan.length) throw new Error(`La pestaña ${visible(nombre)} no tiene las columnas obligatorias: ${faltan.map(visible).join(', ')}`);

  const lineas = [permitidas.join(',')];
  let n = 0;
  for (const fila of valores.slice(1)) {
    const celdas = indices.map((i, k) => {
      let v = i === -1 ? '' : String(fila[i] ?? '').trim();
      if (['fecha', 'anio'].includes(def.columnas[permitidas[k]].tipo)) v = normalizarFecha(v);
      return v;
    });
    if (celdas.every((c) => !c)) continue;
    lineas.push(celdas.map(celdaCSV).join(','));
    n++;
  }
  salidas.push({ archivo: def.archivo, texto: lineas.join('\n') + '\n' });
  console.log(`✓ ${visible(nombre)}: ${n} filas${ignoradas.length ? ` (columnas privadas ignoradas: ${ignoradas.join(', ')})` : ''}`);
}

for (const { archivo, texto } of salidas) fs.writeFileSync(path.join(DATOS, archivo), texto);
