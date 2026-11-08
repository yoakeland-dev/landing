function gather(pick){
  const frags={};const sizes={};
  for(const [k,sel] of Object.entries(pick)){const e=document.querySelector(sel); if(!e){console.log('missing '+k);continue}
    const c=e.cloneNode(true);
    c.querySelectorAll('script').forEach(x=>x.remove());
    frags[k]=c.outerHTML;const r=e.getBoundingClientRect();sizes[k]=[Math.round(r.width),Math.round(r.height)];}
  const classes=new Set(); for(const h of Object.values(frags)){for(const m of h.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).forEach(c=>c&&classes.add(c));}
  const rules={}; const vars={};
  const rootStyle=getComputedStyle(document.documentElement);
  const addVar=n=>{if(!(n in vars)){vars[n]=rootStyle.getPropertyValue(n).trim()}};
  for(let i=0;i<document.documentElement.style.length;i++){const n=document.documentElement.style[i]; if(n.startsWith('--')) addVar(n)}
  const prefixPart=p=>'.yk '+p.trim();
  const keepPart=p=>{ if(/(^|[\s>+~])(html|body|:root)\b/.test(p)||p.includes(':root')) return false; const toks=[...p.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(m=>m[1]); if(!toks.length) return false; return toks.every(t=>classes.has(t)); };
  const split=sel=>{const out=[];let d=0,cur='';for(const ch of sel){if(ch==='(')d++;if(ch===')')d--;if(ch===','&&d===0){out.push(cur);cur=''}else cur+=ch}out.push(cur);return out};
  const conv=(sel)=>split(sel).filter(keepPart).map(prefixPart).join(',');
  const walk=(rs)=>{let out='';for(const r of rs){
    if(r.type===1){ for(const n of r.style) if(n.startsWith('--')&&/:root/.test(r.selectorText)) addVar(n); const s=conv(r.selectorText); if(s) out+=s+'{'+r.style.cssText.replace(/\s*\n\s*/g,' ')+'}\n'; }
    else if(r.type===7){out+=r.cssText.replace(/\s*\n\s*/g,' ')+'\n'}
    else if(r.cssRules&&r.cssText&&/^@(media|supports|container|layer)/.test(r.cssText)){const pre=r.cssText.slice(0,r.cssText.indexOf('{')).trim(); const inner=walk(r.cssRules).replace(/\n/g,' '); if(inner) out+=pre+'{'+inner+'}\n'}
  } return out;};
  for(const sh of document.styleSheets){ try{ const t=walk(sh.cssRules); if(t) rules[(sh.ownerNode&&sh.ownerNode.getAttribute&&sh.ownerNode.getAttribute('data-sveltekit-style'))||('s'+Math.random().toString(36).slice(2))]=t }catch{} }
  // also vars referenced in kept rules that live on :root only: pull every custom property defined in any :root rule
  return {frags,rules,vars,sizes};
}
