<script>
  import { onMount } from "svelte";

  /** @type {"top" | "bottom"} */
  let { mode = "top", falloffPower = 1.3 } = $props();

  /** @type {HTMLCanvasElement} */
  let canvas;

  onMount(() => {
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;

    function createStarTexture() {
      const texCanvas = document.createElement("canvas");
      const size = 128;
      const cols = 4;
      const rows = 4;
      texCanvas.width = size * cols;
      texCanvas.height = size * rows;
      const ctx = texCanvas.getContext("2d");

      const symbols = ["✮", "✦", "✧", "★", "✶", "⊹", "✦", "✧"];

      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillRect(0, 0, texCanvas.width, texCanvas.height);
      ctx.font = "64px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";

      for (let i = 0; i < symbols.length; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        ctx.fillText(symbols[i], col * size + size / 2, row * size + size / 2);
      }

      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        texCanvas,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return texture;
    }

    const vsSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        v_uv.y = 1.0 - v_uv.y;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_seed;
      uniform sampler2D u_starTex;
      uniform float u_desktop;
      uniform vec2 u_mouse;
      const float u_falloffPower = ${falloffPower.toFixed(2)};

      float hash(vec2 p) {
        p = fract((p + vec2(u_seed, u_seed * 1.618)) * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      vec4 renderDrip(vec2 cellId, vec2 cellUv, vec2 gridCount, float distFromEdge, float edgeDist) {
        float drift = u_time * 0.1;
        float primaryDrip = noise(vec2(cellId.x * 0.08 + u_seed * 0.1, 0.5 + drift));
        float secondaryDrip = noise(vec2(cellId.x * 0.22 + u_seed * 0.2, 1.8 + drift)) * 0.35;

        float dripMaxRows = (primaryDrip + secondaryDrip) * 6.0;

        float regionAlpha = 1.0 - smoothstep(dripMaxRows - 1.0, dripMaxRows + 1.0, distFromEdge);

        if (regionAlpha > 0.001) {
          float holeNoise = noise(cellId * 0.25 + vec2(u_seed + drift, 0.0));
          float holeAlpha = smoothstep(0.23, 0.33, holeNoise);
          if (holeAlpha <= 0.001) return vec4(0.0);

          float edgeSoften = mix(1.0, 0.25, edgeDist);
          float effectivePower = mix(u_falloffPower, u_falloffPower * edgeSoften, u_desktop);

          float depthNormalized = distFromEdge / dripMaxRows;
          float falloff = pow(1.0 - depthNormalized, effectivePower);

          float tipSparsity = hash(cellId + 4.12);
          float tipAlpha = 1.0 - smoothstep(falloff + 0.03, falloff + 0.13, tipSparsity);
          if (tipAlpha <= 0.001) return vec4(0.0);

          float charSeed = hash(cellId * 0.5 + vec2(u_seed, 0.0));
          float charIndex = floor(charSeed * 16.0);
          float colIndex = mod(charIndex, 4.0);
          float rowIndex = floor(charIndex / 4.0);
          vec2 atlasUv = (cellUv + vec2(colIndex, rowIndex)) * 0.25;

          vec4 texColor = texture2D(u_starTex, atlasUv);
          if (texColor.a < 0.01) return vec4(0.0);

          float colSpeed = 0.15 + hash(vec2(cellId.x, 7.0)) * 0.2;
          float colPhase = hash(vec2(cellId.x, 2.4)) * 10.0;
          float dripPhase = fract(colPhase - cellId.y * 0.12 + u_time * colSpeed);
          float glint = pow(cos(dripPhase * 6.28318) * 0.5 + 0.5, 6.0);
          float calmPulse = mix(0.15, 0.9, glint);

          float finalBrightness = calmPulse * falloff;
          vec3 baseTint = mix(vec3(0.88, 0.94, 1.0), vec3(1.0, 1.0, 1.0), hash(cellId + 3.1));
          vec3 starColor = baseTint * texColor.rgb * finalBrightness;

          float entryAlpha = regionAlpha * holeAlpha * tipAlpha;
          return vec4(starColor, texColor.a * falloff * mix(0.35, 1.0, calmPulse) * entryAlpha);
        }
        return vec4(0.0);
      }

      void main() {
        float cellSize = 28.0;
        vec2 gridCount = u_resolution / cellSize;
        vec2 st = vec2(v_uv.x * gridCount.x, v_uv.y * gridCount.y);
        vec2 cellId = floor(st);
        vec2 cellUv = fract(st);

        float distFromEdge = u_seed > -999.0 && ${mode === "top" ? "true" : "false"}
          ? cellId.y
          : (gridCount.y - 1.0) - cellId.y;

        float edgeDist = abs(v_uv.x - 0.5) * 2.0;
        vec4 finalColor = renderDrip(cellId, cellUv, gridCount, distFromEdge, edgeDist);

        float mouseDist = length(v_uv * u_resolution - u_mouse);
        float mouseGlow = smoothstep(140.0, 0.0, mouseDist);
        finalColor.rgb += finalColor.rgb * mouseGlow * 1.5;
        finalColor.a = clamp(finalColor.a + finalColor.a * mouseGlow * 0.6, 0.0, 1.0);

        if (finalColor.a < 0.001) discard;
        gl_FragColor = finalColor;
      }
    `;

    function createShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1i(gl.getUniformLocation(program, "u_starTex"), 0);
    createStarTexture();

    const resLocation = gl.getUniformLocation(program, "u_resolution");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const seedLocation = gl.getUniformLocation(program, "u_seed");
    const desktopLocation = gl.getUniformLocation(program, "u_desktop");
    const mouseLocation = gl.getUniformLocation(program, "u_mouse");
    gl.uniform1f(seedLocation, Math.random() * 100.0);

    let mouseX = -10000;
    let mouseY = -10000;
    function handlePointerMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    }
    if (mode === "bottom") {
      window.addEventListener("pointermove", handlePointerMove);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resLocation, canvas.width, canvas.height);
      gl.uniform1f(desktopLocation, window.innerWidth >= 900 ? 1.0 : 0.0);
    }
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let raf;
    function render(time) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(timeLocation, time * 0.001);
      gl.uniform2f(mouseLocation, mouseX, mouseY);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (mode === "bottom") {
        window.removeEventListener("pointermove", handlePointerMove);
      }
    };
  });
</script>

<canvas bind:this={canvas} class="star-field"></canvas>

<style>
  .star-field {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
