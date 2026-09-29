// Esquema de las tablas del sitio. Es la única lista de columnas permitidas:
// cualquier columna que no esté aquí (por ejemplo "correo") se rechaza al validar
// y nunca se copia desde Google Sheets. Así ningún dato privado llega al repositorio.
//
// Tipos de columna:
//   texto, slug, id, fecha, anio, url, doi, isbn, sino, numero, youtube, archivo,
//   enum (con `valores`), ref (con `tabla`), refs (lista separada por ";" con `tabla`),
//   lista (texto separado por ";"), autores (ids de personas o "Apellido, N." separados por ";")

export const TABLAS = {
  normales: {
    archivo: 'normales.csv',
    titulo: 'Escuelas normales',
    columnas: {
      id: { tipo: 'slug', req: true },
      nombre: { tipo: 'texto', req: true },
      siglas: { tipo: 'texto' },
      ciudad: { tipo: 'texto' },
      estado: { tipo: 'texto', req: true },
      sitio_web: { tipo: 'url' },
      logo: { tipo: 'archivo', carpeta: 'public/logos' },
    },
  },
  lineas: {
    archivo: 'lineas.csv',
    titulo: 'Líneas de investigación',
    columnas: {
      id: { tipo: 'slug', req: true },
      numero: { tipo: 'numero', req: true },
      nombre: { tipo: 'texto', req: true },
      sublineas: { tipo: 'lista' },
    },
  },
  personas: {
    archivo: 'personas.csv',
    titulo: 'Personas',
    columnas: {
      id: { tipo: 'slug', req: true },
      grado: { tipo: 'texto' },
      nombres: { tipo: 'texto', req: true },
      apellidos: { tipo: 'texto', req: true },
      normal: { tipo: 'ref', tabla: 'normales' },
      institucion: { tipo: 'texto' },
      cargo_red: { tipo: 'texto' },
      orcid: { tipo: 'texto' },
    },
  },
  productos: {
    archivo: 'productos.csv',
    titulo: 'Productos de investigación',
    prefijo: 'p',
    columnas: {
      id: { tipo: 'id', req: true },
      tipo: { tipo: 'enum', req: true, valores: ['articulo', 'capitulo', 'libro', 'ponencia', 'memoria', 'tesis', 'otro'] },
      titulo: { tipo: 'texto', req: true },
      autores: { tipo: 'autores', req: true },
      anio: { tipo: 'anio', req: true },
      fuente: { tipo: 'texto' },
      editores: { tipo: 'texto' },
      editorial: { tipo: 'texto' },
      volumen: { tipo: 'texto' },
      numero: { tipo: 'texto' },
      paginas: { tipo: 'texto' },
      doi: { tipo: 'doi' },
      isbn: { tipo: 'isbn' },
      issn: { tipo: 'texto' },
      url: { tipo: 'url' },
      acceso_abierto: { tipo: 'sino', req: true },
      linea: { tipo: 'ref', tabla: 'lineas' },
      normales: { tipo: 'refs', tabla: 'normales' },
      pdf: { tipo: 'archivo', carpeta: 'public/documentos/productos' },
      resumen: { tipo: 'texto' },
    },
  },
  eventos: {
    archivo: 'eventos.csv',
    titulo: 'Eventos',
    prefijo: 'e',
    columnas: {
      id: { tipo: 'id', req: true },
      tipo: { tipo: 'enum', req: true, valores: ['seminario', 'encuentro', 'reunion', 'congreso', 'taller', 'conferencia', 'presentacion', 'inauguracion', 'otro'] },
      serie: { tipo: 'enum', valores: ['seminario-latinoamericano'] },
      sesion: { tipo: 'numero' },
      titulo: { tipo: 'texto', req: true },
      fecha_inicio: { tipo: 'fecha', req: true },
      fecha_fin: { tipo: 'fecha' },
      sede: { tipo: 'texto' },
      ciudad: { tipo: 'texto' },
      estado: { tipo: 'texto' },
      pais: { tipo: 'texto' },
      modalidad: { tipo: 'enum', valores: ['presencial', 'virtual', 'mixta'] },
      normales: { tipo: 'refs', tabla: 'normales' },
      instituciones: { tipo: 'lista' },
      personas: { tipo: 'refs', tabla: 'personas' },
      invitados: { tipo: 'lista' },
      descripcion: { tipo: 'texto' },
      nota: { tipo: 'texto' },
      video: { tipo: 'youtube' },
      relatoria: { tipo: 'archivo', carpeta: 'public/documentos/eventos' },
      programa: { tipo: 'archivo', carpeta: 'public/documentos/eventos' },
    },
  },
  acuerdos: {
    archivo: 'acuerdos.csv',
    titulo: 'Acuerdos de colaboración',
    prefijo: 'a',
    columnas: {
      id: { tipo: 'id', req: true },
      fecha: { tipo: 'fecha', req: true },
      tipo: { tipo: 'enum', req: true, valores: ['carta-compromiso', 'acuerdo', 'convenio', 'otro'] },
      titulo: { tipo: 'texto', req: true },
      instituciones: { tipo: 'lista' },
      normales: { tipo: 'refs', tabla: 'normales' },
      personas: { tipo: 'refs', tabla: 'personas' },
      lugar: { tipo: 'texto' },
      descripcion: { tipo: 'texto' },
      nota: { tipo: 'texto' },
      vigencia: { tipo: 'texto' },
      pdf: { tipo: 'archivo', carpeta: 'public/documentos/acuerdos' },
    },
  },
  divulgacion: {
    archivo: 'divulgacion.csv',
    titulo: 'Divulgación',
    prefijo: 'd',
    columnas: {
      id: { tipo: 'id', req: true },
      fecha: { tipo: 'fecha', req: true },
      tipo: { tipo: 'enum', req: true, valores: ['publicacion', 'transmision', 'podcast', 'entrevista', 'nota-de-prensa', 'otro'] },
      red: { tipo: 'enum', req: true, valores: ['facebook', 'instagram', 'youtube', 'whatsapp', 'tiktok', 'x', 'spotify', 'prensa', 'radio', 'television', 'web'] },
      medio: { tipo: 'texto' },
      url: { tipo: 'url', req: true },
      serie: { tipo: 'texto' },
      titulo: { tipo: 'texto', req: true },
      normales: { tipo: 'refs', tabla: 'normales' },
      personas: { tipo: 'refs', tabla: 'personas' },
      evento: { tipo: 'ref', tabla: 'eventos' },
    },
  },
  obra_colectiva: {
    archivo: 'obra_colectiva.csv',
    titulo: 'Obra colectiva del Seminario',
    columnas: {
      orden: { tipo: 'numero', req: true },
      titulo: { tipo: 'texto', req: true },
      autores: { tipo: 'autores' },
      normales: { tipo: 'refs', tabla: 'normales' },
      estado: { tipo: 'enum', req: true, valores: ['propuesto', 'en-escritura', 'avance-entregado', 'en-dictamen', 'aceptado'] },
    },
  },
  fotos: {
    archivo: 'fotos.csv',
    titulo: 'Fotos',
    columnas: {
      archivo: { tipo: 'archivo', req: true, carpeta: 'fotos' },
      registro: { tipo: 'texto', req: true },
      descripcion: { tipo: 'texto', req: true },
      credito: { tipo: 'texto' },
    },
  },
  retirados: {
    archivo: 'retirados.csv',
    titulo: 'Registros retirados',
    columnas: {
      id: { tipo: 'texto', req: true },
      titulo: { tipo: 'texto', req: true },
      fecha_retiro: { tipo: 'fecha', req: true },
      motivo: { tipo: 'texto', req: true },
    },
  },
};

// Tablas cuyos registros tienen página y URL permanente.
export const CON_PAGINA = ['normales', 'personas', 'productos', 'eventos', 'acuerdos', 'divulgacion'];

export const PENDIENTE = '[PENDIENTE]';
export const EJEMPLO = '[EJEMPLO]';
