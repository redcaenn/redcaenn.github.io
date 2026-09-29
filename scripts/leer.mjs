// Lectura de los CSV de /datos. Lo usan el validador y el sitio.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { TABLAS } from './esquema.mjs';

// Los comandos (npm run ...) siempre corren desde la raíz del proyecto.
export const RAIZ = process.cwd();
export const DATOS = path.join(RAIZ, 'datos');
export const REGISTRO = path.join(DATOS, '_registro.json');

/**
 * Convierte un encabezado escrito a mano al nombre interno de la columna:
 * "Año" → "anio", "Título" → "titulo", "Obra colectiva" → "obra_colectiva".
 * También repara el "aÃ±o" que deja Excel al guardar con otra codificación.
 * Por dentro los nombres van sin ñ ni acentos para que ningún programa los rompa.
 */
export function normalizarEncabezado(h) {
  let t = String(h ?? '').trim();
  if (/Ã|Â/.test(t)) t = Buffer.from(t, 'latin1').toString('utf8');
  return t
    .toLowerCase()
    .replace(/ñ/g, 'ni')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

/** Nombre de la columna como lo escribe una persona, para los mensajes de error. */
const VISIBLES = {
  anio: 'año', titulo: 'título', numero: 'número', paginas: 'páginas', linea: 'línea', lineas: 'líneas',
  sublineas: 'sublíneas', descripcion: 'descripción', sesion: 'sesión', pais: 'país',
  institucion: 'institución', credito: 'crédito', relatoria: 'relatoría', divulgacion: 'divulgación',
  editores: 'editores', obra_colectiva: 'obra colectiva',
};
export const visible = (c) => VISIBLES[c] ?? c.replace(/_/g, ' ');

export function leerTabla(nombre) {
  const def = TABLAS[nombre];
  const ruta = path.join(DATOS, def.archivo);
  if (!fs.existsSync(ruta)) return { encabezados: [], filas: [], existe: false };
  const texto = fs.readFileSync(ruta, 'utf8');
  const registros = parse(texto, { bom: true, relax_column_count: true, skip_empty_lines: true });
  if (!registros.length) return { encabezados: [], filas: [], existe: true };
  const encabezados = registros[0].map(normalizarEncabezado);
  const filas = [];
  registros.slice(1).forEach((celdas, i) => {
    if (celdas.every((c) => !String(c).trim())) return;
    const fila = { _linea: i + 2 };
    encabezados.forEach((h, j) => {
      // Solo las columnas del esquema llegan al sitio.
      if (def.columnas[h]) fila[h] = String(celdas[j] ?? '').trim();
    });
    for (const c of Object.keys(def.columnas)) if (!(c in fila)) fila[c] = '';
    filas.push(fila);
  });
  return { encabezados, filas, existe: true };
}

export function leerTodo() {
  const datos = {};
  for (const nombre of Object.keys(TABLAS)) datos[nombre] = leerTabla(nombre).filas;
  return datos;
}

export function leerRegistro() {
  if (!fs.existsSync(REGISTRO)) return {};
  return JSON.parse(fs.readFileSync(REGISTRO, 'utf8'));
}

export const lista = (v) =>
  String(v ?? '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

export function hoy() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Mexico_City' });
}

export const idYoutube = (v) => {
  const m = v.match(/(?:youtu\.be\/|v=|\/embed\/|\/live\/|\/shorts\/)([\w-]{11})/) || v.match(/^([\w-]{11})$/);
  return m ? m[1] : null;
};
