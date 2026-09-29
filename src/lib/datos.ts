// Carga los CSV de /datos y resuelve las relaciones:
// personas ↔ normales ↔ productos, eventos, acuerdos y divulgación.
import fs from 'node:fs';
import path from 'node:path';
import { leerTodo, leerRegistro, lista, hoy, idYoutube } from '../../scripts/leer.mjs';
import { esPendiente, claveFecha, anioDe, PENDIENTE } from './formato';
import { citaAPA } from './cita';

type Fila = Record<string, string>;

export interface Normal extends Fila {
  corto: string;
  ruta: string;
  alta: string;
  actualizado: string;
}
export interface Linea extends Fila {
  sublineasL: string[];
}
export interface Persona extends Fila {
  nombreCompleto: string;
  normalR?: Normal;
  ruta: string;
  alta: string;
  actualizado: string;
}
export interface Autor {
  persona?: Persona;
  texto: string;
}
interface Base {
  /** Ruta permanente dentro del sitio (la columna "url" es el enlace externo). */
  ruta: string;
  alta: string;
  actualizado: string;
  normalesR: Normal[];
  faltanNormales: boolean;
  ejemplo: boolean;
}
export interface Producto extends Fila, Base {
  autoresR: Autor[];
  lineaR?: Linea;
  doiUrl: string;
  cita: { html: string; texto: string };
}
export interface Foto {
  archivo: string;
  descripcion: string;
  credito: string;
}
export interface Evento extends Fila, Base {
  personasR: Persona[];
  instituciones_l: string[];
  invitados_l: string[];
  videoId: string | null;
  fotos: Foto[];
  divulgacionR: Divulgacion[];
}
export interface Acuerdo extends Fila, Base {
  personasR: Persona[];
  instituciones_l: string[];
  fotos: Foto[];
}
export interface Divulgacion extends Fila, Base {
  personasR: Persona[];
  eventoR?: Evento;
}
export interface Capitulo extends Fila {
  autoresR: Autor[];
  normalesR: Normal[];
}
export interface Retirado extends Fila {
  tabla: string;
}

export const RUTAS: Record<string, string> = {
  productos: '/repositorio/',
  eventos: '/eventos/',
  acuerdos: '/vinculacion/',
  divulgacion: '/divulgacion/',
  personas: '/personas/',
  normales: '/normales/',
};

const unicos = <T>(xs: (T | undefined)[]) => [...new Set(xs.filter(Boolean) as T[])];
const refs = <T>(mapa: Map<string, T>, v: string) => lista(v).filter((x) => !esPendiente(x)).map((x) => mapa.get(x)!).filter(Boolean);
const tienePendiente = (v: string) => lista(v).some((x) => esPendiente(x));
const ejemplo = (f: Fila) => Object.values(f).some((v) => typeof v === 'string' && v.includes('[EJEMPLO]'));
const porFecha = (campo: string) => (a: Fila, b: Fila) => claveFecha(b[campo]).localeCompare(claveFecha(a[campo])) || b.id.localeCompare(a.id);

