# Las Dehesillas · web «Cal y almagre»

> **Maqueta en local, sin publicar.** Todas las páginas llevan `noindex, nofollow`.
> Es la propuesta para un negocio real, **Las Dehesillas · Alojamiento Rural**
> (Ctra. Santa María – Pallares, km 32, BA-067 · 06260 Monesterio, Badajoz).
> Viene del boceto A del tablero `../las-dehesillas-monesterio-bocetos/`, más el
> monograma del B como cortina y el configurador del D como módulo que se quita.

```
node scripts/servir.mjs              → http://127.0.0.1:4195
http://127.0.0.1:4195/?revision      → con el mando de las dos versiones
node scripts/verificar.mjs           → 153 comprobaciones (con --capturas guarda screenshots/)
```

---

## El concepto: «Cal y almagre»

No sale de una lista de efectos. Sale de dos cosas que ya son suyas:

- **El cortijo.** Cal blanca con **zócalo de almagre**: se ve en todas sus fotos.
- **El logo.** El monograma M M bajo un arco con rayos y una cruz, «LAS DEHESILLAS»
  en palo seco condensado y «Alojamiento Rural» en serif fina.

La web es un muro encalado y **el zócalo es su línea de fuerza**:

| Dónde | Qué hace el zócalo |
|---|---|
| Cortina | El monograma entra al rojo vivo, se enfría hasta almagre, el panel carbón se tiñe de almagre y **baja comprimiéndose hasta ser el zócalo del hero**, que se queda puesto. |
| Hero | Es la base: la foto con remate de arco se apoya en él, con la dirección en versalitas. |
| Separadores | Entre las secciones grandes, una banda que se pinta de lado a lado. |
| Cabecera fija | Es la barra de lectura: un zócalo que crece al bajar. |
| Pie | Cierra la página. |

Lo demás tiene el mismo peso: casas, finca, actividades y celebraciones.

**El único arco** de la página es el remate de medio punto de la foto del hero,
que viene del torreón real (Restaurante Gabi ya usa arco y sello: aquí no se repiten).

---

## Mapa de secciones

| # | Sección | Qué hace |
|---|---|---|
| — | Cortina | Monograma al rojo (golpe 1,06 → 1) → se enfría → «LAS DEHESILLAS» sube de su máscara y «Alojamiento Rural» asienta el espaciado → el panel se tiñe y baja con `expo.inOut` hasta la franja del zócalo. ~2,5 s. El hero arranca cuando el panel empieza a bajar. |
| 1 | Hero | «Tres casas de cal en la dehesa» (char-reveal, «la dehesa» en almagre), línea en serif, cifras **10 · 22–34 · 4,6★**, CTA magnético «Consultar fechas» + «Llamar», foto con arco y paralaje dentro de la máscara, zócalo. |
| 2 | La finca | Texto corto y su frase **entre comillas y atribuida a ellos**, con char-reveal. Foto de la terraza de los naranjos con el zócalo, que «se encala» al entrar. |
| 3 | El plano | Su foto aérea **anclada**: la cámara se acerca a los 5 puntos por turno, la lista avanza y cambia el texto. Cada punto lleva a su sección. En móvil, sin pin: la foto se queda fija arriba y debajo van tarjetas con un recorte ampliado de cada zona. |
| 4 | Las casas | «10 habitaciones en 3 casas», características reales en dos columnas, nota de los nombres, galería de interiores, fichas por habitación **solo si `data/habitaciones.json` trae datos**, «Tu perro también viene» y la visita virtual (tras un clic). |
| 5 | Qué hacer | Pila sticky de 6 tarjetas, cada una con su foto y su zócalo. |
| 6 | Marquee | Sobre almagre, con la cruz del monograma de separador. |
| 7 | Celebraciones | **Módulo que se quita** (ver abajo). Cifra que cuenta de 22 a 34 y configurador que compone el mensaje. |
| 8 | Reseñas | «4,6★ · 100 reseñas en Google», 3 citas literales, botón a la ficha con las reseñas abiertas. |
| 9 | Cómo llegar | Dirección, km 32 de la BA-067 dirección Santa María / Pallares, su aviso de que las indicaciones van con la reserva, mapa solo bajo clic. Sin distancias ni tiempos. |
| 10 | Consultar fechas | Sus mismos campos. Sin backend: compone el mensaje y ofrece «Enviar por email» (mailto con asunto y cuerpo), «Copiar mensaje» y «Llamar». |
| — | Pie | Logo vectorizado, dirección, teléfono, Instagram, Facebook, legales, cookies y el zócalo. |

