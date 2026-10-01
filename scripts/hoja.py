from PIL import Image, ImageDraw
from pathlib import Path
import sys
d = Path(sys.argv[1]); out = sys.argv[2]
fs = sorted([f for f in d.iterdir() if f.suffix.lower() in ('.jpg','.jpeg','.png')])
W=300; H=210; cols=6; rows=(len(fs)+cols-1)//cols
sheet = Image.new('RGB',(cols*W, rows*(H+30)),'white'); dr=ImageDraw.Draw(sheet)
for i,f in enumerate(fs):
    im=Image.open(f).convert('RGB'); w,h=im.size; im.thumbnail((W-6,H-6))
    x=(i%cols)*W; y=(i//cols)*(H+30)
    sheet.paste(im,(x+3,y+3)); dr.text((x+4,y+H+2),f"{i} {f.name[:30]}",fill='black'); dr.text((x+4,y+H+14),f"{w}x{h}",fill='gray')
sheet.save(out, quality=85); print(len(fs))
