"""Optional networked art preview. Does not publish or alter engine/save code."""
from pathlib import Path
from io import BytesIO
from urllib.request import Request, urlopen
import base64
import hashlib
import json
import subprocess
import sys
from PIL import Image
root = Path(__file__).resolve().parents[1]
subprocess.run([sys.executable, str(root / 'scripts/build_arms_proto.py')], cwd=root, check=True)
revision = '568e8f89c5e73a7010229337ec7245947974d321'
base = f'https://raw.githubusercontent.com/standujar/forever-classic-ui/{revision}/assets/classic-era/'
files = {
    'tl': 'interface/paperdollinfoframe/ui-character-general-topleft.blp',
    'tr': 'interface/paperdollinfoframe/ui-character-general-topright.blp',
    'bl': 'interface/talentframe/ui-talentframe-botleft.blp',
    'br': 'interface/talentframe/ui-talentframe-botright.blp',
    'rank': 'interface/talentframe/talentframe-rankborder.blp',
}
out = root / 'preview/classic-art'
out.mkdir(parents=True, exist_ok=True)
images, manifest = {}, {'sourceRevision': revision, 'files': {}, 'notice': 'World of Warcraft artwork is copyright Blizzard Entertainment. This reference pack does not grant redistribution rights. Not covered by the source repository MIT license.'}
for key, path in files.items():
    with urlopen(Request(base + path, headers={'User-Agent': 'Azerot-art-preview'}), timeout=30) as response:
        raw = response.read(2000001)
    if len(raw) > 2000000 or raw[:4] not in (b'BLP1', b'BLP2'):
        raise SystemExit('Invalid or oversized BLP: ' + path)
    image = Image.open(BytesIO(raw)).convert('RGBA')
    images[key] = image
    image.save(out / (key + '.png'))
    manifest['files'][path] = {'sourceSha256': hashlib.sha256(raw).hexdigest(), 'size': len(raw), 'dimensions': list(image.size)}
with urlopen(Request(base + 'NOTICE.md', headers={'User-Agent': 'Azerot-art-preview'}), timeout=30) as response:
    (out / 'NOTICE.md').write_bytes(response.read(100000))
(out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
frame = Image.new('RGBA', (384, 512))
for key, xy, size in [('tl', (0, 0), (256, 256)), ('tr', (256, 0), (128, 256)), ('bl', (0, 256), (256, 256)), ('br', (256, 256), (128, 256))]:
    frame.alpha_composite(images[key].resize(size, Image.Resampling.NEAREST), xy)
frame.save(out / 'frame.png')
def uri(image):
    buffer = BytesIO()
    image.save(buffer, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(buffer.getvalue()).decode('ascii')
art = {'frame': uri(frame), 'rank': uri(images['rank'])}
js = r'''(function(){
'use strict';
const art=CLASSIC_ART;
const style=document.createElement('style');
style.textContent=`
.talent-panel{position:relative;overflow:hidden}
.classic-original-window{position:relative;width:384px;height:512px;transform-origin:top left;background-image:url('${art.frame}');background-repeat:no-repeat;background-size:384px 512px}
.classic-original-window>h2{position:absolute;left:75px;top:13px;width:246px;box-sizing:border-box;padding:0;border:0;background:none;font-size:14px;line-height:20px;z-index:2}
.classic-original-window>.panel-status{position:absolute;left:75px;top:48px;width:246px;height:20px;min-height:0;padding:0;line-height:20px;font-size:10px;overflow:hidden;background:#08080899;z-index:2}
#talent-panels .classic-original-window>#tree,.classic-original-window>.locked-board{position:absolute;left:23px;top:77px;box-sizing:border-box;width:296px;max-width:none;height:332px;overflow-x:hidden;overflow-y:auto;padding:12px 5px;border:0;box-shadow:none;scrollbar-width:thin;scrollbar-color:#9b8251 #18160f}
#tree .node>span,.locked-node span{background:transparent url('${art.rank}') center/32px 32px no-repeat;border:0;min-width:22px;min-height:18px;text-align:center;padding:0 2px;line-height:18px;text-shadow:1px 1px #000}
.classic-original-window .original-frame-footer{position:absolute;left:45px;top:414px;width:280px;color:#c9b17a;text-align:center;font:11px/18px Arial}
`;
document.head.appendChild(style);
for(const panel of document.querySelectorAll('.talent-panel')){
 const frame=document.createElement('div');frame.className='classic-original-window';
 while(panel.firstChild)frame.appendChild(panel.firstChild);
 const footer=document.createElement('p');footer.className='original-frame-footer';footer.textContent=panel.id==='talent-panel-arms'?'Оружие · рабочий фрагмент прототипа':'Только просмотр · скоро';frame.appendChild(footer);panel.appendChild(frame);
}
function normalize(){
 for(const svg of document.querySelectorAll('#talent-panels svg')){
  const r=svg.getBoundingClientRect();if(r.width>0&&r.height>0)svg.setAttribute('viewBox','0 0 '+r.width+' '+r.height);
 }
}
function size(){
 for(const panel of document.querySelectorAll('.talent-panel')){
  const scale=panel.clientWidth/384;
  panel.firstElementChild.style.transform='scale('+scale+')';panel.style.height=(512*scale)+'px';
 }
 requestAnimationFrame(()=>requestAnimationFrame(normalize));
}
new MutationObserver(records=>{if(records.some(r=>Array.from(r.addedNodes).some(n=>n.nodeType===1&&n.localName==='svg')))requestAnimationFrame(normalize);}).observe(document.getElementById('talent-panels'),{childList:true,subtree:true});
addEventListener('resize',size);
size();
requestAnimationFrame(()=>dispatchEvent(new Event('resize')));
})();'''.replace('CLASSIC_ART', json.dumps(art))
if '</script' in js.lower():
    raise SystemExit('Unsafe script terminator')
page = root / 'preview/arms-proto.html'
html = page.read_text(encoding='utf-8')
if html.count('</html>') != 1:
    raise SystemExit('Unexpected preview structure')
page.write_text(html.replace('</html>', '<script>' + js + '</script></html>'), encoding='utf-8')
print(json.dumps({'previewBytes': page.stat().st_size, 'artFiles': len(files), 'sourceRevision': revision}))
