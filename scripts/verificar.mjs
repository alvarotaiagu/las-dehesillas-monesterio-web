/* Verificación de Las Dehesillas · «Cal y almagre».
   Levanta un servidor estático, abre la web con Playwright y comprueba:
     · un test por cada punto del checklist de web desde cero (cursor, pila,
       menú móvil, cookies, cortina, hero en móviles bajos, con-movimiento,
       trazos con autoRound, clases de estado con prefijo);
     · la cortina: un fotograma a medias, el zócalo puesto al final y su
       retirada sin CDN y con movimiento reducido;
     · el plano: anclado con la cámara recorriendo los 5 puntos, y los 5 puntos
       responden y llevan a su sección;
     · la pila sticky en página limpia;
     · el configurador y el formulario componen el mensaje y el mailto va bien
       codificado;
     · el borrado del módulo de celebraciones sobre una copia;
     · las dos densidades, y que sin ?revision no hay mando;
     · que ningún texto diga «Starlight», «hierro», «desde … €» ni «paraíso».
   Se baja con mouse.wheel: con Lenis, window.scrollTo no dispara ScrollTrigger.

   node scripts/verificar.mjs            (todo)
   node scripts/verificar.mjs --capturas (además guarda screenshots/)
*/
import { chromium, webkit, devices } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conCapturas = process.argv.includes('--capturas');
if (conCapturas) fs.mkdirSync(path.join(raiz, 'screenshots'), { recursive: true });
const foto = n => path.join(raiz, 'screenshots', n);
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json'
};

