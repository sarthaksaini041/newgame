/*
 * CHAOS TETHER — High-Craft Procedural 3D-Shaded Sci-Fi Power-Up Icon Baker.
 *
 * Bakes 9 photorealistic metallic/plasma 160x160 tactical module emblems ONCE at startup
 * into GPU-cached PNG data URLs (zero external network requests, 100% file:// compatible,
 * zero runtime SVG filter cost, zero duplicate SVG <defs> IDs).
 */
(() => {
  const SIZE = 160;
  const CX = SIZE / 2;
  const CY = SIZE / 2;

  function drawChamferPlate(ctx, pad, cut, accentHex, glowRgb) {
    const x0 = pad, y0 = pad, x1 = SIZE - pad, y1 = SIZE - pad;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0 + cut, y0);
    ctx.lineTo(x1 - cut, y0);
    ctx.lineTo(x1, y0 + cut);
    ctx.lineTo(x1, y1 - cut);
    ctx.lineTo(x1 - cut, y1);
    ctx.lineTo(x0 + cut, y1);
    ctx.lineTo(x0, y1 - cut);
    ctx.lineTo(x0, y0 + cut);
    ctx.closePath();

    // Machined dark-titanium chassis base
    const base = ctx.createLinearGradient(x0, y0, x1, y1);
    base.addColorStop(0, '#16243d');
    base.addColorStop(0.45, '#091122');
    base.addColorStop(1, '#040813');
    ctx.fillStyle = base;
    ctx.fill();

    // Inner ambient volumetric bloom from power-up core
    const amb = ctx.createRadialGradient(CX, CY, 6, CX, CY, SIZE * 0.44);
    amb.addColorStop(0, `rgba(${glowRgb}, 0.34)`);
    amb.addColorStop(0.55, `rgba(${glowRgb}, 0.11)`);
    amb.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = amb;
    ctx.fill();

    // Subtle diagonal machined micro-grid sheen inside chamber
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let i = -SIZE; i < SIZE * 2; i += 14) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - SIZE * 0.5, SIZE);
      ctx.stroke();
    }
    // Top-left glass specular reflection arc
    const spec = ctx.createLinearGradient(x0, y0, CX + 18, CY + 10);
    spec.addColorStop(0, 'rgba(255,255,255,0.22)');
    spec.addColorStop(0.45, 'rgba(255,255,255,0.04)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = spec;
    ctx.fillRect(x0, y0, SIZE, SIZE * 0.5);
    ctx.restore();

    // Metallic rim bevel
    const rim = ctx.createLinearGradient(x0, y0, x1, y1);
    rim.addColorStop(0, '#ffffff');
    rim.addColorStop(0.25, accentHex);
    rim.addColorStop(0.75, `rgba(${glowRgb}, 0.42)`);
    rim.addColorStop(1, '#1e293b');
    ctx.strokeStyle = rim;
    ctx.lineWidth = 2.6;
    ctx.stroke();

    // Corner precision rivets
    ctx.fillStyle = 'rgba(220,242,255,0.55)';
    const rv = pad + 11;
    for (const [rx, ry] of [[rv, rv], [SIZE - rv, rv], [rv, SIZE - rv], [SIZE - rv, SIZE - rv]]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPlasmaSphere(ctx, x, y, r, innerHex, midHex, outerRgb) {
    ctx.save();
    // Volumetric outer halo
    const halo = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.2);
    halo.addColorStop(0, `rgba(${outerRgb}, 0.85)`);
    halo.addColorStop(0.42, `rgba(${outerRgb}, 0.26)`);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // 3D shaded orb body
    const body = ctx.createRadialGradient(x - r * 0.34, y - r * 0.34, r * 0.08, x, y, r);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(0.32, innerHex);
    body.addColorStop(0.72, midHex);
    body.addColorStop(1, '#040a18');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Specular glass highlight
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(x - r * 0.3, y - r * 0.32, r * 0.26, r * 0.16, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const BAKERS = {
    // 1. TWIN ORBIT — Dual 3D Titanium-Encased Plasma Gyro-Cores on Inclined Magnetic Ring
    twin_orb(ctx) {
      drawChamferPlate(ctx, 8, 22, '#00f0ff', '0, 240, 255');
      ctx.save();
      ctx.translate(CX, CY);

      // Outer precision calibration ring
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.26)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Back magnetic orbital track
      ctx.save();
      ctx.rotate(-0.54);
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      const ringGrad = ctx.createLinearGradient(-52, 0, 52, 0);
      ringGrad.addColorStop(0, '#0284c7');
      ringGrad.addColorStop(0.5, '#e0faff');
      ringGrad.addColorStop(1, '#00f0ff');
      ctx.strokeStyle = ringGrad;
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 50, 21, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Secondary ghost orbit
      ctx.save();
      ctx.rotate(0.54);
      ctx.strokeStyle = 'rgba(124, 238, 255, 0.28)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, 44, 16, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Central metallic tether hub
      const hub = ctx.createRadialGradient(-3, -3, 1, 0, 0, 12);
      hub.addColorStop(0, '#ffffff');
      hub.addColorStop(0.45, '#7ceeff');
      hub.addColorStop(1, '#0c2a46');
      ctx.fillStyle = hub;
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Dual 3D plasma spheres with titanium containment collars
      for (const [ox, oy] of [[-35, 22], [35, -22]]) {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(ox, oy, 18.5, 0, Math.PI * 2);
        ctx.stroke();
        drawPlasmaSphere(ctx, ox, oy, 15.5, '#a5f3fc', '#0284c7', '0, 240, 255');
      }
      ctx.restore();
    },

    // 2. ARC CONDUCTOR — High-Voltage Tesla Capacitor Core with Volumetric Lightning
    chain_lightning(ctx) {
      drawChamferPlate(ctx, 8, 22, '#38bdf8', '56, 189, 248');
      ctx.save();
      ctx.translate(CX, CY);

      // Machined hexagonal Tesla housing
      const hex = (r) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3 - Math.PI / 2;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
      };
      hex(54);
      const hg = ctx.createLinearGradient(-48, -48, 48, 48);
      hg.addColorStop(0, '#1e3a5f');
      hg.addColorStop(0.5, '#091529');
      hg.addColorStop(1, '#050b18');
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Inner copper/silver induction coils at 6 vertices
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 2;
        const x = Math.cos(a) * 44, y = Math.sin(a) * 44;
        drawPlasmaSphere(ctx, x, y, 4.2, '#e0f2fe', '#0284c7', '56, 189, 248');
      }

      // Secondary forked electric filaments
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-36, -18); ctx.lineTo(-18, -8); ctx.lineTo(-6, -14);
      ctx.moveTo(36, 18); ctx.lineTo(18, 9); ctx.lineTo(6, 14);
      ctx.moveTo(32, -24); ctx.lineTo(14, -12);
      ctx.stroke();

      // Primary sculpted plasma lightning bolt (outer bloom + core + specular)
      const bolt = () => {
        ctx.beginPath();
        ctx.moveTo(10, -48);
        ctx.lineTo(-26, 4);
        ctx.lineTo(-2, 4);
        ctx.lineTo(-14, 48);
        ctx.lineTo(28, -8);
        ctx.lineTo(4, -8);
        ctx.closePath();
      };
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#0ea5e9';
      const bg = ctx.createLinearGradient(-20, -46, 20, 46);
      bg.addColorStop(0, '#ffffff');
      bg.addColorStop(0.45, '#7dd3fc');
      bg.addColorStop(1, '#0284c7');
      bolt();
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // White-hot interior filament
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(7, -36);
      ctx.lineTo(-15, 0);
      ctx.lineTo(2, 0);
      ctx.lineTo(-6, 33);
      ctx.lineTo(17, -4);
      ctx.lineTo(1, -4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },

    // 3. SINGULARITY CORE — Gargantua-Style Relativistic Black Hole & Accretion Disk
    black_hole(ctx) {
      drawChamferPlate(ctx, 8, 22, '#c084fc', '184, 41, 255');
      ctx.save();
      ctx.translate(CX, CY);

      // Volumetric violet gravitational lensing corona
      const corona = ctx.createRadialGradient(0, 0, 14, 0, 0, 58);
      corona.addColorStop(0, 'rgba(240, 171, 252, 0.95)');
      corona.addColorStop(0.32, 'rgba(184, 41, 255, 0.55)');
      corona.addColorStop(0.68, 'rgba(88, 28, 135, 0.22)');
      corona.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(0, 0, 58, 0, Math.PI * 2);
      ctx.fill();

      // Upper & lower lensed photon halo arcs
      ctx.strokeStyle = 'rgba(245, 208, 254, 0.72)';
      ctx.lineWidth = 3.2;
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(0, 0, 30, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(192, 132, 252, 0.55)';
      ctx.beginPath();
      ctx.arc(0, 0, 28, Math.PI * 0.08, Math.PI * 0.92);
      ctx.stroke();

      // Rear half of glowing accretion disk
      ctx.save();
      ctx.rotate(-0.34);
      const disk = ctx.createLinearGradient(-56, 0, 56, 0);
      disk.addColorStop(0, 'rgba(147, 51, 234, 0.2)');
      disk.addColorStop(0.25, '#f0abfc');
      disk.addColorStop(0.5, '#ffffff');
      disk.addColorStop(0.75, '#e879f9');
      disk.addColorStop(1, 'rgba(147, 51, 234, 0.2)');
      ctx.strokeStyle = disk;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.ellipse(0, 0, 54, 15, 0, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Pitch-black event horizon + razor photon ring
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#020108';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, 22.5, 0, Math.PI * 2);
      ctx.stroke();

      // Front half of incandescent accretion disk crossing over the void
      ctx.save();
      ctx.rotate(-0.34);
      ctx.shadowColor = '#f0abfc';
      ctx.shadowBlur = 16;
      ctx.strokeStyle = disk;
      ctx.lineWidth = 7.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 54, 15, 0, 0, Math.PI);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.ellipse(0, 0, 52, 13.5, 0, 0.12, Math.PI - 0.12);
      ctx.stroke();
      ctx.restore();
      ctx.restore();
    },

    // 4. PLASMA CHAIN — Superheated Crimson Containment Beam Between Armored Nodes
    laser_tether(ctx) {
      drawChamferPlate(ctx, 8, 22, '#ff2a6d', '255, 42, 109');
      ctx.save();
      ctx.translate(CX, CY);

      // Multi-layer volumetric plasma laser beam
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ff2a6d';
      ctx.shadowBlur = 26;
      ctx.strokeStyle = 'rgba(255, 42, 109, 0.55)';
      ctx.lineWidth = 24;
      ctx.beginPath();
      ctx.moveTo(-38, 38); ctx.lineTo(38, -38);
      ctx.stroke();

      ctx.strokeStyle = '#ff4d88';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(-38, 38); ctx.lineTo(38, -38);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(-38, 38); ctx.lineTo(38, -38);
      ctx.stroke();

      // Slicing thermal plasma arcs along beam
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-22, 6); ctx.lineTo(-4, -12);
      ctx.moveTo(4, 14); ctx.lineTo(22, -4);
      ctx.moveTo(-12, 26); ctx.lineTo(-2, 16);
      ctx.moveTo(14, -22); ctx.lineTo(24, -32);
      ctx.stroke();

      // Two heavy metallic anchor emitter nodes + mid-beam focal ring
      for (const [nx, ny, r] of [[-38, 38, 16], [38, -38, 18]]) {
        ctx.shadowBlur = 0;
        const ng = ctx.createLinearGradient(nx - r, ny - r, nx + r, ny + r);
        ng.addColorStop(0, '#e2e8f0');
        ng.addColorStop(0.5, '#475569');
        ng.addColorStop(1, '#0f172a');
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fda4af';
        ctx.lineWidth = 2;
        ctx.stroke();
        drawPlasmaSphere(ctx, nx, ny, r * 0.54, '#ffe4e6', '#ff2a6d', '255, 42, 109');
      }
      drawPlasmaSphere(ctx, 0, 0, 8.5, '#ffffff', '#ff2a6d', '255, 42, 109');
      ctx.restore();
    },

    // 5. HYPER-ELASTICITY — Heavy Kinetic Gyro-Turbine & Solar Force Core
    elastic_whip(ctx) {
      drawChamferPlate(ctx, 8, 22, '#ffd600', '255, 214, 0');
      ctx.save();
      ctx.translate(CX, CY);

      // Kinetic shockwave ring
      ctx.strokeStyle = 'rgba(255, 214, 0, 0.34)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 52, 0, Math.PI * 2);
      ctx.stroke();

      // 8 sculpted metallic kinetic blades
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 16;
      for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        const bg = ctx.createLinearGradient(0, -52, 14, -18);
        bg.addColorStop(0, '#ffffff');
        bg.addColorStop(0.35, '#fde047');
        bg.addColorStop(0.75, '#d97706');
        bg.addColorStop(1, '#451a03');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.moveTo(0, -52);
        ctx.lineTo(11, -24);
        ctx.lineTo(0, -18);
        ctx.lineTo(-11, -24);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      // Armored golden containment bezel
      ctx.shadowBlur = 0;
      const cg = ctx.createLinearGradient(-26, -26, 26, 26);
      cg.addColorStop(0, '#fef08a');
      cg.addColorStop(0.5, '#b45309');
      cg.addColorStop(1, '#291704');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      drawPlasmaSphere(ctx, 0, 0, 17, '#fef9c3', '#f59e0b', '255, 214, 0');
      ctx.restore();
    },

    // 6. SHATTER NOVA — Quad-Directional Homing Plasma Warhead Array
    shrapnel(ctx) {
      drawChamferPlate(ctx, 8, 22, '#ff9e00', '255, 158, 0');
      ctx.save();
      ctx.translate(CX, CY);

      // Targeting reticle ring
      ctx.strokeStyle = 'rgba(255, 158, 0, 0.38)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // 4 diagonal micro-shrapnel needles
      ctx.shadowColor = '#ff9e00';
      ctx.shadowBlur = 10;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 2 + Math.PI / 4);
        ctx.fillStyle = '#fdba74';
        ctx.beginPath();
        ctx.moveTo(0, -46);
        ctx.lineTo(4.5, -27);
        ctx.lineTo(0, -23);
        ctx.lineTo(-4.5, -27);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 4 primary 3D beveled plasma ordnance darts
      ctx.shadowBlur = 16;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 2);
        const dg = ctx.createLinearGradient(-10, -54, 10, -18);
        dg.addColorStop(0, '#ffffff');
        dg.addColorStop(0.32, '#fde047');
        dg.addColorStop(0.7, '#ea580c');
        dg.addColorStop(1, '#431407');
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.moveTo(0, -55);
        ctx.lineTo(12, -26);
        ctx.lineTo(0, -17);
        ctx.lineTo(-12, -26);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.restore();
      }

      // Central detonator core
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1c0f06';
      ctx.beginPath();
      ctx.arc(0, 0, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fb923c';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      drawPlasmaSphere(ctx, 0, 0, 10.5, '#fef3c7', '#f97316', '255, 158, 0');
      ctx.restore();
    },

    // 7. SIPHON CORE — Armored Emerald Nanite Aegis Shield & Bio-Repair Matrix
    vampiric(ctx) {
      drawChamferPlate(ctx, 8, 22, '#05ffa1', '5, 255, 161');
      ctx.save();
      ctx.translate(CX, CY + 2);

      // Outer sculpted titanium-emerald Aegis shield
      const shieldPath = (scale) => {
        ctx.beginPath();
        ctx.moveTo(0, -52 * scale);
        ctx.lineTo(44 * scale, -34 * scale);
        ctx.lineTo(44 * scale, 4 * scale);
        ctx.bezierCurveTo(44 * scale, 30 * scale, 22 * scale, 44 * scale, 0, 54 * scale);
        ctx.bezierCurveTo(-22 * scale, 44 * scale, -44 * scale, 30 * scale, -44 * scale, 4 * scale);
        ctx.lineTo(-44 * scale, -34 * scale);
        ctx.closePath();
      };

      ctx.shadowColor = '#05ffa1';
      ctx.shadowBlur = 20;
      shieldPath(1.0);
      const sg = ctx.createLinearGradient(-44, -52, 44, 54);
      sg.addColorStop(0, '#6ee7b7');
      sg.addColorStop(0.28, '#059669');
      sg.addColorStop(0.7, '#064e3b');
      sg.addColorStop(1, '#022c22');
      ctx.fillStyle = sg;
      ctx.fill();
      ctx.strokeStyle = '#a7f3d0';
      ctx.lineWidth = 2.6;
      ctx.stroke();

      // Recessed dark emerald reactor bay inside shield
      ctx.shadowBlur = 0;
      shieldPath(0.78);
      const inner = ctx.createRadialGradient(0, -4, 4, 0, 0, 42);
      inner.addColorStop(0, '#065f46');
      inner.addColorStop(1, '#021a14');
      ctx.fillStyle = inner;
      ctx.fill();
      ctx.strokeStyle = 'rgba(5, 255, 161, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Glowing nanite repair cross with volumetric bloom
      ctx.shadowColor = '#05ffa1';
      ctx.shadowBlur = 18;
      ctx.fillStyle = '#05ffa1';
      ctx.beginPath();
      ctx.roundRect(-8, -26, 16, 48, 3);
      ctx.roundRect(-24, -10, 48, 16, 3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(-4.5, -22, 9, 40, 2);
      ctx.roundRect(-20, -6.5, 40, 9, 2);
      ctx.fill();
      ctx.restore();
    },

    // 8. THRUSTER OVERCLOCK — Machined Ion Vector Nozzle & Dual Afterburner Plume
    berserker(ctx) {
      drawChamferPlate(ctx, 8, 22, '#38bdf8', '56, 189, 248');
      ctx.save();
      ctx.translate(CX, CY);

      // Supersonic Mach chevrons in background
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.34)';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-46, -4); ctx.lineTo(-30, -20);
      ctx.moveTo(46, -4); ctx.lineTo(30, -20);
      ctx.moveTo(-48, 14); ctx.lineTo(-34, 2);
      ctx.moveTo(48, 14); ctx.lineTo(34, 2);
      ctx.stroke();

      // Fiery gold-cyan afterburner exhaust cone
      ctx.shadowColor = '#ffd600';
      ctx.shadowBlur = 18;
      const flame = ctx.createLinearGradient(0, 16, 0, 56);
      flame.addColorStop(0, '#ffffff');
      flame.addColorStop(0.35, '#fde047');
      flame.addColorStop(0.75, '#f97316');
      flame.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = flame;
      ctx.beginPath();
      ctx.moveTo(-18, 18);
      ctx.lineTo(18, 18);
      ctx.lineTo(0, 56);
      ctx.closePath();
      ctx.fill();

      // Sculpted titanium thruster arrow fuselage
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 16;
      const body = ctx.createLinearGradient(-32, -48, 32, 22);
      body.addColorStop(0, '#ffffff');
      body.addColorStop(0.35, '#7dd3fc');
      body.addColorStop(0.75, '#0284c7');
      body.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(32, -6);
      ctx.lineTo(15, -6);
      ctx.lineTo(15, 22);
      ctx.lineTo(-15, 22);
      ctx.lineTo(-15, -6);
      ctx.lineTo(-32, -6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // Inner white-hot ion spine
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, -37);
      ctx.lineTo(15, -12);
      ctx.lineTo(6.5, -12);
      ctx.lineTo(6.5, 14);
      ctx.lineTo(-6.5, 14);
      ctx.lineTo(-6.5, -12);
      ctx.lineTo(-15, -12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },

    // 9. CORE SURGE (Overflow Fallback) — Radiant Hyper-Nova Star Core
    core_surge(ctx) {
      drawChamferPlate(ctx, 8, 22, '#ffd600', '255, 214, 0');
      ctx.save();
      ctx.translate(CX, CY);

      ctx.shadowColor = '#ffd600';
      ctx.shadowBlur = 22;
      const star = ctx.createLinearGradient(-46, -46, 46, 46);
      star.addColorStop(0, '#ffffff');
      star.addColorStop(0.4, '#fde047');
      star.addColorStop(1, '#ea580c');
      ctx.fillStyle = star;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? 52 : 18;
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      drawPlasmaSphere(ctx, 0, 0, 16, '#ffffff', '#f59e0b', '255, 214, 0');
      ctx.restore();
    },
  };

  const cache = Object.create(null);

  function bakeIcon(id) {
    if (cache[id]) return cache[id];
    const fn = BAKERS[id] || BAKERS.core_surge;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    fn(ctx);
    const url = canvas.toDataURL('image/png');
    cache[id] = url;
    return url;
  }

  function getImgHtml(id, alt = '') {
    const src = bakeIcon(id);
    return `<img class="powerup-icon-img" src="${src}" alt="${alt}" width="48" height="48" decoding="async" draggable="false">`;
  }

  window.PowerupIcons = {
    get: bakeIcon,
    html: getImgHtml,
    prebakeAll() {
      for (const id of Object.keys(BAKERS)) bakeIcon(id);
    },
  };
})();
