// One number t (0 night -> 1 day) drives every color. Shader sky + rotating star field.
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const smooth = (x) => ((x = clamp(x, 0, 1)), x * x * (3 - 2 * x));
export const lerp = (a, b, t) => a + (b - a) * t;

const hex = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const CF = ["top", "mid", "hor", "cs", "cl", "gc"];
const KEYS = [
  { t: 0.0, top: "#05071a", mid: "#0b1130", hor: "#1a2150", cs: "#070a1f", cl: "#222a5e", cov: 0.5, glow: 0, gc: "#ff9f7a" },
  { t: 0.22, top: "#0b1033", mid: "#222a63", hor: "#47468c", cs: "#121641", cl: "#6a5fa0", cov: 0.55, glow: 0.1, gc: "#ff9f7a" },
  { t: 0.42, top: "#262a74", mid: "#6a58a6", hor: "#cf8a96", cs: "#34296d", cl: "#e8a090", cov: 0.58, glow: 0.28, gc: "#f0a08a" },
  { t: 0.58, top: "#6f72c4", mid: "#c98ab0", hor: "#e6a58f", cs: "#7e5ca0", cl: "#efbea2", cov: 0.55, glow: 0.34, gc: "#f2b49c" },
  { t: 0.8, top: "#5683c4", mid: "#98b3d6", hor: "#c9cfdc", cs: "#7f90b8", cl: "#f3e9e3", cov: 0.58, glow: 0.1, gc: "#efc4aa" },
  { t: 1.0, top: "#3f7cc6", mid: "#7fb0e2", hor: "#bcd4ea", cs: "#6d86b4", cl: "#fbf8f5", cov: 0.62, glow: 0, gc: "#dfe9f4" },
].map((k) => ({ ...k, ...Object.fromEntries(CF.map((f) => [f, hex(k[f])])) }));

export function sample(t) {
  t = clamp(t, 0, 1);
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1].t) i++;
  const a = KEYS[i], b = KEYS[i + 1], u = smooth((t - a.t) / (b.t - a.t));
  const o = Object.fromEntries(CF.map((f) => [f, a[f].map((v, j) => lerp(v, b[f][j], u))]));
  o.cov = lerp(a.cov, b.cov, u);
  o.glow = lerp(a.glow, b.glow, u);
  return o;
}

export const skyName = (t) =>
  t < 0.12 ? "night" : t < 0.32 ? "blue hour" : t < 0.5 ? "pre-dawn" : t < 0.7 ? "first light" : t < 0.9 ? "morning" : "day";

