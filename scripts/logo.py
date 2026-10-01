"""Logo de Las Dehesillas vectorizado con potrace desde su PNG.

No se redibuja a ojo: se amplía el PNG ×8 con un desenfoque suave (para que
los bordes de 1 px no salgan en escalera), se umbraliza y potrace traza las
manchas. Salen tres piezas:

    monograma   el arco con rayos y cruz y las dos M (cortina, cabecera, favicon)
    cruz        solo la cruz, recortada por encima del arco (separador del marquee)
    logo        el logotipo completo, monograma + «LAS DEHESILLAS» + «Alojamiento Rural»

Escribe:
    assets/logo-dehesillas.svg       tinta sobre transparente
    assets/logo-dehesillas-cal.svg   cal sobre transparente (pie, fondos oscuros)
    assets/monograma.svg             tinta
    assets/favicon.svg               monograma en cal sobre almagre
y mete en las páginas los <symbol> del monograma y de la cruz (el logotipo
completo va como <img>, pesa 46 KB) entre las marcas
    <!-- simbolos:inicio --> … <!-- simbolos:fin -->

    python scripts/logo.py
"""
import re
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter
import potrace

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = Path(__file__).resolve().parent.parent
PNG = RAIZ / 'scripts' / 'fuentes' / 'fotos' / 'LAS-DEHESILLAS-LOGO-1.png'
AMPLIA = 8
TINTA = '#1C1713'
CAL = '#F4F0E8'
ALMAGRE = '#6E2A22'

# Cajas en píxeles del PNG original (584×213), medidas por filas y columnas de tinta.
MONOGRAMA = (8, 16, 186, 192)
CRUZ = (83, 17, 110, 56)          # se corta antes de tocar el arco
LOGO = (8, 16, 566, 200)


def mascara():
    im = Image.open(PNG).convert('RGBA')
    im = Image.alpha_composite(Image.new('RGBA', im.size, 'white'), im).convert('L')
    grande = im.resize((im.width * AMPLIA, im.height * AMPLIA), Image.LANCZOS)
    grande = grande.filter(ImageFilter.GaussianBlur(AMPLIA * 0.16))
    return np.asarray(grande)


def trazar(gris, caja):
    x0, y0, x1, y1 = (v * AMPLIA for v in caja)
    trozo = gris[y0:y1, x0:x1]
    # potracer toma como figura lo que vale False: se le pasa el FONDO (bool)
    curvas = potrace.Bitmap(trozo >= 128).trace(turdsize=20, alphamax=1.1, opticurve=True, opttolerance=1.0)
    k = 1 / AMPLIA
    f = lambda p: '%.1f %.1f' % (p.x * k, p.y * k)
    d = []
    for c in curvas:
        d.append('M' + f(c.start_point))
        for s in c.segments:
            if s.is_corner:
                d.append('L' + f(s.c) + 'L' + f(s.end_point))
            else:
                d.append('C' + f(s.c1) + ' ' + f(s.c2) + ' ' + f(s.end_point))
        d.append('Z')
    return ''.join(d), (caja[2] - caja[0], caja[3] - caja[1])


def svg(d, tam, color, titulo):
    w, h = tam
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w * 2}" height="{h * 2}" '
            f'role="img" aria-labelledby="t"><title id="t">{titulo}</title>'
            f'<path fill="{color}" fill-rule="evenodd" d="{d}"/></svg>\n')


def simbolo(ident, d, tam):
    w, h = tam
    return (f'<symbol id="{ident}" viewBox="0 0 {w} {h}">'
            f'<path fill="currentColor" fill-rule="evenodd" d="{d}"/></symbol>')


if __name__ == '__main__':
    gris = mascara()
    mono, tm = trazar(gris, MONOGRAMA)
    cruz, tc = trazar(gris, CRUZ)
    logo, tl = trazar(gris, LOGO)
    assets = RAIZ / 'assets'
    assets.mkdir(exist_ok=True)
    (assets / 'logo-dehesillas.svg').write_text(svg(logo, tl, TINTA, 'Las Dehesillas · Alojamiento Rural'), encoding='utf8')
    (assets / 'logo-dehesillas-cal.svg').write_text(svg(logo, tl, CAL, 'Las Dehesillas · Alojamiento Rural'), encoding='utf8')
    (assets / 'monograma.svg').write_text(svg(mono, tm, TINTA, 'Las Dehesillas'), encoding='utf8')
    # favicon: el monograma centrado en un cuadrado de almagre
    w, h = tm
    lado = max(w, h) * 1.28
    fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {lado:.1f} {lado:.1f}">'
           f'<rect width="{lado:.1f}" height="{lado:.1f}" rx="{lado * 0.2:.1f}" fill="{ALMAGRE}"/>'
           f'<g transform="translate({(lado - w) / 2:.1f} {(lado - h) / 2:.1f})">'
           f'<path fill="{CAL}" fill-rule="evenodd" d="{mono}"/></g></svg>\n')
    (assets / 'favicon.svg').write_text(fav, encoding='utf8')

    bloque = ('<!-- simbolos:inicio · generado por scripts/logo.py, no editar a mano -->\n'
              '<svg class="simbolos" width="0" height="0" aria-hidden="true" focusable="false"><defs>'
              + simbolo('mm', mono, tm) + simbolo('cruz', cruz, tc) +
              '</defs></svg>\n<!-- simbolos:fin -->')
    patron = re.compile(r'<!-- simbolos:inicio[^>]*-->.*?<!-- simbolos:fin -->', re.S)
    for pagina in ['index.html', '404.html', 'aviso-legal.html', 'privacidad.html']:
        ruta = RAIZ / pagina
        if not ruta.exists():
            continue
        t = ruta.read_text(encoding='utf8')
        nuevo, n = patron.subn(lambda m: bloque, t)
        if n:
            ruta.write_text(nuevo, encoding='utf8')
        print(('símbolos en ' if n else 'sin marcas   ') + pagina)
    print(f'monograma {tm} · {len(mono)} car. | cruz {tc} · {len(cruz)} car. | logo {tl} · {len(logo)} car.')
