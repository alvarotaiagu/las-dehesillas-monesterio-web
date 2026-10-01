/* Lee las reseñas de la ficha de Google con Playwright (para elegir citas literales).
   node scripts/leer-resenas.mjs → scripts/fuentes/resenas.json. Se usó el 2026-10-01. */
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import fs from 'node:fs';
const S = process.argv[2] || new URL(".", import.meta.url).pathname.slice(1) + "fuentes";
const b = await chromium.launch({ args: ['--disable-blink-features=AutomationControlled', '--lang=es-ES'] });
const c = await b.newContext({ locale: 'es-ES', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36', viewport: { width: 1400, height: 1000 } });
const p = await c.newPage();
await p.goto('https://www.google.com/maps/search/' + encodeURIComponent('Alojamiento Rural Badajoz Las Dehesillas Monesterio') + '?hl=es', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(3000);
for (const t of ['Rechazar todo', 'Aceptar todo']) { const bt = p.getByRole('button', { name: t }).first(); if (await bt.count()) { await bt.click().catch(() => {}); await p.waitForTimeout(3000); break; } }
await p.waitForTimeout(4000);
console.log('url', p.url());
await p.screenshot({ path: S + '/maps1.png' });
// si sale lista de resultados, abrir el primero
const primero = p.locator('a.hfpxzc').first();
if (await primero.count()) { await primero.click(); await p.waitForTimeout(4000); }
const titulo = await p.locator('h1').first().textContent().catch(() => '');
const nota = await p.locator('div.F7nice').first().textContent().catch(() => '');
console.log('ficha', titulo, '|', nota);
const tab = p.getByRole('tab', { name: /Reseñas/ }).first();
if (await tab.count()) { await tab.click(); await p.waitForTimeout(3000); }
// ordenar por más recientes? dejamos relevantes
let antes = 0;
for (let i = 0; i < 60; i++) {
  const n = await p.locator('div.jftiEf').count();
  await p.evaluate(() => {
    const r = document.querySelector('div.jftiEf'); let n = r && r.parentElement;
    while (n && !(n.scrollHeight > n.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(n).overflowY))) n = n.parentElement;
    if (n) n.scrollTop = n.scrollHeight;
  });
  await p.waitForTimeout(1200);
  if (n === antes && i > 6) break; if (n >= 60) break; antes = n;
}
await p.evaluate(() => document.querySelectorAll('button').forEach(b => { const t = (b.textContent || '').trim(); if (t === 'Más' || /Ver más/.test(b.getAttribute('aria-label') || '')) b.click(); }));
await p.waitForTimeout(1000);
const r = await p.evaluate(() => [...document.querySelectorAll('div.jftiEf')].map(n => ({
  autor: n.querySelector('.d4r55')?.textContent.trim(),
  estrellas: (n.querySelector('[role=img][aria-label*=estrella]') || n.querySelector('.kvMYJc'))?.getAttribute('aria-label'),
  cuando: n.querySelector('.rsqaWe')?.textContent.trim(),
  texto: n.querySelector('.wiI7pd')?.textContent.trim(),
  etiquetas: [...n.querySelectorAll('[aria-label]')].map(x => x.getAttribute('aria-label')).slice(0, 8),
  fecha: [...n.querySelectorAll('span')].map(s => s.textContent.trim()).filter(t => /^(Hace|hace)|^\d(,\d)?\/5$/.test(t)).slice(0, 4)
})));
fs.writeFileSync(S + '/resenas.json', JSON.stringify({ titulo, nota, url: p.url(), r }, null, 1));
console.log('reseñas leídas', r.length);
await p.screenshot({ path: S + '/maps2.png' });
await b.close();