---

## Paleta y letra

Medida con PIL en **sus** fotos (`scripts/paleta.py`). Las fotos son de tarde y
salen frías: en cada una se corrige el balance de blancos contra un trozo de cal
de la misma fachada y con esa corrección se lee el color.

| Token | Medido | Usado | Papel |
|---|---|---|---|
| `--almagre` | zócalo al sol (Foto-144) **#61251E** · zócalo del patio (Foto-142) **#6F352D** | **#6E2A22** | El **único** acento. Matiz 6–7º: rojo óxido. |
| — | su web actual: #632536 | — | Es un **vino** (344º), no el color de su pared. Si quieren conservarlo, es un cambio de una variable. |
| `--cal` | referencia de blanco de la corrección | #F4F0E8 | Fondo. |
| `--cal-tostada` | — | #EAE2D3 | Superficie (tarjetas, formulario, citas). |
| `--teja` | alero del patio (Foto-142) #B67161 | #B67161 | Solo en el dibujo de las casas. |
| `--encina` | copa en la aérea (Foto-2-1) #5B6154 | #5B6154 | Solo en el dibujo de las casas. |
| `--carbon` | — | #16130F | Cortina y fondo de Celebraciones. |

`--acento-texto` = `color-mix(almagre 86 %, tinta)`, para texto pequeño sobre cal.
Contrastes medidos en el navegador (verificar.mjs, componiendo el alfa): tinta/cal
15,6:1 · antetítulo/cal 10,0:1 · secundario/cal 6,9:1 · cal/almagre 9,2:1 ·
textos sobre carbón ≥ 9,5:1. Todos ≥ 4,5:1.

**Letra** (`scripts/comparar-letra.py`, lámina en `scripts/fuentes/comparar-letra.png`):
se compuso «LAS DEHESILLAS» con cada candidata a la altura de mayúscula del logo.

| Candidata | Ancho vs. logo | Mancha (logo 0,599) | Solape |
|---|---|---|---|
| **Anton** | **0,99** | **0,623** | 0,724 |
| Bebas Neue | 1,00 | 0,476 | 0,627 |
| Oswald 700 | 1,18 | 0,528 | 0,651 |
| Big Shoulders Display 900 | 1,06 | 0,557 | 0,761 |

Gana **Anton**: el mismo ancho y la mancha más parecida (es igual de negra).
Big Shoulders 900 solapa algo más, pero es un 6 % más ancha y más clara.
Texto: **Spectral** (300/400), afín a «Alojamiento Rural»; versalitas con **Spectral SC**.

**Logo**: vectorizado con potrace desde su PNG (`scripts/logo.py`), no redibujado.
Salen el logotipo completo (`assets/logo-dehesillas.svg`, y en cal), el monograma
suelto (`assets/monograma.svg`, cortina y cabecera), la cruz (separador del marquee)
y el favicon (monograma en cal sobre almagre).

---

## Qué es real y qué es provisional

