"""Quick inference API test — sends a synthetic leaf image to /predict."""
import base64, io, sys
from PIL import Image, ImageDraw

# Create a synthetic green leaf image
img = Image.new('RGB', (400, 300), (40, 120, 35))
draw = ImageDraw.Draw(img)
draw.ellipse((50, 50, 350, 250), fill=(50, 140, 40))
for _ in range(5):
    draw.ellipse((130, 100, 170, 140), fill=(180, 100, 30))

buf = io.BytesIO()
img.save(buf, 'JPEG', quality=90)
b64 = base64.b64encode(buf.getvalue()).decode()

try:
    import requests
    print("[TEST] /health ...")
    r = requests.get('http://localhost:5000/health', timeout=5)
    j = r.json()
    print(f"  status: {r.status_code}  body: {j}")

    print("[TEST] /predict ...")
    r2 = requests.post('http://localhost:5000/predict',
                       json={'image': b64, 'gradcam': True}, timeout=60)
    d = r2.json()
    gc = d.get('gradcam_base64') or ''
    print(f"  status: {r2.status_code}")
    print(f"  predicted_class:  {d.get('predicted_class')}")
    print(f"  confidence:       {d.get('confidence')}%")
    print(f"  gradcam_base64:   present={bool(gc)}, len={len(gc)}")
    print(f"  all_probabilities: {d.get('all_probabilities')}")
    if d.get('error'):
        print(f"  ERROR: {d['error']}")
except Exception as e:
    print(f"FAIL: {e}")
