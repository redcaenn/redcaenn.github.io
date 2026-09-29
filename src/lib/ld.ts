// Metadatos schema.org (JSON-LD) para buscadores y repositorios académicos.
import { sitio, datos, type Producto, type Evento, type Acuerdo, type Divulgacion, type Persona, type Normal } from './datos';
import { enlace } from './exportar';
import { limpio, esPendiente } from './formato';

const v = (x?: string) => (x && !esPendiente(x) ? limpio(x) : undefined);
const ORG_ID = `${sitio.url}/#organizacion`;

export function organizacion() {
  const { normales } = datos();
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: sitio.nombre,
    alternateName: ['Red CAENN', 'CAENN'],
    url: enlace('/'),
    logo: enlace('/logo.png'),
    foundingDate: String(sitio.fundacion),
    description: sitio.textos.presentacion,
    email: v(sitio.correo),
    sameAs: sitio.redes_confirmadas ? Object.values(sitio.redes as Record<string, string>).filter((x) => !esPendiente(x)) : undefined,
    member: normales.map(normal),
  };
}

export const normal = (n: Normal) => ({
  '@type': 'EducationalOrganization',
  '@id': enlace(n.ruta),
  name: n.nombre,
  alternateName: v(n.siglas),
  url: v(n.sitio_web),
  address: { '@type': 'PostalAddress', addressLocality: v(n.ciudad), addressRegion: n.estado, addressCountry: 'MX' },
});

export const persona = (p: Persona) => ({
  '@type': 'Person',
  '@id': enlace(p.ruta),
  name: limpio(`${p.nombres} ${p.apellidos}`),
  honorificPrefix: v(p.grado),
  affiliation: p.normalR ? { '@id': enlace(p.normalR.ruta), name: p.normalR.nombre } : v(p.institucion) ? { '@type': 'Organization', name: v(p.institucion) } : undefined,
  identifier: v(p.orcid) ? `https://orcid.org/${p.orcid}` : undefined,
});

const TIPOS: Record<string, string> = { articulo: 'ScholarlyArticle', capitulo: 'Chapter', libro: 'Book', ponencia: 'ScholarlyArticle', memoria: 'ScholarlyArticle', tesis: 'Thesis', otro: 'CreativeWork' };

export function producto(p: Producto) {
  const o: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': TIPOS[p.tipo],
    '@id': enlace(p.ruta),
    url: enlace(p.ruta),
    name: limpio(p.titulo),
    headline: p.tipo === 'articulo' ? limpio(p.titulo) : undefined,
    author: p.autoresR.map((a) => (a.persona ? persona(a.persona) : { '@type': 'Person', name: a.texto })),
    datePublished: p.anio,
    inLanguage: 'es',
    isAccessibleForFree: /^s/i.test(p.acceso_abierto),
    abstract: v(p.resumen),
    publisher: v(p.editorial) ? { '@type': 'Organization', name: v(p.editorial) } : undefined,
    isbn: v(p.isbn),
    sameAs: [p.doiUrl, v(p.url)].filter(Boolean),
    identifier: p.doi ? { '@type': 'PropertyValue', propertyID: 'DOI', value: p.doi } : undefined,
    about: p.lineaR?.nombre,
    sourceOrganization: { '@id': ORG_ID, name: sitio.nombre },
  };
  if (p.tipo === 'articulo' && v(p.fuente))
    o.isPartOf = { '@type': 'Periodical', name: v(p.fuente), volumeNumber: v(p.volumen), issueNumber: v(p.numero) };
  if (p.tipo === 'capitulo' && v(p.fuente)) o.isPartOf = { '@type': 'Book', name: v(p.fuente) };
  if (v(p.paginas)) o.pagination = v(p.paginas);
  return o;
}

export function evento(e: Evento) {
  const presencial = e.modalidad !== 'virtual';
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationEvent',
    '@id': enlace(e.ruta),
    url: enlace(e.ruta),
    name: limpio(e.titulo),
    description: v(e.descripcion),
    startDate: v(e.fecha_inicio),
    endDate: v(e.fecha_fin),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode:
      e.modalidad === 'virtual'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : e.modalidad === 'mixta'
          ? 'https://schema.org/MixedEventAttendanceMode'
          : 'https://schema.org/OfflineEventAttendanceMode',
    location: presencial
      ? { '@type': 'Place', name: v(e.sede), address: { '@type': 'PostalAddress', addressLocality: v(e.ciudad), addressRegion: v(e.estado), addressCountry: v(e.pais) } }
      : { '@type': 'VirtualLocation', url: enlace(e.ruta) },
    organizer: [{ '@id': ORG_ID, name: sitio.nombre }, ...e.normalesR.map((n) => ({ '@id': enlace(n.ruta), name: n.nombre }))],
    performer: e.personasR.length ? e.personasR.map(persona) : undefined,
    superEvent: e.serie ? { '@type': 'EventSeries', name: sitio.seminario.nombre, url: enlace('/seminario/') } : undefined,
  };
}

export const acuerdo = (a: Acuerdo) => ({
  '@context': 'https://schema.org',
  '@type': 'DigitalDocument',
  '@id': enlace(a.ruta),
  url: enlace(a.ruta),
  name: limpio(a.titulo),
  description: v(a.descripcion),
  dateCreated: v(a.fecha),
  locationCreated: v(a.lugar) ? { '@type': 'Place', name: v(a.lugar) } : undefined,
  associatedMedia: v(a.pdf) ? { '@type': 'MediaObject', contentUrl: enlace(`/documentos/acuerdos/${a.pdf}`), encodingFormat: 'application/pdf' } : undefined,
  sourceOrganization: [{ '@id': ORG_ID, name: sitio.nombre }, ...a.normalesR.map((n) => ({ '@id': enlace(n.ruta), name: n.nombre })), ...a.instituciones_l.map((i) => ({ '@type': 'Organization', name: i }))],
});

export const divulgacion = (d: Divulgacion) => ({
  '@context': 'https://schema.org',
  '@type': d.tipo === 'nota-de-prensa' ? 'NewsArticle' : 'SocialMediaPosting',
  '@id': enlace(d.ruta),
  url: enlace(d.ruta),
  headline: limpio(d.titulo),
  datePublished: v(d.fecha),
  sameAs: d.url,
  publisher: v(d.medio) ? { '@type': 'Organization', name: v(d.medio) } : undefined,
  mentions: [...d.personasR.map(persona), ...d.normalesR.map((n) => ({ '@id': enlace(n.ruta), name: n.nombre }))],
  about: d.eventoR ? { '@id': enlace(d.eventoR.ruta), name: limpio(d.eventoR.titulo) } : undefined,
});