**Real (su web y su ficha de Google, 2026-10-01):**
- Nombre, dirección, km 32 de la BA-067, teléfono 636 82 98 45, Instagram y Facebook.
- 10 habitaciones con baño privado en 3 casas, de 22 a 34 personas con supletorias.
- Habitaciones para niños y para movilidad reducida, 3 baños adaptados, calefactor, split, chimenea y TV.
- Caballos, piscina de agua salada, pádel «infinity», buggy y quad, senderos, mirador, ping-pong y juegos de mesa.
- Pet friendly sin suplemento, wifi y aparcamiento gratis.
- Los cinco tipos de celebración.
- 4,6★ con 100 reseñas. Las tres citas son literales (ver «Permiso de las reseñas»).
- Su frase del cielo, **solo entre comillas y atribuida a ellos**. Nada de «Starlight», «reserva» ni «certificado».
- **Todas las fotos son suyas** salvo una (abajo), sacadas de su WordPress en su tamaño mayor (`-scaled`, 2560 px casi todas).
- La visita virtual: es la vista 360º de Google que tienen en `fincalasdehesillas.com/tour-virtual/`. Se carga solo tras un clic.

**Provisional o de relleno:**
- **Ping-pong:** no tienen foto. Es de Pexels (ID 8681352), con la misma gradación y marcada «Foto de archivo». Se cambia en cuanto haya una suya.
- **El email** cristinamunozma@gmail.com es personal. Solo es el destino de los dos formularios y **no se enseña como texto** en la web.
- **Formularios sin backend:** componen el mensaje y lo abren en el correo del visitante.
- **Titular, CIF y registro turístico:** `[PENDIENTE]` en el aviso legal y en privacidad.
- **Habitaciones:** `data/habitaciones.json` tiene 10 entradas `[PENDIENTE]`. Mientras el nombre esté pendiente no se pinta nada, y la sección se ve completa sin ellas. Cuando haya nombres, aparecen las fichas sin tocar el HTML (el test lo prueba con datos de ejemplo).

**Fotos y gradación** (`scripts/gradar.py`, receta de la memoria «food photo consistency»):
- Balance de blancos a medias.
- Tono partido común: sombras hacia almagre tostado, luces hacia cal.
- Azules con menos saturación.
- Brillo igualado y curva en S suave.
- Profundidad simulada fuera de una elipse de foco (cero en la aérea).
- No se toca ningún fondo.

**Menores:** en la foto del jinete en la charca (`10.jpg`) sale un niño a la izquierda. El recorte empieza en x = 0,26 y el niño acaba en 0,23: no se ve. El resto de fotos con personas son de adultos.

**Fotos de clientes de Google:** ninguna.

---

## Pendientes para el dueño

1. **Nombres y fotos de las 10 habitaciones** (y casa y camas de cada una) → `data/habitaciones.json`.
   Pista: en su biblioteca de medios aparecen `HABITACION-RETINTA.jpg`, `HABITACION-LIMOUSINE-2.jpg` y un cartel tallado «CHAROLESA» (`Foto-28`). Son razas de vaca, así que los nombres podrían ser de su ganado. **No se han usado**: que lo confirme.
2. **Precios y temporadas.** No hay ninguno publicado. La web no da precios, y el CTA es «Consultar fechas».
3. **Si sirven comidas.** Su portada tiene un icono de gastronomía sin detalle. Una reseña cuenta que «Cristina nos ofreció poder encargar un arroz a un cocinero». Varias hablan de barbacoa: **¿hay barbacoa?** Si la hay, falta en «Qué hacer».
4. **Aforo de eventos.** No hay ninguno. El configurador no da cifras: pasado de 34 dice «Para más invitados, preguntadnos por los espacios».
5. **WhatsApp.** El 636 82 98 45 es un móvil, pero no está confirmado. La web solo ofrece llamar.
6. **Qué es el monograma M M.** ¿Es un hierro de ganadería familiar? La web no lo llama «hierro» ni le atribuye historia.
7. **La visita virtual.** La URL ya está localizada (su página `/tour-virtual/`, una vista de Google Street View). Falta confirmar que es la que quieren enseñar.
8. **Fotos originales en alta.** Las de la web son las `-scaled` de su WordPress (2560 px). Si tienen los originales de cámara, mejor. Además:
   - falta una foto de ping-pong / juegos de mesa;
   - falta una de la chimenea encendida en alta: solo hay una a 640 px, y no se ha usado.
