/*
 * CHAOS TETHER — Procedural deep-space backdrop.
 * Heavy layers (nebula gas, star fields, galaxies, planet) are rendered once to
 * offscreen canvases, then composited every frame with parallax. Only twinkling
 * stars, shooting stars and dust streaks are drawn live.
 */
(() => {
  // ---------- Seeded RNG + 2D Perlin noise ----------
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
      return (x1 + (x2 - x1) * v) * 1.41; // ~[-1, 1]
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

  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (e0, e1, x) => {
    const t = clamp01((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };

  // Nebula colour ramp: deep indigo -> electric blue -> teal -> violet -> magenta -> ember
  const NEBULA_RAMP = [
    [0.0, [18, 24, 92]],
    [0.22, [24, 86, 210]],
    [0.4, [0, 170, 205]],
    [0.58, [118, 48, 225]],
    [0.78, [224, 44, 150]],
    [1.0, [255, 128, 70]],
  ];

  function ramp(t, out) {
    t = clamp01(t);
    for (let i = 1; i < NEBULA_RAMP.length; i++) {
      if (t <= NEBULA_RAMP[i][0]) {
        const [t0, c0] = NEBULA_RAMP[i - 1];
        const [t1, c1] = NEBULA_RAMP[i];
        const k = (t - t0) / (t1 - t0);
        out[0] = c0[0] + (c1[0] - c0[0]) * k;
        out[1] = c0[1] + (c1[1] - c0[1]) * k;
        out[2] = c0[2] + (c1[2] - c0[2]) * k;
        return out;
      }
    }
    const last = NEBULA_RAMP[NEBULA_RAMP.length - 1][1];
    out[0] = last[0]; out[1] = last[1]; out[2] = last[2];
    return out;
  }

  // Realistic stellar colour temperatures
  const STAR_COLORS = [
    [155, 185, 255], // O/B blue
    [195, 215, 255], // A blue-white
    [240, 244, 255], // F white
    [255, 244, 222], // G yellow-white
    [255, 214, 160], // K orange
    [255, 170, 130], // M red-orange
  ];
  const STAR_WEIGHTS = [0.08, 0.22, 0.3, 0.2, 0.13, 0.07];

  function pickStarColor(rand) {
    let r = rand();
    for (let i = 0; i < STAR_WEIGHTS.length; i++) {
      r -= STAR_WEIGHTS[i];
      if (r <= 0) return STAR_COLORS[i];
    }
    return STAR_COLORS[2];
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    return c;
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
      this.shootingStars = [];
      this.nextShootingStar = 3;
      this.rebuildTimer = null;

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
    }

    // Galactic band intensity (a soft diagonal Milky-Way stripe) in layer-normalised coords
    bandAt(nx, ny) {
      const ca = Math.cos(this.bandAngle);
      const sa = Math.sin(this.bandAngle);
      const d = (nx - 0.5) * sa + (ny - 0.5) * ca;
      const wobble = this.fbm(nx * 2.2 + 11, ny * 2.2 - 7, 3) * 0.09;
      const dd = (d + wobble) / 0.17;
      return Math.exp(-dd * dd);
    }

    // ---------- Layer 1: volumetric nebula gas (rendered at reduced res, upscaled = natural blur) ----------
    buildNebula() {
      const { w, h } = this.layerSize(this.Z_NEBULA);
      const SCALE = 0.3;
      const lw = Math.ceil(w * SCALE);
      const lh = Math.ceil(h * SCALE);
      const low = makeCanvas(lw, lh);
      const lctx = low.getContext('2d');
      const img = lctx.createImageData(lw, lh);
      const data = img.data;
      const fbm = this.fbm;
      const col = [0, 0, 0];
      const col2 = [0, 0, 0];
      const feature = 1 / (Math.max(lw, lh) * 0.36);

      for (let py = 0; py < lh; py++) {
        const ny = py / lh;
        for (let px = 0; px < lw; px++) {
          const nx = px / lw;
          const x = px * feature;
          const y = py * feature;

          // Large-scale cloud mask: keeps gas in a few big regions, leaving true dark void elsewhere
          const band = this.bandAt(nx, ny);
          const mask = smooth(0.02, 0.5, fbm(x * 0.55 + 20.3, y * 0.55 - 11.7, 3) + band * 0.32);

          // Gently domain-warped fractal noise => soft wispy gas (low warp avoids a "marble" look)
          const qx = fbm(x + 1.7, y + 9.2, 3);
          const qy = fbm(x + 8.3, y + 2.8, 3);
          const d = fbm(x + 1.35 * qx, y + 1.35 * qy, 5);

          let density = smooth(-0.05, 0.7, d + band * 0.12);
          density = density * density * mask;

          // Dark dust lanes cutting through the gas
          const lane = fbm(x * 2.2 + 5.1, y * 2.2 - 3.3, 4);
          const dust = smooth(0.05, 0.35, lane) * 0.75;
          density *= 1 - dust;

          // Faint ionised filaments only inside dense gas
          const fil = Math.pow(1 - Math.abs(fbm(x * 2.6 + qx, y * 2.6 + qy, 3)), 10) * density;

          const hue = clamp01(0.42 + qx * 0.55 + qy * 0.25);
          ramp(hue, col);
          ramp(clamp01(hue + 0.15), col2);

          // Near-black void with a faint blue lift inside the galactic band
          let r = 2 + band * 6;
          let g = 3 + band * 7;
          let b = 9 + band * 16;

          r += col[0] * density * 0.42 + col2[0] * fil * 0.5;
          g += col[1] * density * 0.42 + col2[1] * fil * 0.5;
          b += col[2] * density * 0.42 + col2[2] * fil * 0.5;

          // Unresolved-star glow of the galactic band
          const glow = band * band * (0.5 + 0.5 * fbm(x * 5, y * 5, 2)) * (1 - dust * 0.9);
          r += 26 * glow;
          g += 30 * glow;
          b += 44 * glow;

          const idx = (py * lw + px) * 4;
          data[idx] = r > 255 ? 255 : r;
          data[idx + 1] = g > 255 ? 255 : g;
          data[idx + 2] = b > 255 ? 255 : b;
          data[idx + 3] = 255;
        }
      }
      lctx.putImageData(img, 0, 0);

      // Upscale with smoothing, then add a soft bloom pass
      const out = makeCanvas(w, h);
      const octx = out.getContext('2d');
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.filter = 'blur(3px)';
      octx.drawImage(low, 0, 0, w, h);
      octx.globalCompositeOperation = 'screen';
      octx.globalAlpha = 0.45;
      octx.filter = 'blur(26px)';
      octx.drawImage(low, 0, 0, w, h);
      octx.filter = 'none';
      octx.globalAlpha = 1;
      octx.globalCompositeOperation = 'source-over';

      // Cinematic vignette baked into the deepest layer
      const vg = octx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.25, w / 2, h / 2, Math.max(w, h) * 0.7);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,6,0.55)');
      octx.fillStyle = vg;
      octx.fillRect(0, 0, w, h);

      this.nebulaCanvas = out;
    }

    // ---------- Layer 2: dense distant star field + galaxies + clusters ----------
    buildFarStars() {
      const { w, h } = this.layerSize(this.Z_FAR_STARS);
      const c = makeCanvas(w, h);
      const sctx = c.getContext('2d');
      const rand = this.rand;
      const count = Math.floor((w * h) / 520);

      // Tiny background stars, concentrated in the galactic band
      for (let i = 0; i < count; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const band = this.bandAt(x / w, y / h);
        if (rand() > 0.28 + band * 0.72) continue;
        const [cr, cg, cb] = pickStarColor(rand);
        const mag = Math.pow(rand(), 3.2);
        const a = 0.18 + mag * 0.75;
        const s = 0.5 + mag * 1.1;
        sctx.fillStyle = `rgba(${cr},${cg},${cb},${a.toFixed(3)})`;
        sctx.fillRect(x, y, s, s);
      }

      // Open star clusters
      for (let k = 0; k < 5; k++) {
        const cx = rand() * w;
        const cy = rand() * h;
        const rad = 30 + rand() * 60;
        const n = 60 + Math.floor(rand() * 80);
        for (let i = 0; i < n; i++) {
          const ang = rand() * Math.PI * 2;
          const rr = Math.pow(rand(), 1.8) * rad;
          const [cr, cg, cb] = pickStarColor(rand);
          sctx.fillStyle = `rgba(${cr},${cg},${cb},${(0.35 + rand() * 0.6).toFixed(3)})`;
          const s = 0.6 + rand() * 1.1;
          sctx.fillRect(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, s, s);
        }
      }

      // Distant spiral / elliptical galaxies
      for (let k = 0; k < 7; k++) {
        this.drawGalaxy(sctx, rand() * w, rand() * h, 7 + rand() * 18, rand() * Math.PI, 0.25 + rand() * 0.45, rand);
      }

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
      // Spiral arms made of tiny dots
      const arms = 2;
      for (let a = 0; a < arms; a++) {
        for (let i = 0; i < 70; i++) {
          const t = i / 70;
          const ang = a * Math.PI + t * 4.2;
          const r = t * size * 1.5;
          const jitter = (rand() - 0.5) * size * 0.18;
          g.fillStyle = `rgba(${tint[0]},${tint[1]},${tint[2]},${(0.28 * (1 - t)).toFixed(3)})`;
          g.fillRect(Math.cos(ang) * r + jitter, Math.sin(ang) * r + jitter, 1.2, 1.2);
        }
      }
      g.fillStyle = 'rgba(255,255,255,0.9)';
      g.beginPath();
      g.arc(0, 0, Math.max(0.8, size * 0.09), 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    // ---------- Layer 3: brighter mid-distance stars with glow + diffraction spikes ----------
    buildNearStars() {
      const { w, h } = this.layerSize(this.Z_NEAR_STARS);
      const c = makeCanvas(w, h);
      const sctx = c.getContext('2d');
      const rand = this.rand;
      const count = Math.floor((w * h) / 9000);
      sctx.globalCompositeOperation = 'lighter';

      for (let i = 0; i < count; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const [cr, cg, cb] = pickStarColor(rand);
        const mag = Math.pow(rand(), 2.2);
        const core = 0.7 + mag * 1.4;
        const glowR = core * (3 + mag * 5);
        const glow = sctx.createRadialGradient(x, y, 0, x, y, glowR);
        glow.addColorStop(0, `rgba(${cr},${cg},${cb},${(0.35 + mag * 0.4).toFixed(3)})`);
        glow.addColorStop(0.3, `rgba(${cr},${cg},${cb},${(0.08 + mag * 0.12).toFixed(3)})`);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        sctx.fillStyle = glow;
        sctx.beginPath();
        sctx.arc(x, y, glowR, 0, Math.PI * 2);
        sctx.fill();
        sctx.fillStyle = 'rgba(255,255,255,0.95)';
        sctx.beginPath();
        sctx.arc(x, y, core * 0.55, 0, Math.PI * 2);
        sctx.fill();
      }

      // Hero stars with 4-point diffraction spikes
      const heroes = Math.max(6, Math.floor((w * h) / 140000));
      for (let i = 0; i < heroes; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const [cr, cg, cb] = pickStarColor(rand);
        const len = 16 + rand() * 30;
        this.drawSpikeStar(sctx, x, y, len, cr, cg, cb);
      }

      // Live twinkling stars sampled from this layer
      this.twinklers = Array.from({ length: Math.floor((w * h) / 26000) }, () => {
        const col = pickStarColor(rand);
        return {
          x: rand() * w,
          y: rand() * h,
          r: 0.8 + rand() * 1.3,
          speed: 1.2 + rand() * 3.2,
          phase: rand() * Math.PI * 2,
          color: `rgb(${col[0]},${col[1]},${col[2]})`,
        };
      });

      this.nearStarCanvas = c;
    }

    drawSpikeStar(g, x, y, len, cr, cg, cb) {
      g.save();
      g.globalCompositeOperation = 'lighter';
      const glow = g.createRadialGradient(x, y, 0, x, y, len * 0.6);
      glow.addColorStop(0, `rgba(${cr},${cg},${cb},0.85)`);
      glow.addColorStop(0.15, `rgba(${cr},${cg},${cb},0.3)`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = glow;
      g.beginPath();
      g.arc(x, y, len * 0.6, 0, Math.PI * 2);
      g.fill();
      for (let k = 0; k < 4; k++) {
        const ang = (k * Math.PI) / 2 + 0.12;
        const ex = x + Math.cos(ang) * len;
        const ey = y + Math.sin(ang) * len;
        const lg = g.createLinearGradient(x, y, ex, ey);
        lg.addColorStop(0, `rgba(${cr},${cg},${cb},0.9)`);
        lg.addColorStop(1, 'rgba(0,0,0,0)');
        g.strokeStyle = lg;
        g.lineWidth = 1.1;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(ex, ey);
        g.stroke();
      }
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(x, y, 1.6, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }

    // ---------- Layer 4: textured gas giant, anchored in the bottom-left corner ----------
    buildPlanet() {
      const r = Math.round(Math.max(110, Math.min(260, this.viewH * 0.27)));
      this.planetR = r;
      const pad = Math.round(r * 0.35);
      const size = r * 2 + pad * 2;
      const c = makeCanvas(size, size);
      const pctx = c.getContext('2d');
      const img = pctx.createImageData(size, size);
      const data = img.data;
      const fbm = this.fbm;
      const L = [0.62, -0.48, 0.62];
      const ll = Math.hypot(L[0], L[1], L[2]);
      L[0] /= ll; L[1] /= ll; L[2] /= ll;
      const tilt = 0.32;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);

      // Planet band palette: dusty indigo / teal / violet
      const bandCols = [
        [38, 42, 96],
        [64, 92, 160],
        [40, 132, 160],
        [104, 70, 150],
        [150, 110, 170],
        [52, 60, 120],
      ];

      for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
          const dx = (px - size / 2) / r;
          const dy = (py - size / 2) / r;
          const d2 = dx * dx + dy * dy;
          if (d2 > 1) continue;
          const nz = Math.sqrt(1 - d2);
          // Axial tilt
          const tx = dx * ct - dy * st;
          const ty = dx * st + dy * ct;
          const lon = Math.atan2(tx, nz);
          const lat = ty;

          const turb = fbm(lon * 1.6 + 3, lat * 7, 5);
          const v = lat * 5.5 + turb * 1.3;
          const bi = ((Math.floor(v) % bandCols.length) + bandCols.length) % bandCols.length;
          const bj = (bi + 1) % bandCols.length;
          const f = v - Math.floor(v);
          const sf = f * f * (3 - 2 * f);
          let cr = bandCols[bi][0] + (bandCols[bj][0] - bandCols[bi][0]) * sf;
          let cg = bandCols[bi][1] + (bandCols[bj][1] - bandCols[bi][1]) * sf;
          let cb = bandCols[bi][2] + (bandCols[bj][2] - bandCols[bi][2]) * sf;

          // Fine cloud streak detail
          const detail = 0.85 + 0.3 * fbm(lon * 6, lat * 28, 3);
          cr *= detail; cg *= detail; cb *= detail;

          // Lighting (Lambert + soft terminator)
          const ndl = dx * L[0] + dy * L[1] + nz * L[2];
          const light = smooth(-0.15, 0.85, ndl);
          const ambient = 0.06;
          const shade = ambient + light * 1.05;
          // Limb darkening
          const limb = 0.55 + 0.45 * Math.pow(nz, 0.5);

          cr = cr * shade * limb;
          cg = cg * shade * limb;
          cb = cb * shade * limb;

          // Atmospheric scattering on the lit rim
          const rim = Math.pow(1 - nz, 3) * light;
          cr += 40 * rim;
          cg += 150 * rim;
          cb += 230 * rim;

          // Anti-aliased edge
          const edge = clamp01((1 - Math.sqrt(d2)) * r * 1.2);
          const idx = (py * size + px) * 4;
          data[idx] = cr > 255 ? 255 : cr;
          data[idx + 1] = cg > 255 ? 255 : cg;
          data[idx + 2] = cb > 255 ? 255 : cb;
          data[idx + 3] = 255 * edge;
        }
      }
      pctx.putImageData(img, 0, 0);

      // Outer atmosphere glow (lit side brighter)
      pctx.globalCompositeOperation = 'destination-over';
      const atmo = pctx.createRadialGradient(size / 2, size / 2, r * 0.96, size / 2, size / 2, r + pad * 0.9);
      atmo.addColorStop(0, 'rgba(70, 190, 255, 0.45)');
      atmo.addColorStop(0.35, 'rgba(60, 120, 255, 0.14)');
      atmo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pctx.fillStyle = atmo;
      pctx.beginPath();
      pctx.arc(size / 2, size / 2, r + pad, 0, Math.PI * 2);
      pctx.fill();
      pctx.globalCompositeOperation = 'source-over';

      this.planetCanvas = c;
      this.planetPad = pad;
    }

    // ---------- Per-frame ----------
    update(dt) {
      this.time += dt;
      this.nextShootingStar -= dt;
      if (this.nextShootingStar <= 0) {
        this.nextShootingStar = 4 + Math.random() * 7;
        const fromLeft = Math.random() < 0.5;
        const ang = fromLeft ? 0.35 + Math.random() * 0.4 : Math.PI - 0.35 - Math.random() * 0.4;
        const speed = 900 + Math.random() * 600;
        this.shootingStars.push({
          x: fromLeft ? Math.random() * this.viewW * 0.5 : this.viewW * (0.5 + Math.random() * 0.5),
          y: Math.random() * this.viewH * 0.4,
          vx: Math.cos(ang) * speed,
          vy: Math.sin(ang) * speed,
          life: 0.9,
          maxLife: 0.9,
        });
      }
      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        const s = this.shootingStars[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt;
        if (s.life <= 0) this.shootingStars.splice(i, 1);
      }
    }

    drawLayer(ctx, canvas, z, camX, camY) {
      if (!canvas) return { x: 0, y: 0 };
      const ox = -(camX - this.arenaW / 2) * z;
      const oy = -(camY - this.arenaH / 2) * z;
      const x = Math.round((this.viewW - canvas.width) / 2 + ox);
      const y = Math.round((this.viewH - canvas.height) / 2 + oy);
      ctx.drawImage(canvas, x, y);
      return { x, y };
    }

    draw(ctx, camX, camY, playerVX = 0, playerVY = 0, overdrive = false) {
      ctx.save();
      ctx.fillStyle = '#02030a';
      ctx.fillRect(0, 0, this.viewW, this.viewH);

      // 1. Nebula gas
      this.drawLayer(ctx, this.nebulaCanvas, this.Z_NEBULA, camX, camY);

      // 2. Far stars & galaxies
      this.drawLayer(ctx, this.farStarCanvas, this.Z_FAR_STARS, camX, camY);

      // 3. Gas giant anchored partially off-screen in the bottom-left corner
      if (this.planetCanvas) {
        const ox = -(camX - this.arenaW / 2) * this.Z_PLANET;
        const oy = -(camY - this.arenaH / 2) * this.Z_PLANET;
        const cx = this.viewW * 0.04 + ox;
        const cy = this.viewH + this.planetR * 0.18 + oy;
        const half = this.planetCanvas.width / 2;
        ctx.globalAlpha = 0.92;
        ctx.drawImage(this.planetCanvas, Math.round(cx - half), Math.round(cy - half));
        ctx.globalAlpha = 1;
      }

      // 4. Near glowing stars
      const near = this.drawLayer(ctx, this.nearStarCanvas, this.Z_NEAR_STARS, camX, camY);

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
          if (tw > 0.85) {
            const fl = t.r * 5 * tw;
            ctx.globalAlpha = (tw - 0.85) * 4;
            ctx.strokeStyle = t.color;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(sx - fl, sy);
            ctx.lineTo(sx + fl, sy);
            ctx.moveTo(sx, sy - fl);
            ctx.lineTo(sx, sy + fl);
            ctx.stroke();
          }
        }
      }

      // 6. Shooting stars
      for (const s of this.shootingStars) {
        const a = s.life / s.maxLife;
        const tailX = s.x - s.vx * 0.12;
        const tailY = s.y - s.vy * 0.12;
        const g = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        g.addColorStop(0, `rgba(255,255,255,${(0.95 * a).toFixed(3)})`);
        g.addColorStop(0.25, `rgba(150,220,255,${(0.5 * a).toFixed(3)})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }

      // 7. Foreground dust streaks (speed lines)
      const speed = Math.hypot(playerVX, playerVY);
      const streak = Math.min(1, speed / 900);
      ctx.strokeStyle = overdrive ? '#e9b8ff' : '#9bdcff';
      ctx.lineWidth = 1.1;
      for (const d of this.dust) {
        const dx = (((d.x - camX * d.z) % this.viewW) + this.viewW) % this.viewW;
        const dy = (((d.y - camY * d.z) % this.viewH) + this.viewH) % this.viewH;
        ctx.globalAlpha = d.alpha * (0.45 + streak * 0.9);
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(dx - playerVX * 0.018 * d.z - 1.2, dy - playerVY * 0.018 * d.z);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  window.SpaceBackdrop = SpaceBackdrop;
})();
