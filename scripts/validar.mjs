// Revisa los CSV de /datos antes de construir el sitio.
//   npm run validar            revisa y actualiza datos/_registro.json (fechas de alta y actualización)
//   npm run validar -- --solo-revisar   revisa sin escribir nada
// Termina con error si algo impediría publicar; los [PENDIENTE] solo se cuentan.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { TABLAS, CON_PAGINA, PENDIENTE, EJEMPLO } from './esquema.mjs';
import { RAIZ, REGISTRO, leerTabla, leerRegistro, lista, hoy, idYoutube, visible } from './leer.mjs';

const soloRevisar = process.argv.includes('--solo-revisar');
const errores = [];
const avisos = [];
let pendientes = 0;
let ejemplos = 0;

const err = (tabla, linea, msg) => errores.push(`${TABLAS[tabla].archivo}, fila ${linea}: ${msg}`);

function fechaValida(v) {
  const m = v.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);
  if (!m) return false;
  const [, a, mes, dia] = m;
  if (mes && (+mes < 1 || +mes > 12)) return false;
  if (dia) {
    const d = new Date(`${a}-${mes}-${dia}T12:00:00Z`);
    if (d.getUTCDate() !== +dia) return false;
  }
  return +a >= 1990 && +a <= 2100;
}

function isbnValido(v) {
  const s = v.replace(/[-\s]/g, '').toUpperCase();
  if (/^\d{9}[\dX]$/.test(s)) {
    const suma = [...s].reduce((t, c, i) => t + (c === 'X' ? 10 : +c) * (10 - i), 0);
    return suma % 11 === 0;
  }
  if (/^\d{13}$/.test(s)) {
    const suma = [...s].reduce((t, c, i) => t + +c * (i % 2 ? 3 : 1), 0);
    return suma % 10 === 0;
  }
  return false;
}

// 1. Leer y revisar columnas
const tablas = {};
for (const [nombre, def] of Object.entries(TABLAS)) {
  const { encabezados, filas, existe } = leerTabla(nombre);
  if (!existe) {
    errores.push(`Falta el archivo datos/${def.archivo}`);
    tablas[nombre] = [];
    continue;
  }
  const extra = encabezados.filter((h) => h && !def.columnas[h]);
  if (extra.length) {
    errores.push(
      `${def.archivo}: columna(s) no permitida(s): ${extra.join(', ')}. ` +
        `Solo se publican las columnas del esquema (scripts/esquema.mjs); los datos privados como correos no van en el repositorio.`,
    );
  }
  for (const [c, cd] of Object.entries(def.columnas)) {
    if (cd.req && !encabezados.includes(c)) errores.push(`${def.archivo}: falta la columna obligatoria "${visible(c)}"`);
  }
  tablas[nombre] = filas;
}

// 2. Revisar cada celda
const ids = {};
for (const [nombre, def] of Object.entries(TABLAS)) {
  if (def.columnas.id) ids[nombre] = new Set();
  for (const fila of tablas[nombre]) {
    const L = fila._linea;
    for (const [c, cd] of Object.entries(def.columnas)) {
      const v = fila[c];
      if (v.includes(EJEMPLO)) ejemplos++;
      if (!v) {
        if (cd.req) err(nombre, L, `la columna "${visible(c)}" es obligatoria`);
        continue;
      }
      if (v.includes(PENDIENTE)) {
        if (c === 'id') err(nombre, L, 'el id no puede quedar pendiente');
        pendientes++;
        continue;
      }
      switch (cd.tipo) {
        case 'slug':
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) err(nombre, L, `"${v}" no es un id válido: solo minúsculas sin acentos, números y guiones`);
          break;
        case 'id':
          if (!new RegExp(`^${def.prefijo}\\d{4}$`).test(v)) err(nombre, L, `"${v}" no es un id válido: debe ser "${def.prefijo}" seguido de 4 cifras, p. ej. ${def.prefijo}0001`);
          break;
        case 'fecha':
          if (!fechaValida(v)) err(nombre, L, `"${visible(c)}" = "${v}" no es una fecha válida (usa AAAA-MM-DD, AAAA-MM o AAAA)`);
          break;
        case 'anio':
          if (!/^\d{4}$/.test(v) || !fechaValida(v)) err(nombre, L, `"${visible(c)}" = "${v}" no es un año válido`);
          break;
        case 'numero':
          if (!/^\d+$/.test(v)) err(nombre, L, `"${visible(c)}" = "${v}" debe ser un número entero`);
          break;
        case 'url':
          if (!/^https?:\/\/\S+$/.test(v)) err(nombre, L, `"${visible(c)}" = "${v}" no es un enlace válido (debe empezar con https://)`);
          break;
        case 'doi':
          if (!/^(https?:\/\/(dx\.)?doi\.org\/)?10\.\d{4,9}\/\S+$/i.test(v)) err(nombre, L, `DOI "${v}" no tiene el formato 10.xxxx/xxxx`);
          break;
        case 'isbn':
          if (!isbnValido(v)) err(nombre, L, `ISBN "${v}" no es válido (revisa los dígitos)`);
          break;
        case 'sino':
          if (!/^(s[ií]|no)$/i.test(v)) err(nombre, L, `"${visible(c)}" debe ser "sí" o "no"`);
          break;
        case 'enum':
          if (!cd.valores.includes(v)) err(nombre, L, `"${visible(c)}" = "${v}" no es válido. Opciones: ${cd.valores.join(', ')}`);
          break;
        case 'youtube':
          if (!idYoutube(v)) err(nombre, L, `"${v}" no es un enlace de YouTube reconocible`);
          break;
        case 'archivo': {
          const ruta = path.join(RAIZ, cd.carpeta, v);
          if (!fs.existsSync(ruta)) err(nombre, L, `no existe el archivo ${cd.carpeta}/${v}`);
          break;
        }
      }
    }
    if (def.columnas.id && fila.id) {
      if (ids[nombre].has(fila.id)) err(nombre, L, `el id "${fila.id}" está repetido`);
      ids[nombre].add(fila.id);
    }
  }
}