9. **Permiso de las reseñas.** Se citan literalmente, con el nombre de pila:
   - «Jesus» = Jesus Prieto Reyes, 5/5, hace 5 meses;
   - «Judit» = Judit Jaramillo García, 5/5, hace 5 meses;
   - «Yolanda» = Yolanda Maza, 5/5, hace 3 años.

   Hay 70 reseñas descargadas en `scripts/fuentes/resenas-google-2026-10-01.json` por si prefieren otras.
10. **El email de contacto.** ¿Debe ser el personal (cristinamunozma@gmail.com) o uno del alojamiento?
11. **Titular, CIF** y, si lo tienen, el número del Registro de Empresas y Actividades Turísticas de Extremadura.
12. **El patio.** El encargo llamaba al punto 3 del plano «Patio del naranjo», pero en `Foto-142` el árbol del patio central no es un naranjo. Los naranjos están en la terraza (`Foto-129`). El punto se llama «El patio» hasta que lo confirmen.

---

## Módulo «Celebraciones»: cómo quitarlo

Está pensado para salir entero sin romper nada. Vive en:

- `index.html`: una sola `<section id="celebraciones" data-modulo="celebraciones">` entre las marcas `[MÓDULO CELEBRACIONES]`, y tres líneas con `data-modulo="celebraciones"`: el enlace del menú, el `<link>` de su hoja y el `<script>`;
- `css/celebraciones.css` (su hoja, nada más la usa);
- `js/celebraciones.js` (`main.js` no depende de él).

**Receta:**
```
node scripts/quitar-celebraciones.mjs ../una-copia     # sobre una copia
node scripts/quitar-celebraciones.mjs --aqui           # en esta carpeta, sin vuelta atrás
```
A mano es lo mismo:
1. Borra la sección entre sus marcas y las tres líneas con `data-modulo="celebraciones"`.
2. Borra `css/celebraciones.css` y `js/celebraciones.js`.
3. Ejecuta `node scripts/versionar.mjs`.

`verificar.mjs` hace esto sobre una copia temporal y comprueba tres cosas: que no hay errores de consola ni peticiones caídas, que el enlace del menú desaparece y que el resto de secciones sigue en orden (a 1440 y a 390).

---

## Mando de maqueta (`?revision`)

Solo aparece con `?revision` en la URL. Sin ese parámetro no hay mando, y tampoco se aplica una versión guardada. Se aparta mientras está el aviso de cookies.

| | «Cal y almagre» (la cargada) | «Sobria» |
|---|---|---|
| Zócalo | Cortina, hero, separadores, barra de lectura y pie | Solo hero y pie (separadores de línea fina) |
| Cortina | El panel baja y **se queda como zócalo** | El panel baja entero, sin traspaso |
| Plano | Anclado, con la cámara que se acerca a cada punto | La aérea quieta con sus 5 puntos y la lista |
| Marquee | Sí, con la cruz | No |
| **Ficha rápida** | No | **Sí**: tabla con capacidad, habitaciones, accesibilidad, mascotas, wifi, aparcamiento, piscina y pádel |

**Quitar el mando antes de entregar** (nunca viaja al cliente):
```
node scripts/quitar-mando.mjs ../las-dehesillas-entrega
node scripts/comprobar-borrado.mjs ../las-dehesillas-entrega
```
Caso A, el dueño elige «Cal y almagre»: con eso basta.

Caso B, elige la sobria:
1. Antes de quitar el mando, copia fuera de los bloques marcados las reglas `.densidad-sobria …` que quieras conservar, sin el prefijo.
2. Copia la `<section class="ficha">`.
3. En `main.js`, cambia `densidad()` para que devuelva `'sobria'`.

Las reglas del mando están siempre entre `[MANDO DE MAQUETA] … fin del bloque [MANDO DE MAQUETA]`, en `index.html`, `css/estilos.css`, `css/celebraciones.css`, `js/main.js` y `privacidad.html`.

---

## Qué la separa de Casa Bricaña y del resto de la carpeta

