// TCW-27: lee un archivo del repo (ruta relativa a la raíz, p. ej. 'src/components/organisms/Menu/Menu.module.css').
// Se usa para afirmar reglas de CSS que jsdom no calcula. Si el archivo no existe devuelve '' (la afirmación falla
// con "expected '' to match ...", que es la razón correcta: falta el archivo de estilos).
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

export const readSrc = (rel: string): string => {
  const p = resolve(process.cwd(), rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : '';
};

export const listDir = (rel: string): string[] => {
  const p = resolve(process.cwd(), rel);
  return existsSync(p) && statSync(p).isDirectory() ? readdirSync(p) : [];
};
