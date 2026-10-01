/* ═══════════════════════════════════════════════════════════════════════════
   [MÓDULO CELEBRACIONES] — se puede quitar entero (receta en el README).
   El contador 22 → 34 y el configurador que compone el mensaje.
   No toca nada fuera de #celebraciones y no hace falta para que el resto
   funcione. Si js/main.js no está, se apaña solo (copiar y mailto propios).
   Habla en plural: aquí se dirige a un grupo («vuestra boda»).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var seccion = document.getElementById('celebraciones');
  if (!seccion) return;

  var EMAIL = 'cristinamunozma@gmail.com';
  var MAXIMO_ALOJADOS = 34;     /* capacidad con supletorias: dato publicado. Aforo de eventos: no hay */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D = window.Dehesillas || {};

  /* ───────── el contador: de 22 a 34 al entrar (con movimiento reducido, 34 directamente) ───────── */
  (function contador() {
    var n = document.getElementById('celebra-n');
    if (!n) return;
    var desde = Number(n.dataset.desde), hasta = Number(n.dataset.hasta);
    if (reduce || !('IntersectionObserver' in window)) { n.textContent = hasta; return; }
    n.textContent = desde;
    var obs = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      obs.disconnect();
      var t0 = null, dur = 1600;
      (function paso(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, (t - t0) / dur);
        var suave = 1 - Math.pow(1 - p, 3);
        n.textContent = Math.round(desde + (hasta - desde) * suave);
        if (p < 1) requestAnimationFrame(paso);
      })(performance.now());
    }, { threshold: 0.6 });
    obs.observe(n);
  })();

  /* ───────── el configurador ───────── */
  var form = document.getElementById('config');
  if (!form) return;
  var rango = document.getElementById('config-personas');
  var salidaN = document.getElementById('config-personas-salida');
  var aviso = document.getElementById('config-aviso');
  var texto = document.getElementById('config-texto');
  var email = document.getElementById('config-email');
  var estado = document.getElementById('config-estado');

  var QUE = {
    boda: 'una boda', bautizo: 'un bautizo', comunion: 'una comunión',
    cumple: 'un cumpleaños', empresa: 'una comida de empresa', despedida: 'una despedida'
  };
  var ALOJA = {
    si: 'Necesitaríamos alojamiento.',
    no: 'No necesitamos alojamiento.',
    quiza: 'Aún no sabemos si necesitaremos alojamiento.'
  };

  function valor(nombre) {
    var marcado = form.querySelector('input[name="' + nombre + '"]:checked');
    return marcado ? marcado.value : '';
  }

  function mailto(asunto, cuerpo) {
    if (D.mailto) return D.mailto(asunto, cuerpo);
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo.replace(/\r?\n/g, '\r\n'));
  }

  function componer() {
    var n = Number(rango.value);
    var max = Number(rango.max);
    var cuantos = n >= max ? 'más de ' + (max - 1) : String(n);
    salidaN.textContent = n >= max ? max + '+' : n;
    aviso.hidden = n <= MAXIMO_ALOJADOS;
    var mes = form.elements.mes.value;
    var partes = ['Hola, somos ' + cuantos + ' y queremos celebrar ' + QUE[valor('tipo')] + (mes ? ' hacia ' + mes : '') + '.'];
    partes.push(ALOJA[valor('aloja')]);
    var com = form.elements.comentarios.value.trim();
    if (com) partes.push(/[.!?…]$/.test(com) ? com : com + '.');
    partes.push('¿Nos contáis qué opciones hay? Gracias.');
    var mensaje = partes.join(' ');
    texto.textContent = mensaje;
    email.href = mailto('Celebración en Las Dehesillas · ' + QUE[valor('tipo')].replace(/^una? /, ''), mensaje);
    estado.textContent = '';
    return mensaje;
  }

  form.addEventListener('input', componer);
  form.addEventListener('change', componer);
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  document.getElementById('config-copiar').addEventListener('click', function () {
    var mensaje = componer();
    var hecho = D.copiar ? D.copiar(mensaje) : (navigator.clipboard ? navigator.clipboard.writeText(mensaje).then(function () { return true; }, function () { return false; }) : Promise.resolve(false));
    hecho.then(function (ok) {
      estado.textContent = ok ? 'Mensaje copiado. Pegadlo donde queráis.' : 'No se ha podido copiar: seleccionad el texto y copiadlo a mano.';
    });
  });

  componer();
  window.DehesillasCelebraciones = { componer: componer };
})();
