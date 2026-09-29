// Utilidades de presentación: fechas en español, enlaces con la base del sitio
// y resaltado de las marcas [PENDIENTE] y [EJEMPLO].

export const PENDIENTE = '[PENDIENTE]';
export const EJEMPLO = '[EJEMPLO]';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const esPendiente = (v?: string) => !v || v.includes(PENDIENTE);
export const esEjemplo = (v?: string) => !!v && v.includes(EJEMPLO);

/** Ruta interna con la base del sitio (para cuando se publica en una subcarpeta). */
export function u(ruta: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${ruta.startsWith('/') ? ruta : `/${ruta}`}`;
}

/** "2025-11-26" → "26 de noviembre de 2025"; "2024-03" → "marzo de 2024". */
export function fecha(v?: string): string {
  if (esPendiente(v)) return 'Fecha pendiente';
  const [a, m, d] = v!.split('-');
  if (d) return `${+d} de ${MESES[+m - 1]} de ${a}`;
  if (m) return `${MESES[+m - 1]} de ${a}`;
  return a;
}

/** Rango compacto: "26–27 de noviembre de 2025". */
export function rango(inicio?: string, fin?: string): string {
  if (!fin || fin === inicio || esPendiente(fin)) return fecha(inicio);
  if (esPendiente(inicio)) return fecha(inicio);
  const [a1, m1, d1] = inicio!.split('-');
  const [a2, m2, d2] = fin.split('-');
  if (d1 && d2 && a1 === a2 && m1 === m2) return `${+d1}–${+d2} de ${MESES[+m1 - 1]} de ${a1}`;
  if (d1 && d2 && a1 === a2) return `${+d1} de ${MESES[+m1 - 1]} al ${+d2} de ${MESES[+m2 - 1]} de ${a1}`;
  return `${fecha(inicio)} al ${fecha(fin)}`;
}

/** Clave para ordenar por fecha; las pendientes quedan al final en orden descendente. */
export const claveFecha = (v?: string) => (esPendiente(v) ? '' : v!);

/** Año de una fecha o cadena vacía. */
export const anioDe = (v?: string) => (esPendiente(v) ? '' : v!.slice(0, 4));

export function escapar(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Escapa el texto y resalta [PENDIENTE] y [EJEMPLO] para que se vean al revisar. */
export function marcar(t?: string): string {
  if (!t) return '';
  return escapar(t)
    .replace(/\[PENDIENTE\]/g, '<mark class="marca marca-pendiente">Pendiente</mark>')
    .replace(/\[EJEMPLO\]/g, '<mark class="marca marca-ejemplo">Ejemplo</mark>');
}

/** Texto sin las marcas, para metadatos y títulos de pestaña. */
export const limpio = (t?: string) =>
  (t || '').replace(/\[EJEMPLO\]\s*/g, '').replace(/\[PENDIENTE\]/g, 'pendiente').trim();

export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

export const ETIQUETAS: Record<string, Record<string, string>> = {
  tipoProducto: {
    articulo: 'Artículo',
    capitulo: 'Capítulo de libro',
    libro: 'Libro',
    ponencia: 'Ponencia',
    memoria: 'Memoria en extenso',
    tesis: 'Tesis',
    otro: 'Otro',
  },
  tipoEvento: {
    seminario: 'Sesión de seminario',
    encuentro: 'Encuentro',
    reunion: 'Reunión de trabajo',
    congreso: 'Congreso',
    taller: 'Taller',
    conferencia: 'Conferencia',
    presentacion: 'Presentación',
    inauguracion: 'Inauguración',
    otro: 'Otro',
  },
  tipoAcuerdo: {
    'carta-compromiso': 'Carta compromiso',
    acuerdo: 'Acuerdo de colaboración',
    convenio: 'Convenio',
    otro: 'Otro',
  },
  tipoDivulgacion: {
    publicacion: 'Publicación',
    transmision: 'Transmisión',
    podcast: 'Podcast',
    entrevista: 'Entrevista',
    'nota-de-prensa': 'Nota de prensa',
    otro: 'Otro',
  },
  red: {
    facebook: 'Facebook',
    instagram: 'Instagram',
    youtube: 'YouTube',
    whatsapp: 'WhatsApp',
    tiktok: 'TikTok',
    x: 'X',
    spotify: 'Spotify',
    prensa: 'Prensa',
    radio: 'Radio',
    television: 'Televisión',
    web: 'Web',
  },
  modalidad: { presencial: 'Presencial', virtual: 'Virtual', mixta: 'Virtual y presencial' },
  estadoCapitulo: {
    propuesto: 'Propuesto',
    'en-escritura': 'En escritura',
    'avance-entregado': 'Avance entregado',
    'en-dictamen': 'En dictamen',
    aceptado: 'Aceptado',
  },
};

export const etiqueta = (grupo: string, v?: string) => (v ? ETIQUETAS[grupo]?.[v] ?? v : '');

/** Fecha de hoy (AAAA-MM-DD) en horario del centro de México. */
export const hoyISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Mexico_City' });
