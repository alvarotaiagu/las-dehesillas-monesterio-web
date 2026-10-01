/* ═══════════════════════════════════════════════════════════════════════════
   Las Dehesillas · «Cal y almagre»
   El zócalo de almagre es la línea de fuerza: la cortina (el monograma al rojo
   que se enfría) baja y se comprime hasta quedarse como el zócalo del hero;
   los separadores se pintan de lado a lado; la barra de lectura de la cabecera
   es un zócalo que crece; el pie lo cierra.

   Banderas separadas a propósito:
     gsapReady  → hay motor de animación (GSAP + ScrollTrigger cargados)
     movimiento → además el usuario NO ha pedido reducir el movimiento
   Con movimiento reducido el CONTENIDO sigue (punto activo del plano, fichas,
   mensajes compuestos); lo que se apaga es el viaje.

   El módulo de celebraciones vive en js/celebraciones.js: este archivo no
   depende de él y funciona igual si se borra.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esTactil = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var gsapReady = !!(window.gsap && window.ScrollTrigger);
  var movimiento = gsapReady && !reduce;
  var gsap = window.gsap;

  if (gsapReady) gsap.registerPlugin(window.ScrollTrigger);
  if (movimiento) html.classList.add('con-movimiento');

  var TELEFONO = '636 82 98 45';
  var EMAIL = 'cristinamunozma@gmail.com';     /* solo como destino de los mensajes: ver README */

  function densidad() { return html.classList.contains('densidad-sobria') ? 'sobria' : 'cal'; }
  function alturaCabecera() { var c = document.getElementById('cabecera'); return c ? c.offsetHeight : 72; }
  function refrescar() { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }
  function todos(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }

  function cuandoVisible(nodos, umbral, alEntrar, margen) {
    if (!('IntersectionObserver' in window)) { nodos.forEach(alEntrar); return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        alEntrar(en.target);
      });
    }, { threshold: umbral, rootMargin: margen || '0px' });
    nodos.forEach(function (n) { obs.observe(n); });
  }

  /* expuesto para js/celebraciones.js (copiar al portapapeles con respaldo) */
  window.Dehesillas = window.Dehesillas || {};

  /* ───────────────────────── Lenis ───────────────────────── */
  var lenis = null;
  if (movimiento && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', window.ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  }

  function irA(destino) {
    var desfase = -alturaCabecera() + 1;
    if (lenis) { lenis.scrollTo(destino, { offset: desfase, duration: 1.5 }); return; }
    var el = typeof destino === 'string' ? document.querySelector(destino) : destino;
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset + desfase);
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || !document.querySelector(id)) return;
    e.preventDefault();
    cerrarMenu();
    irA(id === '#inicio' ? 0 : id);
  });

  /* ───────────────────── titulares partidos (char-reveal) ───────────────────── */
  /* respeta los elementos en línea (el <em> de «la dehesa» sigue siendo <em>) */
  function partir(el) {
    var modo = el.dataset.revelar;
    var texto = el.textContent.replace(/\s+/g, ' ').trim();
    if (!el.closest('[aria-hidden="true"]')) el.setAttribute('aria-label', texto);
    var piezas = [];
    function trocear(cadena, destino) {
      cadena.split(/(\s+)/).forEach(function (trozo) {
        if (!trozo) return;
        if (/^\s+$/.test(trozo)) { destino.appendChild(document.createTextNode(' ')); return; }
        var caja = document.createElement('span');
        caja.className = 'palabra';
        caja.setAttribute('aria-hidden', 'true');
        if (modo === 'letras') {
          Array.from(trozo).forEach(function (c) {
            var s = document.createElement('span');
            s.className = 'letra';
            s.textContent = c;
            caja.appendChild(s);
            piezas.push(s);
          });
        } else {
          var s = document.createElement('span');
          s.className = 'palabra-int';
          s.textContent = trozo;
          caja.appendChild(s);
          piezas.push(s);
        }
        destino.appendChild(caja);
      });
    }
    var hijos = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    hijos.forEach(function (n) {
      if (n.nodeType === 3) { trocear(n.textContent, el); return; }
      if (n.nodeType === 1) {
        var envoltura = n.cloneNode(false);
        envoltura.setAttribute('aria-hidden', 'true');
        el.appendChild(envoltura);
        trocear(n.textContent, envoltura);
      }
    });
    return piezas;
  }

  function revelar(el, piezas, retardo) {
    var letras = el.dataset.revelar === 'letras';
    gsap.to(piezas, {
      y: 0, yPercent: 0, duration: 1.1, ease: 'expo.out', delay: retardo || 0,
      stagger: letras ? Math.min(0.04, 1.2 / piezas.length) : 0.08
    });
  }

  todos('[data-revelar]').forEach(function (el) {
    var piezas = partir(el);
    if (!movimiento) return;
    if (el.closest('.hero')) {
      /* el titular espera a que la cortina empiece a bajar */
      document.addEventListener('cortina-abre', function () { revelar(el, piezas, 0.3); }, { once: true });
      return;
    }
    /* una sola vez: IntersectionObserver (ScrollTrigger once:true no dispara si ya está en pantalla) */
    cuandoVisible([el], 0.3, function () { revelar(el, piezas); });
  });

  /* ───────────────── cortina: el monograma al rojo, se enfría y baja hasta ser zócalo ───────────────── */
  var cortinaAbierta = false;
  function avisarApertura() {
    if (cortinaAbierta) return;
    cortinaAbierta = true;
    document.dispatchEvent(new CustomEvent('cortina-abre'));
  }
  window.Dehesillas.alAbrirse = function (fn) {
    if (cortinaAbierta) fn(); else document.addEventListener('cortina-abre', fn, { once: true });
  };

  (function cortina() {
    var cort = document.getElementById('cortina');
    if (!cort) { avisarApertura(); return; }
    var lienzo = document.getElementById('cortina-lienzo');
    var panel = document.getElementById('cortina-panel');
    var contenido = document.getElementById('cortina-contenido');
    var sello = document.getElementById('cortina-sello');
    var capa = function (n) { return cort.querySelector('.cortina__mm--' + n); };
    var vivo = capa('vivo'), brasa = capa('brasa'), enfriado = capa('almagre'), halo = capa('halo'), haloAncho = capa('halo-ancho');
    var nombre = cort.querySelector('.cortina__nombre span');
    var pie = cort.querySelector('.cortina__pie');
    var zocalo = document.getElementById('hero-zocalo');
    var hecho = false;

    function retirar() {
      if (hecho) return;
      hecho = true;
      avisarApertura();
      cort.classList.add('fuera');
      html.classList.add('cortina-fuera');
      /* con Lenis, lagSmoothing(0) al retirarla, nunca antes (el tirón de la carga saltaría el golpe) */
      if (gsapReady) gsap.ticker.lagSmoothing(0);
      refrescar();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }

    if (!movimiento) {
      /* sin GSAP o con movimiento reducido se retira igual: nunca tapa la página */
      setTimeout(retirar, reduce ? 0 : 60);
      return;
    }

    var w = 0, h = 0;
    /* el panel ocupa de «arriba» a h − «abajo»; el borde de arriba se curva «curva» px al caer */
    var estado = { arriba: 0, abajo: 0, curva: 0 };
    function pintar() {
      var t = estado.arriba, b = h - estado.abajo, c = estado.curva;
      panel.setAttribute('d', 'M0 ' + t.toFixed(1) + 'Q' + (w / 2) + ' ' + (t - c).toFixed(1) + ' ' + w + ' ' + t.toFixed(1) +
        'V' + b.toFixed(1) + 'H0Z');
    }
    function medir() {
      w = window.innerWidth; h = window.innerHeight;
      lienzo.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      pintar();
    }
    medir();
    cort.classList.add('cortina--pintada');      /* ya hay panel: el fondo provisional se quita */
    window.addEventListener('resize', medir);

    /* adónde cae: la franja del zócalo del hero. En la sobria cae entero, sin traspaso. */
    function destino() {
      if (densidad() !== 'cal' || !zocalo) return { arriba: h + 40, abajo: 0 };
      var r = zocalo.getBoundingClientRect();
      if (r.top >= h || r.bottom <= 0) return { arriba: h + 40, abajo: 0 };
      return { arriba: Math.max(0, r.top), abajo: Math.max(0, h - r.bottom) };
    }
    var final = null;
    window.Dehesillas.cortinaDestino = function () { return final; };

    var BAJA = 1.5;
    var tl = gsap.timeline({ paused: true, onComplete: retirar });
    /* 1 · golpe: el sello entero al rojo vivo, con su halo, y un asiento 1,06 → 1 */
    tl.set(sello, { scale: 1.06 }, 0)
      .set([vivo, halo, haloAncho], { opacity: 1 }, 0)
      .to(sello, { scale: 1, duration: 0.42, ease: 'power4.out' }, 0)
    /* 2 · enfriado: solo opacidades de copias ya desenfocadas (ningún filtro animado) */
      .to(brasa, { opacity: 1, duration: 0.3, ease: 'none' }, 0.2)
      .to(vivo, { opacity: 0, duration: 0.45, ease: 'power1.in' }, 0.25)
      .to(haloAncho, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 0.25)
      .to(halo, { opacity: 0, duration: 0.55, ease: 'power2.in' }, 0.35)
      .to(enfriado, { opacity: 1, duration: 0.4, ease: 'power1.inOut' }, 0.5)
      .to(brasa, { opacity: 0, duration: 0.4, ease: 'power1.in' }, 0.65)
    /* 3 · el nombre sube de su máscara y el pie asienta el espaciado */
      .to(nombre, { y: 0, yPercent: 0, duration: 0.8, ease: 'expo.out' }, 0.45)
      .fromTo(pie, { letterSpacing: '.62em', opacity: 0 }, { letterSpacing: '.2em', opacity: 1, duration: 0.95, ease: 'expo.out', immediateRender: false }, 0.6)
    /* 4 · un instante ya frío; luego el panel se tiñe de almagre y el sello se funde en él… */
      .to(panel, { fill: '#6E2A22', duration: 0.4, ease: 'power1.inOut' }, 1.12)
      .to(enfriado, { opacity: 0, duration: 0.4 }, 1.12)
      .call(function () { final = destino(); }, null, BAJA - 0.01)
      .call(avisarApertura, null, BAJA)
    /* …y baja con expo.inOut, comprimiéndose hasta la franja del zócalo, que se queda puesta */
      .to(estado, {
        arriba: function () { return (final || destino()).arriba; },
        abajo: function () { return (final || destino()).abajo; },
        duration: 1.0, ease: 'expo.inOut', onUpdate: pintar
      }, BAJA)
      .to(estado, { curva: function () { return h * 0.07; }, duration: 0.45, ease: 'power2.out', onUpdate: pintar }, BAJA)
      .to(estado, { curva: 0, duration: 0.55, ease: 'power2.inOut', onUpdate: pintar }, BAJA + 0.45)
      .to(contenido, { y: function () { return h * 0.45; }, opacity: 0, duration: 0.55, ease: 'power2.in' }, BAJA);

    /* arranca enseguida: el monograma es SVG y no espera a la letra (como mucho 450 ms) */
    var arrancada = false;
    function arrancar() { if (!arrancada) { arrancada = true; tl.play(); } }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(arrancar);
    setTimeout(arrancar, 450);

    /* quien empieza a bajar no espera: la cortina acelera, no se corta */
    function prisa() { if (!hecho) tl.timeScale(3); }
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { window.addEventListener(ev, prisa, { passive: true, once: true }); });

    /* red de seguridad: pase lo que pase, a los 6 s la cortina se va */
    setTimeout(retirar, 6000);
  })();

  /* ───────────────── hero: entrada tras la cortina + paralaje dentro del arco ───────────────── */
  (function hero() {
    var seccion = document.getElementById('inicio');
    if (!seccion || !movimiento) return;
    var foto = document.getElementById('hero-foto');
    var img = foto.querySelector('img');
    var resto = todos('.hero__ante, .hero__sub, .cifras > div, .hero__acciones', seccion);
    var texto = seccion.querySelector('.zocalo__texto');

    gsap.set(resto, { opacity: 0, y: 24 });
    gsap.set(foto, { clipPath: 'inset(100% 0% 0% 0%)' });
    gsap.set(texto, { opacity: 0 });
    document.addEventListener('cortina-abre', function () {
      gsap.to(foto, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', delay: 0.15 });
      gsap.to(resto, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.55 });
      gsap.to(texto, { opacity: 1, duration: 0.8, delay: 1.1 });
    }, { once: true });

    /* paralaje suave dentro de la máscara */
    gsap.fromTo(img, { yPercent: -4 }, {
      yPercent: 5, ease: 'none',
      scrollTrigger: { trigger: seccion, start: 'top top', end: 'bottom top', scrub: true }
    });
  })();

  /* ───────────────── separadores y fotos que se encalan (una vez) ───────────────── */
  /* se observa el envoltorio, no la banda: nace con clip-path al 100 % y el observador no la vería */
  cuandoVisible(todos('.separa'), 0.6, function (n) { n.classList.add('es-pintada'); });
  cuandoVisible(todos('.encalar'), 0.25, function (n) { n.classList.add('es-visible'); });
  cuandoVisible(todos('.cita'), 0.25, function (n) { n.classList.add('es-visible'); });

  /* ───────────────── el plano de la finca ───────────────── */
  (function plano() {
    var seccion = document.getElementById('plano');
    if (!seccion) return;
    var marco = document.getElementById('plano-marco');
    var camara = document.getElementById('plano-camara');
    var pins = todos('.pin', camara);
    var puntos = todos('.punto', seccion);
    var disparo = null, linea = null, observador = null;
    var actual = -1;

    function marcar(k) {
      if (k === actual) return;
      actual = k;
      pins.forEach(function (p) { p.classList.toggle('es-activo', Number(p.dataset.punto) === k); });
      puntos.forEach(function (p) {
        var es = Number(p.dataset.punto) === k;
        p.classList.toggle('es-activo', es);
        var a = p.querySelector('a');
        if (es) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
      });
    }
    window.Dehesillas.puntoActivo = function () { return actual; };

    /* puntos y lista se responden en cualquier modo (contenido, no movimiento) */
    pins.concat(puntos).forEach(function (n) {
      ['pointerenter', 'focusin'].forEach(function (ev) {
        n.addEventListener(ev, function () { marcar(Number(n.dataset.punto)); });
      });
    });

    var coords = pins.map(function (p) {
      return { x: parseFloat(p.style.getPropertyValue('--x')) / 100, y: parseFloat(p.style.getPropertyValue('--y')) / 100 };
    });

    function quitar() {
      if (disparo) { disparo.kill(true); disparo = null; }
      if (linea) { linea.kill(); linea = null; }
      if (observador) { observador.disconnect(); observador = null; }
      if (gsapReady) gsap.set(camara, { clearProps: 'transform' });
      camara.style.removeProperty('--inv');
    }

    function montar() {
      quitar();
      var anclado = movimiento && densidad() === 'cal' && window.innerWidth > 900 && window.innerHeight >= 560;
      html.classList.toggle('plano-anclado', anclado);
      if (!anclado) {
        /* sin anclar: la lista marca el punto que tienes delante (en móvil la foto se queda arriba) */
        if ('IntersectionObserver' in window && window.innerWidth <= 900) {
          observador = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (en) { if (en.isIntersecting) marcar(Number(en.target.dataset.punto)); });
          }, { rootMargin: '-55% 0px -35% 0px' });
          puntos.forEach(function (p) { observador.observe(p); });
        } else if (actual < 1) {
          marcar(1);
        }
        return;
      }
      /* anclado: la cámara se acerca a cada punto por turno */
      var S = 2.35;
      function vista(c) {
        var W = marco.clientWidth, H = marco.clientHeight;
        var x = Math.min(0, Math.max(W - W * S, W / 2 - c.x * W * S));
        var y = Math.min(0, Math.max(H - H * S, H / 2 - c.y * H * S));
        return { x: x, y: y, scale: S };
      }
      gsap.set(camara, { x: 0, y: 0, scale: 1, transformOrigin: '0 0' });
      linea = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut', duration: 1 } });
      var llegadas = [];
      coords.forEach(function (c, i) {
        var inicio = i === 0 ? 0.3 : '+=0.55';
        linea.to(camara, {
          x: function () { return vista(c).x; },
          y: function () { return vista(c).y; },
          scale: S,
          onUpdate: function () { camara.style.setProperty('--inv', (1 / gsap.getProperty(camara, 'scale')).toFixed(3)); }
        }, inicio);
        llegadas.push(linea.duration());
      });
      linea.to({}, { duration: 0.6 });
      marcar(0);
      disparo = window.ScrollTrigger.create({
        trigger: seccion,
        start: 'top top',
        end: '+=' + (coords.length * 75) + '%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: linea,
        onUpdate: function () {
          var t = linea.time(), k = 0;
          llegadas.forEach(function (fin, i) { if (t >= fin - 0.55) k = i + 1; });
          marcar(k);
        }
      });
    }

    montar();
    var temporizador;
    window.addEventListener('resize', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { montar(); refrescar(); }, 220);
    });
    document.addEventListener('densidad-cambiada', function () { montar(); setTimeout(refrescar, 60); });
  })();

  /* ───────────────── habitaciones.json: fichas solo si hay datos de verdad ───────────────── */
  (function habitaciones() {
    var caja = document.getElementById('fichas');
    var lista = document.getElementById('fichas-lista');
    if (!caja || !lista || !window.fetch) return;
    var pendiente = function (v) { return !v || /\[PENDIENTE\]/.test(String(v)); };
    fetch('data/habitaciones.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (datos) {
      var habs = (datos && datos.habitaciones || []).filter(function (h) { return !pendiente(h.nombre); });
      if (!habs.length) return;                 /* vacío: no se pinta nada y no queda hueco */
      habs.forEach(function (h) {
        var li = document.createElement('li');
        li.className = 'ficha-hab';
        if (!pendiente(h.foto)) {
          var img = document.createElement('img');
          img.src = h.foto; img.alt = h.nombre; img.loading = 'lazy'; img.width = 600; img.height = 400;
          li.appendChild(img);
        }
        var d = document.createElement('div');
        var t = document.createElement('h4'); t.textContent = h.nombre; d.appendChild(t);
        var datosHab = [h.casa, h.camas].filter(function (v) { return !pendiente(v); }).join(' · ');
        if (datosHab) { var p = document.createElement('p'); p.textContent = datosHab; d.appendChild(p); }
        li.appendChild(d);
        lista.appendChild(li);
      });
      caja.hidden = false;
      setTimeout(refrescar, 50);
    }).catch(function () { /* sin JSON: la sección ya está completa sin él */ });
  })();

  /* ───────────────── pila: mismo alto para todas, medido ───────────────── */
  (function pila() {
    var seccion = document.getElementById('que-hacer');
    var lista = document.getElementById('pila');
    if (!seccion || !lista) return;
    var items = todos('.pila__item', lista);
    var disparos = [];

    function tope() { return alturaCabecera() + window.innerHeight * 0.03; }

    /* Todas miden lo que la más alta (condición para que la pila no se deshaga)
       y se mide el contenido real, nunca la pantalla. Si la más alta no cabe
       anclada bajo la cabecera, se desapila. */
    function igualar() {
      var tarjetas = items.map(function (it) { return it.querySelector('.tarjeta'); });
      seccion.classList.remove('pila-suelta');
      lista.style.removeProperty('--alto-tarjeta');
      tarjetas.forEach(function (t) { t.style.height = 'auto'; });
      var alto = Math.max.apply(null, tarjetas.map(function (t) { return t.offsetHeight; }));   /* offsetHeight ignora el scale */
      tarjetas.forEach(function (t) { t.style.removeProperty('height'); });
      if (alto > window.innerHeight - tope() - 16) { seccion.classList.add('pila-suelta'); return false; }
      lista.style.setProperty('--alto-tarjeta', alto + 'px');
      return true;
    }

    function montar() {
      var apilada = igualar();
      disparos.forEach(function (d) { d.kill(); });
      disparos = [];
      items.forEach(function (it) {
        var t = it.querySelector('.tarjeta');
        if (gsapReady) gsap.set(t, { clearProps: 'transform' });
        t.style.removeProperty('--oscuro');
      });
      if (!movimiento || !apilada) return;
      items.forEach(function (it, i) {
        var siguiente = items[i + 1];
        if (!siguiente) return;
        var tarjeta = it.querySelector('.tarjeta');
        var tw = gsap.fromTo(tarjeta, { scale: 1, '--oscuro': 0 }, { scale: 0.93, '--oscuro': 0.32, ease: 'none', paused: true });
        disparos.push(window.ScrollTrigger.create({
          trigger: siguiente,
          start: 'top bottom',
          end: 'top ' + Math.round(tope()) + 'px',          /* acaba justo cuando la siguiente se posa */
          scrub: true,
          animation: tw
        }));
      });
    }

    montar();
    var temporizador;
    function rehacer(ms) {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () { montar(); refrescar(); }, ms);
    }
    window.addEventListener('resize', function () { rehacer(220); });
    document.addEventListener('densidad-cambiada', function () { rehacer(60); });
    /* Anton y Spectral cambian la altura de los textos al llegar: volver a medir */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { rehacer(0); });
  })();

  /* ───────────────── marquee con la cruz del monograma ───────────────── */
  (function cinta() {
    var pista = document.getElementById('cinta-pista');
    if (!pista) return;
    var grupo = pista.firstElementChild;
    var copias = Math.ceil((window.innerWidth * 2) / Math.max(1, grupo.offsetWidth)) + 1;
    for (var i = 0; i < copias; i++) {
      var c = grupo.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      pista.appendChild(c);
    }
    if (!movimiento) return;
    var x = 0, base = 0.6, extra = 0;
    if (lenis) lenis.on('scroll', function (e) { extra = Math.min(Math.abs(e.velocity || 0) * 0.3, 8); });
    /* rAF propio: ningún tween de GSAP toca esta propiedad */
    (function paso() {
      var ancho = grupo.offsetWidth;
      if (densidad() === 'cal') {
        x -= base + extra;
        extra *= 0.92;
        if (ancho && x <= -ancho) x += ancho;
        pista.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      }
      requestAnimationFrame(paso);
    })();
  })();

  /* ───────────────── botones magnéticos ───────────────── */
  (function imanes() {
    if (!movimiento || esTactil) return;
    todos('.iman').forEach(function (el) {
      var aX = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' });
      var aY = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var c = el.getBoundingClientRect();
        aX((e.clientX - (c.left + c.width / 2)) * 0.28);
        aY((e.clientY - (c.top + c.height / 2)) * 0.38);
      });
      el.addEventListener('pointerleave', function () { aX(0); aY(0); });
    });
  })();

  /* ───────────────── cursor propio: punto sólido + aro ───────────────── */
  (function cursor() {
    if (!movimiento || esTactil) return;
    var aro = document.createElement('div');
    var pt = document.createElement('div');
    aro.className = 'cursor';
    pt.className = 'cursor-punto';
    [aro, pt].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });
    var aX = gsap.quickTo(aro, 'x', { duration: 0.28, ease: 'power3.out' });
    var aY = gsap.quickTo(aro, 'y', { duration: 0.28, ease: 'power3.out' });
    var ultimo = null;

    function mostrar(si) { aro.classList.toggle('cursor--vivo', si); pt.classList.toggle('cursor--vivo', si); }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!aro.classList.contains('cursor--vivo')) {
        gsap.set(aro, { x: e.clientX, y: e.clientY });
        mostrar(true);
      }
      /* el del sistema se oculta solo cuando el propio ya se ve */
      if (!html.classList.contains('con-cursor')) html.classList.add('con-cursor');
      gsap.set(pt, { x: e.clientX, y: e.clientY });
      aX(e.clientX); aY(e.clientY);
      /* el estado se decide aquí, por el objetivo (pointerover no siempre llega) */
      if (e.target !== ultimo) {
        ultimo = e.target;
        var cerca = e.target.closest ? e.target : null;
        var sobre = !!(cerca && cerca.closest('a, button, label, input, select, textarea, .pin'));
        var oscuro = !!(cerca && cerca.closest('.cinta, .celebra, .zocalo, .cookies, .mando'));
        aro.classList.toggle('cursor--activo', sobre);
        aro.classList.toggle('cursor--claro', oscuro);
        pt.classList.toggle('cursor-punto--activo', sobre);
      }
    });
    html.addEventListener('mouseleave', function () { mostrar(false); });
    html.addEventListener('mouseenter', function () { if (html.classList.contains('con-cursor')) mostrar(true); });
  })();

  /* ───────────────── cabecera fija y barra de lectura ───────────────── */
  var cabecera = document.getElementById('cabecera');
  var boton = document.getElementById('hamburguesa');
  var progreso = document.getElementById('progreso');

  (function cabeceraFija() {
    if (!cabecera) return;
    function actualizar() {
      var y = window.pageYOffset;
      cabecera.classList.toggle('cabecera--fija', y > 40);
      var total = document.documentElement.scrollHeight - window.innerHeight;
      if (progreso) progreso.style.setProperty('--p', total > 0 ? Math.min(1, y / total).toFixed(4) : 0);
    }
    window.addEventListener('scroll', actualizar, { passive: true });
    window.addEventListener('resize', actualizar);
    actualizar();
  })();

  function cerrarMenu() {
    if (!cabecera || !boton || !cabecera.classList.contains('menu-abierto')) return;
    cabecera.classList.remove('menu-abierto');
    boton.setAttribute('aria-expanded', 'false');
    boton.querySelector('.visualmente-oculto').textContent = 'Abrir menú';
    if (lenis) lenis.start();
  }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = cabecera.classList.toggle('menu-abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      boton.querySelector('.visualmente-oculto').textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
      if (lenis) { if (abierto) lenis.stop(); else lenis.start(); }
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* ───────────────── Google solo bajo clic: mapa y visita virtual ───────────────── */
  function cargarAlPulsar(idBoton, idCaja, src, titulo) {
    var btn = document.getElementById(idBoton);
    var caja = document.getElementById(idCaja);
    if (!btn || !caja) return;
    btn.addEventListener('click', function () {
      var marco = document.createElement('iframe');
      marco.src = src;
      marco.loading = 'lazy';
      marco.title = titulo;
      marco.allowFullscreen = true;
      marco.referrerPolicy = 'no-referrer-when-downgrade';
      caja.parentNode.replaceChild(marco, caja);
    });
  }
  cargarAlPulsar('mapa-boton', 'mapa-consentimiento',
    'https://www.google.com/maps?q=' + encodeURIComponent('38.0451853,-6.1022847') + '&z=14&output=embed',
    'Mapa: Las Dehesillas, km 32 de la BA-067, Monesterio');
  /* la misma vista 360º que tienen en fincalasdehesillas.com/tour-virtual/ */
  cargarAlPulsar('visita-boton', 'visita-consentimiento',
    'https://www.google.com/maps/embed?pb=!4v1707135685194!6m8!1m7!1sCAoSLEFGMVFpcE5HYWFCWXk3X0dwMjRFdl9DSC1kdUFvdU1zQnZWTlBmUS00OERY!2m2!1d38.045238687778!2d-6.1022135395746!3f114.1371594581109!4f-19.818001688802383!5f0.4000000000000002',
    'Visita virtual de Las Dehesillas en 360 grados');

  /* ───────────────── mensajes: email, copiar y llamar ───────────────── */
  /* mailto según RFC 6068: saltos de línea como CRLF y todo codificado */
  function mailto(asunto, cuerpo) {
    return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(cuerpo.replace(/\r?\n/g, '\r\n'));
  }
  function copiar(texto) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return copiarViejo(texto); });
    }
    return Promise.resolve(copiarViejo(texto));
  }
  function copiarViejo(texto) {
    var t = document.createElement('textarea');
    t.value = texto; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t);
    return ok;
  }
  window.Dehesillas.mailto = mailto;
  window.Dehesillas.copiar = copiar;
  window.Dehesillas.telefono = TELEFONO;

  (function reserva() {
    var form = document.getElementById('reserva');
    if (!form) return;
    var error = document.getElementById('reserva-error');
    var listo = document.getElementById('reserva-listo');
    var salida = document.getElementById('reserva-texto');
    var email = document.getElementById('reserva-email');
    var estado = document.getElementById('reserva-estado');
    var texto = '';

    function fecha(v) { var p = v.split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : v; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = {};
      ['nombre', 'email', 'telefono', 'llegada', 'salida', 'tipo', 'adultos', 'ninos', 'preferencias'].forEach(function (k) { d[k] = (form.elements[k].value || '').trim(); });
      var fallos = [];
      if (!d.nombre) fallos.push('tu nombre');
      if (!d.llegada || !d.salida) fallos.push('las fechas de llegada y salida');
      if (!d.email && !d.telefono) fallos.push('un email o un teléfono');
      if (!(Number(d.adultos) >= 1)) fallos.push('cuántos adultos sois');
      var noches = 0;
      if (d.llegada && d.salida) {
        noches = Math.round((new Date(d.salida) - new Date(d.llegada)) / 864e5);
        if (noches < 1) fallos.push('una salida posterior a la llegada');
      }
      if (fallos.length) {
        error.textContent = 'Falta ' + fallos.join(', ').replace(/, ([^,]*)$/, ' y $1') + '.';
        listo.hidden = true;
        return;
      }
      error.textContent = '';
      var lineas = [
        'Hola, soy ' + d.nombre + '. Quería consultar disponibilidad en Las Dehesillas.',
        '',
        'Llegada: ' + fecha(d.llegada),
        'Salida: ' + fecha(d.salida) + ' (' + noches + (noches === 1 ? ' noche' : ' noches') + ')',
        'Adultos: ' + d.adultos + ' · Niños: ' + (d.ninos || '0'),
        'Tipo de habitación: ' + (d.tipo || 'sin preferencia')
      ];
      if (d.preferencias) lineas.push('Preferencias: ' + d.preferencias);
      lineas.push('');
      if (d.email) lineas.push('Email: ' + d.email);
      if (d.telefono) lineas.push('Teléfono: ' + d.telefono);
      lineas.push('', 'Gracias.');
      texto = lineas.join('\n');
      salida.textContent = texto;
      email.href = mailto('Consulta de fechas · ' + fecha(d.llegada) + ' – ' + fecha(d.salida), texto);
      listo.hidden = false;
      estado.textContent = '';
      setTimeout(refrescar, 30);
    });
    document.getElementById('reserva-copiar').addEventListener('click', function () {
      copiar(texto).then(function (ok) {
        estado.textContent = ok ? 'Mensaje copiado. Pégalo donde quieras.' : 'No se ha podido copiar: selecciona el texto y cópialo a mano.';
      });
    });
  })();

  /* ───────────────── aviso de cookies ───────────────── */
  (function cookies() {
    var caja = document.getElementById('cookies');
    var ok = document.getElementById('cookies-aceptar');
    var reabrir = document.getElementById('cookies-reabrir');
    if (!caja || !ok) return;
    function ver(si) {
      caja.hidden = !si;                      /* el CSS pone display solo si NO hay [hidden] */
      document.body.classList.toggle('cookies-visibles', si);
    }
    var guardado = null;
    try { guardado = localStorage.getItem('dehesillas-cookies'); } catch (e) {}
    if (guardado !== 'ok') ver(true);
    ok.addEventListener('click', function () {
      ver(false);
      try { localStorage.setItem('dehesillas-cookies', 'ok'); } catch (e) {}
    });
    if (reabrir) reabrir.addEventListener('click', function () { ver(true); ok.focus(); });
  })();

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  if (gsapReady && document.fonts && document.fonts.ready) document.fonts.ready.then(refrescar);
  /* contenido que cambia de alto (fichas, mensajes): el fin de página de ScrollTrigger se queda viejo */
  if (gsapReady && 'ResizeObserver' in window) {
    var altoPrevio = 0, espera;
    new ResizeObserver(function () {
      var a = document.body.offsetHeight;
      if (Math.abs(a - altoPrevio) < 40) return;
      altoPrevio = a;
      clearTimeout(espera);
      espera = setTimeout(refrescar, 150);
    }).observe(document.body);
  }

  /* ═══════════════════════════════════════════════════════════════════════
     [MANDO DE MAQUETA] — SOLO REVISIÓN INTERNA. NO PUBLICAR.
     Borrar este bloque entero, el bloque CSS marcado igual en estilos.css,
     el <div class="mando"> y la <section class="ficha"> del HTML, y la parte
     de densidad del script bloqueante del <head>. Receta en el README.
     ═══════════════════════════════════════════════════════════════════════ */
  (function mandoMaqueta() {
    var mando = document.getElementById('mando');
    if (!mando) return;
    /* solo con ?revision: el enlace que recibe el cliente sale limpio */
    if (!/[?&]revision\b/.test(window.location.search)) return;
    mando.hidden = false;                       /* sin JS no haría nada: lo enseña el JS */
    var botones = todos('[data-densidad]', mando);

    function aplicar(d) {
      html.classList.remove('densidad-cal', 'densidad-sobria');
      html.classList.add('densidad-' + d);
      botones.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.densidad === d ? 'true' : 'false'); });
      try { localStorage.setItem('dehesillas-densidad', d); } catch (e) {}
      document.dispatchEvent(new CustomEvent('densidad-cambiada', { detail: d }));
      setTimeout(refrescar, 90);
    }
    var actual = densidad();
    botones.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.densidad === actual ? 'true' : 'false');
      b.addEventListener('click', function () { aplicar(b.dataset.densidad); });
    });
  })();
  /* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */
})();
