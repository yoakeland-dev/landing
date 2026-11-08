# Wide crops of icon/final/photos/bluehour.jpg for the page: the icon's pre-dawn grade (grade.py) up top, the photo as shot at the close.
import numpy as np
from PIL import Image
src = Image.open('../icon/final/photos/bluehour.jpg').convert('RGB')
def gmap(l, stops):
    out = np.zeros(l.shape, np.float32)[..., None].repeat(3, 2)
    for (p, c), (q, d) in zip(stops, stops[1:]):
        c = np.array([int(c[i:i+2], 16) for i in (1, 3, 5)], np.float32) / 255; d = np.array([int(d[i:i+2], 16) for i in (1, 3, 5)], np.float32) / 255
        w = np.clip((l - p) / (q - p), 0, 1)[..., None]; out = np.where((l >= p)[..., None], c * (1 - w) + d * w, out)
    return out
c = src.crop((0, 490, 1500, 1590)).resize((2400, 1760), Image.LANCZOS)
a = np.asarray(c, np.float32) / 255
ys = np.linspace(0, 1, a.shape[0], dtype=np.float32)[:, None]
l = (a @ np.array([.2126, .7152, .0722], np.float32)) * (.42 + .58 * ys) ** 1.5
l = np.clip(l + np.clip((a[..., 0] - a[..., 2]) * 6, 0, 1) * .25, 0, 1)
g = .85 * gmap(l, [(0, '#05081a'), (.25, '#121c44'), (.45, '#2c3b78'), (.62, '#6a5f9a'), (.78, '#e39a8c'), (1, '#ffd3a8')]) + .15 * a
Image.fromarray((np.clip(g, 0, 1) * 255).astype(np.uint8)).save('static/sky-predawn.webp', quality=86)
src.crop((0, 420, 1500, 2000)).resize((2000, 2107), Image.LANCZOS).save('static/sky-morning.webp', quality=84)