function servir(dir, puerto) {
  const s = http.createServer((req, res) => {
    const limpia = decodeURIComponent(req.url.split('?')[0]);
    const destino = path.join(dir, limpia === '/' ? 'index.html' : limpia);
    if (!destino.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(dir, '404.html')));
      return;
    }
    res.writeHead(200, { 'content-type': tipos[path.extname(destino)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(fs.readFileSync(destino));
  });
  return new Promise(r => s.listen(puerto, '127.0.0.1', () => r(s)));
}

const fallos = [];
const notas = [];
function comprobar(ok, mensaje) { (ok ? notas : fallos).push((ok ? 'OK   ' : 'FALLA') + ' · ' + mensaje); }

async function rueda(page, vueltas, paso = 600, espera = 220) {
  for (let i = 0; i < vueltas; i++) { await page.mouse.wheel(0, paso); await page.waitForTimeout(espera); }
  await page.waitForTimeout(1600);
}
/* lleva la página hasta que el selector quede bajo la cabecera, con la rueda */
async function hasta(page, selector, margen = 0) {
  for (let i = 0; i < 120; i++) {
    const top = await page.evaluate(s => document.querySelector(s).getBoundingClientRect().top, selector);
    if (top <= 90 + margen && top > -40) break;
    const paso = top > 0 ? Math.min(600, Math.max(100, top - 60)) : Math.max(-600, top - 80);
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(1600);
}
/* baja hasta el final cargando todo (imágenes lazy incluidas) */
async function recorrer(page) {
  let ant = -1;
  for (let i = 0; i < 160; i++) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(120);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    if (y === ant) break;
    ant = y;
  }
  await page.waitForTimeout(2500);
}

async function nuevaPagina(navegador, opciones = {}) {
  const contexto = await navegador.newContext({
    viewport: opciones.viewport || { width: 1440, height: 900 },
    reducedMotion: opciones.reducedMotion || 'no-preference',
    hasTouch: !!opciones.tactil, isMobile: !!opciones.tactil,
    deviceScaleFactor: 1
  });
  if (opciones.cookiesVistas) await contexto.addInitScript(() => { try { localStorage.setItem('dehesillas-cookies', 'ok'); } catch (e) {} });
  const page = await contexto.newPage();
  const errores = [];
  const caidas = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.on('requestfailed', r => caidas.push(r.url() + ' → ' + (r.failure()?.errorText || '')));
  page.on('response', r => { if (r.status() >= 400) caidas.push(r.status() + ' ' + r.url()); });
  return { contexto, page, errores, caidas };
}
const esperarCortina = page => page.waitForFunction(() => getComputedStyle(document.getElementById('cortina')).display === 'none', null, { timeout: 9000 }).catch(() => {});
const caidasPropias = c => c.filter(x => !/favicon\.ico|google\.com\/maps|gstatic|googleapis\.com\/maps|maps\.google|googleusercontent|streetview/.test(x));

const PUERTO = 4196;
const base = 'http://127.0.0.1:' + PUERTO;
const servidor = await servir(raiz, PUERTO);
const navegador = await chromium.launch();
const VIEWPORTS = [[360, 640], [375, 667], [390, 844], [768, 1024], [1440, 900]];
const ORDEN = ['inicio', 'la-finca', 'plano', 'casas', 'que-hacer', 'celebraciones', 'resenas', 'como-llegar', 'consultar'];

try {
  /* ───── 0. archivos ───── */
  {
    const paginas = ['index.html', 'aviso-legal.html', 'privacidad.html', '404.html'];
    for (const p of paginas) {
      const t = fs.readFileSync(path.join(raiz, p), 'utf8');
      const charset = t.indexOf('<meta charset'), robots = t.indexOf('<meta name="robots" content="noindex, nofollow">');
      comprobar(robots > charset && charset > 0 && t.indexOf('<head>') < charset, p + ': noindex justo detrás del charset');
    }
    const huella = f => crypto.createHash('sha1').update(fs.readFileSync(path.join(raiz, f))).digest('hex').slice(0, 8);
    const idx = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
    for (const f of ['css/estilos.css', 'css/celebraciones.css', 'js/main.js', 'js/celebraciones.js']) {
      const m = idx.match(new RegExp('(?:href|src)="' + f.replace(/[./]/g, '\\$&') + '\\?v=([0-9a-f]{8})"'));
      comprobar(m && m[1] === huella(f), 'versionado: ' + f + '?v=' + (m ? m[1] : '—') + ' = huella ' + huella(f));
    }
    const sinAtributo = idx.replace(/(?:href|src)="[^"]*"/g, '');
    comprobar(!/\?v=/.test(sinAtributo), 'versionado: el ?v= solo aparece dentro de href/src');
    comprobar(!/cdnjs\.cloudflare\.com\/ajax\/libs\/lenis/.test(idx) && /cdn\.jsdelivr\.net\/npm\/lenis@/.test(idx), 'Lenis desde jsDelivr (cdnjs da 404)');
    const css = fs.readFileSync(path.join(raiz, 'css/estilos.css'), 'utf8');
    comprobar(/\.cookies:not\(\[hidden\]\)\s*\{\s*display:\s*flex/.test(css) && !/\.cookies\s*\{[^}]*display:\s*flex/.test(css), 'checklist 4 · cookies: display:flex solo en .cookies:not([hidden])');
    comprobar(/height:\s*100dvh/.test(css), 'checklist 3 · menú móvil con altura 100dvh');
    comprobar(/\.cortina\[hidden\]\s*\{\s*display:\s*none/.test(css), 'cortina: su propia regla [hidden]');
    const js = fs.readFileSync(path.join(raiz, 'js/main.js'), 'utf8');
    comprobar(!/getContext\(|\.filter\s*=|shadowBlur/.test(js) && !/filter\s*:\s*['"]/.test(js) && !/dropShadow|drop-shadow/.test(js),
      'cortina: ningún filter ni drop-shadow animado (el halo son copias con desenfoque fijo, solo cambia su opacidad)');
    const dash = /strokeDashoffset|stroke-dashoffset/.test(js);
    comprobar(!dash || /autoRound:\s*false/.test(js), 'checklist 8 · trazos: ' + (dash ? 'con autoRound:false' : 'no hay trazos dibujados con dashoffset (el monograma no se traza)'));
    const estados = (js + fs.readFileSync(path.join(raiz, 'js/celebraciones.js'), 'utf8')).match(/classList\.(?:add|toggle|remove)\('([^']+)'/g) || [];
    const sinPrefijo = estados.map(s => s.match(/'([^']+)'/)[1]).filter(c => /^(activo|visible|pintada|hoy|abierto|actual|on)$/.test(c));
    comprobar(sinPrefijo.length === 0, 'checklist 9 · clases de estado con prefijo es- (ninguna «activo», «visible»… a secas)' + (sinPrefijo.length ? ' → ' + sinPrefijo.join(',') : ''));
    const jsonHabs = JSON.parse(fs.readFileSync(path.join(raiz, 'data/habitaciones.json'), 'utf8'));
    comprobar(jsonHabs.habitaciones.length === 10 && jsonHabs.habitaciones.every(h => ['nombre', 'casa', 'camas', 'foto'].every(k => h[k] === '[PENDIENTE]')),
      'data/habitaciones.json: 10 entradas [PENDIENTE] para nombre, camas, casa y foto');
  }

  /* ───── 1. escritorio, pasada normal ───── */
  {
    const { contexto, page, errores, caidas } = await nuevaPagina(navegador);
    /* el contador de celebraciones se graba desde la carga: cuenta en cuanto asoma */
    await contexto.addInitScript(() => {
      window.__cuenta = [];
      document.addEventListener('DOMContentLoaded', () => {
        const n = document.getElementById('celebra-n');
        if (!n) return;
        window.__cuenta.push(n.textContent);
        new MutationObserver(() => window.__cuenta.push(n.textContent)).observe(n, { childList: true, characterData: true, subtree: true });
      });
    });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });

    /* cortina: fotogramas intermedios */
    const muestras = [];
    const t0 = Date.now();
    let capturadas = 0;
    const instantes = [250, 900, 1500, 2050];
    while (Date.now() - t0 < 3600) {
      const m = await page.evaluate(() => {
        const c = document.getElementById('cortina');
        const e = getComputedStyle(c);
        const sello = getComputedStyle(document.getElementById('cortina-sello')).transform;
        const op = n => +getComputedStyle(document.querySelector('.cortina__mm--' + n)).opacity;
        const d = document.getElementById('cortina-panel').getAttribute('d') || '';
        const arriba = parseFloat((d.match(/^M0 ([\d.-]+)/) || [])[1]);
        return { display: e.display, fondo: e.backgroundColor, panel: getComputedStyle(document.getElementById('cortina-panel')).fill, sello, vivo: op('vivo'), halo: op('halo'), almagre: op('almagre'), arriba, h: innerHeight };
      });
      muestras.push({ t: Date.now() - t0, ...m });
      if (conCapturas && capturadas < instantes.length && Date.now() - t0 >= instantes[capturadas]) {
        await page.screenshot({ path: foto('00' + 'abcd'[capturadas] + '-cortina.png') });
        capturadas++;
      }
      await page.waitForTimeout(50);
    }
    const tapaba = muestras.find(m => m.t < 300);
    comprobar(tapaba && tapaba.display === 'block', 'cortina: tapa la página al cargar');
    const escala = s => { const m = s.match(/matrix\(([\d.]+)/); return m ? +m[1] : 1; };
    comprobar(muestras.some(m => m.vivo > 0.9 && m.halo > 0.9) && muestras.some(m => escala(m.sello) > 1.01),
      'cortina 1 · golpe: el monograma entero al rojo vivo con su halo y el asiento de escala (máx. ' + Math.max(...muestras.map(m => escala(m.sello))).toFixed(3) + ')');
    comprobar(muestras.some(m => m.almagre > 0.9 && m.vivo < 0.05 && m.halo < 0.05), 'cortina 2 · enfriado: de brasa a almagre y el halo apagado');
    const cayendo = muestras.find(m => m.display === 'block' && m.arriba > 20 && m.arriba < m.h - 120);
    comprobar(!!cayendo, 'cortina 4 · fotograma a medias: el panel bajando (borde a ' + (cayendo ? Math.round(cayendo.arriba) : '—') + ' px)');
    comprobar(cayendo && cayendo.fondo === 'rgba(0, 0, 0, 0)', 'cortina: con el panel bajando, la capa no tiene fondo opaco → ' + (cayendo && cayendo.fondo));
    comprobar(cayendo && /110, 42, 34/.test(cayendo.panel), 'cortina: el panel se ha teñido de almagre al bajar → ' + (cayendo && cayendo.panel));
    const carbon = muestras.find(m => m.t < 400);
    const fondoHero = await page.evaluate(() => getComputedStyle(document.getElementById('inicio')).backgroundColor);
    comprobar(carbon && carbon.panel !== fondoHero && /22, 19, 15/.test(carbon.panel), 'cortina: carbón (' + (carbon && carbon.panel) + '), distinto del hero de cal (' + fondoHero + ')');
    await esperarCortina(page);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display) === 'none', 'cortina: acaba en display:none (pasada normal)');
    const traspaso = await page.evaluate(() => {
      const d = window.Dehesillas.cortinaDestino();
      const z = document.getElementById('hero-zocalo');
      const r = z.getBoundingClientRect(), e = getComputedStyle(z);
      return { destino: d, zTop: Math.round(r.top), zBottom: Math.round(r.bottom), h: innerHeight, fondo: e.backgroundColor, op: e.opacity, y: scrollY };
    });
    comprobar(traspaso.destino && Math.abs(traspaso.destino.arriba - traspaso.zTop) <= 2 && Math.abs((traspaso.h - traspaso.destino.abajo) - traspaso.zBottom) <= 2 && /110, 42, 34/.test(traspaso.fondo) && traspaso.op === '1',
      'cortina: se comprime justo en la franja del zócalo del hero, que se queda puesta → ' + JSON.stringify(traspaso));
    comprobar(await page.evaluate(() => document.documentElement.classList.contains('con-movimiento')), 'checklist 7 · con-movimiento activo con GSAP y sin movimiento reducido');
    await page.waitForTimeout(1800);
    const desborda = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    comprobar(desborda <= 1, 'sin desbordamiento horizontal en escritorio (' + desborda + 'px)');
    if (conCapturas) await page.screenshot({ path: foto('01-hero.png') });

    /* cursor propio */
    await page.mouse.move(700, 300);
    await page.mouse.move(720, 320, { steps: 4 });
    await page.waitForTimeout(400);
    const cursorLibre = await page.evaluate(() => ({
      sistema: getComputedStyle(document.body).cursor,
      aro: getComputedStyle(document.querySelector('.cursor')).opacity,
      punto: getComputedStyle(document.querySelector('.cursor-punto')).opacity
    }));
    comprobar(cursorLibre.sistema === 'none' && cursorLibre.aro === '1' && cursorLibre.punto === '1',
      'checklist 1 · cursor: aro + punto visibles y el del sistema oculto → ' + JSON.stringify(cursorLibre));
    const boton = await page.locator('.hero__acciones .boton--almagre').boundingBox();
    await page.mouse.move(boton.x + boton.width / 2, boton.y + boton.height / 2, { steps: 6 });
    await page.waitForTimeout(700);
    const cursorBoton = await page.evaluate(() => {
      const e = getComputedStyle(document.querySelector('.cursor'));
      return { fondo: e.backgroundColor, ancho: e.width, sistema: getComputedStyle(document.querySelector('.hero__acciones .boton')).cursor };
    });
    const alfa = parseFloat((cursorBoton.fondo.match(/rgba\([^)]*,\s*([\d.]+)\)/) || [])[1] || 0);
    comprobar(alfa >= 0.35 && cursorBoton.ancho === '66px' && cursorBoton.sistema === 'none',
      'checklist 1 · cursor: sobre un botón el aro crece y se rellena (alfa ' + alfa + ' ≥ .35), sin cursor del sistema');
    if (conCapturas) await page.screenshot({ path: foto('01b-cursor-boton.png'), clip: { x: boton.x - 50, y: boton.y - 50, width: boton.width + 100, height: boton.height + 100 } });
    await page.mouse.move(1435, 450, { steps: 4 });

    /* hero: paralaje dentro de la máscara */
    const paralaje0 = await page.evaluate(() => getComputedStyle(document.querySelector('#hero-foto img')).transform);
    await rueda(page, 1, 350);
    const paralaje1 = await page.evaluate(() => getComputedStyle(document.querySelector('#hero-foto img')).transform);
    comprobar(paralaje0 !== paralaje1, 'hero: la foto se mueve dentro de su arco al bajar (paralaje)');
    const progreso = await page.evaluate(() => ({ fija: document.getElementById('cabecera').classList.contains('cabecera--fija'), p: parseFloat(getComputedStyle(document.getElementById('progreso')).getPropertyValue('--p')), op: getComputedStyle(document.getElementById('progreso')).opacity }));
    comprobar(progreso.fija && progreso.p > 0 && progreso.op === '1', 'cabecera: fija y con la barra de lectura (un zócalo que crece) → ' + JSON.stringify(progreso));

    /* la finca y el primer separador */
    await hasta(page, '#la-finca');
    if (conCapturas) await page.screenshot({ path: foto('02-la-finca.png') });
    const finca = await page.evaluate(() => ({
      pintada: document.querySelector('.separa').classList.contains('es-pintada'),
      encalada: document.getElementById('finca-foto').classList.contains('es-visible'),
      cita: document.querySelector('.finca__cita p').getAttribute('aria-label')
    }));
    comprobar(finca.encalada, 'la finca: la foto de los naranjos se encala al entrar');
    comprobar(/^«Despierta rodeado de naturaleza .* cielos más espectaculares de Europa»$/.test(finca.cita), 'el cielo solo aparece como cita suya, entre comillas');

    /* el plano anclado: la cámara recorre los cinco puntos */
    await hasta(page, '#plano', 40);
    const muestrasPlano = [];
    for (let i = 0; i < 42; i++) {
      await page.mouse.wheel(0, 160);
      await page.waitForTimeout(140);
      muestrasPlano.push(await page.evaluate(() => ({
        top: Math.round(document.getElementById('plano').getBoundingClientRect().top),
        escala: +window.gsap.getProperty(document.getElementById('plano-camara'), 'scale').toFixed(2),
        activo: window.Dehesillas.puntoActivo(),
        lista: [...document.querySelectorAll('.punto.es-activo')].map(n => +n.dataset.punto).join(),
        visibles: [...document.querySelectorAll('.pin')].filter(p => { const r = p.getBoundingClientRect(); return r.width > 0 && getComputedStyle(p).display !== 'none'; }).length
      })));
      if (conCapturas && i === 14) await page.screenshot({ path: foto('03-plano-zoom.png') });
    }
    const anclado = await page.evaluate(() => document.documentElement.classList.contains('plano-anclado'));
    const vistos = [...new Set(muestrasPlano.map(m => m.activo))];
    const enOrden = vistos.filter(k => k > 0).every((k, i, a) => i === 0 || k > a[i - 1]);
    comprobar(anclado && muestrasPlano.filter(m => Math.abs(m.top) <= 1).length >= 10, 'plano: anclado mientras la cámara recorre la finca (' + muestrasPlano.filter(m => Math.abs(m.top) <= 1).length + ' muestras clavadas)');
    comprobar(Math.max(...muestrasPlano.map(m => m.escala)) >= 2.2, 'plano: la cámara se acerca (escala máx. ' + Math.max(...muestrasPlano.map(m => m.escala)) + ')');
    comprobar([1, 2, 3, 4, 5].every(k => vistos.includes(k)) && enOrden, 'plano: el punto activo avanza 1 → 5 por turno → ' + vistos.join(' → '));
    comprobar(muestrasPlano.every(m => m.activo === 0 || m.lista === String(m.activo)), 'plano: la lista avanza con la cámara (un solo punto marcado y es el de la cámara)');
    comprobar(muestrasPlano.every(m => m.visibles === 5), 'checklist 9 · plano: los 5 puntos siguen visibles con uno marcado (no se esconde el activo)');

    /* casas: sin JSON no hay hueco */
    await hasta(page, '#casas');
    const casas = await page.evaluate(() => ({ fichas: document.getElementById('fichas').hidden, alto: document.getElementById('fichas').offsetHeight, rasgos: document.querySelectorAll('.rasgos li').length }));
    comprobar(casas.fichas && casas.alto === 0 && casas.rasgos === 8, 'casas: con el JSON pendiente no se pinta nada y no queda hueco; 8 características reales');
    if (conCapturas) await page.screenshot({ path: foto('04-casas.png') });
    await rueda(page, 2, 500);
    if (conCapturas) await page.screenshot({ path: foto('04b-casas-galeria.png') });

    /* qué hacer */
    await hasta(page, '#que-hacer');
    if (conCapturas) await page.screenshot({ path: foto('05-que-hacer.png') });
    await hasta(page, '#hacer-buggy', 40); await rueda(page, 1, 250);
    if (conCapturas) await page.screenshot({ path: foto('05b-pila-media.png') });
    const alturas = await page.evaluate(() => [...document.querySelectorAll('.pila__item .tarjeta')].map(t => ({ alto: t.offsetHeight, cabe: t.scrollHeight <= t.clientHeight + 1 })));
    comprobar(new Set(alturas.map(a => a.alto)).size === 1 && alturas.every(a => a.cabe), 'checklist 2 · pila: las seis tarjetas miden lo mismo (medido por JS) y su contenido cabe → ' + alturas.map(a => a.alto).join('/'));

    /* marquee */
    await hasta(page, '#cinta', 300);
    const c1 = await page.evaluate(() => document.getElementById('cinta-pista').style.transform);
    await page.waitForTimeout(500);
    const c2 = await page.evaluate(() => ({ t: document.getElementById('cinta-pista').style.transform, cruces: document.querySelectorAll('#cinta-pista use[href="#cruz"]').length, fondo: getComputedStyle(document.getElementById('cinta')).backgroundColor }));
    comprobar(c1 !== c2.t && c2.cruces >= 6 && /110, 42, 34/.test(c2.fondo), 'marquee sobre almagre, en marcha, con la cruz del monograma de separador (' + c2.cruces + ' cruces)');
    if (conCapturas) await page.screenshot({ path: foto('06-marquee.png') });

    /* celebraciones: la cifra cuenta de 22 a 34 */
    await hasta(page, '#celebraciones');
    await page.waitForTimeout(1200);
    const cuenta = (await page.evaluate(() => window.__cuenta)).map(Number);
    const sube = cuenta.slice(1).every((v, i) => v >= cuenta[i]);
    comprobar(cuenta[0] === 22 && cuenta[cuenta.length - 1] === 34 && cuenta.length > 8 && sube,
      'celebraciones: la cifra cuenta de 22 a 34 al entrar (' + cuenta.filter((v, i, a) => i === 0 || v !== a[i - 1]).join(' ') + ')');
    if (conCapturas) { await hasta(page, '#celebraciones'); await page.screenshot({ path: foto('07-celebraciones.png') }); }

    /* reseñas */
    await hasta(page, '#resenas');
    await page.waitForTimeout(900);
    if (conCapturas) await page.screenshot({ path: foto('08-resenas.png') });
    const resenas = await page.evaluate(() => ({
      titulo: document.getElementById('resenas-titulo').innerText.replace(/\s+/g, ' ').trim(),
      citas: [...document.querySelectorAll('.cita blockquote')].map(b => b.textContent.trim()),
      boton: document.querySelector('#resenas a.boton').href
    }));
    comprobar(/^4,6★ ?100 reseñas en Google$/i.test(resenas.titulo.replace(/·/g, '').replace(/\s+/g, ' ')) || /4,6★.*100 reseñas en Google/i.test(resenas.titulo), 'reseñas: «4,6★ · 100 reseñas en Google» → «' + resenas.titulo + '»');
    const guardadas = JSON.parse(fs.readFileSync(path.join(raiz, 'scripts/fuentes/resenas-google-2026-10-01.json'), 'utf8')).r.map(r => (r.texto || '').replace(/\s+/g, ' ').trim());
    const literales = resenas.citas.map(c => c.replace(/^«|»$/g, '').replace(/\s+/g, ' ').trim()).every(c => guardadas.includes(c));
    comprobar(resenas.citas.length === 3 && literales, 'reseñas: tres citas, todas literales de la ficha de Google (comparadas con las descargadas)');
    comprobar(/0xd13c71a552482a7:0x799aabdd9136cf78/.test(resenas.boton) && /!9m1!1b1/.test(resenas.boton), 'reseñas: el botón va a su ficha real, con las reseñas abiertas');

    /* cómo llegar y mapa */
    await hasta(page, '#como-llegar');
    if (conCapturas) await page.screenshot({ path: foto('09-como-llegar.png') });
    const llegar = await page.evaluate(() => document.getElementById('como-llegar').innerText);
    comprobar(/km 32 de la BA-067|km 32/.test(llegar) && /Santa María \/ Pallares/.test(llegar) && /indicaciones detalladas/.test(llegar) && !/\d+\s*(min|minutos|km de|horas?)\b/.test(llegar.replace(/km 32/g, '')),
      'cómo llegar: dirección, km 32 de la BA-067 dirección Santa María / Pallares, su aviso, y ni distancias ni tiempos inventados');

    const cookiesVisible = await page.evaluate(() => { const c = document.getElementById('cookies'); return { oculto: c.hidden, display: getComputedStyle(c).display }; });
    comprobar(!cookiesVisible.oculto && cookiesVisible.display === 'flex', 'checklist 4 · cookies: el aviso se ve al entrar');
    await page.click('#cookies-aceptar');
    await page.waitForTimeout(300);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display) === 'none', 'checklist 4 · cookies: el botón lo cierra de verdad');

    const iframesAntes = await page.$$eval('iframe', n => n.length);
    await page.click('#mapa-boton');
    await page.waitForTimeout(600);
    const marcos = await page.$$eval('iframe', n => n.map(i => i.src));
    comprobar(iframesAntes === 0 && marcos.length === 1 && /google\.com\/maps\?q=38\.0451853/.test(marcos[0]) && /output=embed/.test(marcos[0]), 'mapa: el iframe no existe hasta el clic (maps?q=…&output=embed, sin API key)');

    /* consultar y pie */
    await hasta(page, '#consultar');
    if (conCapturas) await page.screenshot({ path: foto('10-consultar.png') });
    await rueda(page, 4, 700);
    if (conCapturas) await page.screenshot({ path: foto('11-pie.png') });
    const pie = await page.evaluate(() => {
      const z = document.querySelector('.pie__zocalo'), r = z.getBoundingClientRect();
      return { abajo: Math.round(innerHeight - r.bottom), fondo: getComputedStyle(z).backgroundColor, logo: document.querySelector('.pie__logo').complete && document.querySelector('.pie__logo').naturalWidth > 0, redes: [...document.querySelectorAll('.pie a')].map(a => a.href).join(' ') };
    });
    comprobar(pie.abajo <= 1 && /110, 42, 34/.test(pie.fondo) && pie.logo, 'pie: logo vectorizado y el zócalo cierra la página');
    comprobar(/instagram\.com\/fincalasdehesillas/.test(pie.redes) && /facebook\.com/.test(pie.redes) && /aviso-legal/.test(pie.redes), 'pie: Instagram, Facebook y legales');

    const mandoSin = await page.evaluate(() => { const m = document.getElementById('mando'); return { oculto: m.hidden, display: getComputedStyle(m).display }; });
    comprobar(mandoSin.oculto && mandoSin.display === 'none', 'sin ?revision no hay mando → ' + JSON.stringify(mandoSin));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
    comprobar(await page.evaluate(() => document.getElementById('cookies').hidden), 'checklist 4 · cookies: tras aceptar, al recargar ya no sale');

    comprobar(errores.length === 0, 'consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    const cr = caidasPropias(caidas);
    comprobar(cr.length === 0, 'sin peticiones caídas' + (cr.length ? ' → ' + cr.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 1b. la pila, en una página limpia y bajando desde arriba ───── */
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: vp, cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    await page.waitForTimeout(1200);
    await page.mouse.move(vp.width - 5, vp.height / 2);
    const suelta = await page.evaluate(() => document.getElementById('que-hacer').classList.contains('pila-suelta'));
    const n = vp.width + '×' + vp.height;
    if (suelta) { comprobar(true, 'pila ' + n + ': no cabe anclada y se desapila (medido)'); await contexto.close(); continue; }
    await hasta(page, '#hacer-piscina', 300);
    const tope = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.pila__item')).top));
    let ultimo = null, sueltaAntes = null, asomaDebajo = null, seSeparan = null, ultimaPosada = false;
    for (let i = 0; i < 110; i++) {
      await page.mouse.wheel(0, 90);
      await page.waitForTimeout(160);
      const m = await page.evaluate(() => [...document.querySelectorAll('.pila__item')].map(li => { const r = li.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }));
      ultimo = m;
      const ultima = m[m.length - 1];
      const anteriores = m.slice(0, -1);
      if (!ultimaPosada && ultima[0] > tope + 2 && ultima[0] < vp.height && anteriores.some(a => a[0] < tope - 2)) sueltaAntes = sueltaAntes || { paso: i, m };
      if (Math.abs(ultima[0] - tope) <= 2) {
        ultimaPosada = true;
        if (anteriores.some(a => a[1] > ultima[1] + 1)) asomaDebajo = asomaDebajo || { paso: i, m };
      }
      if (ultimaPosada && anteriores.some(a => Math.abs(a[0] - ultima[0]) > 2)) seSeparan = seSeparan || { paso: i, m };
      if (ultimaPosada && ultima[1] < 0) break;
    }
    const sinLlegar = ultimaPosada ? '' : ' (la última no llegó a posarse: ' + JSON.stringify(ultimo) + ')';
    comprobar(ultimaPosada && !sueltaAntes, 'checklist 2 · pila ' + n + ': ninguna tarjeta se suelta antes de que se pose la última' + (sueltaAntes ? ' → ' + JSON.stringify(sueltaAntes) : '') + sinLlegar);
    comprobar(ultimaPosada && !asomaDebajo, 'checklist 2 · pila ' + n + ': la última tapa entera a la anterior' + (asomaDebajo ? ' → ' + JSON.stringify(asomaDebajo) : '') + sinLlegar);
    comprobar(ultimaPosada && !seSeparan, 'checklist 2 · pila ' + n + ': al acabarse, las seis salen juntas' + (seSeparan ? ' → ' + JSON.stringify(seSeparan) : '') + sinLlegar);
    await contexto.close();
  }

  /* ───── 2. los 5 puntos del plano responden y llevan a su sección ───── */
  for (const [nombre, vp] of [['escritorio', { width: 1440, height: 900 }], ['móvil', { width: 390, height: 844 }]]) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: vp, cookiesVistas: true, reducedMotion: 'reduce', tactil: vp.width < 900 });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const destinos = await page.$$eval('.pin', ps => ps.map(p => ({ k: p.dataset.punto, href: p.getAttribute('href') })));
    const esperados = { 1: '#hacer-piscina', 2: '#hacer-padel', 3: '#la-finca', 4: '#casas', 5: '#hacer-caballos' };
    comprobar(destinos.length === 5 && destinos.every(d => esperados[d.k] === d.href), 'plano (' + nombre + '): 5 puntos numerados con su sección → ' + destinos.map(d => d.k + d.href).join(' '));
    let bien = 0;
    const malos = [];
    for (const d of destinos) {
      await page.evaluate(() => window.scrollTo(0, document.getElementById('plano').offsetTop));
      await page.waitForTimeout(200);
      const pin = page.locator('.pin[data-punto="' + d.k + '"]');
      if (vp.width >= 900) {
        await pin.hover();
        await page.waitForTimeout(150);
        const marcado = await page.evaluate(k => document.querySelector('.punto[data-punto="' + k + '"]').classList.contains('es-activo') && document.querySelector('.pin[data-punto="' + k + '"]').classList.contains('es-activo'), d.k);
        if (!marcado) { malos.push(d.k + ' no responde'); continue; }
      }
      await pin.click();
      await page.waitForTimeout(500);
      const top = await page.evaluate(h => Math.round(document.querySelector(h).getBoundingClientRect().top), d.href);
      /* las tarjetas de la pila son sticky: se posan en su tope (cabecera + 3vh), no bajo la cabecera */
      const { cab, tope } = await page.evaluate(h => ({ cab: document.getElementById('cabecera').offsetHeight, tope: parseFloat(getComputedStyle(document.querySelector(h)).top) || 0 }), d.href);
      if (Math.abs(top - cab) <= 5 || Math.abs(top - tope) <= 2) bien++; else malos.push(d.k + ' → ' + d.href + ' top ' + top);
    }
    comprobar(bien === 5, 'plano (' + nombre + '): cada punto ' + (vp.width >= 900 ? 'se marca con su línea al pasar y ' : '') + 'lleva a su sección' + (malos.length ? ' → ' + malos.join(', ') : ''));
    if (vp.width < 900) {
      const movil = await page.evaluate(() => ({ pos: getComputedStyle(document.getElementById('plano-marco')).position, zonas: [...document.querySelectorAll('.punto__zona')].filter(i => i.getBoundingClientRect().width > 0).length }));
      comprobar(movil.pos === 'sticky' && movil.zonas === 5, 'plano (móvil): sin pin, la foto se queda fija arriba y debajo van 5 tarjetas con su recorte ampliado');
    }
    await contexto.close();
  }

  /* ───── 3. configurador de celebraciones y formulario de fechas ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { cookiesVistas: true });
    await contexto.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    await page.evaluate(() => document.getElementById('celebraciones').scrollIntoView());
    await page.waitForTimeout(400);
    await page.check('input[name="tipo"][value="comunion"]', { force: true });
    await page.fill('#config-personas', '28');
    await page.selectOption('#config-mes', 'mayo');
    await page.check('input[name="aloja"][value="si"]', { force: true });
    await page.waitForTimeout(150);
    const esperado = 'Hola, somos 28 y queremos celebrar una comunión hacia mayo. Necesitaríamos alojamiento. ¿Nos contáis qué opciones hay? Gracias.';
    const c1 = await page.evaluate(() => ({ texto: document.getElementById('config-texto').textContent, href: document.getElementById('config-email').getAttribute('href'), aviso: document.getElementById('config-aviso').hidden }));
    comprobar(c1.texto === esperado, 'configurador: compone «' + c1.texto + '»');
    const u = new URL(c1.href.replace('mailto:', 'mailto://'));
    const cuerpo = c1.href.split('body=')[1];
    comprobar(c1.href.startsWith('mailto:cristinamunozma@gmail.com?subject=') && !/[ \n«»¿?]/.test(c1.href.split('?')[1].replace(/^subject=|&body=/g, '')) && decodeURIComponent(cuerpo) === esperado,
      'configurador: el mailto va bien codificado (asunto y cuerpo, sin espacios ni signos sueltos) → ' + c1.href.slice(0, 96) + '…');
    comprobar(c1.aviso, 'configurador: con 28 no hay aviso de espacios');
    await page.fill('#config-personas', '45');
    await page.fill('#config-comentarios', 'Comida & baile, sobre las 14:00');
    await page.waitForTimeout(150);
    const c2 = await page.evaluate(() => ({ texto: document.getElementById('config-texto').textContent, href: document.getElementById('config-email').getAttribute('href'), aviso: document.getElementById('config-aviso'), }));
    const c2b = await page.evaluate(() => ({ visible: !document.getElementById('config-aviso').hidden, aviso: document.getElementById('config-aviso').textContent, seccion: document.getElementById('celebraciones').innerText }));
    comprobar(c2b.visible && /para más invitados, preguntadnos por los espacios/i.test(c2b.aviso), 'configurador: pasado de 34, «Para más invitados, preguntadnos por los espacios»');
    comprobar(!/aforo|capacidad (máxima|para) \d|hasta \d+ invitados/i.test(c2b.seccion), 'celebraciones: ninguna cifra de aforo');
    comprobar(/Comida%20%26%20baile/.test(c2.href) && decodeURIComponent(c2.href.split('body=')[1]).includes('Comida & baile, sobre las 14:00.'), 'configurador: «&» y «:» de los comentarios codificados en el mailto');
    await page.click('#config-copiar');
    await page.waitForTimeout(300);
    const copiado = await page.evaluate(() => navigator.clipboard.readText());
    comprobar(copiado === (await page.textContent('#config-texto')), 'configurador: «Copiar mensaje» copia el mismo texto');
    const tel = await page.$$eval('#celebraciones a[href^="tel:"]', a => a.map(x => x.getAttribute('href')));
    comprobar(tel.includes('tel:+34636829845'), 'configurador: botón Llamar');
    if (conCapturas) { await page.evaluate(() => document.getElementById('config').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400); await page.screenshot({ path: foto('12-configurador.png') }); }

    /* formulario de fechas */
    await page.evaluate(() => document.getElementById('consultar').scrollIntoView());
    await page.click('.reserva__enviar');
    await page.waitForTimeout(150);
    const error = await page.textContent('#reserva-error');
    comprobar(/nombre/.test(error) && /fechas/.test(error) && /email o un teléfono/.test(error), 'formulario: sin datos, dice lo que falta → «' + error + '»');
    await page.fill('#r-nombre', 'Ana');
    await page.fill('#r-email', 'ana@example.com');
    await page.fill('#r-telefono', '600 000 000');
    await page.fill('#r-llegada', '2026-11-13');
    await page.fill('#r-salida', '2026-11-15');
    await page.fill('#r-tipo', 'Doble');
    await page.fill('#r-adultos', '2');
    await page.fill('#r-ninos', '1');
    await page.fill('#r-preferencias', 'Vamos con perro & con prisa?');
    await page.click('.reserva__enviar');
    await page.waitForTimeout(200);
    const r = await page.evaluate(() => ({ texto: document.getElementById('reserva-texto').textContent, href: document.getElementById('reserva-email').getAttribute('href'), visible: !document.getElementById('reserva-listo').hidden }));
    const cuerpoR = decodeURIComponent(r.href.split('body=')[1]);
    comprobar(r.visible && /Llegada: 13\/11\/2026/.test(r.texto) && /\(2 noches\)/.test(r.texto) && /Adultos: 2 · Niños: 1/.test(r.texto) && /Tipo de habitación: Doble/.test(r.texto),
      'formulario: compone el mensaje con sus mismos campos (fechas, noches, adultos, niños, tipo)');
    comprobar(cuerpoR === r.texto.replace(/\n/g, '\r\n') && /%0D%0A/.test(r.href) && /%26/.test(r.href) && /%3F/.test(r.href) && !/ /.test(r.href),
      'formulario: el mailto va bien codificado (saltos CRLF, «&» y «?» escapados, sin espacios)');
    await page.click('#reserva-copiar');
    await page.waitForTimeout(300);
    /* Windows devuelve el portapapeles con CRLF: se compara normalizado */
    comprobar((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n') === r.texto, 'formulario: «Copiar mensaje» copia el mensaje');
    if (conCapturas) { await page.evaluate(() => document.getElementById('reserva-listo').scrollIntoView({ block: 'center' })); await page.waitForTimeout(400); await page.screenshot({ path: foto('13-formulario-listo.png') }); }
    comprobar(errores.length === 0, 'formularios: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 4. las dos densidades ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador);
    await page.goto(base + '/index.html?revision', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    const mandoConCookies = await page.evaluate(() => getComputedStyle(document.getElementById('mando')).visibility);
    comprobar(mandoConCookies === 'hidden', 'mando: se aparta mientras el aviso de cookies está en pantalla');
    await page.click('#cookies-aceptar');
    await page.waitForTimeout(500);
    comprobar(await page.evaluate(() => !document.getElementById('mando').hidden && getComputedStyle(document.getElementById('mando')).visibility === 'visible'), 'con ?revision el mando aparece (lo enseña el JS) al cerrar las cookies');
    const leer = () => page.evaluate(() => ({
      clase: document.documentElement.className,
      boton: document.querySelector('[data-densidad="cal"]').textContent,
      separa: getComputedStyle(document.querySelector('.separa__banda')).height,
      progreso: getComputedStyle(document.getElementById('progreso')).display,
      cinta: getComputedStyle(document.getElementById('cinta')).display,
      ficha: getComputedStyle(document.getElementById('ficha')).display,
      fichaFilas: document.querySelectorAll('#ficha tr').length,
      zocaloHero: getComputedStyle(document.getElementById('hero-zocalo')).backgroundColor,
      zocaloPie: getComputedStyle(document.querySelector('.pie__zocalo')).backgroundColor,
      anclado: document.documentElement.classList.contains('plano-anclado'),
      pins: document.querySelectorAll('.pin').length,
      desborda: document.documentElement.scrollWidth - window.innerWidth,
      pulsado: document.querySelector('[aria-pressed="true"]').dataset.densidad
    }));
    const cal = await leer();
    comprobar(cal.boton === 'Cal y almagre' && parseFloat(cal.separa) >= 20 && cal.progreso !== 'none' && cal.cinta !== 'none' && cal.ficha === 'none' && cal.anclado,
      '«Cal y almagre»: zócalo en separadores y barra de lectura, plano anclado, marquee, sin ficha rápida → ' + JSON.stringify({ separa: cal.separa, cinta: cal.cinta, ficha: cal.ficha, anclado: cal.anclado }));
    await page.click('[data-densidad="sobria"]');
    await page.waitForTimeout(900);
    const sob = await leer();
    comprobar(sob.clase.includes('densidad-sobria') && sob.pulsado === 'sobria', 'sobria: la clase cambia en <html> y el botón queda pulsado');
    comprobar(parseFloat(sob.separa) <= 1 && sob.progreso === 'none' && sob.cinta === 'none', 'sobria: separadores de línea fina, sin barra de lectura y sin marquee');
    comprobar(/110, 42, 34/.test(sob.zocaloHero) && /110, 42, 34/.test(sob.zocaloPie), 'sobria: el zócalo se queda en el hero y en el pie');
    comprobar(!sob.anclado && sob.pins === 5, 'sobria: el plano sin pin, la aérea quieta con sus 5 puntos y la lista');
    comprobar(sob.ficha === 'block' && sob.fichaFilas === 8, 'sobria: añade la ficha rápida (capacidad, habitaciones, accesibilidad, mascotas, wifi, aparcamiento, piscina, pádel)');
    comprobar(sob.desborda <= 1, 'sobria: sin desbordamiento nuevo (' + sob.desborda + 'px)');
    if (conCapturas) {
      await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
      await page.screenshot({ path: foto('20-sobria-hero.png') });
      await hasta(page, '#ficha'); await page.screenshot({ path: foto('21-sobria-ficha.png') });
      await hasta(page, '#plano'); await page.screenshot({ path: foto('22-sobria-plano.png') });
      await hasta(page, '#hacer-padel', 40); await page.screenshot({ path: foto('23-sobria-pila.png') });
      await hasta(page, '#celebraciones'); await page.screenshot({ path: foto('24-sobria-celebraciones.png') });
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(150);
    comprobar((await page.evaluate(() => document.documentElement.className)).includes('densidad-sobria'), 'la densidad elegida se aplica sin parpadeo al recargar con ?revision');
    await esperarCortina(page);
    await page.click('[data-densidad="cal"]');
    await page.waitForTimeout(800);
    const vuelta = await leer();
    comprobar(vuelta.clase.includes('densidad-cal') && vuelta.cinta !== 'none' && vuelta.anclado, 'se puede volver a «Cal y almagre» (y el plano se vuelve a anclar)');
    await page.click('[data-densidad="sobria"]');
    await page.waitForTimeout(300);
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);
    const limpio = await page.evaluate(() => ({ clase: document.documentElement.className, mando: getComputedStyle(document.getElementById('mando')).display, guardada: localStorage.getItem('dehesillas-densidad') }));
    comprobar(limpio.guardada === 'sobria' && limpio.clase.includes('densidad-cal') && limpio.mando === 'none', 'sin ?revision: aunque haya una sobria guardada, se ve «Cal y almagre» y sin mando');
    await contexto.close();
  }

  /* ───── 5. móvil: menú con la cabecera fija ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { viewport: { width: 390, height: 844 }, tactil: true, cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    await page.waitForTimeout(800);
    const ancho = await page.evaluate(() => ({ innerWidth: window.innerWidth, scroll: document.documentElement.scrollWidth }));
    comprobar(ancho.innerWidth === 390 && ancho.scroll - ancho.innerWidth <= 1, 'móvil: el viewport no se ensancha (' + JSON.stringify(ancho) + ')');
    comprobar(await page.evaluate(() => !document.querySelector('.cursor')), 'checklist 1 · móvil táctil: no hay cursor propio');
    await page.tap('#hamburguesa');
    await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'true', 'móvil: el menú abre (aria-expanded)');
    if (conCapturas) await page.screenshot({ path: foto('30-movil-menu.png') });
    await page.tap('#hamburguesa');
    await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'false', 'móvil: el mismo botón cierra el menú');
    await page.evaluate(() => window.scrollTo(0, 2600));
    await page.waitForTimeout(700);
    const panel = await page.evaluate(() => {
      const n = document.getElementById('menu').getBoundingClientRect();
      return { fija: document.getElementById('cabecera').classList.contains('cabecera--fija'), filtro: getComputedStyle(document.getElementById('cabecera')).backdropFilter, bottom: Math.round(n.bottom), alto: Math.round(n.height) };
    });
    comprobar(panel.fija && /blur/.test(panel.filtro) && panel.bottom <= 1 && panel.alto >= 844, 'checklist 3 · móvil: con la cabecera fija (blur) el menú cerrado queda fuera y mide la pantalla → ' + JSON.stringify(panel));
    await page.tap('#hamburguesa');
    await page.waitForTimeout(900);
    const abierto = await page.evaluate(() => { const r = document.getElementById('menu').getBoundingClientRect(); return { top: Math.round(r.top), alto: Math.round(r.height) }; });
    comprobar(abierto.top === 0 && abierto.alto >= 844, 'checklist 3 · móvil: con la cabecera fija el menú abierto ocupa toda la pantalla → ' + JSON.stringify(abierto));
    if (conCapturas) await page.screenshot({ path: foto('31-movil-menu-fija.png') });
    await page.tap('#hamburguesa');
    comprobar(errores.length === 0, 'móvil: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 6. hero en cinco pantallas: zócalo, foto y texto no se pisan + capturas ───── */
  for (const [w, hgt] of VIEWPORTS) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: { width: w, height: hgt }, cookiesVistas: true, tactil: w < 1000 });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    await page.waitForTimeout(2200);
    const r = await page.evaluate(() => {
      const c = s => document.querySelector(s).getBoundingClientRect();
      const cab = c('#cabecera'), t = c('.hero__titulo'), tx = c('.hero__texto'), acc = c('.hero__acciones'), f = c('#hero-foto'), z = c('#hero-zocalo'), zt = c('#hero-zocalo .zocalo__texto');
      const solapa = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
      return {
        cabAbajo: Math.round(cab.bottom), tituloArriba: Math.round(t.top),
        textoFoto: solapa(acc, f) || solapa(t, f), fotoZocalo: Math.round(f.bottom - z.top),
        textoZocalo: Math.round(acc.bottom - z.top), zTexto: zt.top >= z.top - 1 && zt.bottom <= z.bottom + 1 && zt.right <= innerWidth,
        tituloDer: Math.round(t.right), ancho: innerWidth, desborda: document.documentElement.scrollWidth - innerWidth
      };
    });
    comprobar(r.tituloArriba >= r.cabAbajo && !r.textoFoto && Math.abs(r.fotoZocalo) <= 1 && r.textoZocalo <= 0 && r.zTexto && r.desborda <= 1 && r.tituloDer <= r.ancho,
      'checklist 6 · hero ' + w + '×' + hgt + ': titular bajo la cabecera, foto apoyada en el zócalo y nada se pisa → ' + JSON.stringify(r));
    if (conCapturas) {
      const n = w + 'x' + hgt;
      await page.screenshot({ path: foto('40-' + n + '-hero.png') });
      for (const [sel, et, m] of [['#la-finca', 'finca', 0], ['#plano', 'plano', 40], ['#casas', 'casas', 0], ['.galeria', 'galeria', 0], ['#hacer-padel', 'pila', 40], ['#cinta', 'marquee', 200], ['#celebraciones', 'celebraciones', 0], ['#resenas', 'resenas', 0], ['#como-llegar', 'llegar', 0], ['#consultar', 'consultar', 0], ['#pie', 'pie', 300]]) {
        await hasta(page, sel, m);
        await page.screenshot({ path: foto('40-' + n + '-' + et + '.png') });
      }
    }
    await contexto.close();
  }

  /* ───── 7. textos vetados ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { cookiesVistas: true });
    const vetado = /starlight|hierro|desde\s+[\d.,]+\s*€|para[ií]so|experiencia inolvidable|el arte de la relajaci[oó]n|certificad|reserva starlight/i;
    for (const p of ['index.html?revision', 'aviso-legal.html', 'privacidad.html', 'no-existe.html']) {
      await page.goto(base + '/' + p, { waitUntil: 'domcontentloaded' });
      const textos = await page.evaluate(() => [
        document.title, document.body.textContent,
        ...[...document.querySelectorAll('[alt],[title],[aria-label],meta[content],[placeholder]')].map(n => [n.getAttribute('alt'), n.getAttribute('title'), n.getAttribute('aria-label'), n.getAttribute('content'), n.getAttribute('placeholder')].filter(Boolean).join(' '))
      ].join(' \n '));
      const m = textos.match(vetado);
      const nombre = p.replace('?revision', '');
      comprobar(!m, nombre + ': ningún texto dice «Starlight», «hierro», «desde … €», «paraíso» ni frases de folleto' + (m ? ' → «' + m[0] + '»' : ''));
      comprobar(!/\bTODO\b/.test(textos), nombre + ': sin marcadores TODO');
      if (nombre === 'index.html') {
        comprobar(!/\[PENDIENTE\]/.test(textos), 'index.html: ningún [PENDIENTE] a la vista');
        comprobar(!/\d+([.,]\d+)?\s*€|euros?\b/i.test(textos), 'index.html: sin precios');
        const cielo = textos.match(/[^«\n]{0,3}cielos más espectaculares de Europa[^»\n]{0,3}/g) || [];
        comprobar(cielo.length >= 1 && (textos.match(/cielos más espectaculares/g) || []).length === (textos.match(/«Despierta rodeado de naturaleza y descansa a todo confort bajo uno de los cielos más espectaculares de Europa»/g) || []).length,
          'index.html: «uno de los cielos más espectaculares de Europa» solo dentro de su cita entre comillas');
        comprobar(!/cristinamunozma/.test(await page.evaluate(() => document.body.innerText)), 'index.html: el email personal no se enseña como texto (solo es el destino del mailto)');
      }
    }
    const svgs = fs.readdirSync(path.join(raiz, 'assets')).filter(f => f.endsWith('.svg')).map(f => fs.readFileSync(path.join(raiz, 'assets', f), 'utf8')).join(' ');
    comprobar(!vetado.test(svgs), 'logotipos y favicon: sin texto vetado');
    await contexto.close();
  }

  /* ───── 8. contraste medido en el navegador (componiendo el alfa) ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { cookiesVistas: true, reducedMotion: 'reduce' });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    const pares = await page.evaluate(() => {
      const leer = s => {
        const m = s.match(/color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/);
        if (m) return [m[1] * 255, m[2] * 255, m[3] * 255, m[4] === undefined ? 1 : +m[4]];
        const n = s.match(/[\d.]+/g).map(Number);
        return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1];
      };
      const lum = c => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const sobre = (a, b) => [0, 1, 2].map(i => a[i] * a[3] + b[i] * (1 - a[3]));
      const ratio = (t, f) => { const c = sobre(t, f); const [x, y] = [lum(c), lum(f)].sort((p, q) => q - p); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
      const medir = (sel, fondoSel) => {
        const el = document.querySelector(sel);
        const f = leer(getComputedStyle(fondoSel ? document.querySelector(fondoSel) : el).backgroundColor);
        return ratio(leer(getComputedStyle(el).color), f);
      };
      return {
        'texto sobre cal': medir('.entrada', 'body'),
        'antetítulo (--acento-texto) sobre cal': medir('.finca .antetitulo', 'body'),
        'secundario sobre cal': medir('.plano__ayuda', 'body'),
        'cifras (leyenda) sobre cal': medir('.cifras dt', 'body'),
        'zócalo: dirección sobre almagre': medir('#hero-zocalo .zocalo__texto', '#hero-zocalo'),
        'botón almagre': medir('.hero__acciones .boton--almagre'),
        'número de tarjeta sobre cal tostada': medir('.tarjeta__num', '.tarjeta'),
        'antetítulo sobre carbón': medir('.celebra .antetitulo', '.celebra'),
        'entrada sobre carbón': medir('.celebra .entrada', '.celebra'),
        'marquee sobre almagre': medir('.cinta__grupo', '#cinta'),
        'campo (versalita) sobre cal tostada': medir('.campo span', '.consultar')
      };
    });
    for (const [que, r] of Object.entries(pares)) comprobar(r >= 4.5, 'contraste ' + que + ': ' + r + ':1');
    await contexto.close();
  }

  /* ───── 9. habitaciones.json con datos: fichas sin tocar el HTML ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { cookiesVistas: true });
    await page.route('**/data/habitaciones.json', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ habitaciones: [
      { nombre: 'Prueba Uno', casa: 'Casa A', camas: '1 de 150', foto: 'assets/img/casa-dormitorio-800.jpg' },
      { nombre: 'Prueba Dos', casa: '[PENDIENTE]', camas: '2 de 90', foto: '[PENDIENTE]' },
      { nombre: '[PENDIENTE]', casa: '[PENDIENTE]', camas: '[PENDIENTE]', foto: '[PENDIENTE]' }
    ] }) }));
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    await page.waitForTimeout(500);
    const f = await page.evaluate(() => ({ visible: !document.getElementById('fichas').hidden, n: document.querySelectorAll('.ficha-hab').length, textos: [...document.querySelectorAll('.ficha-hab')].map(n => n.textContent).join(' | '), fotos: document.querySelectorAll('.ficha-hab img').length }));
    comprobar(f.visible && f.n === 2 && f.fotos === 1 && /Prueba Uno.*Casa A · 1 de 150/.test(f.textos) && !/PENDIENTE/.test(f.textos), 'habitaciones.json con datos: pinta una ficha por habitación con nombre (y solo los campos que no están pendientes) → ' + f.textos);
    if (conCapturas) { await page.evaluate(() => document.getElementById('fichas').scrollIntoView()); await page.waitForTimeout(500); await page.screenshot({ path: foto('14-fichas-con-datos.png') }); }
    await contexto.close();
  }

  /* ───── 10. sin GSAP (CDN caído) ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador);
    await page.route('**/cdn.jsdelivr.net/**', r => r.abort());
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const estado = await page.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      conMovimiento: document.documentElement.classList.contains('con-movimiento'),
      zocalo: getComputedStyle(document.getElementById('hero-zocalo')).backgroundColor
    }));
    comprobar(estado.cortina === 'none', 'cortina: sin GSAP se retira igual → ' + estado.cortina);
    comprobar(!estado.conMovimiento && /110, 42, 34/.test(estado.zocalo), 'sin GSAP: no se activa con-movimiento y el zócalo del hero está puesto');
    const apagados = await page.evaluate(() => [...document.querySelectorAll('h1, h2, h3, p, img, .letra, .palabra-int, figure')].filter(n => {
      const r = n.getBoundingClientRect();
      if (!r.height || r.top > innerHeight) return false;
      const e = getComputedStyle(n);
      return parseFloat(e.opacity) < 0.15 || /matrix\(1, 0, 0, 1, 0, [1-9]/.test(e.transform) || (e.clipPath && e.clipPath !== 'none' && /inset\((?!0px\))/.test(e.clipPath) && !/inset\(0px/.test(e.clipPath));
    }).map(n => n.className || n.tagName));
    comprobar(apagados.length === 0, 'sin GSAP: nada de la primera pantalla queda oculto' + (apagados.length ? ' → ' + apagados.join(',') : ''));
    await page.evaluate(() => document.getElementById('celebraciones').scrollIntoView());
    await page.waitForTimeout(600);
    comprobar(/^Hola, somos 28/.test(await page.textContent('#config-texto')), 'sin GSAP: el configurador compone igual');
    if (conCapturas) { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300); await page.screenshot({ path: foto('50-sin-gsap.png') }); }
    const propios = errores.filter(e => !/Failed to load resource|ERR_FAILED/.test(e));
    comprobar(propios.length === 0, 'sin GSAP: consola sin errores propios' + (propios.length ? ' → ' + propios.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 11. movimiento reducido: el contenido sigue, el movimiento no ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { reducedMotion: 'reduce', cookiesVistas: true });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    /* ni un fotograma de cortina: se mira enseguida, no al final */
    const temprano = await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display);
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      movimiento: document.documentElement.classList.contains('con-movimiento'),
      titulo: getComputedStyle(document.querySelector('.hero__titulo .letra')).transform,
      cursor: !!document.querySelector('.cursor'),
      anclado: document.documentElement.classList.contains('plano-anclado'),
      cifras: [...document.querySelectorAll('.cifras dd')].map(d => d.textContent.trim()).join(' / '),
      celebra: document.getElementById('celebra-n').textContent
    }));
    comprobar(temprano === 'none' && r.cortina === 'none' && !r.movimiento, 'cortina: con movimiento reducido no pinta ni un fotograma (display:none desde el primer momento)');
    comprobar(r.titulo === 'none' && !r.cursor && !r.anclado, 'checklist 7 · movimiento reducido: titulares en su sitio, sin cursor propio y sin plano anclado');
    comprobar(r.cifras === '10 / 22–34 / 4,6★ estrellas' || /^10 \/ 22–34 \/ 4,6★/.test(r.cifras), 'movimiento reducido: las cifras del hero se ven igual → ' + r.cifras);
    comprobar(r.celebra === '34', 'movimiento reducido: la cifra de celebraciones muestra el dato (34) sin contar');
    await page.evaluate(() => document.querySelector('.punto[data-punto="2"]').scrollIntoView({ block: 'center' }));
    await page.hover('.pin[data-punto="4"]');
    comprobar(await page.evaluate(() => window.Dehesillas.puntoActivo()) === 4, 'movimiento reducido: el plano sigue marcando el punto (contenido, no movimiento)');
    if (conCapturas) { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300); await page.screenshot({ path: foto('51-movimiento-reducido.png') }); }
    comprobar(errores.length === 0, 'movimiento reducido: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 12. 404 y páginas legales ───── */
  {
    const { contexto, page, caidas } = await nuevaPagina(navegador);
    const resp = await page.goto(base + '/no-existe.html', { waitUntil: 'networkidle' });
    const titulo = await page.textContent('h1').catch(() => '');
    comprobar(resp.status() === 404 && /no se llega/i.test(titulo || ''), '404 propio con el lenguaje del sitio (monograma y zócalo) → «' + titulo + '»');
    if (conCapturas) await page.screenshot({ path: foto('60-404.png') });
    for (const p of ['aviso-legal.html', 'privacidad.html']) {
      await page.goto(base + '/' + p, { waitUntil: 'networkidle' });
      const t = await page.evaluate(() => document.body.textContent);
      comprobar((t.match(/\[PENDIENTE\]/g) || []).length >= 2 && /NIF/.test(t) && /[Tt]itular/.test(t), p + ': titular y CIF/NIF como [PENDIENTE]');
    }
    comprobar(/dehesillas-cookies/.test(await page.evaluate(() => document.body.textContent)), 'privacidad: explica la clave que guarda el aviso de cookies');
    const propias = caidas.filter(c => !/no-existe\.html/.test(c));
    comprobar(propias.length === 0, 'legales: sin peticiones caídas' + (propias.length ? ' → ' + propias.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 13. la copia sin mando que viajaría al cliente ───── */
  {
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'dehesillas-entrega-'));
    execFileSync(process.execPath, [path.join(raiz, 'scripts/quitar-mando.mjs'), destino]);
    let limpio = true;
    try { execFileSync(process.execPath, [path.join(raiz, 'scripts/comprobar-borrado.mjs'), destino]); } catch (e) { limpio = false; }
    comprobar(limpio, 'entrega: quitar-mando.mjs deja la copia sin rastros (comprobado contra los archivos)');
    const s2 = await servir(destino, PUERTO + 1);
    const { contexto, page, errores } = await nuevaPagina(navegador, { cookiesVistas: true });
    await page.goto('http://127.0.0.1:' + (PUERTO + 1) + '/index.html?revision', { waitUntil: 'networkidle' });
    await esperarCortina(page);
    const r = await page.evaluate(() => ({ mando: !!document.getElementById('mando'), ficha: !!document.getElementById('ficha'), cortina: getComputedStyle(document.getElementById('cortina')).display, cinta: getComputedStyle(document.getElementById('cinta')).display }));
    comprobar(!r.mando && !r.ficha && r.cortina === 'none' && r.cinta !== 'none' && errores.length === 0, 'entrega: la copia funciona en «Cal y almagre», sin mando ni errores → ' + JSON.stringify(r) + (errores.length ? ' ' + errores.join(' | ') : ''));
    await contexto.close();
    s2.close();
    fs.rmSync(destino, { recursive: true, force: true });
  }

  /* ───── 14. borrar el módulo de celebraciones (en una copia temporal) ───── */
  {
    const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'dehesillas-sin-celebraciones-'));
    fs.cpSync(raiz, destino, { recursive: true, filter: s => !/[\\/](screenshots|node_modules|\.git|fuentes)([\\/]|$)/.test(s) });
    execFileSync(process.execPath, [path.join(destino, 'scripts/quitar-celebraciones.mjs'), destino]);
    const idx = fs.readFileSync(path.join(destino, 'index.html'), 'utf8');
    comprobar(!/celebraciones/i.test(idx.replace(/<!--[\s\S]*?-->/g, '')) && !fs.existsSync(path.join(destino, 'css/celebraciones.css')) && !fs.existsSync(path.join(destino, 'js/celebraciones.js')),
      'celebraciones fuera: ni la sección, ni el enlace, ni su hoja ni su script en la copia');
    const s3 = await servir(destino, PUERTO + 2);
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const { contexto, page, errores, caidas } = await nuevaPagina(navegador, { viewport: vp, cookiesVistas: true, tactil: vp.width < 900 });
      await page.goto('http://127.0.0.1:' + (PUERTO + 2) + '/index.html', { waitUntil: 'networkidle' });
      await esperarCortina(page);
      await recorrer(page);
      const r = await page.evaluate(() => ({
        ids: [...document.querySelectorAll('main section[id]')].map(s => s.id),
        enlace: !!document.querySelector('a[href="#celebraciones"], [data-modulo]'),
        nav: [...document.querySelectorAll('#menu a')].map(a => a.textContent.trim()).join(' · ')
      }));
      const esperado = ORDEN.filter(x => x !== 'celebraciones');
      const enOrden = r.ids.filter(i => esperado.includes(i)).join() === esperado.join();
      comprobar(errores.length === 0 && caidasPropias(caidas).length === 0, 'sin celebraciones (' + vp.width + '): consola sin errores ni peticiones caídas' + (errores.length ? ' → ' + errores.join(' | ') : '') + (caidasPropias(caidas).length ? ' → ' + caidasPropias(caidas).join(' | ') : ''));
      comprobar(!r.enlace && enOrden, 'sin celebraciones (' + vp.width + '): el enlace del menú desaparece y el resto sigue en orden → ' + r.ids.join(' › ') + ' | menú: ' + r.nav);
      await contexto.close();
    }
    s3.close();
    fs.rmSync(destino, { recursive: true, force: true });
  }

  /* ───── 14b. WebKit (Safari de iPhone): la foto del perro no queda bajo su texto ─────
     La foto tenía height:100% dentro de una fila auto: alto circular, y en un iPhone
     real el título «Tu perro también viene» se montaba encima. */
  {
    let wk = null;
    try { wk = await webkit.launch(); } catch (e) { comprobar(false, 'WebKit no está instalado: npx playwright install webkit'); }
    if (wk) {
      for (const disp of ['iPhone SE', 'iPhone 13', 'iPhone 14 Pro Max']) {
        const c = await wk.newContext({ ...devices[disp] });
        await c.addInitScript(() => { try { localStorage.setItem('dehesillas-cookies', 'ok'); } catch (e) {} });
        const p = await c.newPage();
        const err = [];
        p.on('pageerror', e => err.push(e.message));
        await p.goto(base + '/index.html', { waitUntil: 'networkidle' });
        await esperarCortina(p);
        await p.evaluate(() => document.querySelector('.perro').scrollIntoView({ block: 'center' }));
        await p.waitForTimeout(800);
        const r = await p.evaluate(() => {
          const img = document.querySelector('.perro img').getBoundingClientRect();
          const t = document.querySelector('.perro__titulo').getBoundingClientRect();
          return { imgAbajo: Math.round(img.bottom), tituloArriba: Math.round(t.top), altoImg: Math.round(img.height), proporcion: +(img.width / img.height).toFixed(2), cargada: document.querySelector('.perro img').complete };
        });
        comprobar(r.tituloArriba >= r.imgAbajo && Math.abs(r.proporcion - 1.33) <= 0.02 && err.length === 0, 'WebKit ' + disp + ': el texto del perro va debajo de su foto (4:3) → ' + JSON.stringify(r));
        await c.close();
      }
      await wk.close();
    }
  }

  /* ───── 15. orden de secciones en la maqueta ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { cookiesVistas: true, reducedMotion: 'reduce' });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    const ids = await page.evaluate(() => [...document.querySelectorAll('main section[id]')].map(s => s.id).filter(i => i !== 'ficha' && i !== 'cinta'));
    comprobar(ids.join() === ORDEN.join(), 'secciones en el orden del encargo → ' + ids.join(' › '));
    await contexto.close();
  }
} finally {
  await navegador.close();
  servidor.close();
}

console.log('\n' + notas.join('\n'));
if (fallos.length) {
  console.log('\n──────── FALLOS ────────\n' + fallos.join('\n'));
  process.exitCode = 1;
} else {
  console.log('\nTodo en orden: ' + notas.length + ' comprobaciones.');
}
