from PIL import Image, ImageDraw
from pathlib import Path
import sys
d = Path(sys.argv[1]); out = sys.argv[2]; ini=int(sys.argv[3]); fin=int(sys.argv[4])
fs = sorted([f for f in d.iterdir() if f.suffix.lower() in ('.jpg','.jpeg','.png')])[ini:fin]
W=240; H=170; cols=8; rows=(len(fs)+cols-1)//cols
sheet = Image.new('RGB',(cols*W, rows*(H+26)),'white'); dr=ImageDraw.Draw(sheet)
for i,f in enumerate(fs):
    try:
        im=Image.open(f).convert('RGB')
    except Exception: continue
    w,h=im.size; im.thumbnail((W-6,H-6))
    x=(i%cols)*W; y=(i//cols)*(H+26)
    sheet.paste(im,(x+3,y+3)); dr.text((x+4,y+H+1),f"{ini+i} {f.name[:28]}",fill='black'); dr.text((x+4,y+H+12),f"{w}x{h}",fill='gray')
sheet.save(out, quality=82)
