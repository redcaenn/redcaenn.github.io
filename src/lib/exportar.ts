// Tablas para exportar a CSV. Las usan los archivos /datos/*.csv
// y el botón "Exportar esta vista" de cada sección.
import { datos, sitio } from './datos';
import { u, etiqueta } from './formato';

const base = import.meta.env.SITE || sitio.url;
export const enlace = (ruta: string) => new URL(u(ruta), base).href;
const nombres = (xs: { nombre?: string; nombreCompleto?: string; texto?: string }[]) =>
  xs.map((x) => x.nombreCompleto ?? x.nombre ?? x.texto ?? '').join('; ');

export interface Tabla {
  columnas: string[];
  filas: Record<string, string[]>;
}

export function tablaProductos(): Tabla {
  const columnas = ['id', 'enlace_permanente', 'tipo', 'titulo', 'autores', 'normales', 'num_normales', 'anio', 'fuente', 'editores', 'editorial', 'volumen', 'numero', 'paginas', 'doi', 'isbn', 'issn', 'url', 'acceso_abierto', 'linea', 'cita_apa', 'fecha_alta', 'fecha_actualizacion'];
  const filas: Tabla['filas'] = {};
  for (const p of datos().productos)
    filas[p.id] = [p.id, enlace(p.ruta), etiqueta('tipoProducto', p.tipo), p.titulo, nombres(p.autoresR), nombres(p.normalesR), String(p.normalesR.length), p.anio, p.fuente, p.editores, p.editorial, p.volumen, p.numero, p.paginas, p.doiUrl, p.isbn, p.issn, p.url, p.acceso_abierto, p.lineaR?.nombre ?? '', p.cita.texto, p.alta, p.actualizado];
  return { columnas, filas };
}

export function tablaEventos(): Tabla {
  const columnas = ['id', 'enlace_permanente', 'tipo', 'serie', 'sesion', 'titulo', 'fecha_inicio', 'fecha_fin', 'sede', 'ciudad', 'estado', 'pais', 'modalidad', 'normales', 'num_normales', 'instituciones', 'personas', 'invitados', 'video', 'fecha_alta', 'fecha_actualizacion'];
  const filas: Tabla['filas'] = {};
  for (const e of datos().eventos)
    filas[e.id] = [e.id, enlace(e.ruta), etiqueta('tipoEvento', e.tipo), e.serie ? sitio.seminario.nombre : '', e.sesion, e.titulo, e.fecha_inicio, e.fecha_fin, e.sede, e.ciudad, e.estado, e.pais, etiqueta('modalidad', e.modalidad) || e.modalidad, nombres(e.normalesR), String(e.normalesR.length), e.instituciones_l.join('; '), nombres(e.personasR), e.invitados_l.join('; '), e.videoId ? `https://www.youtube.com/watch?v=${e.videoId}` : e.video, e.alta, e.actualizado];
  return { columnas, filas };
}

export function tablaAcuerdos(): Tabla {
  const columnas = ['id', 'enlace_permanente', 'fecha', 'tipo', 'titulo', 'instituciones', 'normales', 'num_normales', 'personas', 'lugar', 'vigencia', 'documento_pdf', 'fecha_alta', 'fecha_actualizacion'];
  const filas: Tabla['filas'] = {};
  for (const a of datos().acuerdos)
    filas[a.id] = [a.id, enlace(a.ruta), a.fecha, etiqueta('tipoAcuerdo', a.tipo), a.titulo, a.instituciones_l.join('; '), nombres(a.normalesR), String(a.normalesR.length), nombres(a.personasR), a.lugar, a.vigencia, a.pdf && !a.pdf.includes('[') ? enlace(`/documentos/acuerdos/${a.pdf}`) : a.pdf, a.alta, a.actualizado];
  return { columnas, filas };
}

export function tablaDivulgacion(): Tabla {
  const columnas = ['id', 'enlace_permanente', 'fecha', 'tipo', 'red', 'medio', 'url', 'serie', 'titulo', 'normales', 'personas', 'evento', 'fecha_alta', 'fecha_actualizacion'];
  const filas: Tabla['filas'] = {};
  for (const d of datos().divulgacion)
    filas[d.id] = [d.id, enlace(d.ruta), d.fecha, etiqueta('tipoDivulgacion', d.tipo), etiqueta('red', d.red), d.medio, d.url, d.serie, d.titulo, nombres(d.normalesR), nombres(d.personasR), d.eventoR ? enlace(d.eventoR.ruta) : '', d.alta, d.actualizado];
  return { columnas, filas };
}

export const TABLAS_EXPORTABLES: Record<string, { titulo: string; tabla: () => Tabla }> = {
  productos: { titulo: 'Productos de investigación', tabla: tablaProductos },
  eventos: { titulo: 'Eventos', tabla: tablaEventos },
  acuerdos: { titulo: 'Acuerdos de colaboración', tabla: tablaAcuerdos },
  divulgacion: { titulo: 'Bitácora de divulgación', tabla: tablaDivulgacion },
};

export function aCSV({ columnas, filas }: Tabla, ids?: string[]): string {
  const celda = (v: string) => (/[",\n;]/.test(v ?? '') ? `"${String(v).replace(/"/g, '""')}"` : v ?? '');
  const lineas = [columnas.join(',')];
  for (const id of ids ?? Object.keys(filas)) if (filas[id]) lineas.push(filas[id].map(celda).join(','));
  return '﻿' + lineas.join('\r\n') + '\r\n';
}
