"""Paleta de Las Dehesillas medida en sus propias fotos.

Las fotos están hechas con luz de tarde y salen frías, así que no se toma el
color tal cual: en cada foto se mide también un trozo de cal de la misma
fachada y se corrige el balance de blancos en luz lineal para que esa cal
sea blanca cálida. Con esa misma corrección se lee el zócalo, la teja o la
encina. Es lo que haría un ojo delante de la pared.

    python scripts/paleta.py
"""
import sys
import colorsys
from pathlib import Path
import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
FOTOS = Path(__file__).resolve().parent / 'fuentes' / 'fotos'
BLANCO = (244, 240, 232)   # la cal a la que se lleva el balance


def lin(c):
    c = np.asarray(c, float) / 255
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def srgb(l):
    l = np.clip(l, 0, 1)
    c = np.where(l <= 0.0031308, l * 12.92, 1.055 * l ** (1 / 2.4) - 0.055)
    return (c * 255).round().astype(int)


def mediana(foto, caja):
    im = Image.open(FOTOS / foto).convert('RGB')
    w, h = im.size
    x0, y0, x1, y1 = caja
    a = np.asarray(im.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))).reshape(-1, 3)
    return np.median(a, 0)


def hexa(c):
    return '#%02X%02X%02X' % tuple(int(v) for v in c)


def hsv(c):
    h, s, v = colorsys.rgb_to_hsv(*(np.asarray(c) / 255))
    return 'H%3.0f S%.2f V%.2f' % (h * 360, s, v)


def lum(c):
    l = lin(c)
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]


def contraste(a, b):
    x, y = sorted([lum(a), lum(b)], reverse=True)
    return (x + 0.05) / (y + 0.05)


# (qué, foto, caja de cal de referencia, caja del color)
MUESTRAS = [
    ('almagre · zócalo al sol', 'mas/202409-Foto-144-scaled.jpg', (0.62, 0.45, 0.72, 0.62), (0.80, 0.76, 0.97, 0.88)),
    ('almagre · zócalo del patio', 'mas/202409-Foto-142-scaled.jpg', (0.115, 0.49, 0.165, 0.54), (0.625, 0.585, 0.69, 0.605)),
    ('teja · alero del patio', 'mas/202409-Foto-142-scaled.jpg', (0.115, 0.49, 0.165, 0.54), (0.82, 0.76, 0.97, 0.94)),
    ('teja · tejado (aérea)', 'Foto-2-1.jpg', (0.385, 0.37, 0.405, 0.40), (0.33, 0.27, 0.40, 0.33)),
    ('encina · copa (aérea)', 'Foto-2-1.jpg', (0.385, 0.37, 0.405, 0.40), (0.80, 0.04, 0.86, 0.11)),
]

if __name__ == '__main__':
    print('Cal medida (sin corregir): Foto-140-2', hexa(mediana('Foto-140-2.jpg', (0.40, 0.23, 0.46, 0.33))),
          '· Foto-144', hexa(mediana('mas/202409-Foto-144-scaled.jpg', (0.62, 0.45, 0.72, 0.62))))
    for que, foto, caja_cal, caja in MUESTRAS:
        cal = mediana(foto, caja_cal)
        crudo = mediana(foto, caja)
        corregido = srgb(lin(crudo) * lin(BLANCO) / lin(cal))
        print(f'{que:30s} medido {hexa(crudo)} → corregido {hexa(corregido)}  {hsv(corregido)}')
    print('su web: #632536', hsv((0x63, 0x25, 0x36)))
    print()
    # la paleta elegida (ver css/estilos.css) y sus contrastes
    P = {'cal': (0xF4, 0xF0, 0xE8), 'cal tostada': (0xEA, 0xE2, 0xD3), 'tinta': (0x1C, 0x17, 0x13),
         'almagre': (0x6E, 0x2A, 0x22), 'carbón': (0x16, 0x13, 0x0F)}
    for a, b in [('tinta', 'cal'), ('almagre', 'cal'), ('almagre', 'cal tostada'), ('cal', 'almagre'), ('cal', 'carbón')]:
        print(f'{a} sobre {b}: {contraste(P[a], P[b]):.2f}:1')
