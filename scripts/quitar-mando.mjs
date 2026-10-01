/* Genera la copia que viaja al cliente, SIN el mando de maqueta.
   No toca esta carpeta: escribe una copia limpia en otra, para que la maqueta
   con sus dos versiones siga sirviendo para la reunión.

   node scripts/quitar-mando.mjs ../las-dehesillas-entrega
   node scripts/comprobar-borrado.mjs ../las-dehesillas-entrega

   Entrega la versión «Cal y almagre» (la cargada). Si el dueño elige la
   sobria, ver README → «Quitar el mando de maqueta», caso B.

   Qué quita, en todos los casos por marcas «[MANDO DE MAQUETA] … fin del
   bloque [MANDO DE MAQUETA]»:
     index.html            aviso del mando, lectura de la densidad en el <head>,
                           la «ficha rápida» y el <div class="mando">
     css/estilos.css       el bloque del mando y las reglas de la versión sobria
     css/celebraciones.css las reglas sobrias del módulo (si el módulo sigue)
     js/main.js            mandoMaqueta()
     privacidad.html       la fila de la clave dehesillas-densidad
   Después vuelve a versionar CSS y JS (?v=), porque han cambiado.
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!destino) { console.error('Uso: node scripts/quitar-mando.mjs <carpeta-destino>'); process.exit(1); }
if (destino === raiz || destino.startsWith(raiz + path.sep)) { console.error('El destino tiene que estar fuera de la maqueta.'); process.exit(1); }

const fuera = new Set(['scripts', 'screenshots', 'node_modules', '.git']);
function copiar(de, a) {
  fs.mkdirSync(a, { recursive: true });
  for (const e of fs.readdirSync(de, { withFileTypes: true })) {
    if (fuera.has(e.name)) continue;
    const o = path.join(de, e.name), d = path.join(a, e.name);
    if (e.isDirectory()) copiar(o, d); else fs.copyFileSync(o, d);
  }
}
fs.rmSync(destino, { recursive: true, force: true });
copiar(raiz, destino);

const bloqueHtml = /[ \t]*<!-- ═+ \[MANDO DE MAQUETA\][\s\S]*?fin del bloque \[MANDO DE MAQUETA\] ═+ -->\r?\n?/g;
const bloqueCodigo = /[ \t]*\/\*[^*]*?\[MANDO DE MAQUETA\][\s\S]*?fin del bloque \[MANDO DE MAQUETA\][^*]*\*\/\r?\n?/g;
const filaPrivacidad = /[ \t]*<!-- \[MANDO DE MAQUETA\][^>]*-->\s*<tr>[\s\S]*?<\/tr>\r?\n?/g;

const cambios = {
  'index.html': t => t.replace(bloqueHtml, '').replace(bloqueCodigo, ''),
  'css/estilos.css': t => t.replace(bloqueCodigo, ''),
  'css/celebraciones.css': t => t.replace(bloqueCodigo, ''),
  'js/main.js': t => t.replace(bloqueCodigo, ''),
  'privacidad.html': t => t.replace(filaPrivacidad, '')
};
for (const [archivo, f] of Object.entries(cambios)) {
  const ruta = path.join(destino, archivo);
  if (!fs.existsSync(ruta)) { console.log('no está     ' + archivo + '  (módulo quitado antes)'); continue; }
  const antes = fs.readFileSync(ruta, 'utf8');
  const despues = f(antes);
  /* nada de comodines que se coman el archivo: si pierde más de un tercio, algo va mal */
  if (despues.length < antes.length * 0.66) { console.error('Me niego: ' + archivo + ' perdería demasiado.'); process.exit(1); }
  fs.writeFileSync(ruta, despues);
  console.log((antes === despues ? 'sin cambios ' : 'limpiado    ') + archivo + '  (−' + (antes.length - despues.length) + ' caracteres)');
}
/* las huellas ?v= del destino, recalculadas con el versionador de la maqueta */
fs.mkdirSync(path.join(destino, 'scripts'), { recursive: true });
fs.copyFileSync(path.join(raiz, 'scripts/versionar.mjs'), path.join(destino, 'scripts/versionar.mjs'));
execFileSync(process.execPath, [path.join(destino, 'scripts/versionar.mjs')], { stdio: 'ignore' });
fs.rmSync(path.join(destino, 'scripts'), { recursive: true, force: true });
console.log('Copia sin mando en ' + destino);
