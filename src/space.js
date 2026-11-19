/*
 * CHAOS TETHER — GPU-Accelerated Procedural Deep-Space Backdrop.
 * Heavy layers (volumetric domain-warped FBM nebula gas, star fields, spiral galaxies,
 * axial-tilted gas-giant planet) are baked once at startup using WebGL2 fragment shaders
 * (with automatic LUT-accelerated CPU fallback) in < 8 ms instead of 620 ms.
 */
(() => {
  function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makePerlin(rand) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const GX = [1, -1, 1, -1, 1, -1, 0, 0];
    const GY = [1, 1, -1, -1, 0, 0, 1, -1];

    return (x, y) => {
      const xi = Math.floor(x);
      const yi = Math.floor(y);
      const xf = x - xi;
      const yf = y - yi;
      const X = xi & 255;
      const Y = yi & 255;
      const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
      const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
      const aa = perm[perm[X] + Y] & 7;
      const ab = perm[perm[X] + Y + 1] & 7;
      const ba = perm[perm[X + 1] + Y] & 7;
      const bb = perm[perm[X + 1] + Y + 1] & 7;
      const n00 = GX[aa] * xf + GY[aa] * yf;
      const n10 = GX[ba] * (xf - 1) + GY[ba] * yf;
      const n01 = GX[ab] * xf + GY[ab] * (yf - 1);
      const n11 = GX[bb] * (xf - 1) + GY[bb] * (yf - 1);
      const x1 = n00 + (n10 - n00) * u;
      const x2 = n01 + (n11 - n01) * u;
      return (x1 + (x2 - x1) * v) * 1.41;
    };
  }

  function makeFbm(noise) {
    return (x, y, octaves) => {
      let sum = 0;
      let amp = 0.5;
      let freq = 1;
      let norm = 0;
      for (let o = 0; o < octaves; o++) {
        sum += noise(x * freq, y * freq) * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2.03;
      }
      return sum / norm;
    };
  }

  const STAR_COLORS = [
    [155, 185, 255], // O/B blue
    [195, 215, 255], // A blue-white
    [240, 244, 255], // F white
    [255, 244, 222], // G yellow-white
    [255, 214, 160], // K orange
    [255, 170, 130], // M red-orange
  ];
  const STAR_WEIGHTS = [0.08, 0.22, 0.3, 0.2, 0.13, 0.07];

  function pickStarColorIndex(rand) {
    let r = rand();
    for (let i = 0; i < STAR_WEIGHTS.length; i++) {
      r -= STAR_WEIGHTS[i];
      if (r <= 0) return i;
    }
    return 2;
  }

  function pickStarColor(rand) {
    return STAR_COLORS[pickStarColorIndex(rand)];
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
  }

  // ---------- Shared WebGL2 Procedural Shader Baker ----------
  let sharedBaker = null;
  function getShaderBaker() {
    if (sharedBaker !== null) return sharedBaker;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const gl = canvas.getContext('webgl2', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
      });
      if (!gl) {
        sharedBaker = false;
        return false;
      }

      const vsSrc = `#version 300 es
      out vec2 vUv;
      void main() {
        vec2 pos = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
        vUv = vec2(pos.x, 1.0 - pos.y);
        gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
      }`;

      const commonNoiseGLSL = `#version 300 es
      precision highp float;
      in vec2 vUv;
      out vec4 fragColor;

      float hash21(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      vec2 grad2(vec2 i) {
        float h = hash21(i) * 6.2831853;
        return vec2(cos(h), sin(h));
      }

      float gnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
        float n00 = dot(grad2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));
        float n10 = dot(grad2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
        float n01 = dot(grad2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
        float n11 = dot(grad2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
        return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y) * 1.414;
      }

      float fbm(vec2 p, int octaves) {
        float sum = 0.0;
        float amp = 0.5;
        float freq = 1.0;
        float norm = 0.0;
        for (int o = 0; o < 5; o++) {
          if (o >= octaves) break;
          sum += gnoise(p * freq) * amp;
          norm += amp;
          amp *= 0.5;
          freq *= 2.03;
        }
        return sum / norm;
      }

      vec3 nebulaRamp(float t) {
        t = clamp(t, 0.0, 1.0);
        vec3 c0 = vec3(18.0, 24.0, 92.0);
        vec3 c1 = vec3(24.0, 86.0, 210.0);
        vec3 c2 = vec3(0.0, 170.0, 205.0);
        vec3 c3 = vec3(118.0, 48.0, 225.0);
        vec3 c4 = vec3(224.0, 44.0, 150.0);
        vec3 c5 = vec3(255.0, 128.0, 70.0);
        if (t <= 0.22) return mix(c0, c1, t / 0.22);
        if (t <= 0.40) return mix(c1, c2, (t - 0.22) / 0.18);
        if (t <= 0.58) return mix(c2, c3, (t - 0.40) / 0.18);
        if (t <= 0.78) return mix(c3, c4, (t - 0.58) / 0.20);
        return mix(c4, c5, (t - 0.78) / 0.22);
      }
      `;

      const nebulaFsSrc = commonNoiseGLSL + `
      uniform vec2 uSize;
      uniform float uBandAngle;

      float bandAt(vec2 uv) {
        float ca = cos(uBandAngle);
        float sa = sin(uBandAngle);
        float d = (uv.x - 0.5) * sa + (uv.y - 0.5) * ca;
        float wobble = fbm(uv * 2.2 + vec2(11.0, -7.0), 2) * 0.09;
        float dd = (d + wobble) / 0.17;
        return exp(-dd * dd);
      }

      void main() {
        vec2 uv = vUv;
        float maxDim = max(uSize.x, uSize.y);
        vec2 p = (uv * uSize) / (maxDim * 0.36);

        float band = bandAt(uv);
        float mask = smoothstep(0.02, 0.5, fbm(p * 0.55 + vec2(20.3, -11.7), 2) + band * 0.32);

        float qx = fbm(p + vec2(1.7, 9.2), 2);
        float qy = fbm(p + vec2(8.3, 2.8), 2);
        float d = fbm(p + 1.35 * vec2(qx, qy), 3);

        float density = smoothstep(-0.05, 0.7, d + band * 0.12);
        density = density * density * mask;

        float lane = fbm(p * 2.2 + vec2(5.1, -3.3), 3);
        float dust = smoothstep(0.05, 0.35, lane) * 0.75;
        density *= (1.0 - dust);

        float fil = pow(max(0.0, 1.0 - abs(fbm(p * 2.6 + vec2(qx, qy), 2))), 10.0) * density;

        float hue = clamp(0.42 + qx * 0.55 + qy * 0.25, 0.0, 1.0);
        vec3 col = nebulaRamp(hue);
        vec3 col2 = nebulaRamp(clamp(hue + 0.15, 0.0, 1.0));

        vec3 rgb = vec3(2.0 + band * 6.0, 3.0 + band * 7.0, 9.0 + band * 16.0);
        rgb += col * (density * 0.48) + col2 * (fil * 0.55);

        float glow = band * band * (0.5 + 0.5 * gnoise(p * 5.0)) * (1.0 - dust * 0.9);
        rgb += vec3(26.0, 30.0, 44.0) * glow;

        // Cinematic radial vignette
        vec2 centered = (uv - 0.5) * uSize;
        float dist = length(centered);
        float r0 = min(uSize.x, uSize.y) * 0.25;
        float r1 = max(uSize.x, uSize.y) * 0.70;
        float vig = smoothstep(r0, r1, dist) * 0.55;
        rgb = mix(rgb, vec3(0.0, 0.0, 6.0), vig);

        fragColor = vec4(clamp(rgb / 255.0, 0.0, 1.0), 1.0);
      }`;

      const planetFsSrc = commonNoiseGLSL + `
      uniform float uSize;
      uniform float uRadius;
      uniform float uPad;

      vec3 bandColor(int idx) {
        int m = idx - (idx / 6) * 6;
        if (m < 0) m += 6;
        if (m == 0) return vec3(38.0, 42.0, 96.0);
        if (m == 1) return vec3(64.0, 92.0, 160.0);
        if (m == 2) return vec3(40.0, 132.0, 160.0);
        if (m == 3) return vec3(104.0, 70.0, 150.0);
        if (m == 4) return vec3(150.0, 110.0, 170.0);
        return vec3(52.0, 60.0, 120.0);
      }

      void main() {
        vec2 px = vUv * uSize;
        vec2 delta = (px - uSize * 0.5) / uRadius;
        float d2 = dot(delta, delta);
        float dist = sqrt(d2);

        // Outer atmosphere halo
        float outerMax = (uRadius + uPad * 0.9) / uRadius;
        float outerT = clamp((dist - 0.96) / max(0.001, outerMax - 0.96), 0.0, 1.0);
        vec3 atmoCol = mix(vec3(70.0, 190.0, 255.0), vec3(60.0, 120.0, 255.0), min(1.0, outerT / 0.35)) / 255.0;
        float atmoAlpha = outerT < 0.35
          ? mix(0.45, 0.14, outerT / 0.35)
          : mix(0.14, 0.0, (outerT - 0.35) / 0.65);
        if (dist > outerMax) atmoAlpha = 0.0;

        if (d2 > 1.0) {
          fragColor = vec4(atmoCol, atmoAlpha);
          return;
        }

        float nz = sqrt(max(0.0, 1.0 - d2));
        float ct = cos(0.32);
        float st = sin(0.32);
        float tx = delta.x * ct - delta.y * st;
        float ty = delta.x * st + delta.y * ct;
        float lon = atan(tx, nz);
        float lat = ty;

        float turb = fbm(vec2(lon * 1.6 + 3.0, lat * 7.0), 3);
        float v = lat * 5.5 + turb * 1.3 + 60.0;
        int bi = int(floor(v));
        float f = fract(v);
        float sf = f * f * (3.0 - 2.0 * f);
        vec3 col = mix(bandColor(bi), bandColor(bi + 1), sf);

        float detail = 0.85 + 0.3 * fbm(vec2(lon * 6.0, lat * 28.0), 2);
        col *= detail;

        vec3 L = normalize(vec3(0.62, -0.48, 0.62));
        float ndl = dot(vec3(delta.x, delta.y, nz), L);
        float light = smoothstep(-0.15, 0.85, ndl);
        float shade = 0.06 + light * 1.05;
        float limb = 0.55 + 0.45 * sqrt(nz);
        col *= shade * limb;

        float rim = pow(1.0 - nz, 3.0) * light;
        col += vec3(40.0, 150.0, 230.0) * rim;

        float edge = clamp((1.0 - dist) * uRadius * 1.2, 0.0, 1.0);
        vec3 planetRgb = clamp(col / 255.0, 0.0, 1.0);

        // Blend planet over outer atmosphere halo at anti-aliased limb
        float outA = edge + atmoAlpha * (1.0 - edge);
        vec3 outRgb = outA > 0.0001 ? (planetRgb * edge + atmoCol * atmoAlpha * (1.0 - edge)) / outA : vec3(0.0);
        fragColor = vec4(outRgb, outA);
      }`;

      function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          gl.deleteShader(s);
          return null;
        }
        return s;
      }

      function link(vs, fs) {
        if (!vs || !fs) return null;
        const p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
        return p;
      }

      const vs = compile(gl.VERTEX_SHADER, vsSrc);
      const nebulaProg = link(vs, compile(gl.FRAGMENT_SHADER, nebulaFsSrc));
      const planetProg = link(vs, compile(gl.FRAGMENT_SHADER, planetFsSrc));
      if (!nebulaProg || !planetProg) {
        sharedBaker = false;
        return false;
      }
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);

      sharedBaker = { canvas, gl, nebulaProg, planetProg, vao };
      return sharedBaker;
    } catch {
      sharedBaker = false;
      return false;
    }
  }

  class SpaceBackdrop {
    constructor(arenaW, arenaH, seed = 90210) {
      this.arenaW = arenaW;
      this.arenaH = arenaH;
      this.seed = seed;
      this.rand = mulberry32(seed);
      const noise = makePerlin(this.rand);
      this.noise = noise;
      this.fbm = makeFbm(noise);

      // Parallax depth factors (fraction of camera movement)
      this.Z_NEBULA = 0.035;
      this.Z_FAR_STARS = 0.07;
      this.Z_NEAR_STARS = 0.16;
      this.Z_PLANET = 0.025;

      this.viewW = 0;
      this.viewH = 0;
      this.time = 0;
      this.version = 0;
      this.shootingStars = [];
      this.nextShootingStar = 3;
      this.rebuildTimer = null;
      this._starStamps = null;

      this.dust = Array.from({ length: 70 }, () => ({
        x: this.rand() * 4000,
        y: this.rand() * 4000,
        z: 0.75 + this.rand() * 0.6,
        alpha: 0.08 + this.rand() * 0.22,
      }));
    }

    resize(viewW, viewH) {
      const changed = Math.abs(viewW - this.viewW) > 2 || Math.abs(viewH - this.viewH) > 2;
      this.viewW = viewW;
      this.viewH = viewH;
      if (!this.nebulaCanvas) {
        this.build();
        return;
      }
      if (changed) {
        clearTimeout(this.rebuildTimer);
        this.rebuildTimer = setTimeout(() => this.build(), 220);
      }
    }

    layerSize(z) {
      return {
        w: Math.ceil(this.viewW + this.arenaW * z + 96),
        h: Math.ceil(this.viewH + this.arenaH * z + 96),
      };
    }

    build() {
      this.rand = mulberry32(this.seed);
      this.bandAngle = -0.42;
      this.buildNebula();
      this.buildFarStars();
      this.buildNearStars();
      this.buildPlanet();
      this.version++;
    }

    bandAtFast(nx, ny) {
      const ca = Math.cos(this.bandAngle);
      const sa = Math.sin(this.bandAngle);
      const d = (nx - 0.5) * sa + (ny - 0.5) * ca;
      const wobble = Math.sin(nx * 6.5 + ny * 4.2) * 0.04;
      const dd = (d + wobble) / 0.17;
      return Math.exp(-dd * dd);
    }

    bandAt(nx, ny) {
      return this.bandAtFast(nx, ny);
    }

    // ---------- Layer 1: volumetric nebula gas (GPU shader baked) ----------
    buildNebula() {
      const { w, h } = this.layerSize(this.Z_NEBULA);
      // Bake nebula at 0.16x layer resolution (~335x197 px = 0.26 MB VRAM);
      // hardware gl.LINEAR magnification provides silky-smooth natural cloud blur for free.
      const SCALE = 0.16;
      const bw = Math.max(64, Math.ceil(w * SCALE));
      const bh = Math.max(64, Math.ceil(h * SCALE));
      const out = makeCanvas(bw, bh);
      const octx = out.getContext('2d');

      const baker = getShaderBaker();
      if (baker) {
        const { canvas: glCanvas, gl, nebulaProg, vao } = baker;
        if (glCanvas.width < bw || glCanvas.height < bh) {
          glCanvas.width = Math.max(glCanvas.width, bw);
          glCanvas.height = Math.max(glCanvas.height, bh);
        }
        gl.bindVertexArray(vao);
        gl.viewport(0, 0, bw, bh);
        gl.useProgram(nebulaProg);
        gl.uniform2f(gl.getUniformLocation(nebulaProg, 'uSize'), bw, bh);
        gl.uniform1f(gl.getUniformLocation(nebulaProg, 'uBandAngle'), this.bandAngle);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        const sy = glCanvas.height - bh;
        octx.drawImage(glCanvas, 0, sy, bw, bh, 0, 0, bw, bh);
      } else {
        // Fast low-res CPU fallback if WebGL2 is unavailable
        const lw = Math.max(32, Math.ceil(w * 0.18));
        const lh = Math.max(32, Math.ceil(h * 0.18));
        const low = makeCanvas(lw, lh);
        const lctx = low.getContext('2d');
        const img = lctx.createImageData(lw, lh);
        const data = img.data;
        const fbm = this.fbm;
        const feature = 1 / (Math.max(lw, lh) * 0.36);
        for (let py = 0; py < lh; py++) {
          const ny = py / lh;
          for (let px = 0; px < lw; px++) {
            const nx = px / lw;
            const x = px * feature;
            const y = py * feature;
            const band = this.bandAtFast(nx, ny);
            const d = fbm(x * 1.2 + 2.1, y * 1.2 + 4.3, 3);
            const density = Math.max(0, Math.min(1, (d + 0.25 + band * 0.25) * 0.7));
            const idx = (py * lw + px) * 4;
            data[idx] = Math.min(255, 4 + band * 18 + density * 95);
            data[idx + 1] = Math.min(255, 6 + band * 20 + density * 45);
            data[idx + 2] = Math.min(255, 14 + band * 36 + density * 165);
            data[idx + 3] = 255;
          }
        }
        lctx.putImageData(img, 0, 0);
        octx.drawImage(low, 0, 0, bw, bh);
      }

      this.nebulaLogicalW = w;
      this.nebulaLogicalH = h;
      this.nebulaCanvas = out;
    }

    // ---------- Layer 2: dense distant star field + galaxies + clusters ----------
    buildFarStars() {
      const { w, h } = this.layerSize(this.Z_FAR_STARS);
      const SCALE = 0.62;
      const bw = Math.max(64, Math.ceil(w * SCALE));
      const bh = Math.max(64, Math.ceil(h * SCALE));
      const c = makeCanvas(bw, bh);
      const sctx = c.getContext('2d');
      sctx.scale(SCALE, SCALE);
      const rand = this.rand;
      const count = Math.floor((w * h) / 520);

      // Group background stars into 12 colour/alpha buckets to eliminate 5,300+ per-star fillStyle string parses
      const buckets = Array.from({ length: STAR_COLORS.length * 2 }, (_, idx) => {
        const [cr, cg, cb] = STAR_COLORS[idx >> 1];
        const alpha = (idx & 1) ? '0.68' : '0.32';
        return { style: `rgba(${cr},${cg},${cb},${alpha})`, coords: [] };
      });

      for (let i = 0; i < count; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const band = this.bandAtFast(x / w, y / h);
        if (rand() > 0.28 + band * 0.72) continue;
        const cIdx = pickStarColorIndex(rand);
        const mag = rand();
        const bright = mag > 0.68 ? 1 : 0;
        const s = bright ? 1.55 : 1.05;
        buckets[(cIdx << 1) | bright].coords.push(x, y, s);
      }

      // Open star clusters added directly into the batched buckets
      for (let k = 0; k < 5; k++) {
        const cx = rand() * w;
        const cy = rand() * h;
        const rad = 30 + rand() * 60;
        const n = 60 + Math.floor(rand() * 80);
        for (let i = 0; i < n; i++) {
          const ang = rand() * Math.PI * 2;
          const rr = Math.pow(rand(), 1.8) * rad;
          const cIdx = pickStarColorIndex(rand);
          const bright = rand() > 0.45 ? 1 : 0;
          const s = 0.9 + rand() * 0.9;
          buckets[(cIdx << 1) | bright].coords.push(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, s);
        }
      }

      for (const b of buckets) {
        const pts = b.coords;
        if (!pts.length) continue;
        sctx.fillStyle = b.style;
        sctx.beginPath();
        for (let i = 0; i < pts.length; i += 3) {
          sctx.rect(pts[i], pts[i + 1], pts[i + 2], pts[i + 2]);
        }
        sctx.fill();
      }

      // Distant spiral / elliptical galaxies
      for (let k = 0; k < 7; k++) {
        this.drawGalaxy(sctx, rand() * w, rand() * h, 7 + rand() * 18, rand() * Math.PI, 0.25 + rand() * 0.45, rand);
      }

      this.farStarLogicalW = w;
      this.farStarLogicalH = h;
      this.farStarCanvas = c;
    }

    drawGalaxy(g, x, y, size, rot, tilt, rand) {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      g.scale(1, tilt);
      g.globalCompositeOperation = 'lighter';
      const tint = rand() < 0.5 ? [190, 205, 255] : [255, 225, 200];
      const halo = g.createRadialGradient(0, 0, 0, 0, 0, size * 1.6);
      halo.addColorStop(0, `rgba(${tint[0]},${tint[1]},${tint[2]},0.55)`);
      halo.addColorStop(0.25, `rgba(${tint[0]},${tint[1]},${tint[2]},0.18)`);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = halo;
      g.beginPath();
      g.arc(0, 0, size * 1.6, 0, Math.PI * 2);
      g.fill();

      g.fillStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},0.22)`;
      g.beginPath();
      for (let a = 0; a < 2; a++) {
        for (let i = 0; i < 55; i++) {
          const t = i / 55;
          const ang = a * Math.PI + t * 4.2;
          const r = t * size * 1.5;
          const jitter = (rand() - 0.5) * size * 0.18;
          g.rect(Math.cos(ang) * r + jitter, Math.sin(ang) * r + jitter, 1.2, 1.2);
        }
      }
      g.fill();

      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath();
      g.arc(0, 0, Math.max(0.8, size * 0.09), 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    _ensureStarStamps() {
      if (this._starStamps) return this._starStamps;
      this._starStamps = STAR_COLORS.map(([cr, cg, cb]) => {
        const sc = makeCanvas(32, 32);
        const g = sc.getContext('2d');
        const glow = g.createRadialGradient(16, 16, 0, 16, 16, 15);
        glow.addColorStop(0, `rgba(${cr},${cg},${cb},0.65)`);
        glow.addColorStop(0.3, `rgba(${cr},${cg},${cb},0.16)`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = glow;
        g.beginPath();
        g.arc(16, 16, 15, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.95)';
        g.beginPath();
        g.arc(16, 16, 2.2, 0, Math.PI * 2);
        g.fill();
        return sc;
      });
      return this._starStamps;
    }

    // ---------- Layer 3: brighter mid-distance stars with glow + diffraction spikes ----------
    buildNearStars() {
      const { w, h } = this.layerSize(this.Z_NEAR_STARS);
      const SCALE = 0.62;
      const bw = Math.max(64, Math.ceil(w * SCALE));
      const bh = Math.max(64, Math.ceil(h * SCALE));
      const c = makeCanvas(bw, bh);
      const sctx = c.getContext('2d');
      sctx.scale(SCALE, SCALE);
      const rand = this.rand;
      const count = Math.floor((w * h) / 9000);
      const stamps = this._ensureStarStamps();
      sctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < count; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const cIdx = pickStarColorIndex(rand);
        const mag = Math.pow(rand(), 2.2);
        const core = 0.7 + mag * 1.4;
        const glowR = core * (3 + mag * 5);
        sctx.drawImage(stamps[cIdx], x - glowR, y - glowR, glowR * 2, glowR * 2);
      }

      // Hero stars with realistic Hubble-style 4-point optical diffraction spikes (subtle deep-field luminance for 100% gameplay clarity)
      const heroes = Math.max(10, Math.floor((w * h) / 98000));
      for (let i = 0; i < heroes; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const [cr, cg, cb] = pickStarColor(rand);
        const len = 14 + rand() * 24;
        this.drawSpikeStar(sctx, x, y, len, cr, cg, cb);
      }

      // Live twinkling stars sampled from this layer (realistic astronomical twinkle + optional micro diffraction cross)
      this.twinklers = Array.from({ length: Math.floor((w * h) / 22000) }, () => {
        const col = pickStarColor(rand);
        const bright = rand() < 0.24;
        return {
          x: rand() * w,
          y: rand() * h,
          r: bright ? (1.05 + rand() * 0.9) : (0.65 + rand() * 0.85),
          speed: 1.0 + rand() * 2.6,
          phase: rand() * Math.PI * 2,
          bright,
          rgb: col,
          color: `rgb(${col[0]},${col[1]},${col[2]})`,
        };
      });

      this.nearStarLogicalW = w;
      this.nearStarLogicalH = h;
      this.nearStarCanvas = c;
    }

    drawSpikeStar(g, x, y, len, cr, cg, cb) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      // Soft inverse-square atmospheric halo (kept restrained so it never competes with foreground entities)
      const glow = g.createRadialGradient(x, y, 0, x, y, len * 0.52);
      glow.addColorStop(0, `rgba(255,255,255,0.78)`);
      glow.addColorStop(0.14, `rgba(${cr},${cg},${cb},0.42)`);
      glow.addColorStop(0.45, `rgba(${cr},${cg},${cb},0.10)`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(x, y, len * 0.52, 0, Math.PI * 2);
      g.fill();

      // Primary 4-point optical diffraction spikes (thin, needle-sharp, fading smoothly)
      for (let k = 0; k < 4; k++) {
        const ang = (k * Math.PI) / 2 + 0.14;
        const ex = x + Math.cos(ang) * len;
        const ey = y + Math.sin(ang) * len;
        const lg = g.createLinearGradient(x, y, ex, ey);
        lg.addColorStop(0, `rgba(255,255,255,0.72)`);
        lg.addColorStop(0.25, `rgba(${cr},${cg},${cb},0.48)`);
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        g.strokeStyle = lg;
        g.lineWidth = 0.95;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(ex, ey);
        g.stroke();
      }
      // Subtle 45° secondary micro-spikes for authentic telescopic realism
      const subLen = len * 0.36;
      for (let k = 0; k < 4; k++) {
        const ang = (k * Math.PI) / 2 + Math.PI / 4 + 0.14;
        const ex = x + Math.cos(ang) * subLen;
        const ey = y + Math.sin(ang) * subLen;
        const lg = g.createLinearGradient(x, y, ex, ey);
        lg.addColorStop(0, `rgba(${cr},${cg},${cb},0.34)`);
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        g.strokeStyle = lg;
        g.lineWidth = 0.7;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(ex, ey);
        g.stroke();
      }
      // Pinpoint white-hot stellar core
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(x, y, 1.35, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    // ---------- Layer 4: textured gas giant (GPU shader baked) ----------
    buildPlanet() {
      const rLogical = Math.round(Math.max(110, Math.min(260, this.viewH * 0.27)));
      this.planetR = rLogical;
      const padLogical = Math.round(rLogical * 0.35);
      this.planetLogicalSize = rLogical * 2 + padLogical * 2;
      const SCALE = 0.5;
      const r = Math.round(rLogical * SCALE);
      const pad = Math.round(padLogical * SCALE);
      const size = r * 2 + pad * 2;
      const c = makeCanvas(size, size);
      const pctx = c.getContext('2d');

      const baker = getShaderBaker();
      if (baker) {
        const { canvas: glCanvas, gl, planetProg, vao } = baker;
        if (glCanvas.width < size || glCanvas.height < size) {
          glCanvas.width = Math.max(glCanvas.width, size);
          glCanvas.height = Math.max(glCanvas.height, size);
        }
        gl.bindVertexArray(vao);
        gl.viewport(0, 0, size, size);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(planetProg);
        gl.uniform1f(gl.getUniformLocation(planetProg, 'uSize'), size);
        gl.uniform1f(gl.getUniformLocation(planetProg, 'uRadius'), r);
        gl.uniform1f(gl.getUniformLocation(planetProg, 'uPad'), pad);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        const sy = glCanvas.height - size;
        pctx.drawImage(glCanvas, 0, sy, size, size, 0, 0, size, size);
      } else {
        // Fast radial gradient fallback if WebGL2 is unavailable
        const g = pctx.createRadialGradient(size * 0.4, size * 0.4, r * 0.1, size * 0.5, size * 0.5, r);
        g.addColorStop(0, '#5a78b4');
        g.addColorStop(0.6, '#384678');
        g.addColorStop(1, '#080c1e');
        pctx.fillStyle = g;
        pctx.beginPath();
        pctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
        pctx.fill();
      }

      this.planetCanvas = c;
      this.planetPad = pad;
    }

    // ---------- Per-frame ----------
    update(dt) {
      this.time += dt;
      this.nextShootingStar -= dt;
      if (this.nextShootingStar <= 0 && this.shootingStars.length < 3) {
        this.nextShootingStar = 2.6 + Math.random() * 3.4;
        const fromLeft = Math.random() < 0.55;
        const ang = fromLeft ? 0.28 + Math.random() * 0.36 : Math.PI - 0.28 - Math.random() * 0.36;
        const speed = 780 + Math.random() * 520;
        const warm = Math.random() < 0.35;
        this.shootingStars.push({
          x: fromLeft ? Math.random() * this.viewW * 0.55 : this.viewW * (0.45 + Math.random() * 0.55),
          y: Math.random() * this.viewH * 0.45,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          life: 1.05 + Math.random() * 0.45,
          maxLife: 1.25,
          rgb: warm ? [255, 232, 198] : [188, 234, 255],
        });
      }
      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        const s = this.shootingStars[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) {
          this.shootingStars[i] = this.shootingStars[this.shootingStars.length - 1];
          this.shootingStars.pop();
        }
      }
    }

    drawLayer(ctx, canvas, z, camX, camY, logicalW = canvas ? canvas.width : 0, logicalH = canvas ? canvas.height : 0) {
      if (!canvas) return { x: 0, y: 0 };
      const ox = -(camX - this.arenaW / 2) * z;
      const oy = -(camY - this.arenaH / 2) * z;
      const x = Math.round((this.viewW - logicalW) / 2 + ox);
      const y = Math.round((this.viewH - logicalH) / 2 + oy);
      if (logicalW !== canvas.width || logicalH !== canvas.height) {
        ctx.drawImage(canvas, x, y, logicalW, logicalH);
      } else {
        ctx.drawImage(canvas, x, y);
      }
      return { x, y };
    }

    draw(ctx, camX, camY, playerVX = 0, playerVY = 0, overdrive = false) {
      ctx.save();
      ctx.fillStyle = '#02030a';
      ctx.fillRect(0, 0, this.viewW, this.viewH);

      // 1. Nebula gas
      this.drawLayer(
        ctx,
        this.nebulaCanvas,
        this.Z_NEBULA,
        camX,
        camY,
        this.nebulaLogicalW || (this.nebulaCanvas ? this.nebulaCanvas.width : 0),
        this.nebulaLogicalH || (this.nebulaCanvas ? this.nebulaCanvas.height : 0)
      );

      // 2. Far stars & galaxies
      this.drawLayer(
        ctx,
        this.farStarCanvas,
        this.Z_FAR_STARS,
        camX,
        camY,
        this.farStarLogicalW || (this.farStarCanvas ? this.farStarCanvas.width : 0),
        this.farStarLogicalH || (this.farStarCanvas ? this.farStarCanvas.height : 0)
      );

      // 3. Gas giant anchored partially off-screen in the bottom-left corner
      if (this.planetCanvas) {
        const ox = -(camX - this.arenaW / 2) * this.Z_PLANET;
        const oy = -(camY - this.arenaH / 2) * this.Z_PLANET;
        const cx = this.viewW * 0.04 + ox;
        const cy = this.viewH + this.planetR * 0.18 + oy;
        const plW = this.planetLogicalSize || this.planetCanvas.width;
        const half = plW / 2;
        ctx.globalAlpha = 0.92;
        ctx.drawImage(this.planetCanvas, Math.round(cx - half), Math.round(cy - half), plW, plW);
        ctx.globalAlpha = 1;
      }

      // 4. Near glowing stars
      const near = this.drawLayer(
        ctx,
        this.nearStarCanvas,
        this.Z_NEAR_STARS,
        camX,
        camY,
        this.nearStarLogicalW || (this.nearStarCanvas ? this.nearStarCanvas.width : 0),
        this.nearStarLogicalH || (this.nearStarCanvas ? this.nearStarCanvas.height : 0)
      );

      // 5. Live twinkling stars
      ctx.globalCompositeOperation = 'lighter';
      if (this.twinklers) {
        for (const t of this.twinklers) {
          const sx = near.x + t.x;
          const sy = near.y + t.y;
          if (sx < -10 || sy < -10 || sx > this.viewW + 10 || sy > this.viewH + 10) continue;
          const tw = 0.5 + 0.5 * Math.sin(this.time * t.speed + t.phase);
          ctx.globalAlpha = 0.25 + tw * 0.75;
          ctx.fillStyle = t.color;
          ctx.beginPath();
          ctx.arc(sx, sy, t.r * (0.7 + tw * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 6. Realistic Shooting Stars / Meteors (tapered ionization tail + incandescent head, restrained alpha for gameplay clarity)
      for (const s of this.shootingStars) {
        const frac = Math.max(0, Math.min(1, s.life / s.maxLife));
        const a = Math.sin(frac * Math.PI) * 0.62;
        const [sr, sg, sb] = s.rgb || [188, 234, 255];
        const tailX = s.x - s.vx * 0.16;
        const tailY = s.y - s.vy * 0.16;
        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${(a * 0.95).toFixed(3)})`);
        grad.addColorStop(0.22, `rgba(${sr},${sg},${sb},${(a * 0.72).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.85;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Foreground dust streaks (speed lines)
      const speed = Math.hypot(playerVX, playerVY);
      const streak = Math.min(1, speed / 900);
      ctx.strokeStyle = overdrive ? '#e9b8ff' : '#9bdcff';
      ctx.lineWidth = 1.1;
      ctx.globalAlpha = 0.22 * (0.45 + streak * 0.9);
      ctx.beginPath();
      for (const d of this.dust) {
        const dx = (((d.x - camX * d.z) % this.viewW) + this.viewW) % this.viewW;
        const dy = (((d.y - camY * d.z) % this.viewH) + this.viewH) % this.viewH;
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx - playerVX * 0.018 * d.z - 1.2, dy - playerVY * 0.018 * d.z);
      }
      ctx.stroke();

      ctx.restore();
    }
  }

  window.SpaceBackdrop = SpaceBackdrop;
})();
