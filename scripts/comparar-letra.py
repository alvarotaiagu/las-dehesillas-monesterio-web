"""Qué condensada de Google Fonts se parece más a «LAS DEHESILLAS» del logo.

Se recorta la palabra del PNG, se compone la misma palabra con cada candidata
a la misma altura de mayúscula y se comparan tres cosas:
  · ancho      cuánto mide la palabra frente a la del logo (1,00 = igual)
  · mancha     proporción de tinta dentro de la caja (lo negra que es)
  · solape     IoU de las dos manchas estiradas a la misma caja (forma)
Además guarda una lámina para mirarlas una encima de otra.

    python scripts/comparar-letra.py
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

sys.stdout.reconfigure(encoding='utf-8')
AQUI = Path(__file__).resolve().parent
FUENTES = AQUI / 'fuentes'
LOGO = FUENTES / 'fotos' / 'LAS-DEHESILLAS-LOGO-1.png'
SALIDA = AQUI / 'fuentes' / 'comparar-letra.png'
TEXTO = 'LAS DEHESILLAS'


def tinta(im):
    a = np.asarray(im.convert('L'))
    return a < 128


def caja(m):
    ys, xs = np.where(m)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def palabra_logo():
    im = Image.open(LOGO).convert('RGBA')
    fondo = Image.new('RGBA', im.size, 'white')
    im = Image.alpha_composite(fondo, im).convert('L')
    w, h = im.size
    # la palabra está a la derecha del monograma y encima de «Alojamiento Rural»
    zona = im.crop((int(w * 0.33), 0, w, int(h * 0.66)))
    m = tinta(zona)
    x0, y0, x1, y1 = caja(m)
    return m[y0:y1, x0:x1]


def instancia(ruta, ejes):
    if not ejes:
        return str(ruta)
    f = TTFont(ruta)
    f = instantiateVariableFont(f, ejes)
    destino = FUENTES / (ruta.stem.split('[')[0] + '-' + '-'.join(f'{k}{v}' for k, v in ejes.items()) + '.ttf')
    f.save(destino)
    return str(destino)


def componer(ruta, alto_mayus, tracking=0):
    f = ImageFont.truetype(ruta, 400)
    lienzo = Image.new('L', (6000, 800), 255)
    d = ImageDraw.Draw(lienzo)
    x = 20
    for c in TEXTO:
        d.text((x, 100), c, font=f, fill=0)
        x += d.textlength(c, font=f) + tracking * 400
    m = tinta(lienzo)
    x0, y0, x1, y1 = caja(m)
    m = m[y0:y1, x0:x1]
    esc = alto_mayus / m.shape[0]
    im = Image.fromarray((~m * 255).astype(np.uint8)).resize((max(1, round(m.shape[1] * esc)), alto_mayus), Image.LANCZOS)
    return tinta(im)


def iou(a, b):
    h, w = b.shape
    a2 = tinta(Image.fromarray((~a * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS))
    return (a2 & b).sum() / (a2 | b).sum()


CANDIDATAS = [
    ('Anton', FUENTES / 'Anton-Regular.ttf', {}),
    ('Bebas Neue', FUENTES / 'BebasNeue-Regular.ttf', {}),
    ('Oswald 700', FUENTES / 'Oswald[wght].ttf', {'wght': 700}),
    ('Big Shoulders Display 800', FUENTES / 'BigShouldersDisplay[wght].ttf', {'wght': 800}),
    ('Big Shoulders Display 900', FUENTES / 'BigShouldersDisplay[wght].ttf', {'wght': 900}),
    ('League Gothic', FUENTES / 'LeagueGothic[wdth].ttf', {'wdth': 100}),
]

if __name__ == '__main__':
    logo = palabra_logo()
    alto = logo.shape[0]
    print(f'Logo: {logo.shape[1]}×{alto} px, mancha {logo.mean():.3f}')
    filas = [('LOGO', logo)]
    for nombre, ruta, ejes in CANDIDATAS:
        m = componer(instancia(ruta, ejes), alto)
        print(f'{nombre:28s} ancho {m.shape[1] / logo.shape[1]:.2f}  mancha {m.mean():.3f} (logo {logo.mean():.3f})  solape {iou(m, logo):.3f}')
        filas.append((nombre, m))
    ancho = max(m.shape[1] for _, m in filas) + 260
    lam = Image.new('RGB', (ancho, len(filas) * (alto + 24) + 10), 'white')
    d = ImageDraw.Draw(lam)
    for i, (n, m) in enumerate(filas):
        y = 10 + i * (alto + 24)
        lam.paste(Image.fromarray((~m * 255).astype(np.uint8)).convert('RGB'), (250, y))
        d.text((8, y + alto // 2 - 6), n, fill=(120, 40, 30))
    lam.save(SALIDA)
    print('lámina:', SALIDA.relative_to(AQUI.parent))
