"""Gradación común de las fotos de Las Dehesillas.

Las fotos de su web son de sesiones distintas: exteriores de atardecer muy
fríos, interiores con bombilla amarilla, móviles con el cielo quemado. Para
que parezcan de la misma casa, todas pasan por la misma receta (la de la
memoria «food photo consistency»: color y profundidad, sin tocar fondos):

  1. balance de blancos a medias (mundo gris al 45 %): quita el azul del
     atardecer y el amarillo de la bombilla sin dejarlas iguales;
  2. tono partido común: sombras hacia el almagre tostado, luces hacia la cal;
  3. azules y cianes con menos saturación (cielo y piscina dejan de gritar);
  4. brillo medio igualado a medias y una curva en S suave;
  5. profundidad: fuera de una elipse de foco, desenfoque suave y un punto más
     oscuro. Cada foto lleva su foco y su fuerza (0 en la aérea: es un plano).

Recortes con nombre (x0, y0, x1, y1 en fracción). El del caballo deja fuera al
menor que camina a la izquierda: el recorte empieza en x = 0,26 y el niño
termina en 0,23.

    python scripts/gradar.py
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')
RAIZ = Path(__file__).resolve().parent.parent
F = RAIZ / 'scripts' / 'fuentes' / 'fotos'
SALIDA = RAIZ / 'assets' / 'img'

ALMAGRE_SOMBRA = np.array([0x3A, 0x22, 0x1C]) / 255
CAL_LUZ = np.array([0xF6, 0xF1, 0xE6]) / 255

# nombre, origen, recorte, anchos, foco (cx, cy, rx, ry), fuerza de profundidad
FOTOS = [
    ('hero-piscina', 'Foto-140-2.jpg', (0.17, 0.0, 0.73, 1.0), (1400, 820), (0.5, 0.42, 0.62, 0.55), 0.5),
    ('finca-naranjos', 'Foto-129-1.jpg', (0.0, 0.0, 1.0, 1.0), (1600, 900), (0.55, 0.5, 0.5, 0.55), 0.6),
    ('plano-aerea', 'Foto-2-1.jpg', (0.0, 0.0, 1.0, 1.0), (2400, 1400, 900), None, 0),
    ('casa-butaca', 'Foto-54.jpg', (0.0, 0.0, 1.0, 1.0), (1000, 600), (0.68, 0.62, 0.45, 0.45), 0.5),
    ('casa-salon', 'Foto-82-1.jpg', (0.0, 0.0, 1.0, 1.0), (1400, 800), (0.4, 0.45, 0.5, 0.5), 0.5),
    ('casa-dormitorio', 'Foto-115.jpg', (0.0, 0.0, 1.0, 1.0), (1400, 800), (0.5, 0.6, 0.5, 0.5), 0.45),
    ('casa-literas', 'mas/202409-Foto-99-scaled.jpg', (0.0, 0.0, 1.0, 1.0), (1400, 800), (0.5, 0.55, 0.5, 0.5), 0.4),
    ('casa-bano-adaptado', 'Foto-37.jpg', (0.0, 0.0, 1.0, 1.0), (1400, 800), (0.55, 0.55, 0.5, 0.55), 0.4),
    ('casa-cocina', 'Foto-109.jpg', (0.0, 0.0, 1.0, 1.0), (1400, 800), (0.5, 0.6, 0.35, 0.5), 0.45),
    ('hacer-caballos', '10.jpg', (0.26, 0.0, 1.0, 1.0), (700, 500), (0.32, 0.55, 0.32, 0.5), 0.55),
    ('hacer-piscina', 'mas/202409-Foto-135-scaled.jpg', (0.0, 0.0, 1.0, 1.0), (1200, 700), (0.5, 0.55, 0.6, 0.5), 0.4),
    ('hacer-padel', 'mas/202410-IMG_0592-scaled.jpg', (0.0, 0.08, 1.0, 1.0), (1200, 700), (0.5, 0.6, 0.6, 0.55), 0.35),
    ('hacer-buggy', 'mas/202410-1-bc79e3e0.jpg', (0.0, 0.0, 1.0, 1.0), (1200, 700), (0.53, 0.58, 0.32, 0.4), 0.55),
    ('hacer-mirador', 'mas/202311-mirador-1.jpg', (0.0, 0.0, 1.0, 1.0), (1200, 700), (0.55, 0.55, 0.5, 0.5), 0.4),
    ('hacer-pingpong', 'pexels-8681352.jpg', (0.0, 0.0, 1.0, 1.0), (1200, 700), (0.5, 0.5, 0.42, 0.45), 0.5),
    ('perro', 'mas/202410-crop-1-1-scaled.jpg', (0.12, 0.0, 0.88, 1.0), (1000, 600), (0.5, 0.45, 0.4, 0.5), 0.55),
]

# Zonas del plano (centro en fracción de la aérea): recorte ampliado para la lista móvil.
ZONAS = [
    ('zona-piscina', (0.71, 0.70)),
    ('zona-padel', (0.19, 0.44)),
    ('zona-patio', (0.555, 0.26)),
    ('zona-casas', (0.42, 0.36)),
    ('zona-dehesa', (0.86, 0.12)),
]


def gradar(im, foco, fuerza):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255

    # 1. mundo gris a medias
    medias = a.reshape(-1, 3).mean(0)
    gris = medias.mean()
    a = a * (1 + 0.45 * (gris / np.maximum(medias, 1e-3) - 1))

    # 3. menos saturación en azules y cianes (antes del tono partido)
    mx, mn = a.max(2), a.min(2)
    sat = (mx - mn) / np.maximum(mx, 1e-3)
    azul = np.clip((a[..., 2] - a[..., 0]) * 3, 0, 1) * sat
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    k = 0.32 * azul
    a = a * (1 - k[..., None]) + lum[..., None] * k[..., None]

    # 2. tono partido: sombras → almagre tostado, luces → cal
    lum = a @ np.array([0.2126, 0.7152, 0.0722], np.float32)
    somb = np.clip(1 - lum * 2, 0, 1)[..., None] * 0.16
    luz = np.clip(lum * 2 - 1, 0, 1)[..., None] * 0.12
    a = a * (1 - somb) + ALMAGRE_SOMBRA * somb
    a = a * (1 - luz) + CAL_LUZ * luz

    # 4. brillo medio igualado a medias + curva en S suave
    m = float((a @ np.array([0.2126, 0.7152, 0.0722], np.float32)).mean())
    a = a * (1 + 0.5 * (0.47 / max(m, 1e-3) - 1))
    a = np.clip(a, 0, 1)
    a = a + 0.08 * (a - 0.5) * (1 - np.abs(2 * a - 1))
    a = np.clip(a, 0, 1)
    out = Image.fromarray((a * 255).round().astype(np.uint8))

    # 5. profundidad: desenfoque fuera de la elipse de foco
    if foco and fuerza > 0:
        w, h = out.size
        cx, cy, rx, ry = foco
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        d = np.sqrt(((xx / w - cx) / rx) ** 2 + ((yy / h - cy) / ry) ** 2)
        mascara = np.clip((d - 0.75) / 0.9, 0, 1) * fuerza
        borroso = np.asarray(out.filter(ImageFilter.GaussianBlur(max(w, h) / 260))).astype(np.float32)
        nitido = np.asarray(out).astype(np.float32)
        mezcla = nitido * (1 - mascara[..., None]) + borroso * mascara[..., None]
        mezcla *= (1 - 0.14 * mascara[..., None])
        out = Image.fromarray(np.clip(mezcla, 0, 255).round().astype(np.uint8))
    return out


def recortar(im, caja):
    w, h = im.size
    x0, y0, x1, y1 = caja
    return im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)))


def guardar(im, nombre, anchos):
    for ancho in anchos:
        alto = round(im.height * ancho / im.width)
        ruta = SALIDA / f'{nombre}-{ancho}.jpg'
        im.resize((ancho, alto), Image.LANCZOS).save(ruta, quality=78, optimize=True, progressive=True)
        print(f'{ruta.relative_to(RAIZ)}  {ancho}×{alto}  {ruta.stat().st_size // 1024} KB')


def og(aerea):
    """Imagen para compartir (1200×630): la aérea, el zócalo y el logo en cal."""
    base = aerea.copy()
    base = base.resize((1200, round(base.height * 1200 / base.width)), Image.LANCZOS)
    top = (base.height - 630) // 2
    base = base.crop((0, top, 1200, top + 630)).convert('RGB')
    capa = Image.new('RGB', base.size, (0x6E, 0x2A, 0x22))
    d = ImageDraw.Draw(capa)
    mascara = Image.new('L', base.size, 0)
    ImageDraw.Draw(mascara).rectangle((0, 470, 1200, 630), fill=255)
    base.paste(capa, (0, 0), mascara)
    logo = Image.open(F / 'LAS-DEHESILLAS-LOGO-1.png').convert('RGBA')
    logo = Image.alpha_composite(Image.new('RGBA', logo.size, 'white'), logo).convert('L')
    alto = 118                                   # cabe en la franja de 160 px con aire
    logo = logo.resize((round(logo.width * alto / logo.height), alto), Image.LANCZOS)
    alfa = logo.point(lambda v: 255 - v)
    cal = Image.new('RGB', logo.size, (0xF4, 0xF0, 0xE8))
    base.paste(cal, (60, 470 + (160 - logo.height) // 2 + 2), alfa.point(lambda v: min(255, v * 1.2)))
    ruta = RAIZ / 'assets' / 'og-las-dehesillas.jpg'
    base.save(ruta, quality=82, optimize=True)
    print(ruta.relative_to(RAIZ), base.size)


if __name__ == '__main__':
    SALIDA.mkdir(parents=True, exist_ok=True)
    aerea = None
    for nombre, origen, caja, anchos, foco, fuerza in FOTOS:
        im = recortar(Image.open(F / origen), caja)
        g = gradar(im, foco, fuerza)
        guardar(g, nombre, anchos)
        if nombre == 'plano-aerea':
            aerea = g
    # recortes ampliados de cada zona del plano (lista de tarjetas en móvil)
    w, h = aerea.size
    for nombre, (cx, cy) in ZONAS:
        rw, rh = w * 0.22, w * 0.22 * 0.62
        x0 = min(max(cx * w - rw / 2, 0), w - rw)
        y0 = min(max(cy * h - rh / 2, 0), h - rh)
        guardar(aerea.crop((round(x0), round(y0), round(x0 + rw), round(y0 + rh))), nombre, (560,))
    og(aerea)