- **Casa Bricaña («Orballo»)**, la otra casa rural:
  - allí hay cristal empañado y gotas, habitaciones como ventanas en galería horizontal con brújula, pluviómetro, probeta y piedra gallega, en crema, óxido y serif;
  - aquí no hay nada de eso: muro de cal, una banda de almagre, Anton negra, el plano real de la finca desde el aire y las fotos del propio cortijo;
  - su pila sticky lleva iconos de línea; esta, fotos reales con un zócalo en cada tarjeta.
- **Día/noche (Marabú, Melao v2):** no hay cambio de tema.
- **Pazo do Souto** (sello que se traza y portón 3D):
  - aquí el monograma **no se traza** (aparece de golpe y se enfría por opacidad de copias);
  - no hay puertas: el panel cae y se comprime en una franja.
- **Restaurante Gabi** (arco, sello, copa): un solo arco, el de la foto del hero, y viene del torreón.
- **Otros:** la cámara que recorre una foto aérea con puntos y el configurador de celebraciones no existen en ninguna otra web de la carpeta.

---

## Checklist de web desde cero (cómo se cumple y qué lo prueba)

| Punto | Cómo | Test en `verificar.mjs` |
|---|---|---|
| 1 Cursor | Punto sólido + aro, `html.con-cursor *{cursor:none}`, relleno .38, en cal sobre almagre/carbón, nada en táctil | `getComputedStyle(body).cursor`, alfa del aro sobre un botón, sin cursor en táctil |
| 2 Pila sticky | `<li>` sticky, mismo alto medido por JS (resize + fonts.ready), mismo `margin-bottom` en todos, `::after` de reposo, lo siguiente sube con margen negativo | página limpia a 1440 y 390: nadie se suelta antes, nada asoma, salen juntas |
| 3 Menú móvil | `height:100dvh` dentro de la cabecera con blur | con la cabecera ya fija: cerrado fuera de pantalla, abierto a pantalla completa |
| 4 Cookies | `.cookies:not([hidden]){display:flex}` | se ve, cierra de verdad y no vuelve al recargar |
| 5 Cortina | Carbón ≠ cal del hero, sin JS (`<noscript>`), `setTimeout` inline, sin GSAP, con movimiento reducido (`display:none`), `[hidden]` propio, `lagSmoothing(0)` al retirarla | golpe, enfriado, fotograma a medias, traspaso al zócalo, sin CDN y movimiento reducido |
| 6 Hero en móvil | Todo en flujo, `min-height`, la foto apoyada en el zócalo | 360×640, 375×667, 390×844, 768×1024 y 1440×900 midiendo solapes |
| 7 `con-movimiento` | Solo con GSAP y sin movimiento reducido | clase y titulares visibles en las dos pasadas |
| 8 `autoRound` | No hay trazos dibujados con dashoffset (el monograma no se traza) | el test lo vigila en `main.js` |
| 9 Clases de estado | Todas con `es-` (`es-activo`, `es-visible`, `es-pintada`) | búsqueda en el JS + los 5 puntos siguen visibles con uno marcado |

---

## Scripts

| Script | Para qué |
|---|---|
| `servir.mjs` | Servidor local (puerto 4195) |
| `verificar.mjs` | Todas las comprobaciones (`--capturas` → `screenshots/`) |
| `versionar.mjs` | `?v=<huella>` en CSS y JS, solo en `href`/`src`, idempotente |
| `quitar-mando.mjs` / `comprobar-borrado.mjs` | Copia de entrega sin mando y su comprobación |
| `quitar-celebraciones.mjs` | Quita el módulo de celebraciones |
| `logo.py` | Vectoriza el logo con potrace y mete los símbolos en las páginas |
| `gradar.py` | Gradación común, recortes, tamaños, zonas del plano e imagen para compartir |
| `paleta.py` | Mide la paleta en sus fotos y calcula contrastes |
| `comparar-letra.py` | Compara las condensadas con el logo |
| `leer-resenas.mjs` | Lee las reseñas de su ficha de Google |

Las fotos originales y las fuentes descargadas están en `scripts/fuentes/` (fuera de git).

Créditos en `CREDITOS.md`.
