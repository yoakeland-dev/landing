// node grab.mjs scenes.json out.json ; scene: {url,w,h,mobile,prep,pick:{name:selector}}
import {spawn} from 'node:child_process'; import fs from 'node:fs';
const scenes=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const prof='/tmp/claude-1000/grab-prof-'+process.pid;
const ch=spawn('/usr/bin/helium-browser',['--headless=new','--user-data-dir='+prof,'--remote-debugging-port=9334','--no-first-run'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(let i=0;i<50;i++){try{await (await fetch('http://127.0.0.1:9334/json/version')).json();break}catch{await sleep(200)}}
const tgt=await (await fetch('http://127.0.0.1:9334/json/new?about:blank',{method:'PUT'})).json();
const ws=new WebSocket(tgt.webSocketDebuggerUrl); await new Promise(r=>ws.onopen=r);
let id=0; const pend=new Map(); ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const ev=async js=>{const r=await send('Runtime.evaluate',{expression:js,awaitPromise:true,returnByValue:true});if(r.result?.exceptionDetails)console.log('ERR',JSON.stringify(r.result.exceptionDetails).slice(0,400));return r.result?.result?.value};
const GATHER=fs.readFileSync(new URL('./gather.js',import.meta.url),'utf8');
const out={frags:{},rules:{},vars:{},sizes:{}};
for(const s of scenes){
  await send('Emulation.setDeviceMetricsOverride',{width:s.w,height:s.h,deviceScaleFactor:1,mobile:!!s.mobile});
  await send('Page.navigate',{url:'about:blank'}); await send('Page.navigate',{url:s.url}); await sleep(3500);
  await ev(`(()=>{const o=JSON.parse(localStorage['yoake.settings']||'{}');if(!o.onboarded){o.onboarded=true;localStorage['yoake.settings']=JSON.stringify(o);location.reload()}})()`);
  await sleep(3500);
  await ev(`(async()=>{for(const b of document.querySelectorAll('button')) if(b.textContent.trim()==='Got it') b.click(); window.__app&&(window.__app.toasts=[],window.__app.notifications=[]);})()`);
  if(s.prep){await ev(s.prep); await sleep(s.wait||1200);}
  const r=await ev(`(()=>{${GATHER}; return JSON.stringify(gather(${JSON.stringify(s.pick)}))})()`);
  if(!r){console.log('fail',Object.keys(s.pick));continue}
  const g=JSON.parse(r); Object.assign(out.frags,g.frags); Object.assign(out.rules,g.rules); Object.assign(out.vars,g.vars);Object.assign(out.sizes,g.sizes);
  console.log(Object.entries(g.frags).map(([k,v])=>k+':'+v.length).join(' '));
}
fs.writeFileSync(process.argv[3],JSON.stringify(out)); ch.kill(); process.exit(0);
