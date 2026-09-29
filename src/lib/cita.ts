// Cita en formato APA 7 (versión en español: "y" en lugar de "&").
import { escapar, esPendiente } from './formato';
import type { Producto, Autor } from './datos';

const sinMarcas = (t: string) => t.replace(/\[EJEMPLO\]\s*/g, '').trim();

/** "Catalina G." → "C. G."; "Daniel Hugo" → "D. H." */
function iniciales(nombres: string): string {
  return sinMarcas(nombres)
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n.split('-').map((p) => `${p[0].toUpperCase()}.`).join('-'))
    .join(' ');
}

function autorAPA(a: Autor): string {
  if (a.persona) return `${sinMarcas(a.persona.apellidos)}, ${iniciales(a.persona.nombres)}`;
  return a.texto;
}

function unirAutores(autores: Autor[]): string {
  const n = autores.map(autorAPA);
  if (n.length <= 1) return n[0] ?? '';
  // En español no se usa coma antes de la "y".
  if (n.length <= 20) return `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}`;
  return `${n.slice(0, 19).join(', ')}, … ${n[n.length - 1]}`;
}

const punto = (t: string) => (/[.?!]$/.test(t) ? t : `${t}.`);

export function citaAPA(p: Producto): { html: string; texto: string } {
  // Cada parte es [texto, cursiva]
  const partes: [string, boolean][] = [];
  const add = (t: string, it = false) => t && partes.push([t, it]);
  const v = (x?: string) => (x && !esPendiente(x) ? x : '');

  add(`${punto(unirAutores(p.autoresR))} (${p.anio}). `);
  const titulo = v(p.titulo);
  const enlace = p.doiUrl || v(p.url);

  switch (p.tipo) {
    case 'articulo': {
      add(`${punto(titulo)} `);
      if (v(p.fuente)) {
        add(v(p.fuente), true);
        if (v(p.volumen)) {
          add(', ');
          add(p.volumen, true);
        }
        if (v(p.numero)) add(`(${p.numero})`);
        if (v(p.paginas)) add(`, ${p.paginas}`);
        add('. ');
      }
      break;
    }
    case 'capitulo': {
      add(`${punto(titulo)} En `);
      if (v(p.editores)) add(`${v(p.editores)}, `);
      add(v(p.fuente), true);
      add(v(p.paginas) ? ` (pp. ${p.paginas}). ` : '. ');
      if (v(p.editorial)) add(`${punto(v(p.editorial))} `);
      break;
    }
    case 'libro': {
      add(titulo, true);
      add('. ');
      if (v(p.editorial)) add(`${punto(v(p.editorial))} `);
      break;
    }
    case 'ponencia': {
      add(titulo, true);
      add(' [Ponencia]. ');
      if (v(p.fuente)) add(`${punto(v(p.fuente))} `);
      break;
    }
    default: {
      add(titulo, true);
      add('. ');
      if (v(p.fuente)) add(`${punto(v(p.fuente))} `);
      if (v(p.editorial)) add(`${punto(v(p.editorial))} `);
    }
  }
  add(enlace);

  const texto = partes.map(([t]) => t).join('').trim();
  const html = partes.map(([t, it]) => (it ? `<i>${escapar(t)}</i>` : escapar(t))).join('').trim();
  return { html, texto };
}
