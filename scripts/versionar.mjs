/* GitHub Pages sirve CSS/JS con max-age=600: tras un push el navegador mezcla
   durante 10 minutos la hoja vieja con el HTML nuevo. Cada referencia a los
   CSS/JS propios lleva ?v=<huella del contenido>; este script la recalcula.

   Anclado al atributo (href="…" / src="…") a propósito: la versión heredada de
   Miralles versionaba la primera mención del archivo, aunque estuviera en un
   comentario, y a la segunda pasada se comía el <html>. Es idempotente:
   ejecutado dos veces seguidas, la segunda dice «sin cambios».

   node scripts/versionar.mjs

   Si se ha quitado el módulo de celebraciones, sus dos archivos ya no están:
   se saltan sin error.
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const huella = f => crypto.createHash('sha1').update(fs.readFileSync(path.join(raiz, f))).digest('hex').slice(0, 8);
const archivos = ['css/estilos.css', 'css/celebraciones.css', 'js/main.js', 'js/celebraciones.js'];
const versiones = Object.fromEntries(archivos.filter(f => fs.existsSync(path.join(raiz, f))).map(f => [f, huella(f)]));
const escapar = s => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

for (const pagina of ['index.html', 'aviso-legal.html', 'privacidad.html']) {
  const ruta = path.join(raiz, pagina);
  let html = fs.readFileSync(ruta, 'utf8');
  const antes = html;
  for (const [archivo, v] of Object.entries(versiones)) {
    html = html.replace(new RegExp('((?:href|src)="' + escapar(archivo) + ')(\\?v=[0-9a-f]*)?"', 'g'), '$1?v=' + v + '"');
  }
  if (html !== antes) fs.writeFileSync(ruta, html);
  console.log((html !== antes ? 'actualizado ' : 'sin cambios ') + pagina);
}
console.log(versiones);