const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}";
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;uniform float uTime;uniform float uScroll;uniform vec2 uPtr;
uniform vec3 uTop;uniform vec3 uMid;uniform vec3 uHor;uniform vec3 uCS;uniform vec3 uCL;uniform vec3 uGC;uniform float uCov;uniform float uGlow;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);float a=hash(i);float b=hash(i+vec2(1.0,0.0));float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.0;float a=0.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){v+=a*noise(p);p=m*p;a*=0.5;}return v;}
void main(){
 vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;float y=uv.y;
 vec3 col=mix(uHor,uMid,smoothstep(0.0,0.55,y));col=mix(col,uTop,smoothstep(0.3,1.0,y));
 vec2 g=vec2((uv.x-0.5)*asp*0.6,(y+0.04)*1.5);col+=uGC*exp(-dot(g,g)*3.2)*uGlow*0.7;
 vec2 g2=vec2((uv.x-0.5)*asp*0.9,y*3.6);col+=uGC*exp(-dot(g2,g2)*1.5)*uGlow*0.45;
 float inv=1.0/(y*1.15+0.10);
 float mo=0.5+0.5*sin(uTime*0.1);
 float vis=1.0-smoothstep(0.55,1.05,y);
 for(int L=0;L<2;L++){
  float fl=float(L);
  vec2 cp=vec2((uv.x-0.5)*asp*inv*0.5*(1.0-0.35*fl)+uTime*(0.02+0.0125*fl)+uPtr.x*(0.04+0.03*fl),inv*(0.85-0.2*fl)-uScroll*(0.5+0.25*fl)-uTime*0.006)+vec2(fl*6.3,fl*2.1);
  vec2 w=vec2(fbm(cp*0.8+vec2(uTime*0.035,uTime*0.025)),fbm(cp*0.8+vec2(5.2,1.3)-vec2(uTime*0.025,uTime*0.03)));
  vec2 cq=cp*1.25+(w-0.5)*0.9;
  vec2 o=vec2(0.0,0.07);
  float d=mix(fbm(cq+vec2(3.1,1.7)),fbm(cq*1.07+vec2(9.4,2.3)+uTime*0.02),mo);
  float d2=mix(fbm(cq+o+vec2(3.1,1.7)),fbm((cq+o)*1.07+vec2(9.4,2.3)+uTime*0.02),mo);
  float cv=uCov-0.07*fl;
  float cover=smoothstep(1.0-cv,1.0-cv+0.26,d);
  float lit=clamp((d-d2)*6.0+0.42,0.0,1.0);
  float core=smoothstep(1.0-cv+0.1,1.0-cv+0.5,d);
  float rim=cover*(1.0-smoothstep(0.25,0.8,cover));
  vec3 cc=mix(uCS,uCL,lit*(0.4+0.6*(1.0-y)));
  cc=mix(cc,uCS,core*0.35);
  cc=mix(cc,uGC,exp(-y*4.5)*uGlow*0.45);
  cc+=uGC*rim*(0.1+uGlow)*0.55;
  col=mix(col,cc,cover*vis*(0.92-0.3*fl));
 }
 vec2 q=(uv-vec2(0.5))*vec2(1.0,1.25);col*=1.0-0.22*dot(q,q);
 col+=(hash(gl_FragCoord.xy)-0.5)/255.0*1.5;
 gl_FragColor=vec4(col,1.0);}`;

export function makeSky(canvas, scale) {
  let gl = null;
  try { gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" }); } catch {}
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(r.width * scale));
    canvas.height = Math.max(2, Math.round(r.height * scale));
  };
  if (!gl) {
    // no WebGL: flat gradient from the same keys
    const c = (v) => `rgb(${v.map((x) => Math.round(x * 255))})`;
    return { resize, draw: (s) => (canvas.style.background = `linear-gradient(to top,${c(s.hor)} 0%,${c(s.mid)} 55%,${c(s.top)} 100%)`) };
  }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return { resize, draw() {} };
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(
    ["uRes", "uTime", "uScroll", "uPtr", "uTop", "uMid", "uHor", "uCS", "uCL", "uGC", "uCov", "uGlow"].map((n) => [n, gl.getUniformLocation(pr, n)]),
  );
  return {
    resize,
    draw(s, time, scroll, px, py) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uScroll, scroll);
      gl.uniform2f(U.uPtr, px, py);
      gl.uniform3fv(U.uTop, s.top); gl.uniform3fv(U.uMid, s.mid); gl.uniform3fv(U.uHor, s.hor);
      gl.uniform3fv(U.uCS, s.cs); gl.uniform3fv(U.uCL, s.cl); gl.uniform3fv(U.uGC, s.gc);
      gl.uniform1f(U.uCov, s.cov); gl.uniform1f(U.uGlow, s.glow);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}

// Falloff stops that ease out (never a straight ramp), so halos have no visible edge.
function halo(ctx, x, y, r, c, a) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  for (let i = 0; i <= 8; i++) { const t = i / 8, f = 1 - t * t * (3 - 2 * t); g.addColorStop(t, `rgba(${c},${(a * f * f).toFixed(3)})`); }
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// A rigid sky turning about a celestial pole; a few bright stars get a soft halo.
export function makeStars(canvas, density, poleX, poleY, reduce) {
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1, px0 = 0, py0 = 0, stars = [], shoot = null, nextShoot = 9 + Math.random() * 8;
  function build() {
    px0 = W * poleX; py0 = H * poleY; stars = [];
    const R = Math.max(Math.hypot(px0, py0), Math.hypot(W - px0, py0), Math.hypot(px0, H - py0), Math.hypot(W - px0, H - py0));
    const n = Math.min(1300, Math.round((Math.PI * R * R) / density));
    for (let i = 0; i < n; i++) {
      const m = Math.pow(Math.random(), 3.2), w = Math.random();
      stars.push({
        r: R * Math.sqrt(Math.random()), a: Math.random() * 6.2832, m,
        s: 0.3 + m * 0.7, al: 0.1 + m * 0.5,
        c: w < 0.3 ? [255, 226, 205] : w < 0.65 ? [255, 246, 238] : [205, 220, 255],
        z: 0.3 + 0.7 * Math.min(1, m * 1.4 + Math.random() * 0.35), ph: Math.random() * 6.28, bokeh: false, sp: 0.5 + Math.random() * 1.6,
      });
      const t = stars[stars.length - 1];
      t.s *= 0.6 + 0.9 * t.z * t.z; t.al *= 0.45 + 0.7 * t.z;
    }
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    build();
  }
  function draw(vis, time, rot, px, py, dt, sy = 0) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (vis < 0.01) return;
    for (const s of stars) {
      // depth: z 0 = far, 1 = near. near stars turn faster, shift more with pointer and scroll
      const z = s.z, k = rot * (0.25 + 1.75 * z), ca = Math.cos(s.a + k), sa = Math.sin(s.a + k);
      // far away: only the slow turn moves them, no pointer parallax and no scroll shift
      const x = px0 + s.r * ca;
      const y = py0 + s.r * sa;
      const hr0 = s.s * 9;
      if (x < -hr0 - 6 || x > W + hr0 + 6 || y < -hr0 - 6 || y > H + hr0 + 6) continue;
      const fade = 1 - smooth((y / H - 0.5) / 0.42);
      if (fade <= 0) continue;
      const tw = reduce ? 1 : 0.82 + 0.18 * Math.sin(time * s.sp + s.ph);
      const day = Math.max(0, vis - 1) / 0.9; // 0 at night, 1 in full day: every star gets a lift and a little size so it reads on the light sky
      const a = Math.min(1, (s.al * vis + day * (0.2 + 0.4 * z)) * tw * fade), c = s.c, sz = s.s * (1 + day * 0.7);
      if (s.m > 0.55 || z > 0.8) halo(ctx, x, y, s.s * (3 + z * 4), c, a * 0.35);
      ctx.fillStyle = `rgba(${c},${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, sz, 0, 6.2832); ctx.fill();
    }
    if (!reduce && vis > 0.5) {
      nextShoot -= dt;
      if (!shoot && nextShoot <= 0) {
        shoot = { x: W * (0.3 + Math.random() * 0.6), y: H * (0.04 + Math.random() * 0.2), age: 0 };
        nextShoot = 14 + Math.random() * 14;
      }
      if (shoot) {
        shoot.age += dt;
        const u = shoot.age / 0.9;
        if (u >= 1) shoot = null;
        else {
          const hx = shoot.x - u * H * 0.55, hy = shoot.y + u * H * 0.3, tx = hx + 120, ty = hy - 66;
          const g = ctx.createLinearGradient(hx, hy, tx, ty);
          g.addColorStop(0, `rgba(255,244,234,${(0.9 * (1 - u) * vis).toFixed(3)})`);
          g.addColorStop(1, "rgba(255,244,234,0)");
          ctx.strokeStyle = g; ctx.lineWidth = 1.4;
          ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty); ctx.stroke();
        }
      }
    }
  }
  return { resize, draw };
}
