# Regenerates src/lib/ported from the running app (see scripts/README in this comment):
# start yoake-electron dev, then: node scripts/grab.mjs <scenes.json> <out.json>; python3 scripts/build.py (needs g*.out.json beside it).
import json,glob,os,re,sys
D='/home/aveline/Projects/yoake/landing/src/lib/ported'; os.makedirs(D,exist_ok=True)
frags={};rules={};vars={};sizes={}
for f in sorted(glob.glob('g*.out.json')):
    d=json.load(open(f)); frags.update(d['frags']); rules.update(d['rules']); vars.update(d['vars']); sizes.update(d.get('sizes',{}))
seen=set();css=''
for t in rules.values():
    for line in t.split('\n'):
        if line and line not in seen: seen.add(line); css+=line+'\n'
v='.yk{'+';'.join(f'{k}:{x}' for k,x in vars.items() if x)+'}\n'
base='.yk{font:14px Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--text);background:var(--bg);text-align:left;line-height:normal;letter-spacing:normal;font-weight:400}\n.yk *{box-sizing:border-box;user-select:none}\n.yk button{font-family:inherit}\n.yk .sidebar-toggle,.yk .right-island{position:absolute!important}\n.yk .shell{position:absolute!important;inset:0!important;width:100%!important;height:100%!important}\n.yk .titlebar-drag{display:none}\n'
open(D+'/ported.css','w').write(v+base+css)
for k,h in frags.items():
    h=re.sub(r'\s(data-tauri-drag-region|data-sveltekit-[\w-]+)(="[^"]*")?','',h)
    open(f'{D}/{k}.html','w').write(h)
print(len(css),len(vars),list(frags))
for f in glob.glob(D+'/*.html')+[D+'/ported.css']:
    s=open(f).read()
    s=s.replace('/node_modules/material-icon-theme/icons/','/icons/').replace('url(mark.svg)','url(/app-mark.svg)').replace('url(mark-dot.svg)','url(/app-mark-dot.svg)')
    open(f,'w').write(s)

open(D+'/sizes.json','w').write(json.dumps(sizes))
print(sizes)
import subprocess; subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'namespace.py')], check=True)
