import type { APIRoute } from 'astro';
import { TABLAS_EXPORTABLES, aCSV } from '../../lib/exportar';

export function getStaticPaths() {
  return Object.keys(TABLAS_EXPORTABLES).map((tabla) => ({ params: { tabla } }));
}

export const GET: APIRoute = ({ params }) =>
  new Response(aCSV(TABLAS_EXPORTABLES[params.tabla!].tabla()), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8' },
  });
