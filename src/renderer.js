/*
 * CHAOS TETHER — AAA Futuristic WebGL2 Instanced & Shader Renderer (with Full Canvas 2D Fallback).
 *
 * Highlights:
 *  - Startup Procedural 1024x1024 High-DPR Sprite & Orbitron Glyph Atlas (2x supersampled, 0 KB image downloads):
 *      * Sleek forward-swept Starfighter Interceptor (Normal & Overdrive) with beveled metallic shading & ion vents
 *      * Dual-counter-rotating Plasma Gyro-Disks (3 velocity tiers + Overdrive Golden-Violet Aura Disk)
 *      * 6 distinctive futuristic enemy spacecraft (Stinger, Micro-Drone, Prism Carrier, Lance Striker, Volatile Core, Aegis Tank)
 *      * Dual-counter-rotating Boss Dreadnought (armored 8-turret outer ring + pulsing singularity core)
 *      * Rotating relativistic Black Hole accretion disk + crystalline XP shards + homing plasma bolts
 *  - Pass 1: Single-draw-call multi-texture parallax backdrop with Black Hole gravitational lensing & Shockwave refraction.
 *  - Pass 2..4: Hardware-instanced batching (~4 draw calls/frame) + continuous plasma comet ribbons + tension tethers.
 *  - Re-bakes glyph strip once document.fonts.ready resolves (zero fallback-font combat text).
 *  - Full webglcontextlost / webglcontextrestored resilience + Adaptive Resolution Governor.
 */