function construir() {
  const d = leerTodo() as Record<string, Fila[]>;
  const registro = leerRegistro() as Record<string, { alta: string; actualizado: string }>;
  const fechaDe = (tabla: string, id: string) => registro[`${tabla}/${id}`] ?? { alta: hoy(), actualizado: hoy() };

  // Fotos: solo las revisadas (sin menores) y con archivo presente.
  const fotosPorRegistro = new Map<string, Foto[]>();
  for (const f of d.fotos) {
    if (!/^s[ií]$/i.test(f.revisada_sin_menores)) continue;
    if (!fs.existsSync(path.join(process.cwd(), 'fotos', f.archivo))) continue;
    const l = fotosPorRegistro.get(f.registro) ?? [];
    l.push({ archivo: f.archivo, descripcion: f.descripcion, credito: f.credito });
    fotosPorRegistro.set(f.registro, l);
  }

  const normales = d.normales.map((n) => ({ ...n, ...fechaDe('normales', n.id), corto: n.siglas || n.nombre, ruta: `${RUTAS.normales}${n.id}/` })) as Normal[];
  const mNormales = new Map(normales.map((n) => [n.id, n]));

  const lineas = d.lineas
    .map((l) => ({ ...l, sublineasL: lista(l.sublineas) }))
    .sort((a, b) => +a.numero - +b.numero) as Linea[];
  const mLineas = new Map(lineas.map((l) => [l.id, l]));

  const personas = d.personas.map((p) => ({
    ...p,
    ...fechaDe('personas', p.id),
    nombreCompleto: [p.grado, p.nombres, p.apellidos].filter(Boolean).join(' '),
    normalR: mNormales.get(p.normal),
    ruta: `${RUTAS.personas}${p.id}/`,
  })) as Persona[];
  const mPersonas = new Map(personas.map((p) => [p.id, p]));

  const autores = (v: string): Autor[] =>
    lista(v).map((x) => {
      const persona = mPersonas.get(x);
      return persona ? { persona, texto: persona.nombreCompleto } : { texto: x };
    });

  const base = (tabla: string, f: Fila, extraNormales: (Normal | undefined)[] = []) => {
    const { alta, actualizado } = fechaDe(tabla, f.id);
    return {
      ruta: `${RUTAS[tabla]}${f.id}/`,
      alta,
      actualizado,
      normalesR: unicos([...refs(mNormales, f.normales ?? ''), ...extraNormales]),
      faltanNormales: tienePendiente(f.normales ?? ''),
      ejemplo: ejemplo(f),
    };
  };

  const productos = d.productos
    .map((f) => {
      const autoresR = autores(f.autores);
      const doi = f.doi && !esPendiente(f.doi) ? f.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : '';
      const p = {
        ...f,
        ...base('productos', f, autoresR.map((a) => a.persona?.normalR)),
        autoresR,
        lineaR: mLineas.get(f.linea),
        doi,
        doiUrl: doi ? `https://doi.org/${doi}` : '',
      } as Producto;
      p.cita = citaAPA(p);
      return p;
    })
    .sort((a, b) => b.anio.localeCompare(a.anio) || b.id.localeCompare(a.id));

  const eventosSinDivulgacion = d.eventos.map((f) => {
    const personasR = refs(mPersonas, f.personas);
    return {
      ...f,
      ...base('eventos', f, personasR.map((p) => p.normalR)),
      personasR,
      instituciones_l: lista(f.instituciones),
      invitados_l: lista(f.invitados),
      videoId: f.video && !esPendiente(f.video) ? idYoutube(f.video) : null,
      fotos: fotosPorRegistro.get(f.id) ?? [],
      divulgacionR: [] as Divulgacion[],
    } as Evento;
  });
  const mEventos = new Map(eventosSinDivulgacion.map((e) => [e.id, e]));
  const eventos = eventosSinDivulgacion.sort(porFecha('fecha_inicio'));

  const acuerdos = d.acuerdos
    .map((f) => {
      const personasR = refs(mPersonas, f.personas);
      return {
        ...f,
        ...base('acuerdos', f, personasR.map((p) => p.normalR)),
        personasR,
        instituciones_l: lista(f.instituciones),
        fotos: fotosPorRegistro.get(f.id) ?? [],
      } as Acuerdo;
    })
    .sort(porFecha('fecha'));

  const divulgacion = d.divulgacion
    .map((f) => {
      const personasR = refs(mPersonas, f.personas);
      const item = {
        ...f,
        ...base('divulgacion', f, personasR.map((p) => p.normalR)),
        personasR,
        eventoR: mEventos.get(f.evento),
      } as Divulgacion;
      item.eventoR?.divulgacionR.push(item);
      return item;
    })
    .sort(porFecha('fecha'));

  const obra = d.obra_colectiva
    .map((f) => {
      const autoresR = autores(f.autores);
      return {
        ...f,
        autoresR,
        normalesR: unicos([...refs(mNormales, f.normales), ...autoresR.map((a) => a.persona?.normalR)]),
      } as Capitulo;
    })
    .sort((a, b) => +a.orden - +b.orden);

  // A qué tabla pertenece cada registro retirado (según el registro de fechas).
  const retirados = d.retirados.map((r) => {
    const clave = Object.keys(registro).find((k) => k.endsWith(`/${r.id}`));
    return { ...r, tabla: clave?.split('/')[0] ?? '' } as Retirado;
  });

  return { normales, lineas, personas, productos, eventos, acuerdos, divulgacion, obra, retirados, mNormales, mPersonas };
}

let cache: ReturnType<typeof construir> | undefined;
export function datos() {
  return (cache ??= construir());
}

export const sitio = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'datos', 'sitio.json'), 'utf8'));

/** Todo lo que corresponde a una normal o a una persona. */
export function evidenciaDe(filtro: { normal?: string; persona?: string }) {
  const { productos, eventos, acuerdos, divulgacion } = datos();
  const incluye = (r: { normalesR: Normal[]; personasR?: Persona[]; autoresR?: Autor[] }) => {
    if (filtro.normal) return r.normalesR.some((n) => n.id === filtro.normal);
    if (filtro.persona)
      return (
        !!r.personasR?.some((p) => p.id === filtro.persona) || !!r.autoresR?.some((a) => a.persona?.id === filtro.persona)
      );
    return true;
  };
  return {
    productos: productos.filter(incluye),
    eventos: eventos.filter(incluye),
    acuerdos: acuerdos.filter(incluye),
    divulgacion: divulgacion.filter(incluye),
  };
}

export const retiradosDe = (tabla: string) => datos().retirados.filter((r) => r.tabla === tabla);

export { anioDe, PENDIENTE };