// 3. Revisar relaciones entre tablas
for (const [nombre, def] of Object.entries(TABLAS)) {
  for (const fila of tablas[nombre]) {
    for (const [c, cd] of Object.entries(def.columnas)) {
      const v = fila[c];
      if (!v || v.includes(PENDIENTE)) continue;
      if (cd.tipo === 'ref' && !ids[cd.tabla].has(v)) err(nombre, fila._linea, `"${visible(c)}" = "${v}" no existe en ${TABLAS[cd.tabla].archivo}`);
      if (cd.tipo === 'refs')
        for (const x of lista(v))
          if (!ids[cd.tabla].has(x)) err(nombre, fila._linea, `"${visible(c)}": "${x}" no existe en ${TABLAS[cd.tabla].archivo}`);
      if (cd.tipo === 'autores')
        for (const x of lista(v))
          if (!ids.personas.has(x) && !x.includes(','))
            err(nombre, fila._linea, `autor "${x}" no es una persona de personas.csv ni tiene el formato "Apellido, N."`);
    }
  }
}
for (const f of tablas.fotos) {
  if (f.registro && !ids.eventos.has(f.registro) && !ids.acuerdos.has(f.registro))
    err('fotos', f._linea, `"registro" = "${f.registro}" no es un evento ni un acuerdo`);
}

// 4. Fechas de alta y actualización, y permanencia de los enlaces
const registro = leerRegistro();
const fecha = hoy();
const retirados = new Set(tablas.retirados.map((r) => r.id));
const vistos = new Set();
let nuevos = 0;
let cambiados = 0;
for (const nombre of CON_PAGINA) {
  const cols = Object.keys(TABLAS[nombre].columnas);
  for (const fila of tablas[nombre]) {
    if (!fila.id) continue;
    const clave = `${nombre}/${fila.id}`;
    vistos.add(clave);
    const huella = crypto.createHash('sha1').update(JSON.stringify(cols.map((c) => fila[c]))).digest('hex').slice(0, 12);
    const previo = registro[clave];
    if (!previo) {
      registro[clave] = { alta: fecha, actualizado: fecha, huella };
      nuevos++;
    } else if (previo.huella !== huella) {
      registro[clave] = { ...previo, actualizado: fecha, huella };
      cambiados++;
    }
  }
}
for (const clave of Object.keys(registro)) {
  if (vistos.has(clave)) continue;
  const id = clave.split('/')[1];
  if (!retirados.has(id))
    errores.push(
      `El registro "${clave}" ya no está en los datos. Los enlaces permanentes no se borran: ` +
        `vuelve a ponerlo o agrégalo a retirados.csv con la fecha y el motivo.`,
    );
}

// 5. Resultado
const total = Object.fromEntries(Object.entries(tablas).map(([k, v]) => [k, v.length]));
console.log('Registros:', Object.entries(total).map(([k, v]) => `${k} ${v}`).join(' · '));
if (nuevos || cambiados) console.log(`Nuevos: ${nuevos} · Modificados: ${cambiados}`);
if (pendientes) console.log(`Celdas marcadas ${PENDIENTE}: ${pendientes}`);
if (ejemplos) console.log(`Celdas con ${EJEMPLO}: ${ejemplos} (datos de muestra; bórralos antes de usar el sitio como evidencia)`);
for (const a of avisos) console.log('Aviso:', a);

if (errores.length) {
  console.error(`\n${errores.length} error(es). Corrígelos para poder publicar:\n`);
  for (const e of errores) console.error(' ✗', e);
  process.exit(1);
}
if (!soloRevisar) {
  const ordenado = Object.fromEntries(Object.entries(registro).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(REGISTRO, JSON.stringify(ordenado, null, 2) + '\n');
}
console.log('✓ Datos válidos');
