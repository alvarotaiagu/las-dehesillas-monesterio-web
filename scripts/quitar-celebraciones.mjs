/* Quita el módulo «Celebraciones» de una carpeta de la web.

   node scripts/quitar-celebraciones.mjs ../copia-de-la-web     (sobre una copia)
   node scripts/quitar-celebraciones.mjs --aqui                 (en esta misma carpeta, sin vuelta atrás)

   Lo que hace es exactamente la receta del README:
     1. index.html: borra la <section id="celebraciones"> entre sus marcas
        «[MÓDULO CELEBRACIONES]» y las tres líneas con data-modulo="celebraciones":
        el enlace del menú, el <link> de su hoja y el <script>.
     2. Borra css/celebraciones.css y js/celebraciones.js.
     3. Vuelve a versionar CSS y JS (?v=).
   No toca nada más: main.js y estilos.css no dependen del módulo.
   verificar.mjs lo ejecuta sobre una copia temporal y comprueba que la web
   sigue sin errores y con el resto de secciones en orden.
*/
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const aqui = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = process.argv[2];
if (!arg) { console.error('Uso: node scripts/quitar-celebraciones.mjs <carpeta> | --aqui'); process.exit(1); }
const raiz = arg === '--aqui' ? aqui : path.resolve(arg);

const ruta = path.join(raiz, 'index.html');
const antes = fs.readFileSync(ruta, 'utf8');
let t = antes;
const bloque = /[ \t]*<!-- ═+ \[MÓDULO CELEBRACIONES\][^>]*-->[\s\S]*?<!-- ═+ fin \[MÓDULO CELEBRACIONES\] ═+ -->\r?\n?/;
if (!bloque.test(t)) { console.error('No encuentro las marcas [MÓDULO CELEBRACIONES] en index.html: ¿ya se quitó?'); process.exit(1); }
t = t.replace(bloque, '');
/* líneas sueltas con el atributo: enlace del menú, <link> y <script> */
const lineas = t.split(/\r?\n/);
const quedan = lineas.filter(l => !/data-modulo="celebraciones"/.test(l));
const quitadas = lineas.length - quedan.length;
t = quedan.join('\n');
if (t.length < antes.length * 0.6) { console.error('Me niego: index.html perdería demasiado.'); process.exit(1); }
fs.writeFileSync(ruta, t);
console.log('index.html: sección quitada y ' + quitadas + ' líneas con data-modulo="celebraciones" (menú, hoja y script)');

for (const f of ['css/celebraciones.css', 'js/celebraciones.js']) {
  const r = path.join(raiz, f);
  if (fs.existsSync(r)) { fs.rmSync(r); console.log('borrado ' + f); }
}

const versionador = path.join(raiz, 'scripts/versionar.mjs');
if (fs.existsSync(versionador)) execFileSync(process.execPath, [versionador], { stdio: 'ignore' });
console.log('Módulo de celebraciones quitado de ' + raiz);