(() => {
  const ATLAS_W = 1024;
  const ATLAS_H = 1024;
  const MAX_INSTANCES = 4096;
  const FLOATS_PER_INST = 14; // x, y, w, h, u0, v0, u1, v1, r, g, b, a, cos, sin

  const COLOR_CACHE = new Map();
  function parseColor(hex) {
    let c = COLOR_CACHE.get(hex);
    if (c) return c;
    if (hex.startsWith('#')) {
      const v = hex.length === 4
        ? [parseInt(hex[1] + hex[1], 16) / 255, parseInt(hex[2] + hex[2], 16) / 255, parseInt(hex[3] + hex[3], 16) / 255]
        : [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
      COLOR_CACHE.set(hex, v);
      return v;
    }
    const m = hex.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    const v = m ? [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255] : [1, 1, 1];
    COLOR_CACHE.set(hex, v);
    return v;
  }

  class ChaosRenderer {
    constructor(canvas, space) {
      this.canvas = canvas;
      this.space = space;
      this.viewW = window.innerWidth;
      this.viewH = window.innerHeight;
      this.baseDpr = Math.min(window.devicePixelRatio || 1, 2);
      this.renderScale = 1.0;
      this.dpr = this.baseDpr;

      // Adaptive resolution governor state
      this.emaFrameMs = 12.0;
      this.lastFrameTimestamp = 0;
      this.adaptCooldown = 0;

      this.sprites = {};
      this.glyphs = new Map();
      this._buildAtlas();

      this.gl = null;
      this.ctx2d = null;
      this._contextLost = false;
      this._spaceVersion = -1;
      this._threatIdx = new Int32Array(8);
      this._threatD2 = new Float32Array(8);
      this._rectNeb = new Float32Array(4);
      this._rectFar = new Float32Array(4);
      this._rectNear = new Float32Array(4);
      this._batches = Array.from({ length: 16 }, () => ({ start: 0, count: 0, additive: false, screenSpace: false }));
      this._batchCount = 0;
      this._batchStart = 0;
      this._initWebGL2();
      if (!this.gl) {
        this.ctx2d = canvas.getContext('2d');
      } else {
        this.canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          this._contextLost = true;
        });
        this.canvas.addEventListener('webglcontextrestored', () => {
          this._contextLost = false;
          this._spaceVersion = -1;
          this._initWebGL2();
        });
      }

      // Re-bake bitmap font strip once local Orbitron WOFF2 finishes decoding so combat digits are always crisp
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          this._bakeGlyphRow();
          if (this.gl && this.texAtlas && !this._contextLost) {
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.texAtlas);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.atlasCanvas);
          }
        }).catch(() => {});
      }
    }

    // ---------- 1. Startup Procedural AAA Sprite & Glyph Atlas ----------
    _buildAtlas() {
      const c = document.createElement('canvas');
      c.width = ATLAS_W;
      c.height = ATLAS_H;
      const g = c.getContext('2d');
      g.clearRect(0, 0, ATLAS_W, ATLAS_H);

      const reg = (name, x, y, w, h, drawFn) => {
        g.save();
        g.beginPath();
        g.rect(x, y, w, h);
        g.clip();
        g.translate(x + w / 2, y + h / 2);
        drawFn(g, w, h);
        g.restore();
        this.sprites[name] = {
          x, y, w, h,
          u0: (x + 0.5) / ATLAS_W,
          v0: (y + 0.5) / ATLAS_H,
          u1: (x + w - 0.5) / ATLAS_W,
          v1: (y + h - 0.5) / ATLAS_H,
        };
      };

      // --- ROW 0 (y=2..148): Core FX Primitives, Gems, Bolts, Shockwaves, Black Holes ---
      reg('white', 2, 2, 12, 12, (ctx) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-6, -6, 12, 12);
      });

      // Soft radial glow disc (tintable)
      reg('glow_disc', 18, 2, 96, 96, (ctx) => {
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 46);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.28, 'rgba(255,255,255,0.68)');
        grad.addColorStop(0.65, 'rgba(255,255,255,0.16)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 46, 0, Math.PI * 2);
        ctx.fill();
      });

      // Crisp circle (tintable)
      reg('circle', 118, 2, 64, 64, (ctx) => {
        const grad = ctx.createRadialGradient(0, 0, 6, 0, 0, 29);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.84, 'rgba(255,255,255,0.96)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 29, 0, Math.PI * 2);
        ctx.fill();
      });

      // Multi-ring futuristic shockwave (tintable)
      reg('shockwave', 186, 2, 128, 128, (ctx) => {
        const grad = ctx.createRadialGradient(0, 0, 36, 0, 0, 60);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.55, 'rgba(255,255,255,0.22)');
        grad.addColorStop(0.82, 'rgba(255,255,255,0.95)');
        grad.addColorStop(0.92, 'rgba(255,255,255,0.35)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, 60, 0, Math.PI * 2);
        ctx.fill();
      });

      // Black Hole Event Horizon + Relativistic Swirling Accretion Disk
      reg('black_hole', 318, 2, 144, 144, (ctx) => {
        // Outer violet gravitational halo
        const halo = ctx.createRadialGradient(0, 0, 14, 0, 0, 68);
        halo.addColorStop(0, 'rgba(2, 1, 8, 1)');
        halo.addColorStop(0.28, 'rgba(4, 2, 14, 1)');
        halo.addColorStop(0.36, 'rgba(232, 121, 249, 0.95)');
        halo.addColorStop(0.52, 'rgba(168, 85, 247, 0.55)');
        halo.addColorStop(0.76, 'rgba(99, 102, 241, 0.18)');
        halo.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 68, 0, Math.PI * 2);
        ctx.fill();

        // Swirling plasma accretion filaments
        ctx.lineCap = 'round';
        for (let a = 0; a < 3; a++) {
          const base = (a * Math.PI * 2) / 3;
          ctx.strokeStyle = a === 0 ? 'rgba(250, 232, 255, 0.85)' : 'rgba(192, 132, 252, 0.65)';
          ctx.lineWidth = a === 0 ? 2.4 : 1.7;
          ctx.beginPath();
          for (let s = 0; s <= 24; s++) {
            const t = s / 24;
            const ang = base + t * 2.4;
            const r = 20 + t * 34;
            const x = Math.cos(ang) * r;
            const y = Math.sin(ang) * r;
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Razor photon ring & pitch-black singularity core
        ctx.fillStyle = '#010105';
        ctx.beginPath();
        ctx.arc(0, 0, 18.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(253, 244, 255, 0.92)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, 19.5, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Crystalline Faceted XP Shard
      reg('gem', 466, 2, 52, 52, (ctx) => {
        ctx.scale(2, 2);
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 7;
        const g1 = ctx.createLinearGradient(-5, -8, 5, 8);
        g1.addColorStop(0, '#e0faff');
        g1.addColorStop(0.45, '#00f0ff');
        g1.addColorStop(1, '#0284c7');
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(5.2, -1);
        ctx.lineTo(0, 8);
        ctx.lineTo(-5.2, -1);
        ctx.closePath();
        ctx.fill();

        // Crystal facet highlight
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.82)';
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(2.4, -1.5);
        ctx.lineTo(0, 1.5);
        ctx.lineTo(-2.4, -1.5);
        ctx.closePath();
        ctx.fill();
      });

      // Sleek Directional Energy Shard Particle (white, tintable)
      reg('particle', 522, 2, 48, 48, (ctx) => {
        ctx.scale(2, 2);
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(-3, -3.5);
        ctx.lineTo(-7, 0);
        ctx.lineTo(-3, 3.5);
        ctx.closePath();
        ctx.fill();
      });

      // Supersonic Mach Bow-Shock Cone (layered plasma crescent)
      reg('mach_cone', 574, 2, 120, 120, (ctx) => {
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255, 42, 109, 0.45)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(-4, 0, 44, -0.92, 0.92);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.lineWidth = 3.2;
        ctx.shadowColor = '#ff99c8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 44, -0.86, 0.86);
        ctx.stroke();
      });

      // Homing Plasma Shrapnel Bolt
      reg('shrapnel_bolt', 698, 2, 56, 56, (ctx) => {
        ctx.scale(2, 2);
        ctx.shadowColor = '#ffae00';
        ctx.shadowBlur = 8;
        const grad = ctx.createLinearGradient(-10, 0, 10, 0);
        grad.addColorStop(0, 'rgba(255, 140, 0, 0)');
        grad.addColorStop(0.55, '#ffd600');
        grad.addColorStop(1, '#ffffff');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-2, -3.6);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-2, 3.6);
        ctx.closePath();
        ctx.fill();
      });

      // Boss Energy Plasma Projectile
      reg('enemy_bullet', 758, 2, 56, 56, (ctx) => {
        const halo = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
        halo.addColorStop(0, '#ffffff');
        halo.addColorStop(0.32, '#ff5e8e');
        halo.addColorStop(0.62, 'rgba(255, 42, 109, 0.85)');
        halo.addColorStop(1, 'rgba(255, 42, 109, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
      });

      // Counter-rotating Gyro Inner Containment Ring (for Wrecking Disks)
      reg('orb_ring_inner', 818, 2, 112, 112, (ctx) => {
        ctx.scale(2, 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
        ctx.lineWidth = 2.1;
        for (let k = 0; k < 3; k++) {
          const a0 = (k * Math.PI * 2) / 3 + 0.15;
          const a1 = a0 + 1.15;
          ctx.beginPath();
          ctx.arc(0, 0, 14.5, a0, a1);
          ctx.stroke();
        }
        // Micro-circuit ticks
        ctx.fillStyle = '#ffffff';
        for (let k = 0; k < 6; k++) {
          const a = (k * Math.PI) / 3;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 11, Math.sin(a) * 11, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // --- ROW 1 & ROWS 4-5: 5 Distinct Sci-Fi Starship Themes (Normal & Overdrive, 124x124 @ 2x supersampled) ---
      const shipsList = window.ChaosShips ? window.ChaosShips.list : null;
      if (shipsList && shipsList.length > 0) {
        for (let i = 0; i < shipsList.length; i++) {
          const sh = shipsList[i];
          const nx = i === 0 ? 2 : 4 + (i - 1) * 128;
          const ny = i === 0 ? 148 : 700;
          const ox = i === 0 ? 130 : 4 + (i - 1) * 128;
          const oy = i === 0 ? 148 : 832;
          reg(`ship_${sh.id}_normal`, nx, ny, 124, 124, (ctx) => {
            ctx.scale(2, 2);
            sh.draw(ctx, false);
          });
          reg(`ship_${sh.id}_overdrive`, ox, oy, 124, 124, (ctx) => {
            ctx.scale(2, 2);
            sh.draw(ctx, true);
          });
        }
        this.sprites.ship_normal = this.sprites[`ship_${shipsList[0].id}_normal`];
        this.sprites.ship_overdrive = this.sprites[`ship_${shipsList[0].id}_overdrive`];
      }

      // Holographic Tactical Ship Radar Ring (precision aerospace scanner circle, zero overlap!)
      reg('ship_halo', 2, 416, 132, 132, (ctx) => {
        ctx.scale(2, 2);
        // Subtle volumetric holographic ring glow
        const ringGlow = ctx.createRadialGradient(0, 0, 22, 0, 0, 32);
        ringGlow.addColorStop(0, 'rgba(255,255,255,0)');
        ringGlow.addColorStop(0.52, 'rgba(255,255,255,0.16)');
        ringGlow.addColorStop(0.76, 'rgba(255,255,255,0.28)');
        ringGlow.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = ringGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fill();

        // Fine inner holographic compass circle
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.arc(0, 0, 24.5, 0, Math.PI * 2);
        ctx.stroke();

        // 4 crisp segmented outer aerospace reticle arcs
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.86)';
        ctx.lineWidth = 1.65;
        ctx.lineCap = 'round';
        for (let k = 0; k < 4; k++) {
          const a0 = (k * Math.PI) / 2 + 0.26;
          const a1 = a0 + Math.PI / 2 - 0.52;
          ctx.beginPath();
          ctx.arc(0, 0, 28.5, a0, a1);
          ctx.stroke();
        }

        // 12 precision radial compass micro-ticks (cardinals slightly longer)
        for (let k = 0; k < 12; k++) {
          const a = (k * Math.PI) / 6;
          const isCard = k % 3 === 0;
          const r0 = isCard ? 23.0 : 25.2;
          const r1 = isCard ? 28.8 : 27.6;
          ctx.strokeStyle = isCard ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = isCard ? 1.4 : 0.9;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
          ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
          ctx.stroke();
        }
      });

      // Directional Enemy Threat Radar Warning Arc + Chevron Pip (oriented +X, tintable crimson/gold!)
      reg('threat_arc', 402, 416, 100, 100, (ctx) => {
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        // Soft outer warning bloom arc
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.36)';
        ctx.lineWidth = 7.2;
        ctx.beginPath();
        ctx.arc(0, 0, 21.5, -0.44, 0.44);
        ctx.stroke();

        // Razor-sharp core directional threat arc
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.arc(0, 0, 21.5, -0.38, 0.38);
        ctx.stroke();

        // Crisp outward-pointing directional hostile pointer triangle at +X
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(25.0, 0);
        ctx.lineTo(20.6, -3.2);
        ctx.lineTo(21.6, 0);
        ctx.lineTo(20.6, 3.2);
        ctx.closePath();
        ctx.fill();
      });

      // Cinematic 4-Point Anamorphic Plasma Blast Cross-Flare (tintable)
      reg('impact_flare', 140, 416, 132, 132, (ctx) => {
        const core = ctx.createRadialGradient(0, 0, 2, 0, 0, 56);
        core.addColorStop(0, 'rgba(255,255,255,1)');
        core.addColorStop(0.22, 'rgba(255,255,255,0.85)');
        core.addColorStop(0.55, 'rgba(255,255,255,0.22)');
        core.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, 56, 0, Math.PI * 2);
        ctx.fill();

        // Sharp horizontal & vertical anamorphic star spikes
        const drawSpike = (rx, ry, alpha) => {
          const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
          g.addColorStop(0, `rgba(255,255,255,${alpha})`);
          g.addColorStop(0.4, `rgba(255,255,255,${alpha * 0.55})`);
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.save();
          ctx.scale(1, ry / rx);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(0, 0, rx, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        };
        drawSpike(62, 6.5, 0.96);
        ctx.save();
        ctx.rotate(Math.PI * 0.5);
        drawSpike(48, 5.5, 0.86);
        ctx.restore();
      });

      // Angular Metallic Hull Debris Shard (tintable, spins out from blasted enemies!)
      reg('debris', 278, 416, 56, 56, (ctx) => {
        ctx.scale(2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(9, -1);
        ctx.lineTo(1, -6.5);
        ctx.lineTo(-8, -2);
        ctx.lineTo(-5, 5.5);
        ctx.lineTo(4.5, 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(20, 30, 48, 0.42)';
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(-4, -2);
        ctx.lineTo(-3, 3.5);
        ctx.closePath();
        ctx.fill();
      });

      // Sleek Directional Flight / Catapult Aim Chevron Pip
      reg('aim_pip', 340, 416, 56, 56, (ctx) => {
        ctx.scale(2, 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-4, -7.5);
        ctx.lineTo(5.5, 0);
        ctx.lineTo(-4, 7.5);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-6, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Futuristic Precision Plasma Gyro-Disk (Outer Rotor + Beveled Armor + Reactor Core)
      const drawGyroDisk = (ctx, rimCol, midCol, coreCol, blur) => {
        ctx.scale(2, 2);
        const r0 = 22;

        // Soft volumetric plasma corona
        const corona = ctx.createRadialGradient(0, 0, r0 * 0.4, 0, 0, r0 + 13);
        corona.addColorStop(0, rimCol);
        corona.addColorStop(0.65, rimCol + '55');
        corona.addColorStop(1, rimCol + '00');
        ctx.fillStyle = corona;
        ctx.beginPath();
        ctx.arc(0, 0, r0 + 13, 0, Math.PI * 2);
        ctx.fill();

        // Swept futuristic kinetic saw-blades (8 directional turbine teeth)
        ctx.save();
        ctx.shadowColor = rimCol;
        ctx.shadowBlur = blur;
        ctx.fillStyle = rimCol;
        ctx.beginPath();
        const teeth = 8;
        for (let s = 0; s < teeth; s++) {
          const a0 = (s / teeth) * Math.PI * 2;
          const aTip = a0 + 0.16;
          const aMid = a0 + 0.42;
          const aNext = ((s + 1) / teeth) * Math.PI * 2;
          const rOut = r0 + 6.5;
          const rIn = r0 * 0.80;
          if (s === 0) ctx.moveTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
          ctx.lineTo(Math.cos(aTip) * rOut, Math.sin(aTip) * rOut);
          ctx.lineTo(Math.cos(aMid) * (r0 + 2.2), Math.sin(aMid) * (r0 + 2.2));
          ctx.lineTo(Math.cos(aNext) * rIn, Math.sin(aNext) * rIn);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Metallic beveled containment housing
        const armor = ctx.createLinearGradient(-r0, -r0, r0, r0);
        armor.addColorStop(0, '#1e293b');
        armor.addColorStop(0.5, '#090f1f');
        armor.addColorStop(1, '#020612');
        ctx.fillStyle = armor;
        ctx.strokeStyle = midCol;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, r0 * 0.78, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 4 radial plasma conduit vents
        ctx.strokeStyle = rimCol;
        ctx.lineWidth = 2.0;
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2 + 0.35;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (r0 * 0.42), Math.sin(a) * (r0 * 0.42));
          ctx.lineTo(Math.cos(a) * (r0 * 0.74), Math.sin(a) * (r0 * 0.74));
          ctx.stroke();
        }

        // Volumetric reactor core with specular sheen
        const reactor = ctx.createRadialGradient(-2, -2, 1, 0, 0, r0 * 0.44);
        reactor.addColorStop(0, '#ffffff');
        reactor.addColorStop(0.52, coreCol);
        reactor.addColorStop(1, rimCol);
        ctx.fillStyle = reactor;
        ctx.beginPath();
        ctx.arc(0, 0, r0 * 0.44, 0, Math.PI * 2);
        ctx.fill();
      };
      reg('orb_cyan', 258, 148, 136, 136, (ctx) => drawGyroDisk(ctx, '#00f0ff', '#7dd3fc', '#e0faff', 12));
      reg('orb_gold', 398, 148, 136, 136, (ctx) => drawGyroDisk(ctx, '#ffd600', '#fef08a', '#fffbeb', 14));
      reg('orb_magenta', 538, 148, 136, 136, (ctx) => drawGyroDisk(ctx, '#ff2a6d', '#fda4af', '#fff1f2', 16));
      reg('orb_overdrive', 678, 148, 136, 136, (ctx) => drawGyroDisk(ctx, '#c026d3', '#ffd600', '#ffffff', 16));

      // --- ROW 2 (y=290..495): 6 High-Craft Enemy Warships + Dual-Layer Boss Dreadnought ---
      // 1. Swarmer: Crimson Viper Stinger Interceptor (swept razor wings, dark carapace, twin aft thrusters)
      reg('enemy_swarmer', 2, 290, 92, 92, (ctx) => {
        ctx.scale(2, 2);
        const r = 15.5;
        ctx.shadowColor = '#ff2a6d';
        ctx.shadowBlur = 10;

        // Twin swept crimson outer interceptor wings
        const hull = ctx.createLinearGradient(-r, -r, r, r);
        hull.addColorStop(0, '#ff85b3');
        hull.addColorStop(0.45, '#e11d48');
        hull.addColorStop(1, '#3b0718');
        ctx.fillStyle = hull;
        ctx.strokeStyle = '#fecdd3';
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(r + 3, 0);
        ctx.lineTo(1, -5.2);
        ctx.lineTo(-r * 0.85, -r * 0.96);
        ctx.lineTo(-r * 0.95, -r * 0.56);
        ctx.lineTo(-r * 0.52, -r * 0.22);
        ctx.lineTo(-r * 0.82, 0);
        ctx.lineTo(-r * 0.52, r * 0.22);
        ctx.lineTo(-r * 0.95, r * 0.56);
        ctx.lineTo(-r * 0.85, r * 0.96);
        ctx.lineTo(1, 5.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dark obsidian recessed spine + twin hot-magenta energy slits
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#120612';
        ctx.beginPath();
        ctx.moveTo(r * 0.65, 0);
        ctx.lineTo(-r * 0.42, -4.2);
        ctx.lineTo(-r * 0.62, 0);
        ctx.lineTo(-r * 0.42, 4.2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ff4d84';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-2, -6.5); ctx.lineTo(-10, -11.5);
        ctx.moveTo(-2, 6.5); ctx.lineTo(-10, 11.5);
        ctx.stroke();

        // Twin aft thruster glow nodes + bright visor eye
        ctx.fillStyle = '#ffd600';
        ctx.beginPath();
        ctx.arc(-r * 0.68, -2.8, 1.5, 0, Math.PI * 2);
        ctx.arc(-r * 0.68, 2.8, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(6.5, 0); ctx.lineTo(1.5, -2.3); ctx.lineTo(0, 0); ctx.lineTo(1.5, 2.3);
        ctx.closePath();
        ctx.fill();
      });

      // 2. Mini: Twin-Pronged Fission Hunter-Wasp Drone
      reg('enemy_mini', 98, 290, 72, 72, (ctx) => {
        ctx.scale(2, 2);
        const r = 11;
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 9;
        const hull = ctx.createLinearGradient(-r, -r, r, r);
        hull.addColorStop(0, '#f5d0fe');
        hull.addColorStop(0.5, '#c026d3');
        hull.addColorStop(1, '#3b0764');
        ctx.fillStyle = hull;
        ctx.strokeStyle = '#fae8ff';
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.moveTo(r + 2, -2.2);
        ctx.lineTo(2, -4.5);
        ctx.lineTo(-r * 0.82, -r * 0.88);
        ctx.lineTo(-r * 0.48, 0);
        ctx.lineTo(-r * 0.82, r * 0.88);
        ctx.lineTo(2, 4.5);
        ctx.lineTo(r + 2, 2.2);
        ctx.lineTo(4.5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#14051c';
        ctx.beginPath();
        ctx.arc(-1, 0, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0.5, 0, 2.0, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Splitter: Tri-Wing Armored Prism Fission Carrier (3 glowing fission chambers + conduits)
      reg('enemy_splitter', 174, 290, 116, 116, (ctx) => {
        ctx.scale(2, 2);
        const r = 22.5;
        ctx.shadowColor = '#b829ff';
        ctx.shadowBlur = 12;

        // 3 heavy beveled outer armor fins
        const hull = ctx.createLinearGradient(-r, -r, r, r);
        hull.addColorStop(0, '#d8b4fe');
        hull.addColorStop(0.48, '#7e22ce');
        hull.addColorStop(1, '#1e083a');
        ctx.fillStyle = hull;
        ctx.strokeStyle = '#f3e8ff';
        ctx.lineWidth = 1.35;
        ctx.beginPath();
        for (let s = 0; s < 12; s++) {
          const a = (s / 12) * Math.PI * 2 - Math.PI / 2;
          const rad = (s % 4 === 0) ? r + 2.5 : (s % 2 === 0 ? r * 0.90 : r * 0.68);
          if (s === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dark recessed hexagonal reactor bay
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#090418';
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Energy conduits linking 3 fission pods to central unstable prism
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = 1.5;
        for (let k = 0; k < 3; k++) {
          const a = (k * Math.PI * 2) / 3 - Math.PI / 2;
          const px = Math.cos(a) * 7.2;
          const py = Math.sin(a) * 7.2;
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(px, py);
          ctx.stroke();
          ctx.fillStyle = '#e879f9';
          ctx.beginPath();
          ctx.arc(px, py, 3.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Dasher: Forward-Swept Rail-Lance Sniper Striker
      reg('enemy_dasher', 294, 290, 100, 100, (ctx) => {
        ctx.scale(2, 2);
        const r = 18.5;
        ctx.shadowColor = '#ff0099';
        ctx.shadowBlur = 12;

        // Forward-swept predatory scythe blades + rear stabilizer fins
        const hull = ctx.createLinearGradient(-r, -r, r, r);
        hull.addColorStop(0, '#ff99d6');
        hull.addColorStop(0.45, '#db2777');
        hull.addColorStop(1, '#3d041d');
        ctx.fillStyle = hull;
        ctx.strokeStyle = '#fce7f3';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(r + 4.5, 0);
        ctx.lineTo(2, -4.6);
        ctx.lineTo(r * 0.58, -r * 0.92);
        ctx.lineTo(-r * 0.18, -r * 0.72);
        ctx.lineTo(-r * 0.92, -r * 0.50);
        ctx.lineTo(-r * 0.55, 0);
        ctx.lineTo(-r * 0.92, r * 0.50);
        ctx.lineTo(-r * 0.18, r * 0.72);
        ctx.lineTo(r * 0.58, r * 0.92);
        ctx.lineTo(2, 4.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Recessed gunmetal accelerator channel + blazing plasma rail
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#140410';
        ctx.beginPath();
        ctx.moveTo(r * 0.72, 0);
        ctx.lineTo(-r * 0.45, -3.5);
        ctx.lineTo(-r * 0.45, 3.5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(r * 0.85, 0); ctx.lineTo(-r * 0.35, 0);
        ctx.stroke();
        ctx.fillStyle = '#ffd600';
        ctx.beginPath();
        ctx.arc(r * 0.55, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // 5. Bomber: Armored Emerald Volatile Core-Carrier (4 industrial hazard clamps + pulsing plasma sphere)
      reg('enemy_bomber', 398, 290, 108, 108, (ctx) => {
        ctx.scale(2, 2);
        const r = 20.5;
        ctx.shadowColor = '#05ffa1';
        ctx.shadowBlur = 13;

        // 4 heavy beveled containment arms with glowing emerald hazard tips
        for (let k = 0; k < 4; k++) {
          ctx.save();
          ctx.rotate((k * Math.PI) / 2 + Math.PI / 4);
          const armGrad = ctx.createLinearGradient(8, -6, r + 3, 6);
          armGrad.addColorStop(0, '#0f2922');
          armGrad.addColorStop(0.6, '#065f46');
          armGrad.addColorStop(1, '#34d399');
          ctx.fillStyle = armGrad;
          ctx.strokeStyle = '#a7f3d0';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(8, -5.8);
          ctx.lineTo(r + 2.5, -4.5);
          ctx.lineTo(r + 3.5, 0);
          ctx.lineTo(r + 2.5, 4.5);
          ctx.lineTo(8, 5.8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Hazard chevron slit
          ctx.fillStyle = '#05ffa1';
          ctx.fillRect(13, -1.3, 5, 2.6);
          ctx.restore();
        }

        // Containment ring + multi-layered radioactive emerald plasma sphere
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, 13.8, 0, Math.PI * 2);
        ctx.stroke();

        const core = ctx.createRadialGradient(-2.5, -2.5, 1, 0, 0, 12.2);
        core.addColorStop(0, '#ffffff');
        core.addColorStop(0.35, '#6ee7b7');
        core.addColorStop(0.75, '#059669');
        core.addColorStop(1, '#022c22');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, 12.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d1fae5';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 6. Tank: Heavy Bronze-Gold Aegis Siege Gunship + Twin Turrets + Dual-Layer Holographic Front Shield
      reg('enemy_tank', 510, 290, 156, 156, (ctx) => {
        ctx.scale(2, 2);
        const r = 28;
        ctx.shadowColor = '#ff9e00';
        ctx.shadowBlur = 12;

        // Twin shoulder heavy plasma cannon barrels
        ctx.fillStyle = '#291a0e';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.1;
        for (const sgn of [-1, 1]) {
          ctx.beginPath();
          ctx.rect(4, sgn > 0 ? 15.5 : -20.5, 18, 5);
          ctx.fill();
          ctx.stroke();
        }

        // Heavy beveled armored octagonal siege hull
        const hull = ctx.createLinearGradient(-r, -r, r, r);
        hull.addColorStop(0, '#fde68a');
        hull.addColorStop(0.35, '#d97706');
        hull.addColorStop(0.75, '#78350f');
        hull.addColorStop(1, '#291205');
        ctx.fillStyle = hull;
        ctx.strokeStyle = '#fef3c7';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let s = 0; s < 8; s++) {
          const a = (s / 8) * Math.PI * 2 + Math.PI / 8;
          const rad = (s === 0 || s === 7) ? r + 2.5 : r;
          if (s === 0) ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
          else ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Recessed gunmetal command deck + glowing molten reactor core + vent slits
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#140c06';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(-2, 0, r * 0.56, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.0;
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2 + Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(-2 + Math.cos(a) * 6, Math.sin(a) * 6);
          ctx.lineTo(-2 + Math.cos(a) * 14, Math.sin(a) * 14);
          ctx.stroke();
        }
        const core = ctx.createRadialGradient(-3, -1, 1, -2, 0, 6.2);
        core.addColorStop(0, '#ffffff');
        core.addColorStop(0.55, '#fde047');
        core.addColorStop(1, '#ea580c');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(-2, 0, 6.0, 0, Math.PI * 2);
        ctx.fill();

        // Holographic dual-layer curved front Aegis shield arc
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.34)';
        ctx.lineWidth = 8.0;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(2, 0, r + 6.5, -0.98, 0.98);
        ctx.stroke();

        ctx.strokeStyle = '#fef9c3';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(2, 0, r + 6.5, -0.94, 0.94);
        ctx.stroke();
      });

      // 7. Boss Dreadnought — Colossal 8-Turret Armored Crimson Battle Ring
      reg('enemy_boss_outer', 670, 290, 260, 260, (ctx) => {
        ctx.scale(2, 2);
        const r0 = 50;
        ctx.shadowColor = '#ff2a6d';
        ctx.shadowBlur = 18;

        // 8 armored twin-barrel turret pylons radiating around outer battle hull
        const ringGrad = ctx.createRadialGradient(0, 0, r0 * 0.42, 0, 0, r0 + 11);
        ringGrad.addColorStop(0, '#160718');
        ringGrad.addColorStop(0.56, '#4c0519');
        ringGrad.addColorStop(0.84, '#e11d48');
        ringGrad.addColorStop(1, '#ff5c91');
        ctx.fillStyle = ringGrad;
        ctx.strokeStyle = '#fecdd3';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let s = 0; s < 16; s++) {
          const a = (s / 16) * Math.PI * 2;
          const r = s % 2 === 0 ? r0 + 10 : r0 * 0.78;
          if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dark beveled inner armor ring + crimson energy conduits
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#070a16';
        ctx.strokeStyle = 'rgba(255, 42, 109, 0.78)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, r0 * 0.64, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 8 glowing turret cannon housings + golden muzzle nodes
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          const cx = Math.cos(a) * (r0 * 0.81);
          const cy = Math.sin(a) * (r0 * 0.81);
          ctx.strokeStyle = '#ff4d84';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * (r0 * 0.64), Math.sin(a) * (r0 * 0.64));
          ctx.lineTo(cx, cy);
          ctx.stroke();

          ctx.fillStyle = '#ffd600';
          ctx.beginPath();
          ctx.arc(cx, cy, 3.0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy, 1.3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 8. Boss Dreadnought — Counter-Rotating Inner Singularity Reactor Core
      reg('enemy_boss_inner', 892, 148, 128, 128, (ctx) => {
        ctx.scale(2, 2);
        // 4 armored aperture reactor blades + golden-crimson containment ring
        ctx.strokeStyle = '#ff2a6d';
        ctx.lineWidth = 3.4;
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2 + 0.18;
          ctx.beginPath();
          ctx.arc(0, 0, 23.5, a, a + 1.15);
          ctx.stroke();
        }
        ctx.strokeStyle = '#ffd600';
        ctx.lineWidth = 1.6;
        for (let k = 0; k < 4; k++) {
          const a = (k * Math.PI) / 2 + 0.35;
          ctx.beginPath();
          ctx.arc(0, 0, 19.5, a, a + 0.82);
          ctx.stroke();
        }
        const core = ctx.createRadialGradient(-3, -3, 1, 0, 0, 16.5);
        core.addColorStop(0, '#ffffff');
        core.addColorStop(0.38, '#fef08a');
        core.addColorStop(0.74, '#ff2a6d');
        core.addColorStop(1, '#4c0519');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, 16.5, 0, Math.PI * 2);
        ctx.fill();
      });

      this.atlasCanvas = c;
      this._bakeGlyphRow();
    }

    _bakeGlyphRow() {
      const c = this.atlasCanvas;
      const g = c.getContext('2d');
      g.clearRect(0, 556, ATLAS_W, 136);
      this.glyphs.clear();

      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ!+-:./%⚠★ ';
      g.save();
      g.font = '900 30px Orbitron, Impact, sans-serif';
      g.textBaseline = 'middle';
      g.textAlign = 'center';
      let gx = 8;
      let gy = 564;
      const cellH = 44;
      for (const ch of chars) {
        const m = g.measureText(ch);
        const adv = Math.max(12, Math.ceil(m.width));
        const cw = adv + 12;
        if (gx + cw > ATLAS_W - 8) {
          gx = 8;
          gy += cellH + 4;
        }
        const cx = gx + cw / 2;
        const cy = gy + cellH / 2;
        g.lineWidth = 6;
        g.strokeStyle = 'rgba(4, 6, 14, 0.92)';
        g.strokeText(ch, cx, cy);
        g.fillStyle = '#ffffff';
        g.fillText(ch, cx, cy);

        this.glyphs.set(ch, {
          w: cw * 0.5,
          h: cellH * 0.5,
          advance: adv * 0.5,
          u0: gx / ATLAS_W,
          v0: gy / ATLAS_H,
          u1: (gx + cw) / ATLAS_W,
          v1: (gy + cellH) / ATLAS_H,
        });
        gx += cw + 4;
      }
      g.restore();
    }

    // ---------- 2. WebGL2 Initialization & Shaders ----------
    _initWebGL2() {
      let gl = null;
      try {
        gl = this.canvas.getContext('webgl2', {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        });
      } catch {}
      if (!gl) return;
      this.gl = gl;

      const bgVs = `#version 300 es
      out vec2 vScreenPx;
      uniform vec2 uView;
      void main() {
        vec2 pos = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
        vScreenPx = vec2(pos.x * uView.x, (1.0 - pos.y) * uView.y);
        gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
      }`;

      const bgFs = `#version 300 es
      precision highp float;
      in vec2 vScreenPx;
      out vec4 fragColor;

      uniform sampler2D uTexNebula;
      uniform sampler2D uTexFar;
      uniform sampler2D uTexNear;
      uniform sampler2D uTexPlanet;

      uniform vec4 uRectNebula;
      uniform vec4 uRectFar;
      uniform vec4 uRectNear;
      uniform vec4 uRectPlanet;
      uniform vec4 uBlackHole0;
      uniform vec4 uBlackHole1;
      uniform vec4 uShockwave;

      vec2 applyLensing(vec2 p, vec4 bh) {
        if (bh.w <= 0.0) return p;
        vec2 d = p - bh.xy;
        float dist2 = dot(d, d);
        float r2 = bh.z * bh.z;
        if (dist2 < r2 * 9.0 && dist2 > 1.0) {
          float pull = (r2 * 0.58) / (dist2 + r2 * 0.24);
          return p - d * pull;
        }
        return p;
      }

      vec2 applyShockwaveRefraction(vec2 p, vec4 sw) {
        if (sw.w <= 0.02) return p;
        vec2 d = p - sw.xy;
        float dist = length(d);
        float band = abs(dist - sw.z);
        if (band < 36.0 && dist > 1.0) {
          float wave = sin((1.0 - band / 36.0) * 3.14159) * 14.0 * sw.w;
          return p + (d / dist) * wave;
        }
        return p;
      }

      vec4 sampleLayer(sampler2D tex, vec2 p, vec4 rect) {
        vec2 uv = (p - rect.xy) / rect.zw;
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return vec4(0.0);
        return texture(tex, uv);
      }

      void main() {
        vec2 p = applyLensing(vScreenPx, uBlackHole0);
        p = applyLensing(p, uBlackHole1);
        p = applyShockwaveRefraction(p, uShockwave);

        vec3 col = vec3(0.008, 0.012, 0.039);

        vec4 neb = sampleLayer(uTexNebula, p, uRectNebula);
        col = mix(col, neb.rgb, neb.a);

        vec4 farS = sampleLayer(uTexFar, p, uRectFar);
        col += farS.rgb * farS.a;

        vec4 pl = sampleLayer(uTexPlanet, p, uRectPlanet);
        col = mix(col, pl.rgb, pl.a * 0.92);

        vec4 nearS = sampleLayer(uTexNear, p, uRectNear);
        col += nearS.rgb * nearS.a;

        fragColor = vec4(col, 1.0);
      }`;

      const instVs = `#version 300 es
      layout(location=0) in vec2 aQuad;
      layout(location=1) in vec4 aPosSize;
      layout(location=2) in vec4 aUv;
      layout(location=3) in vec4 aColor;
      layout(location=4) in vec2 aRot;

      uniform vec2 uView;
      uniform vec4 uCamShake;
      uniform vec2 uShakeRot;
      uniform float uScreenSpace;

      out vec2 vUv;
      out vec4 vColor;
      out float vFlash;

      void main() {
        vec2 local = aQuad * aPosSize.zw;
        vec2 rotated = vec2(
          local.x * aRot.x - local.y * aRot.y,
          local.x * aRot.y + local.y * aRot.x
        );
        vec2 pos = aPosSize.xy + rotated;

        vec2 screenPos;
        if (uScreenSpace > 0.5) {
          screenPos = pos;
        } else {
          vec2 camRel = pos - uCamShake.xy;
          vec2 camRot = vec2(
            camRel.x * uShakeRot.x - camRel.y * uShakeRot.y,
            camRel.x * uShakeRot.y + camRel.y * uShakeRot.x
          );
          screenPos = camRot + uView * 0.5 + uCamShake.zw;
        }

        vec2 clip = (screenPos / uView) * 2.0 - 1.0;
        gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);

        vUv = mix(aUv.xy, aUv.zw, aQuad + 0.5);
        if (aColor.a < 0.0) {
          vFlash = 1.0;
          vColor = vec4(aColor.rgb, -aColor.a);
        } else {
          vFlash = 0.0;
          vColor = aColor;
        }
      }`;

      const instFs = `#version 300 es
      precision mediump float;
      in vec2 vUv;
      in vec4 vColor;
      in float vFlash;
      uniform sampler2D uAtlas;
      out vec4 fragColor;

      void main() {
        vec4 tex = texture(uAtlas, vUv);
        vec3 rgb = vFlash > 0.5 ? mix(tex.rgb * vColor.rgb, vec3(1.0), 0.92) : tex.rgb * vColor.rgb;
        fragColor = vec4(rgb, tex.a * vColor.a);
      }`;

      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error(gl.getShaderInfoLog(s));
          gl.deleteShader(s);
          return null;
        }
        return s;
      };

      const link = (vs, fs) => {
        const p = gl.createProgram();
        gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
          console.error(gl.getProgramInfoLog(p));
          return null;
        }
        return p;
      };

      this.bgProg = link(bgVs, bgFs);
      this.instProg = link(instVs, instFs);
      if (!this.bgProg || !this.instProg) {
        this.gl = null;
        return;
      }

      this.bgLocs = {
        uView: gl.getUniformLocation(this.bgProg, 'uView'),
        uTexNebula: gl.getUniformLocation(this.bgProg, 'uTexNebula'),
        uTexFar: gl.getUniformLocation(this.bgProg, 'uTexFar'),
        uTexNear: gl.getUniformLocation(this.bgProg, 'uTexNear'),
        uTexPlanet: gl.getUniformLocation(this.bgProg, 'uTexPlanet'),
        uRectNebula: gl.getUniformLocation(this.bgProg, 'uRectNebula'),
        uRectFar: gl.getUniformLocation(this.bgProg, 'uRectFar'),
        uRectNear: gl.getUniformLocation(this.bgProg, 'uRectNear'),
        uRectPlanet: gl.getUniformLocation(this.bgProg, 'uRectPlanet'),
        uBlackHole0: gl.getUniformLocation(this.bgProg, 'uBlackHole0'),
        uBlackHole1: gl.getUniformLocation(this.bgProg, 'uBlackHole1'),
        uShockwave: gl.getUniformLocation(this.bgProg, 'uShockwave'),
      };

      this.instLocs = {
        uView: gl.getUniformLocation(this.instProg, 'uView'),
        uCamShake: gl.getUniformLocation(this.instProg, 'uCamShake'),
        uShakeRot: gl.getUniformLocation(this.instProg, 'uShakeRot'),
        uScreenSpace: gl.getUniformLocation(this.instProg, 'uScreenSpace'),
        uAtlas: gl.getUniformLocation(this.instProg, 'uAtlas'),
      };

      this.bgVao = gl.createVertexArray();
      this.instVao = gl.createVertexArray();
      gl.bindVertexArray(this.instVao);

      const quadBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      this.instData = new Float32Array(MAX_INSTANCES * FLOATS_PER_INST);
      this.instCount = 0;
      this.instBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
      gl.bufferData(gl.ARRAY_BUFFER, this.instData.byteLength, gl.DYNAMIC_DRAW);

      const stride = FLOATS_PER_INST * 4;
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 0);
      gl.vertexAttribDivisor(1, 1);

      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, 16);
      gl.vertexAttribDivisor(2, 1);

      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 4, gl.FLOAT, false, stride, 32);
      gl.vertexAttribDivisor(3, 1);

      gl.enableVertexAttribArray(4);
      gl.vertexAttribPointer(4, 2, gl.FLOAT, false, stride, 48);
      gl.vertexAttribDivisor(4, 1);

      const makeTex = () => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
      };

      this.texAtlas = makeTex();
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.atlasCanvas);

      this.texNebula = makeTex();
      this.texFar = makeTex();
      this.texNear = makeTex();
      this.texPlanet = makeTex();
    }

    _syncSpaceTextures() {
      const gl = this.gl;
      const sp = this.space;
      if (!gl || !sp || sp.version === this._spaceVersion) return;
      if (!sp.nebulaCanvas || !sp.farStarCanvas || !sp.nearStarCanvas || !sp.planetCanvas) return;

      gl.bindTexture(gl.TEXTURE_2D, this.texNebula);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sp.nebulaCanvas);

      gl.bindTexture(gl.TEXTURE_2D, this.texFar);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sp.farStarCanvas);

      gl.bindTexture(gl.TEXTURE_2D, this.texNear);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sp.nearStarCanvas);

      gl.bindTexture(gl.TEXTURE_2D, this.texPlanet);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sp.planetCanvas);

      this._spaceVersion = sp.version;
    }

    resize(viewW, viewH, dpr) {
      this.viewW = viewW;
      this.viewH = viewH;
      this.baseDpr = dpr;
      this._applyResolution();
    }

    _applyResolution() {
      this.dpr = Math.max(0.75, Math.min(2.0, this.baseDpr * this.renderScale));
      const targetW = Math.floor(this.viewW * this.dpr);
      const targetH = Math.floor(this.viewH * this.dpr);
      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW;
        this.canvas.height = targetH;
      }
    }

    // ---------- 3. Instanced Batch Helpers (Single GPU Upload Per Frame) ----------
    _pushQuad(x, y, w, h, sp, r, g, b, a, cos = 1, sin = 0) {
      if (this.instCount >= MAX_INSTANCES) {
        this._recordBatch();
        this._submitBatches();
      }
      const idx = this.instCount * FLOATS_PER_INST;
      const d = this.instData;
      d[idx] = x;
      d[idx + 1] = y;
      d[idx + 2] = w;
      d[idx + 3] = h;
      d[idx + 4] = sp.u0;
      d[idx + 5] = sp.v0;
      d[idx + 6] = sp.u1;
      d[idx + 7] = sp.v1;
      d[idx + 8] = r;
      d[idx + 9] = g;
      d[idx + 10] = b;
      d[idx + 11] = a;
      d[idx + 12] = cos;
      d[idx + 13] = sin;
      this.instCount++;
    }

    _pushLine(x1, y1, x2, y2, thickness, sp, r, g, b, a) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 0.001) return;
      const cos = dx / len;
      const sin = dy / len;
      this._pushQuad((x1 + x2) * 0.5, (y1 + y2) * 0.5, len, thickness, sp, r, g, b, a, cos, sin);
    }

    _recordBatch() {
      const count = this.instCount - this._batchStart;
      if (count <= 0) return;
      if (this._batchCount >= this._batches.length) {
        this._batches.push({ start: 0, count: 0, additive: false, screenSpace: false });
      }
      const b = this._batches[this._batchCount++];
      b.start = this._batchStart;
      b.count = count;
      b.additive = Boolean(this._curAdditive);
      b.screenSpace = Boolean(this._curScreenSpace);
      this._batchStart = this.instCount;
    }

    _flushBatch() {
      this._recordBatch();
      this._submitBatches();
    }

    _submitBatches() {
      if (this.instCount === 0 || this._batchCount === 0) {
        this.instCount = 0;
        this._batchCount = 0;
        this._batchStart = 0;
        return;
      }
      const gl = this.gl;
      const stride = FLOATS_PER_INST * 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf);
      // Orphan buffer once per frame to prevent GPU pipeline stalls, then upload all batches in ONE WebGL2 call (zero .subarray() alloc)
      gl.bufferData(gl.ARRAY_BUFFER, this.instData.byteLength, gl.STREAM_DRAW);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.instData, 0, this.instCount * FLOATS_PER_INST);

      let curAdd = null;
      let curScreen = null;
      for (let i = 0; i < this._batchCount; i++) {
        const b = this._batches[i];
        if (curAdd !== b.additive) {
          curAdd = b.additive;
          if (curAdd) gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
          else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
        if (curScreen !== b.screenSpace) {
          curScreen = b.screenSpace;
          gl.uniform1f(this.instLocs.uScreenSpace, curScreen ? 1.0 : 0.0);
        }
        const byteOff = b.start * stride;
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, byteOff);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, stride, byteOff + 16);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, stride, byteOff + 32);
        gl.vertexAttribPointer(4, 2, gl.FLOAT, false, stride, byteOff + 48);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, b.count);
      }

      this.instCount = 0;
      this._batchCount = 0;
      this._batchStart = 0;
    }

    _setMode(additive, screenSpace) {
      if (this._curAdditive === additive && this._curScreenSpace === screenSpace) return;
      this._recordBatch();
      this._curAdditive = additive;
      this._curScreenSpace = screenSpace;
    }

    // ---------- 4. Main Frame Render Entry ----------
    render(game, alpha = 1) {
      const now = performance.now();
      if (this.lastFrameTimestamp > 0) {
        const dtMs = now - this.lastFrameTimestamp;
        if (dtMs > 4 && dtMs < 120) {
          this.emaFrameMs = this.emaFrameMs * 0.9 + dtMs * 0.1;
          if (this.adaptCooldown > 0) {
            this.adaptCooldown--;
          } else if (this.emaFrameMs > 20.0 && this.renderScale > 0.72) {
            this.renderScale = Math.max(0.7, this.renderScale - 0.15);
            this._applyResolution();
            this.adaptCooldown = 45;
          } else if (this.emaFrameMs < 13.5 && this.renderScale < 0.99) {
            this.renderScale = Math.min(1.0, this.renderScale + 0.15);
            this._applyResolution();
            this.adaptCooldown = 90;
          }
        }
      }
      this.lastFrameTimestamp = now;

      if (this._contextLost) return;
      if (!this.gl) {
        this._renderCanvas2DFallback(game, alpha);
        return;
      }

      if (game.state === 'title' && game.titleScene) {
        this._renderTitleCitadel(game);
        return;
      }

      const gl = this.gl;
      const sp = this.space;
      const camX = game.camera.prevX !== undefined ? game.camera.prevX + (game.camera.x - game.camera.prevX) * alpha : game.camera.x;
      const camY = game.camera.prevY !== undefined ? game.camera.prevY + (game.camera.y - game.camera.prevY) * alpha : game.camera.y;
      const shake = game.shaker.getOffset();
      const overdrive = game.overdriveTimer > 0;

      this._syncSpaceTextures();

      gl.viewport(0, 0, this.canvas.width, this.canvas.height);

      // --- PASS 1: Single-Pass Parallax Space Backdrop + Gravitational Lensing & Shockwave Refraction ---
      gl.disable(gl.BLEND);
      gl.useProgram(this.bgProg);
      gl.bindVertexArray(this.bgVao);
      gl.uniform2f(this.bgLocs.uView, this.viewW, this.viewH);

      const fillLayerRect = (out, lw, lh, z) => {
        const ox = -(camX - sp.arenaW / 2) * z;
        const oy = -(camY - sp.arenaH / 2) * z;
        out[0] = Math.round((this.viewW - lw) / 2 + ox);
        out[1] = Math.round((this.viewH - lh) / 2 + oy);
        out[2] = lw;
        out[3] = lh;
        return out;
      };

      const nebW = sp.nebulaLogicalW || sp.nebulaCanvas.width;
      const nebH = sp.nebulaLogicalH || sp.nebulaCanvas.height;
      const farW = sp.farStarLogicalW || sp.farStarCanvas.width;
      const farH = sp.farStarLogicalH || sp.farStarCanvas.height;
      const nearW = sp.nearStarLogicalW || sp.nearStarCanvas.width;
      const nearH = sp.nearStarLogicalH || sp.nearStarCanvas.height;
      const rNeb = fillLayerRect(this._rectNeb, nebW, nebH, sp.Z_NEBULA);
      const rFar = fillLayerRect(this._rectFar, farW, farH, sp.Z_FAR_STARS);
      const rNear = fillLayerRect(this._rectNear, nearW, nearH, sp.Z_NEAR_STARS);

      const plOx = -(camX - sp.arenaW / 2) * sp.Z_PLANET;
      const plOy = -(camY - sp.arenaH / 2) * sp.Z_PLANET;
      const plW = sp.planetLogicalSize || sp.planetCanvas.width;
      const plX = Math.round(this.viewW * 0.04 + plOx - plW / 2);
      const plY = Math.round(this.viewH + sp.planetR * 0.18 + plOy - plW / 2);

      gl.uniform4f(this.bgLocs.uRectNebula, rNeb[0], rNeb[1], rNeb[2], rNeb[3]);
      gl.uniform4f(this.bgLocs.uRectFar, rFar[0], rFar[1], rFar[2], rFar[3]);
      gl.uniform4f(this.bgLocs.uRectNear, rNear[0], rNear[1], rNear[2], rNear[3]);
      gl.uniform4f(this.bgLocs.uRectPlanet, plX, plY, plW, plW);

      const bh0 = game.blackHoles[0];
      const bh1 = game.blackHoles[1];
      if (bh0) {
        gl.uniform4f(this.bgLocs.uBlackHole0, bh0.x - camX + this.viewW * 0.5, bh0.y - camY + this.viewH * 0.5, 74, 1);
      } else {
        gl.uniform4f(this.bgLocs.uBlackHole0, 0, 0, 1, 0);
      }
      if (bh1) {
        gl.uniform4f(this.bgLocs.uBlackHole1, bh1.x - camX + this.viewW * 0.5, bh1.y - camY + this.viewH * 0.5, 74, 1);
      } else {
        gl.uniform4f(this.bgLocs.uBlackHole1, 0, 0, 1, 0);
      }

      let bestSw = null;
      for (let i = 0; i < game.shockwaves.length; i++) {
        const sw = game.shockwaves[i];
        if (!bestSw || sw.maxR > bestSw.maxR) bestSw = sw;
      }
      if (bestSw && bestSw.alpha > 0.05) {
        gl.uniform4f(
          this.bgLocs.uShockwave,
          bestSw.x - camX + this.viewW * 0.5,
          bestSw.y - camY + this.viewH * 0.5,
          bestSw.r,
          bestSw.alpha
        );
      } else {
        gl.uniform4f(this.bgLocs.uShockwave, 0, 0, 1, 0);
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texNebula);
      gl.uniform1i(this.bgLocs.uTexNebula, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.texFar);
      gl.uniform1i(this.bgLocs.uTexFar, 1);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.texNear);
      gl.uniform1i(this.bgLocs.uTexNear, 2);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.texPlanet);
      gl.uniform1i(this.bgLocs.uTexPlanet, 3);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // --- PASS 2..4: Hardware-Instanced Batch Pipeline ---
      gl.enable(gl.BLEND);
      gl.useProgram(this.instProg);
      gl.bindVertexArray(this.instVao);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texAtlas);
      gl.uniform1i(this.instLocs.uAtlas, 0);
      gl.uniform2f(this.instLocs.uView, this.viewW, this.viewH);
      gl.uniform4f(this.instLocs.uCamShake, camX, camY, shake.x, shake.y);
      gl.uniform2f(this.instLocs.uShakeRot, Math.cos(shake.angle), Math.sin(shake.angle));

      this.instCount = 0;
      this._curAdditive = null;
      this._curScreenSpace = null;

      const sWhite = this.sprites.white;
      const sCircle = this.sprites.circle;
      const sGlow = this.sprites.glow_disc;

      // 1. Screen-space realistic twinkling astronomical stars, tapered shooting stars & foreground dust streaks
      this._setMode(true, true);
      if (sp.twinklers) {
        const nx = rNear[0];
        const ny = rNear[1];
        for (let i = 0; i < sp.twinklers.length; i++) {
          const t = sp.twinklers[i];
          const sx = nx + t.x;
          const sy = ny + t.y;
          if (sx < -14 || sy < -14 || sx > this.viewW + 14 || sy > this.viewH + 14) continue;
          const tw = 0.5 + 0.5 * Math.sin(sp.time * t.speed + t.phase);
          const [cr, cg, cb] = t.rgb;
          const rf = cr / 255, gf = cg / 255, bf = cb / 255;
          // Soft deep-field stellar halo + razor-sharp white-hot star pinpoint
          const haloSz = t.r * (3.2 + tw * 2.2);
          this._pushQuad(sx, sy, haloSz, haloSz, sGlow, rf, gf, bf, (0.12 + tw * 0.24));
          const coreSz = t.r * (1.1 + tw * 0.45);
          this._pushQuad(sx, sy, coreSz, coreSz, sCircle, 1.0, 1.0, 1.0, (0.28 + tw * 0.52));
          // Subtle 4-point optical diffraction glint on brightest background stars (non-intrusive!)
          if (t.bright && tw > 0.35) {
            const spikeLen = (7 + tw * 8) * t.r;
            const sa = (tw - 0.35) * 0.46;
            this._pushLine(sx - spikeLen, sy, sx + spikeLen, sy, 0.9, sWhite, rf, gf, bf, sa);
            this._pushLine(sx, sy - spikeLen, sx, sy + spikeLen, 0.9, sWhite, rf, gf, bf, sa);
          }
        }
      }

      for (let i = 0; i < sp.shootingStars.length; i++) {
        const s = sp.shootingStars[i];
        const frac = Math.max(0, Math.min(1, s.life / s.maxLife));
        // Smooth ease-in/out meteor visibility curve (background-only alpha so gameplay stays 100% clear)
        const a = Math.sin(frac * Math.PI) * 0.58;
        if (a < 0.02) continue;
        const [sr, sg, sb] = s.rgb || [188, 234, 255];
        const rf = sr / 255, gf = sg / 255, bf = sb / 255;
        // 3-stage tapered incandescent ionization trail (head -> mid plasma -> faint vapor wake)
        const m1x = s.x - s.vx * 0.045;
        const m1y = s.y - s.vy * 0.045;
        const m2x = s.x - s.vx * 0.105;
        const m2y = s.y - s.vy * 0.105;
        const tX = s.x - s.vx * 0.185;
        const tY = s.y - s.vy * 0.185;
        this._pushLine(s.x, s.y, m1x, m1y, 2.2, sWhite, 1.0, 1.0, 1.0, a * 0.92);
        this._pushLine(m1x, m1y, m2x, m2y, 1.5, sWhite, rf, gf, bf, a * 0.62);
        this._pushLine(m2x, m2y, tX, tY, 0.95, sWhite, rf, gf, bf, a * 0.26);
        // Incandescent pinpoint meteor head + soft atmospheric aura
        this._pushQuad(s.x, s.y, 14, 14, sGlow, rf, gf, bf, a * 0.55);
        this._pushQuad(s.x, s.y, 3.8, 3.8, sCircle, 1.0, 1.0, 1.0, a * 0.98);
      }

      const p = game.player;
      const isTitle = game.state === 'title';
      const pSpeed = isTitle ? 380 : Math.hypot(p.vx, p.vy);
      const streak = Math.min(1, pSpeed / 900);
      const dr = overdrive ? 0.96 : 0.61;
      const dg = overdrive ? 0.78 : 0.86;
      const db = overdrive ? 0.45 : 1.0;
      const dustVx = isTitle ? 480 : p.vx;
      const dustVy = isTitle ? 0 : p.vy;
      for (let i = 0; i < sp.dust.length; i++) {
        const d = sp.dust[i];
        const dx = (((d.x - camX * d.z) % this.viewW) + this.viewW) % this.viewW;
        const dy = (((d.y - camY * d.z) % this.viewH) + this.viewH) % this.viewH;
        const ex = dx - dustVx * 0.022 * d.z - 2.0;
        const ey = dy - dustVy * 0.022 * d.z;
        this._pushLine(dx, dy, ex, ey, isTitle ? 1.4 : 1.2, sWhite, dr, dg, db, d.alpha * (isTitle ? 0.85 : (0.45 + streak * 0.9)));
      }

      // On the Home Screen, render ONLY the deep-space parallax cosmos (no background moving rocket or arena grid)
      if (isTitle) {
        this._flushBatch();
        return;
      }

      // 2. World-space Opaque / Alpha Batch (Grid, Arena Bounds, Rotating Black Holes)
      this._setMode(false, false);
      const ARENA_W = 2200;
      const ARENA_H = 1600;

      const step = 180;
      const startX = Math.max(step, Math.floor((camX - this.viewW / 2) / step) * step);
      const endX = Math.min(ARENA_W - step, Math.ceil((camX + this.viewW / 2) / step) * step);
      const startY = Math.max(step, Math.floor((camY - this.viewH / 2) / step) * step);
      const endY = Math.min(ARENA_H - step, Math.ceil((camY + this.viewH / 2) / step) * step);
      const gr = overdrive ? 1.0 : 0.59;
      const gg = overdrive ? 0.84 : 0.86;
      const gb = overdrive ? 0.0 : 1.0;
      const ga = overdrive ? 0.25 : 0.14;
      for (let x = startX; x <= endX; x += step) {
        for (let y = startY; y <= endY; y += step) {
          this._pushQuad(x, y, 2.5, 2.5, sWhite, gr, gg, gb, ga);
        }
      }

      const viewHalfW = this.viewW * 0.5;
      const viewHalfH = this.viewH * 0.5;
      const vMinX = camX - viewHalfW - 40;
      const vMaxX = camX + viewHalfW + 40;
      const vMinY = camY - viewHalfH - 40;
      const vMaxY = camY + viewHalfH + 40;
      const cullMinX = vMinX - 50;
      const cullMaxX = vMaxX + 50;
      const cullMinY = vMinY - 50;
      const cullMaxY = vMaxY + 50;

      // Dimmed void outside arena bounds (viewport-clamped so zero off-screen overdraw!)
      if (vMinY < 0) {
        const h = -vMinY;
        const x0 = vMinX, x1 = vMaxX;
        this._pushQuad((x0 + x1) * 0.5, vMinY * 0.5, x1 - x0, h, sWhite, 0.004, 0.008, 0.03, 0.55);
      }
      if (vMaxY > ARENA_H) {
        const h = vMaxY - ARENA_H;
        const x0 = vMinX, x1 = vMaxX;
        this._pushQuad((x0 + x1) * 0.5, ARENA_H + h * 0.5, x1 - x0, h, sWhite, 0.004, 0.008, 0.03, 0.55);
      }
      if (vMinX < 0) {
        const w = -vMinX;
        const y0 = Math.max(0, vMinY), y1 = Math.min(ARENA_H, vMaxY);
        if (y1 > y0) this._pushQuad(vMinX * 0.5, (y0 + y1) * 0.5, w, y1 - y0, sWhite, 0.004, 0.008, 0.03, 0.55);
      }
      if (vMaxX > ARENA_W) {
        const w = vMaxX - ARENA_W;
        const y0 = Math.max(0, vMinY), y1 = Math.min(ARENA_H, vMaxY);
        if (y1 > y0) this._pushQuad(ARENA_W + w * 0.5, (y0 + y1) * 0.5, w, y1 - y0, sWhite, 0.004, 0.008, 0.03, 0.55);
      }

      // Arena plasma perimeter barrier
      this._pushLine(0, 0, ARENA_W, 0, 12, sWhite, 0, 0.94, 1, 0.22);
      this._pushLine(ARENA_W, 0, ARENA_W, ARENA_H, 12, sWhite, 0, 0.94, 1, 0.22);
      this._pushLine(ARENA_W, ARENA_H, 0, ARENA_H, 12, sWhite, 0, 0.94, 1, 0.22);
      this._pushLine(0, ARENA_H, 0, 0, 12, sWhite, 0, 0.94, 1, 0.22);

      this._pushLine(0, 0, ARENA_W, 0, 2.8, sWhite, 0, 0.94, 1, 0.95);
      this._pushLine(ARENA_W, 0, ARENA_W, ARENA_H, 2.8, sWhite, 0, 0.94, 1, 0.95);
      this._pushLine(ARENA_W, ARENA_H, 0, ARENA_H, 2.8, sWhite, 0, 0.94, 1, 0.95);
      this._pushLine(0, ARENA_H, 0, 0, 2.8, sWhite, 0, 0.94, 1, 0.95);

      // Arena corner beacons (zero per-frame array allocation)
      for (let c = 0; c < 4; c++) {
        const cx = (c === 1 || c === 2) ? ARENA_W : 0;
        const cy = (c === 2 || c === 3) ? ARENA_H : 0;
        if (cx < cullMinX || cx > cullMaxX || cy < cullMinY || cy > cullMaxY) continue;
        this._pushQuad(cx, cy, 48, 48, sGlow, 0, 0.94, 1, 0.65);
        this._pushQuad(cx, cy, 24, 24, sCircle, 0, 0.94, 1, 1);
      }

      // Rotating relativistic Black Holes with smooth spawn-in / implode-out scale
      const sBh = this.sprites.black_hole;
      for (let i = 0; i < game.blackHoles.length; i++) {
        const bh = game.blackHoles[i];
        const age = (bh.maxLife || 3.2) - bh.life;
        const spawnScale = Math.min(1, age / 0.24);
        const fadeScale = bh.life < 0.35 ? bh.life / 0.35 : 1;
        const sz = 148 * spawnScale * fadeScale;
        const rot = game.elapsed * 2.8 + i * 1.7;
        this._pushQuad(bh.x, bh.y, sz, sz, sBh, 1, 1, 1, 1, Math.cos(rot), Math.sin(rot));
      }

      // 3. Additive World-Space Batch (Gems, Shockwaves, Tethers, Trails, Projectiles, Lightnings, Particles)
      this._setMode(true, false);

      const pX = p.prevX !== undefined ? p.prevX + (p.x - p.prevX) * alpha : p.x;
      const pY = p.prevY !== undefined ? p.prevY + (p.y - p.prevY) * alpha : p.y;

      const sGem = this.sprites.gem;
      const gemPulse = 1 + Math.sin(game.elapsed * 6) * 0.08;
      for (let i = 0; i < game.gems.length; i++) {
        const gm = game.gems[i];
        const gx = gm.prevX !== undefined ? gm.prevX + (gm.x - gm.prevX) * alpha : gm.x;
        const gy = gm.prevY !== undefined ? gm.prevY + (gm.y - gm.prevY) * alpha : gm.y;
        if (gx < cullMinX || gx > cullMaxX || gy < cullMinY || gy > cullMaxY) continue;
        const sz = 24 * gemPulse;
        this._pushQuad(gx, gy, sz, sz, sGem, 1, 1, 1, 1);
      }

      const sSw = this.sprites.shockwave;
      for (let i = 0; i < game.shockwaves.length; i++) {
        const sw = game.shockwaves[i];
        const r = sw.r;
        if (sw.x + r < cullMinX || sw.x - r > cullMaxX || sw.y + r < cullMinY || sw.y - r > cullMaxY) continue;
        const [cr, cg, cb] = parseColor(sw.color);
        const d = r * 2.25;
        this._pushQuad(sw.x, sw.y, d, d, sSw, cr, cg, cb, Math.max(0, sw.alpha));
      }

      const allOrbs = game.getAllOrbs();
      const laserTether = game.mods.laserTether > 0;
      for (let i = 0; i < allOrbs.length; i++) {
        const orb = allOrbs[i];
        const ox = orb.prevX !== undefined ? orb.prevX + (orb.x - orb.prevX) * alpha : orb.x;
        const oy = orb.prevY !== undefined ? orb.prevY + (orb.y - orb.prevY) * alpha : orb.y;
        const speed = Math.hypot(orb.vx, orb.vy);
        const colHex = orb.isTemp ? '#e879f9' : (speed > 650 ? '#ff2a6d' : speed > 360 ? '#ffd600' : '#00f0ff');
        const [cr, cg, cb] = parseColor(laserTether ? '#ff2a6d' : colHex);

        // Dynamic tension-energized plasma tether
        const tdx = ox - pX;
        const tdy = oy - pY;
        const tDist = Math.hypot(tdx, tdy) || 1;
        const pnx = -tdy / tDist;
        const pny = tdx / tDist;
        const tension = p.yanking ? 5.8 * (0.4 + p.yankCharge) : laserTether ? 3.5 : Math.max(0, (tDist - 160) * 0.014);
        const segs = 6;
        let prevTx = pX;
        let prevTy = pY;
        const beamW = laserTether ? 4.4 : (p.yanking ? 3.4 : 2.5);
        for (let k = 1; k <= segs; k++) {
          const t = k / segs;
          const env = Math.sin(t * Math.PI);
          const wave = tension > 0.15 ? Math.sin(game.elapsed * 28 + k * 1.9 + i * 2.1) * tension * env : 0;
          const nx = pX + tdx * t + pnx * wave;
          const ny = pY + tdy * t + pny * wave;
          this._pushLine(prevTx, prevTy, nx, ny, beamW * 2.4, sWhite, cr, cg, cb, 0.22);
          this._pushLine(prevTx, prevTy, nx, ny, beamW, sWhite, cr, cg, cb, 0.88);
          if (k < segs) {
            this._pushQuad(nx, ny, 5.2, 5.2, sCircle, 1, 1, 1, 0.9);
          }
          prevTx = nx;
          prevTy = ny;
        }

        // Continuous tapered plasma comet ribbon trail (single tapered quad per segment = silky look, 50% less overdraw)
        const [tr, tg, tb] = parseColor(colHex);
        const tCount = orb.trailCount || 0;
        const tCap = orb.trailX ? orb.trailX.length : 0;
        if (tCount > 1 && tCap > 0) {
          const startIdx = (orb.trailHead - tCount + tCap) % tCap;
          const stepJ = tCount > 12 ? 2 : 1;
          let lx = orb.trailX[startIdx];
          let ly = orb.trailY[startIdx];
          for (let j = stepJ; j < tCount; j += stepJ) {
            const idx = (startIdx + j) % tCap;
            const cx = orb.trailX[idx];
            const cy = orb.trailY[idx];
            const frac = j / tCount;
            const d = orb.radius * frac * 1.48;
            this._pushLine(lx, ly, cx, cy, d, sWhite, tr, tg, tb, frac * 0.42);
            lx = cx;
            ly = cy;
          }
          this._pushLine(lx, ly, ox, oy, orb.radius * 1.38, sWhite, tr, tg, tb, 0.44);
        }
      }

      // Active starship theme metadata (drives hull sprite, thruster array, and accent glow)
      const shipDef = window.ChaosShips ? window.ChaosShips.get(game.selectedShipId) : null;
      const shipTrailRgb = shipDef ? shipDef.trailRgb : [0.0, 0.94, 1.0];

      // Ship subtle ion afterimage trail (crisp, non-cluttered, tinted to equipped starship)
      const pCount = p.trailCount || 0;
      const pCap = p.trailX ? p.trailX.length : 0;
      if (pCount > 0 && pCap > 0) {
        const startIdx = (p.trailHead - pCount + pCap) % pCap;
        for (let i = 0; i < pCount; i++) {
          const idx = (startIdx + i) % pCap;
          const frac = (i + 1) / pCount;
          const d = p.radius * frac * (p.trailDash[idx] ? 1.65 : 1.15);
          if (p.trailDash[idx]) {
            this._pushQuad(p.trailX[idx], p.trailY[idx], d, d, sGlow, 1.0, 0.84, 0.0, frac * 0.65);
          } else {
            this._pushQuad(p.trailX[idx], p.trailY[idx], d, d, sGlow, shipTrailRgb[0], shipTrailRgb[1], shipTrailRgb[2], frac * 0.24);
          }
        }
      }

      // Overdrive golden-violet energy halo around player ship
      if (overdrive) {
        const odPulse = 1 + Math.sin(game.elapsed * 14) * 0.09;
        const odAlpha = game.overdriveTimer < 1.2 ? (game.overdriveTimer / 1.2) * 0.55 : 0.48;
        this._pushQuad(pX, pY, 96 * odPulse, 96 * odPulse, sSw, 1.0, 0.82, 0.18, odAlpha);
      }

      // Homing plasma shrapnel bolts (oriented along velocity) & Boss energy orbs
      const sBolt = this.sprites.shrapnel_bolt;
      for (let i = 0; i < game.projectiles.length; i++) {
        const pr = game.projectiles[i];
        const prx = pr.prevX !== undefined ? pr.prevX + (pr.x - pr.prevX) * alpha : pr.x;
        const pry = pr.prevY !== undefined ? pr.prevY + (pr.y - pr.prevY) * alpha : pr.y;
        if (prx < cullMinX || prx > cullMaxX || pry < cullMinY || pry > cullMaxY) continue;
        const spd = Math.hypot(pr.vx, pr.vy) || 1;
        this._pushQuad(prx, pry, 26, 26, sBolt, 1, 1, 1, 1, pr.vx / spd, pr.vy / spd);
      }

      const sBullet = this.sprites.enemy_bullet;
      for (let i = 0; i < game.enemyBullets.length; i++) {
        const b = game.enemyBullets[i];
        const bx = b.prevX !== undefined ? b.prevX + (b.x - b.prevX) * alpha : b.x;
        const by = b.prevY !== undefined ? b.prevY + (b.y - b.prevY) * alpha : b.y;
        if (bx < cullMinX || bx > cullMaxX || by < cullMinY || by > cullMaxY) continue;
        this._pushQuad(bx, by, b.radius * 3.4, b.radius * 3.4, sBullet, 1, 1, 1, 1);
      }

      // High-voltage Arc Conductor lightning bolts (viewport-culled multi-segment jagged core + cyan glow)
      for (let i = 0; i < game.lightnings.length; i++) {
        const l = game.lightnings[i];
        if ((l.x1 < cullMinX && l.x2 < cullMinX) || (l.x1 > cullMaxX && l.x2 > cullMaxX) ||
            (l.y1 < cullMinY && l.y2 < cullMinY) || (l.y1 > cullMaxY && l.y2 > cullMaxY)) continue;
        const mx = (l.x1 + l.x2) * 0.5 + (Math.random() - 0.5) * 30;
        const my = (l.y1 + l.y2) * 0.5 + (Math.random() - 0.5) * 30;
        const la = Math.min(1, l.life / 0.12);
        this._pushLine(l.x1, l.y1, mx, my, 7.0, sWhite, 0.0, 0.85, 1.0, 0.32 * la);
        this._pushLine(mx, my, l.x2, l.y2, 7.0, sWhite, 0.0, 0.85, 1.0, 0.32 * la);
        this._pushLine(l.x1, l.y1, mx, my, 2.4, sWhite, 0.88, 0.98, 1.0, 0.98 * la);
        this._pushLine(mx, my, l.x2, l.y2, 2.4, sWhite, 0.88, 0.98, 1.0, 0.98 * la);
        this._pushQuad(l.x2, l.y2, 22, 22, sGlow, 0.35, 0.95, 1.0, 0.75 * la);
      }

      // Additive energy sparks (trig-free velocity-aligned) + metallic debris shards + anamorphic blast flares
      const sPart = this.sprites.particle;
      const sDebris = this.sprites.debris;
      for (let i = 0; i < game.particles.length; i++) {
        const pt = game.particles[i];
        if (pt.x < cullMinX || pt.x > cullMaxX || pt.y < cullMinY || pt.y > cullMaxY) continue;
        const a = Math.max(0, pt.life / pt.maxLife);
        const [cr, cg, cb] = parseColor(pt.color);
        if (pt.kind === 1) {
          const sz = pt.size * 3.1;
          this._pushQuad(pt.x, pt.y, sz, sz, sDebris, cr, cg, cb, a * 0.92, Math.cos(pt.rot), Math.sin(pt.rot));
        } else {
          const spd = Math.hypot(pt.vx, pt.vy);
          const stretch = 1 + Math.min(1.6, spd * 0.0028);
          const sz = pt.size * 3.2;
          if (spd > 18) {
            this._pushQuad(pt.x, pt.y, sz * stretch, sz * 0.88, sPart, cr, cg, cb, a, pt.vx / spd, pt.vy / spd);
          } else {
            this._pushQuad(pt.x, pt.y, sz * stretch, sz * 0.88, sPart, cr, cg, cb, a, Math.cos(pt.rot), Math.sin(pt.rot));
          }
        }
      }

      const sFlare = this.sprites.impact_flare;
      const flares = game.impactFlares;
      if (flares) {
        for (let i = 0; i < flares.length; i++) {
          const fl = flares[i];
          if (fl.x < cullMinX || fl.x > cullMaxX || fl.y < cullMinY || fl.y > cullMaxY) continue;
          const k = Math.max(0, fl.life / fl.maxLife);
          const [cr, cg, cb] = parseColor(fl.color);
          const sz = fl.size * (0.55 + k * 0.72);
          this._pushQuad(fl.x, fl.y, sz, sz, sFlare, cr, cg, cb, k, Math.cos(fl.rot), Math.sin(fl.rot));
        }
      }

      // Live Holographic Tactical Ring + Red Enemy Proximity Threat Radar (additive crisp glow!)
      const sThreat = this.sprites.threat_arc;
      const enemies = game.enemies;
      const tIdx = this._threatIdx;
      const tD2 = this._threatD2;
      let tCount = 0;
      let bossIdx = -1;
      let nearestEnemyD2 = 1e12;
      const maxRadarD2 = 880 * 880;
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        const dx = e.x - pX;
        const dy = e.y - pY;
        const d2 = dx * dx + dy * dy;
        if (d2 < nearestEnemyD2) nearestEnemyD2 = d2;
        if (e.isBoss) {
          bossIdx = i;
          continue;
        }
        if (d2 > maxRadarD2) continue;
        // Insertion-keep up to 6 closest non-boss threats (zero GC allocation!)
        if (tCount < 6) {
          tIdx[tCount] = i;
          tD2[tCount] = d2;
          tCount++;
        } else {
          let worst = 0;
          for (let k = 1; k < 6; k++) {
            if (tD2[k] > tD2[worst]) worst = k;
          }
          if (d2 < tD2[worst]) {
            tIdx[worst] = i;
            tD2[worst] = d2;
          }
        }
      }

      const dangerProximity = nearestEnemyD2 < 175 * 175 ? 1 - Math.sqrt(nearestEnemyD2) / 175 : 0;
      const lowHull = p.hp <= 2;
      const haloRot = game.elapsed * (overdrive ? 1.8 : 0.72);
      const haloPulse = 1 + Math.sin(game.elapsed * (lowHull ? 7 : 3.2)) * (lowHull ? 0.045 : 0.02);
      let hr = 0.0, hg = 0.94, hb = 1.0;
      if (p.yanking) { hr = 1.0; hg = 0.84; hb = 0.14; }
      else if (overdrive) { hr = 1.0; hg = 0.82; hb = 0.16; }
      else if (p.dashTimer > 0) { hr = 0.72; hg = 0.98; hb = 1.0; }
      else if (lowHull || dangerProximity > 0.35) {
        const w = lowHull ? 0.65 : dangerProximity * 0.75;
        hr = w; hg = 0.94 * (1 - w * 0.78); hb = 1.0 * (1 - w * 0.65);
      }
      const haloAlpha = (p.yanking || overdrive || p.dashTimer > 0) ? 0.86 : (0.58 + dangerProximity * 0.28);
      this._pushQuad(pX, pY, 88 * haloPulse, 88 * haloPulse, this.sprites.ship_halo, hr, hg, hb, haloAlpha, Math.cos(haloRot), Math.sin(haloRot));

      // Render glowing Crimson-Red Enemy Threat Radar Arcs & Pips right along the ring perimeter
      for (let k = 0; k < tCount; k++) {
        const e = enemies[tIdx[k]];
        const ex = e.prevX !== undefined ? e.prevX + (e.x - e.prevX) * alpha : e.x;
        const ey = e.prevY !== undefined ? e.prevY + (e.y - e.prevY) * alpha : e.y;
        const dist = Math.sqrt(tD2[k]) || 1;
        const tc = (ex - pX) / dist;
        const ts = (ey - pY) / dist;
        const urgency = Math.max(0.28, Math.min(1.0, 1 - (dist - 95) / 620));
        const pulse = 0.68 + 0.32 * Math.sin(game.elapsed * (6.5 + urgency * 12) + k * 1.7);
        const arcSz = 92 + urgency * 10;
        // Glowing fiery red-crimson directional arc + hot warning pip
        this._pushQuad(pX, pY, arcSz, arcSz, sThreat, 1.0, 0.14 + urgency * 0.12, 0.34, (0.34 + urgency * 0.62) * pulse, tc, ts);
        const pipR = 45 + urgency * 3;
        this._pushQuad(pX + tc * pipR, pY + ts * pipR, 14 + urgency * 10, 14 + urgency * 10, sGlow, 1.0, 0.12, 0.32, (0.45 + urgency * 0.5) * pulse);
      }

      // High-Priority Boss Dreadnought Crimson-Gold Lock Arc (tracks Boss even off-screen!)
      if (bossIdx !== -1) {
        const b = enemies[bossIdx];
        const bx = b.prevX !== undefined ? b.prevX + (b.x - b.prevX) * alpha : b.x;
        const by = b.prevY !== undefined ? b.prevY + (b.y - b.prevY) * alpha : b.y;
        const bDist = Math.hypot(bx - pX, by - pY) || 1;
        const bc = (bx - pX) / bDist;
        const bs = (by - pY) / bDist;
        const bp = 0.72 + 0.28 * Math.sin(game.elapsed * 11);
        this._pushQuad(pX, pY, 108, 108, sThreat, 1.0, 0.12, 0.36, 0.96 * bp, bc, bs);
        this._pushQuad(pX, pY, 96, 96, sThreat, 1.0, 0.84, 0.15, 0.72 * bp, bc, bs);
        this._pushQuad(pX + bc * 51, pY + bs * 51, 24, 24, sGlow, 1.0, 0.18, 0.35, 0.85 * bp);
      }

      // 4. Normal Alpha World-Space Batch (Dual-Rotating Gyro-Disks, Starfighter, Enemy Fleet, Boss Dreadnought, Texts)
      this._setMode(false, false);

      // Futuristic Dual-Rotating Plasma Gyro-Disks
      const sMach = this.sprites.mach_cone;
      const sInnerRing = this.sprites.orb_ring_inner;
      for (let i = 0; i < allOrbs.length; i++) {
        const orb = allOrbs[i];
        const ox = orb.prevX !== undefined ? orb.prevX + (orb.x - orb.prevX) * alpha : orb.x;
        const oy = orb.prevY !== undefined ? orb.prevY + (orb.y - orb.prevY) * alpha : orb.y;
        const speed = Math.hypot(orb.vx, orb.vy);
        if (speed > 650) {
          const ma = Math.atan2(orb.vy, orb.vx);
          const md = (orb.radius + 11) * 2.75;
          this._pushQuad(ox, oy, md, md, sMach, 1, 1, 1, 0.9, Math.cos(ma), Math.sin(ma));
        }
        const spOrb = orb.isTemp
          ? this.sprites.orb_overdrive
          : (speed > 650 ? this.sprites.orb_magenta : speed > 360 ? this.sprites.orb_gold : this.sprites.orb_cyan);
        const rot = game.elapsed * (3.6 + speed * 0.012);
        const innerRot = -rot * 1.45;
        const scale = orb.radius / 22;
        const sz = 68 * scale;
        const orbAlpha = (orb.isTemp && game.overdriveTimer < 1.2)
          ? 0.45 + 0.55 * Math.abs(Math.sin(game.elapsed * 18))
          : 1.0;
        this._pushQuad(ox, oy, sz, sz, spOrb, 1, 1, 1, orbAlpha, Math.cos(rot), Math.sin(rot));
        this._pushQuad(ox, oy, sz * 0.82, sz * 0.82, sInnerRing, 1, 1, 1, orbAlpha * 0.88, Math.cos(innerRot), Math.sin(innerRot));
      }

      // Player Yank charge ring + Catapult Launch Vector Guide + 2.5D Banking Orbital Interceptor
      const aimA = p.aimAngle !== undefined ? p.aimAngle : p.angle;
      const aimC = Math.cos(aimA);
      const aimS = Math.sin(aimA);
      if (p.yanking && p.yankCharge > 0) {
        const d = (p.radius + 16 + p.yankCharge * 20) * 2.25;
        this._pushQuad(pX, pY, d, d, sSw, 1.0, 0.84, 0.0, Math.min(1, p.yankCharge + 0.3));
        if (p.yankCharge > 0.12) {
          const guideLen = 110 + p.yankCharge * 170;
          const ga = Math.min(0.88, p.yankCharge * 0.95);
          this._pushLine(pX + aimC * 32, pY + aimS * 32, pX + aimC * guideLen, pY + aimS * guideLen, 3.2, sWhite, 1.0, 0.84, 0.12, ga * 0.45);
          this._pushQuad(pX + aimC * (guideLen + 10), pY + aimS * (guideLen + 10), 22, 22, this.sprites.aim_pip, 1.0, 0.88, 0.25, ga, aimC, aimS);
        }
      }

      if (!(p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0)) {
        const c = Math.cos(p.angle);
        const s = Math.sin(p.angle);
        const perpX = -s;
        const perpY = c;
        const bankScale = 1 - Math.min(0.18, Math.abs(p.bank || 0) * 0.16);
        const sAccent = shipDef ? shipDef.accentRgb : [0.0, 0.94, 1.0];
        const sFlame = shipDef ? shipDef.flameRgb : [0.0, 0.95, 1.0];

        // Forward directional flight chevron (tactical halo + red enemy radar rendered in additive pass above)
        const hCol = p.yanking
          ? [1.0, 0.84, 0.12]
          : (overdrive ? [1.0, 0.84, 0.1] : (p.dashTimer > 0 ? [1.0, 0.92, 0.35] : sAccent));
        if (!p.yanking) {
          this._pushQuad(pX + c * 47, pY + s * 47, 15, 15, this.sprites.aim_pip, hCol[0], hCol[1], hCol[2], 0.56, c, s);
        }

        // Ship-specific plasma engine afterburner plumes (single / twin / wide-catamaran / tri-halo / asymmetric)
        const baseFlameLen = 16 + Math.min(36, pSpeed * 0.038) + (p.dashTimer > 0 ? 22 : 0) + Math.random() * 5;
        const fCol = p.dashTimer > 0 ? [1.0, 0.88, 0.2] : (overdrive ? [1.0, 0.76, 0.15] : sFlame);
        const thrusters = shipDef && shipDef.thrusters ? shipDef.thrusters : [
          { back: 18.0, lat: -6.8, w: 12.0, lenScale: 1.0 },
          { back: 18.0, lat: 6.8, w: 12.0, lenScale: 1.0 },
        ];
        for (let t = 0; t < thrusters.length; t++) {
          const th = thrusters[t];
          const fLen = baseFlameLen * (th.lenScale || 1.0);
          const latOff = th.lat * bankScale;
          const nx = pX - c * th.back + perpX * latOff;
          const ny = pY - s * th.back + perpY * latOff;
          this._pushQuad(nx - c * fLen * 0.42, ny - s * fLen * 0.42, fLen * 1.22, th.w, sGlow, fCol[0], fCol[1], fCol[2], 0.95, c, s);
          this._pushQuad(nx - c * fLen * 0.2, ny - s * fLen * 0.2, fLen * 0.58, th.w * 0.45, sGlow, 1, 1, 1, 0.99, c, s);
        }

        // Selected Starship Theme hull at consistent 76x76 gameplay scale with smooth 2.5D turn banking
        const shipKey = shipDef ? `ship_${shipDef.id}_${overdrive ? 'overdrive' : 'normal'}` : (overdrive ? 'ship_overdrive' : 'ship_normal');
        const shipSprite = this.sprites[shipKey] || (overdrive ? this.sprites.ship_overdrive : this.sprites.ship_normal);
        this._pushQuad(pX, pY, 76, 76 * bankScale, shipSprite, 1, 1, 1, 1, c, s);
      }

      // Hostile Fleet & Dual-Rotating Boss Dreadnought (viewport-culled with dasher laser margin)
      const sBossOuter = this.sprites.enemy_boss_outer;
      const sBossInner = this.sprites.enemy_boss_inner;
      const enMinX = cullMinX - 240;
      const enMaxX = cullMaxX + 240;
      const enMinY = cullMinY - 240;
      const enMaxY = cullMaxY + 240;
      for (let i = 0; i < game.enemies.length; i++) {
        const e = game.enemies[i];
        const ex = e.prevX !== undefined ? e.prevX + (e.x - e.prevX) * alpha : e.x;
        const ey = e.prevY !== undefined ? e.prevY + (e.y - e.prevY) * alpha : e.y;
        if (ex < enMinX || ex > enMaxX || ey < enMinY || ey > enMaxY) continue;
        const alphaFlag = e.flash > 0 ? -1.0 : 1.0;

        if (e.type === 'dasher' && e.dashState === 1) {
          // Crisp twin-layer laser sight lock + charge glow
          this._pushLine(ex, ey, ex + e.aimX * 300, ey + e.aimY * 300, 5.5, sWhite, 1.0, 0.0, 0.55, 0.24);
          this._pushLine(ex, ey, ex + e.aimX * 300, ey + e.aimY * 300, 1.8, sWhite, 1.0, 0.75, 0.9, 0.88);
          this._pushQuad(ex, ey, 58, 58, sGlow, 1.0, 0.1, 0.65, 0.45);
        }

        if (e.isBoss) {
          const rOuter = game.elapsed * 0.75;
          const rInner = -game.elapsed * 1.9;
          const bossPulse = 1 + Math.sin(game.elapsed * 5) * 0.03;
          this._pushQuad(ex, ey, 134 * bossPulse, 134 * bossPulse, sBossOuter, 1, 1, 1, alphaFlag, Math.cos(rOuter), Math.sin(rOuter));
          this._pushQuad(ex, ey, 68 * bossPulse, 68 * bossPulse, sBossInner, 1, 1, 1, alphaFlag, Math.cos(rInner), Math.sin(rInner));
          continue;
        }

        let spEn;
        let sz;
        let rot;
        if (e.type === 'swarmer') {
          spEn = this.sprites.enemy_swarmer;
          sz = 46;
          rot = e.angle;
        } else if (e.type === 'mini') {
          spEn = this.sprites.enemy_mini;
          sz = 36;
          rot = e.angle;
        } else if (e.type === 'tank') {
          spEn = this.sprites.enemy_tank;
          sz = 78;
          rot = e.angle;
        } else if (e.type === 'splitter') {
          spEn = this.sprites.enemy_splitter;
          sz = 58;
          rot = game.elapsed * 1.45;
        } else if (e.type === 'dasher') {
          spEn = this.sprites.enemy_dasher;
          sz = 50;
          rot = e.dashState >= 1 ? Math.atan2(e.aimY || 0, e.aimX || 1) : e.angle;
        } else {
          // Bomber breathes gently to telegraph volatility
          spEn = this.sprites.enemy_bomber;
          sz = 54 * (1 + Math.sin(game.elapsed * 8 + i) * 0.06);
          rot = game.elapsed * 2.1;
        }
        this._pushQuad(ex, ey, sz, sz, spEn, 1, 1, 1, alphaFlag, Math.cos(rot), Math.sin(rot));
      }

      // Floating Combat Numbers & Score Pops with elastic spring-pop entrance
      for (let i = 0; i < game.floatingTexts.length; i++) {
        const ft = game.floatingTexts[i];
        if (ft.x < cullMinX - 120 || ft.x > cullMaxX + 120 || ft.y < cullMinY || ft.y > cullMaxY) continue;
        const maxL = ft.maxLife || 0.7;
        const age = Math.max(0, maxL - ft.life);
        const pop = age < 0.085
          ? 0.68 + (age / 0.085) * 0.68
          : Math.max(1.0, 1.36 - (age - 0.085) * 2.6);
        const a = Math.min(1, ft.life * 2.1);
        const [cr, cg, cb] = parseColor(ft.color);
        const sc = ft.scale * pop;
        const str = String(ft.text).toUpperCase();
        let totalW = 0;
        for (let k = 0; k < str.length; k++) {
          const glp = this.glyphs.get(str[k]);
          if (glp) totalW += glp.advance * sc;
        }
        let curX = ft.x - totalW * 0.5;
        for (let k = 0; k < str.length; k++) {
          const glp = this.glyphs.get(str[k]);
          if (!glp) continue;
          const gw = glp.w * sc;
          const gh = glp.h * sc;
          this._pushQuad(curX + (glp.advance * sc) * 0.5, ft.y, gw, gh, glp, cr, cg, cb, a);
          curX += glp.advance * sc;
        }
      }

      // 5. Screen-space impact/overdrive flash overlay
      if (game.screenFlash.alpha > 0.01) {
        this._setMode(false, true);
        const [fr, fg, fb] = parseColor(game.screenFlash.color);
        this._pushQuad(this.viewW * 0.5, this.viewH * 0.5, this.viewW, this.viewH, sWhite, fr, fg, fb, game.screenFlash.alpha);
      }

      this._flushBatch();
    }

    _renderTitleCitadel() {
      // Title background is rendered by GPU-composited .home-screen::before (16:9 4K/1080p WebP).
      // Clear canvas to deep space void with near-zero GPU cost while on the home screen.
      const gl = this.gl;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.clearColor(0.012, 0.024, 0.059, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // ---------- 5. Pre-Baked Sprite-Stamp Canvas 2D Fallback (Full Visual Parity, Zero shadowBlur) ----------
    _renderCanvas2DFallback(game, alpha = 1) {
      const ctx = this.ctx2d;
      if (!ctx) return;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const camX = game.camera.prevX !== undefined ? game.camera.prevX + (game.camera.x - game.camera.prevX) * alpha : game.camera.x;
      const camY = game.camera.prevY !== undefined ? game.camera.prevY + (game.camera.y - game.camera.prevY) * alpha : game.camera.y;
      const shake = game.shaker.getOffset();
      const overdrive = game.overdriveTimer > 0;
      if (game.state === 'title') {
        ctx.fillStyle = '#03060f';
        ctx.fillRect(0, 0, this.viewW, this.viewH);
        return;
      }
      this.space.draw(ctx, camX, camY, game.player.vx, game.player.vy, overdrive);

      ctx.save();
      ctx.translate(this.viewW / 2 + shake.x, this.viewH / 2 + shake.y);
      ctx.rotate(shake.angle);
      ctx.translate(-camX, -camY);

      const ARENA_W = 2200;
      const ARENA_H = 1600;
      ctx.fillStyle = overdrive ? 'rgba(255, 214, 0, 0.25)' : 'rgba(150, 220, 255, 0.14)';
      const step = 180;
      const sx = Math.max(step, Math.floor((camX - this.viewW / 2) / step) * step);
      const ex = Math.min(ARENA_W - step, Math.ceil((camX + this.viewW / 2) / step) * step);
      const sy = Math.max(step, Math.floor((camY - this.viewH / 2) / step) * step);
      const ey = Math.min(ARENA_H - step, Math.ceil((camY + this.viewH / 2) / step) * step);
      for (let x = sx; x <= ex; x += step) {
        for (let y = sy; y <= ey; y += step) ctx.fillRect(x - 1, y - 1, 2, 2);
      }

      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, ARENA_W, ARENA_H);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, ARENA_W, ARENA_H);

      const drawStamp = (spName, x, y, w, h, rot = 0) => {
        const s = this.sprites[spName];
        if (!s) return;
        ctx.save();
        ctx.translate(x, y);
        if (rot) ctx.rotate(rot);
        ctx.drawImage(this.atlasCanvas, s.x, s.y, s.w, s.h, -w / 2, -h / 2, w, h);
        ctx.restore();
      };

      for (const bh of game.blackHoles) drawStamp('black_hole', bh.x, bh.y, 148, 148, game.elapsed * 2.8);
      for (const gm of game.gems) drawStamp('gem', gm.x, gm.y, 24, 24);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const sw of game.shockwaves) {
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const p = game.player;
      const pX = p.prevX !== undefined ? p.prevX + (p.x - p.prevX) * alpha : p.x;
      const pY = p.prevY !== undefined ? p.prevY + (p.y - p.prevY) * alpha : p.y;
      for (const orb of game.getAllOrbs()) {
        const ox = orb.prevX !== undefined ? orb.prevX + (orb.x - orb.prevX) * alpha : orb.x;
        const oy = orb.prevY !== undefined ? orb.prevY + (orb.y - orb.prevY) * alpha : orb.y;
        const speed = Math.hypot(orb.vx, orb.vy);
        const col = orb.isTemp ? '#e879f9' : (speed > 650 ? '#ff2a6d' : speed > 360 ? '#ffd600' : '#00f0ff');
        ctx.strokeStyle = game.mods.laserTether > 0 ? '#ff2a6d' : col;
        ctx.lineWidth = game.mods.laserTether > 0 ? 4 : 2.5;
        ctx.beginPath();
        ctx.moveTo(pX, pY);
        ctx.lineTo(ox, oy);
        ctx.stroke();
      }

      for (const pr of game.projectiles) drawStamp('shrapnel_bolt', pr.x, pr.y, 26, 26, Math.atan2(pr.vy, pr.vx));
      for (const b of game.enemyBullets) drawStamp('enemy_bullet', b.x, b.y, b.radius * 3.4, b.radius * 3.4);

      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 2.5;
      for (const l of game.lightnings) {
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo((l.x1 + l.x2) * 0.5 + (Math.random() - 0.5) * 28, (l.y1 + l.y2) * 0.5 + (Math.random() - 0.5) * 28);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
      }
      for (const pt of game.particles) {
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.fillRect(pt.x - pt.size * 0.5, pt.y - pt.size * 0.5, pt.size, pt.size);
      }
      ctx.restore();

      for (const orb of game.getAllOrbs()) {
        const ox = orb.prevX !== undefined ? orb.prevX + (orb.x - orb.prevX) * alpha : orb.x;
        const oy = orb.prevY !== undefined ? orb.prevY + (orb.y - orb.prevY) * alpha : orb.y;
        const speed = Math.hypot(orb.vx, orb.vy);
        const spName = orb.isTemp ? 'orb_overdrive' : (speed > 650 ? 'orb_magenta' : speed > 360 ? 'orb_gold' : 'orb_cyan');
        const sz = 68 * (orb.radius / 22);
        const rot = game.elapsed * (3.6 + speed * 0.012);
        drawStamp(spName, ox, oy, sz, sz, rot);
        drawStamp('orb_ring_inner', ox, oy, sz * 0.82, sz * 0.82, -rot * 1.45);
      }

      if (p.yanking && p.yankCharge > 0) {
        ctx.strokeStyle = '#ffd600';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pX, pY, p.radius + 16 + p.yankCharge * 20, 0, Math.PI * 2 * p.yankCharge);
        ctx.stroke();
      }
      if (!(p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0)) {
        const shipDef = window.ChaosShips ? window.ChaosShips.get(game.selectedShipId) : null;
        const shipKey = shipDef ? `ship_${shipDef.id}_${overdrive ? 'overdrive' : 'normal'}` : (overdrive ? 'ship_overdrive' : 'ship_normal');
        drawStamp('ship_halo', pX, pY, 82, 82, game.elapsed * 1.15);
        drawStamp(this.sprites[shipKey] ? shipKey : (overdrive ? 'ship_overdrive' : 'ship_normal'), pX, pY, 76, 76, p.angle);
      }

      for (const e of game.enemies) {
        if (e.isBoss) {
          drawStamp('enemy_boss_outer', e.x, e.y, 134, 134, game.elapsed * 0.75);
          drawStamp('enemy_boss_inner', e.x, e.y, 68, 68, -game.elapsed * 1.9);
        } else {
          drawStamp(`enemy_${e.type}`, e.x, e.y, e.radius * 2.7, e.radius * 2.7, e.angle);
        }
      }

      ctx.textAlign = 'center';
      for (const ft of game.floatingTexts) {
        ctx.globalAlpha = Math.min(1, ft.life * 1.6);
        ctx.font = `900 ${Math.round(15 * ft.scale)}px Orbitron, sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      if (game.screenFlash.alpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = game.screenFlash.alpha;
        ctx.fillStyle = game.screenFlash.color;
        ctx.fillRect(0, 0, this.viewW, this.viewH);
        ctx.restore();
      }
    }
  }

  window.ChaosRenderer = ChaosRenderer;
})();
