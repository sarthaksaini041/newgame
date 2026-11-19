/*
 * CHAOS TETHER — 5 Distinct Sci-Fi Starship Themes & Procedural High-Craft Renderer.
 *
 * Every starship is normalized to the exact same 76x76 gameplay scale & collision radius (17px)
 * for 100% competitive fairness, while delivering a completely distinct silhouette, structural
 * architecture, cockpit/core design, thruster array, and glow identity.
 */
(() => {
  const STORAGE_KEY = 'chaos_tether_ship_v1';

  const SHIPS = [
    {
      id: 'valkyrie',
      name: 'VALKYRIE MK-IX',
      classTag: 'DELTA INTERCEPTOR',
      tagline: 'Swept aerospace delta wings, twin rail-lances & dual turbine nacelles.',
      accent: '#00f0ff',
      accentRgb: [0.0, 0.94, 1.0],
      trailRgb: [0.0, 0.94, 1.0],
      flameRgb: [0.0, 0.95, 1.0],
      thrusters: [
        { back: 18.0, lat: -6.8, w: 12.0, lenScale: 1.0 },
        { back: 18.0, lat: 6.8, w: 12.0, lenScale: 1.0 },
      ],
      draw(ctx, isOverdrive) {
        const accent = isOverdrive ? '#ffd600' : '#00f0ff';
        const rimGlow = isOverdrive ? '#ff9e00' : '#38bdf8';

        // Volumetric orbital aura
        const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 29);
        halo.addColorStop(0, isOverdrive ? 'rgba(255, 214, 0, 0.36)' : 'rgba(0, 240, 255, 0.30)');
        halo.addColorStop(0.58, isOverdrive ? 'rgba(184, 41, 255, 0.14)' : 'rgba(56, 189, 248, 0.12)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 29, 0, Math.PI * 2);
        ctx.fill();

        // Twin wingtip plasma rail-lances
        ctx.fillStyle = isOverdrive ? '#fef08a' : '#cbd5e1';
        ctx.strokeStyle = isOverdrive ? '#b45309' : '#0c4a6e';
        ctx.lineWidth = 0.9;
        for (const sgn of [-1, 1]) {
          ctx.beginPath();
          ctx.rect(-6, sgn > 0 ? 17.5 : -20.0, 12.5, 2.5);
          ctx.fill();
          ctx.stroke();
        }

        // Outer swept delta-interceptor wings
        ctx.shadowColor = accent;
        ctx.shadowBlur = isOverdrive ? 14 : 10;
        const wingGrad = ctx.createLinearGradient(-16, -21, 18, 21);
        if (isOverdrive) {
          wingGrad.addColorStop(0, '#fffbeb');
          wingGrad.addColorStop(0.40, '#fde047');
          wingGrad.addColorStop(0.78, '#f59e0b');
          wingGrad.addColorStop(1, '#78350f');
        } else {
          wingGrad.addColorStop(0, '#ffffff');
          wingGrad.addColorStop(0.38, '#e2efff');
          wingGrad.addColorStop(0.72, '#6ba4d9');
          wingGrad.addColorStop(1, '#1e3a5f');
        }
        ctx.fillStyle = wingGrad;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.35;
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(5, -7.2);
        ctx.lineTo(-2.5, -20.2);
        ctx.lineTo(-13.5, -18.8);
        ctx.lineTo(-10.5, -9.8);
        ctx.lineTo(-17.2, -7.2);
        ctx.lineTo(-15.0, -3.2);
        ctx.lineTo(-12.5, 0);
        ctx.lineTo(-15.0, 3.2);
        ctx.lineTo(-17.2, 7.2);
        ctx.lineTo(-10.5, 9.8);
        ctx.lineTo(-13.5, 18.8);
        ctx.lineTo(-2.5, 20.2);
        ctx.lineTo(5, 7.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Dark recessed wing armor bays + gold trim
        ctx.shadowBlur = 0;
        ctx.fillStyle = isOverdrive ? '#451a03' : '#0f172a';
        for (const sgn of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(3, sgn * 6.5);
          ctx.lineTo(-3.8, sgn * 15.0);
          ctx.lineTo(-10.2, sgn * 13.5);
          ctx.lineTo(-8.2, sgn * 6.0);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = isOverdrive ? '#fde047' : 'rgba(255, 204, 112, 0.72)';
          ctx.lineWidth = 0.85;
          ctx.stroke();
        }

        // Forward canard winglets
        ctx.fillStyle = isOverdrive ? '#fde047' : '#dbeafe';
        ctx.strokeStyle = isOverdrive ? '#92400e' : '#0369a1';
        ctx.lineWidth = 0.85;
        for (const sgn of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(16.5, sgn * 2.5);
          ctx.lineTo(9.0, sgn * 7.8);
          ctx.lineTo(6.2, sgn * 7.2);
          ctx.lineTo(10.5, sgn * 3.0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Twin rear plasma turbine nacelles
        for (const sgn of [-1, 1]) {
          ctx.fillStyle = isOverdrive ? '#78350f' : '#1e293b';
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.roundRect(-17.2, sgn > 0 ? 3.0 : -8.2, 9.2, 5.2, 1.6);
          ctx.fill();
          ctx.stroke();
          ctx.strokeStyle = isOverdrive ? '#fef08a' : '#7ceeff';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-14.5, sgn * 5.6);
          ctx.lineTo(-9.5, sgn * 5.6);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-16.8, sgn * 5.6, 1.85, 0, Math.PI * 2);
          ctx.fill();
        }

        // Leading-edge plasma conduits
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(2.5, -8.5); ctx.lineTo(-4.0, -18.0);
        ctx.moveTo(2.5, 8.5); ctx.lineTo(-4.0, 18.0);
        ctx.stroke();

        // Wingtip nav beacons
        ctx.fillStyle = '#ff3864';
        ctx.beginPath();
        ctx.arc(-3.5, -19.2, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(-3.5, 19.2, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Central nose fuselage
        const spineGrad = ctx.createLinearGradient(-12, -5, 25, 5);
        if (isOverdrive) {
          spineGrad.addColorStop(0, '#f59e0b');
          spineGrad.addColorStop(0.5, '#fef08a');
          spineGrad.addColorStop(1, '#ffffff');
        } else {
          spineGrad.addColorStop(0, '#93c5fd');
          spineGrad.addColorStop(0.45, '#f0f9ff');
          spineGrad.addColorStop(0.82, '#ffffff');
          spineGrad.addColorStop(1, '#ffe8b6');
        }
        ctx.fillStyle = spineGrad;
        ctx.strokeStyle = isOverdrive ? '#78350f' : '#0c4a6e';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(25.5, 0);
        ctx.lineTo(7.5, -5.6);
        ctx.lineTo(-10.0, -4.5);
        ctx.lineTo(-13.8, 0);
        ctx.lineTo(-10.0, 4.5);
        ctx.lineTo(7.5, 5.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sapphire glass canopy
        const canopy = ctx.createLinearGradient(15, -3.5, -2, 3.5);
        canopy.addColorStop(0, '#ffffff');
        canopy.addColorStop(0.26, accent);
        canopy.addColorStop(0.76, rimGlow);
        canopy.addColorStop(1, '#082f49');
        ctx.fillStyle = canopy;
        ctx.beginPath();
        ctx.moveTo(15.2, 0);
        ctx.lineTo(4.0, -3.5);
        ctx.lineTo(-3.2, 0);
        ctx.lineTo(4.0, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(12.2, -0.8);
        ctx.lineTo(4.5, -2.2);
        ctx.stroke();

        // Aft tether emitter
        ctx.fillStyle = '#071226';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(-13.2, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-13.2, 0, 1.2, 0, Math.PI * 2);
        ctx.fill();
      },
    },

    {
      id: 'mantis',
      name: 'KRYPTOS MANTIS',
      classTag: 'SCYTHE PREDATOR',
      tagline: 'Forward-swept curved bio-stealth scythes, split mandible nose & vector core.',
      accent: '#05ffa1',
      accentRgb: [0.02, 1.0, 0.63],
      trailRgb: [0.02, 1.0, 0.63],
      flameRgb: [0.05, 1.0, 0.66],
      thrusters: [
        { back: 19.5, lat: 0, w: 14.5, lenScale: 1.25 },
      ],
      draw(ctx, isOverdrive) {
        const accent = isOverdrive ? '#ffd600' : '#05ffa1';
        const deep = isOverdrive ? '#78350f' : '#064e3b';

        // Bio-plasma emerald/gold aura
        const halo = ctx.createRadialGradient(2, 0, 7, 2, 0, 29);
        halo.addColorStop(0, isOverdrive ? 'rgba(255, 214, 0, 0.36)' : 'rgba(5, 255, 161, 0.28)');
        halo.addColorStop(0.6, isOverdrive ? 'rgba(245, 158, 11, 0.14)' : 'rgba(16, 185, 129, 0.12)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(2, 0, 29, 0, Math.PI * 2);
        ctx.fill();

        // Swept rear scorpion tail stabilizers
        ctx.fillStyle = isOverdrive ? '#451a03' : '#0b1817';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.1;
        for (const sgn of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(-6, sgn * 4.5);
          ctx.lineTo(-19.5, sgn * 12.0);
          ctx.lineTo(-16.0, sgn * 5.2);
          ctx.lineTo(-19.0, sgn * 2.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Dramatic FORWARD-SWEPT curved scythe wings (iconic predator crescent silhouette)
        ctx.shadowColor = accent;
        ctx.shadowBlur = isOverdrive ? 14 : 11;
        for (const sgn of [-1, 1]) {
          const scytheGrad = ctx.createLinearGradient(-12, sgn * 6, 22, sgn * 22);
          if (isOverdrive) {
            scytheGrad.addColorStop(0, '#451a03');
            scytheGrad.addColorStop(0.55, '#d97706');
            scytheGrad.addColorStop(1, '#fef08a');
          } else {
            scytheGrad.addColorStop(0, '#071515');
            scytheGrad.addColorStop(0.45, '#0f2d2a');
            scytheGrad.addColorStop(0.82, '#10b981');
            scytheGrad.addColorStop(1, '#d1fae5');
          }
          ctx.fillStyle = scytheGrad;
          ctx.strokeStyle = isOverdrive ? '#fef08a' : '#a7f3d0';
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(-8.5, sgn * 4.8);
          ctx.quadraticCurveTo(-2.0, sgn * 20.5, 19.5, sgn * 19.5);
          ctx.quadraticCurveTo(10.5, sgn * 14.2, 6.5, sgn * 8.2);
          ctx.lineTo(13.0, sgn * 7.2);
          ctx.lineTo(3.5, sgn * 4.0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Glowing inner scythe plasma edge
          ctx.shadowBlur = 0;
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(17.5, sgn * 18.2);
          ctx.quadraticCurveTo(6.5, sgn * 14.5, -2.5, sgn * 7.5);
          ctx.stroke();
        }

        // Split-mandible recessed forward pincer prow
        const bodyGrad = ctx.createLinearGradient(-16, -6, 22, 6);
        if (isOverdrive) {
          bodyGrad.addColorStop(0, '#78350f');
          bodyGrad.addColorStop(0.55, '#f59e0b');
          bodyGrad.addColorStop(1, '#fffbeb');
        } else {
          bodyGrad.addColorStop(0, '#091418');
          bodyGrad.addColorStop(0.42, '#163438');
          bodyGrad.addColorStop(0.78, '#2dd4bf');
          bodyGrad.addColorStop(1, '#ecfdf5');
        }
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = isOverdrive ? '#fde047' : '#6ee7b7';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(23.5, -3.8);
        ctx.lineTo(14.5, -1.6);
        ctx.lineTo(16.5, 0);
        ctx.lineTo(14.5, 1.6);
        ctx.lineTo(23.5, 3.8);
        ctx.lineTo(9.0, 6.8);
        ctx.lineTo(-4.5, 5.2);
        ctx.lineTo(-14.5, 6.2);
        ctx.lineTo(-18.5, 0);
        ctx.lineTo(-14.5, -6.2);
        ctx.lineTo(-4.5, -5.2);
        ctx.lineTo(9.0, -6.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bio-mechanical dorsal rib vents
        ctx.strokeStyle = deep;
        ctx.lineWidth = 1.2;
        for (let x = -11; x <= -1; x += 3.5) {
          ctx.beginPath();
          ctx.moveTo(x, -3.5);
          ctx.lineTo(x + 1.5, 0);
          ctx.lineTo(x, 3.5);
          ctx.stroke();
        }

        // Predator tri-slit glowing visor cockpit
        ctx.fillStyle = '#03120e';
        ctx.beginPath();
        ctx.moveTo(13.5, 0);
        ctx.lineTo(5.5, -4.4);
        ctx.lineTo(1.5, 0);
        ctx.lineTo(5.5, 4.4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(11.5, 0); ctx.lineTo(5.8, -2.8);
        ctx.moveTo(11.5, 0); ctx.lineTo(5.8, 2.8);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(6.8, 0, 1.7, 0, Math.PI * 2);
        ctx.fill();

        // Central vectoring plasma thruster core
        ctx.fillStyle = '#04120f';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(-15.5, 0, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-15.5, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();
      },
    },

    {
      id: 'aegis',
      name: 'AEGIS VANGUARD',
      classTag: 'TWIN-BOOM GUNSHIP',
      tagline: 'Heavy catamaran twin-hull armor prongs, central rail channel & dual ion drives.',
      accent: '#ff9e00',
      accentRgb: [1.0, 0.62, 0.0],
      trailRgb: [1.0, 0.62, 0.0],
      flameRgb: [1.0, 0.68, 0.12],
      thrusters: [
        { back: 18.5, lat: -11.2, w: 14.0, lenScale: 0.95 },
        { back: 18.5, lat: 11.2, w: 14.0, lenScale: 0.95 },
      ],
      draw(ctx, isOverdrive) {
        const accent = isOverdrive ? '#ffd600' : '#ff9e00';
        const hi = isOverdrive ? '#fffbeb' : '#fef3c7';

        // Warm forge-amber industrial aura
        const halo = ctx.createRadialGradient(0, 0, 9, 0, 0, 30);
        halo.addColorStop(0, isOverdrive ? 'rgba(255, 214, 0, 0.36)' : 'rgba(255, 158, 0, 0.28)');
        halo.addColorStop(0.58, 'rgba(234, 88, 12, 0.14)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();

        // Central energy bridge connecting the twin catamaran hulls
        ctx.fillStyle = isOverdrive ? '#78350f' : '#1e293b';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(-14.5, -9.5, 18.0, 19.0, 2.5);
        ctx.fill();
        ctx.stroke();

        // Exposed glowing central plasma capacitor core between the twin prongs
        const capGlow = ctx.createRadialGradient(5, 0, 1, 5, 0, 7.5);
        capGlow.addColorStop(0, '#ffffff');
        capGlow.addColorStop(0.45, accent);
        capGlow.addColorStop(1, 'rgba(255, 158, 0, 0)');
        ctx.fillStyle = capGlow;
        ctx.beginPath();
        ctx.arc(6.0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();

        // Twin heavy armored forward catamaran prongs (blocky, authoritative gunship silhouette)
        ctx.shadowColor = accent;
        ctx.shadowBlur = isOverdrive ? 14 : 10;
        for (const sgn of [-1, 1]) {
          const hullGrad = ctx.createLinearGradient(-18, sgn * 5, 22, sgn * 18);
          if (isOverdrive) {
            hullGrad.addColorStop(0, '#78350f');
            hullGrad.addColorStop(0.5, '#f59e0b');
            hullGrad.addColorStop(1, '#fef08a');
          } else {
            hullGrad.addColorStop(0, '#1e293b');
            hullGrad.addColorStop(0.35, '#475569');
            hullGrad.addColorStop(0.72, '#94a3b8');
            hullGrad.addColorStop(1, '#e2e8f0');
          }
          ctx.fillStyle = hullGrad;
          ctx.strokeStyle = hi;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(22.5, sgn * 7.2);
          ctx.lineTo(18.5, sgn * 15.8);
          ctx.lineTo(4.0, sgn * 17.8);
          ctx.lineTo(-10.5, sgn * 19.2);
          ctx.lineTo(-17.8, sgn * 15.5);
          ctx.lineTo(-17.8, sgn * 7.2);
          ctx.lineTo(3.5, sgn * 5.2);
          ctx.lineTo(18.5, sgn * 5.0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Industrial bronze-amber shoulder armor plate + radiator cooling vents
          ctx.shadowBlur = 0;
          ctx.fillStyle = isOverdrive ? '#b45309' : '#9a3412';
          ctx.strokeStyle = accent;
          ctx.lineWidth = 0.95;
          ctx.beginPath();
          ctx.roundRect(-12.5, sgn > 0 ? 9.5 : -15.5, 19.0, 6.0, 1.5);
          ctx.fill();
          ctx.stroke();

          // Heat-sink radiator slots
          ctx.strokeStyle = hi;
          ctx.lineWidth = 1.0;
          for (let rx = -9; rx <= 3; rx += 4) {
            ctx.beginPath();
            ctx.moveTo(rx, sgn * 10.6);
            ctx.lineTo(rx, sgn * 14.4);
            ctx.stroke();
          }

          // Inner magnetic rail-channel plasma strip
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(19.5, sgn * 5.8);
          ctx.lineTo(3.0, sgn * 5.8);
          ctx.stroke();

          // Heavy rear ion engine nozzle ring
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.roundRect(-19.2, sgn > 0 ? 8.2 : -14.2, 4.2, 6.0, 1.2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-18.6, sgn * 11.2, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }

        // Armored central command bridge & twin tactical visor optics
        const bridgeGrad = ctx.createLinearGradient(-13, -6, 6, 6);
        bridgeGrad.addColorStop(0, '#0f172a');
        bridgeGrad.addColorStop(0.55, '#334155');
        bridgeGrad.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = bridgeGrad;
        ctx.strokeStyle = hi;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(5.5, -5.5);
        ctx.lineTo(8.0, 0);
        ctx.lineTo(5.5, 5.5);
        ctx.lineTo(-12.0, 6.5);
        ctx.lineTo(-15.0, 0);
        ctx.lineTo(-12.0, -6.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing amber armored visor slit
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.roundRect(-1.5, -4.2, 5.2, 8.4, 1.4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0.2, -3.0, 2.2, 6.0);

        // Aft heavy tether anchor winch
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(-13.8, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      },
    },

    {
      id: 'seraph',
      name: 'SERAPH HALO',
      classTag: 'ASTRAL RING-DRIVE',
      tagline: 'Floating orbital halo ring, detached chevron fins & crystalline prism spire.',
      accent: '#c084fc',
      accentRgb: [0.75, 0.52, 0.99],
      trailRgb: [0.75, 0.52, 0.99],
      flameRgb: [0.82, 0.58, 1.0],
      thrusters: [
        { back: 17.5, lat: 0, w: 11.0, lenScale: 1.15 },
        { back: 13.5, lat: -10.5, w: 7.5, lenScale: 0.72 },
        { back: 13.5, lat: 10.5, w: 7.5, lenScale: 0.72 },
      ],
      draw(ctx, isOverdrive) {
        const accent = isOverdrive ? '#ffd600' : '#c084fc';
        const hi = isOverdrive ? '#fffbeb' : '#f5d0fe';
        const trim = isOverdrive ? '#f59e0b' : '#38bdf8';

        // Radiant celestial halo aura
        const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 30);
        halo.addColorStop(0, isOverdrive ? 'rgba(255, 214, 0, 0.38)' : 'rgba(192, 132, 252, 0.32)');
        halo.addColorStop(0.58, isOverdrive ? 'rgba(192, 132, 252, 0.16)' : 'rgba(56, 189, 248, 0.14)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 30, 0, Math.PI * 2);
        ctx.fill();

        // Luminous energy bridges suspending the outer halo ring around the central spire
        ctx.strokeStyle = isOverdrive ? 'rgba(255, 214, 0, 0.65)' : 'rgba(192, 132, 252, 0.65)';
        ctx.lineWidth = 1.6;
        for (const a of [0.75, -0.75, 2.35, -2.35]) {
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5);
          ctx.lineTo(Math.cos(a) * 18.0, Math.sin(a) * 18.0);
          ctx.stroke();
        }

        // Segmented Floating Orbital Halo Ring (unmistakable geometric ring-drive silhouette!)
        ctx.shadowColor = accent;
        ctx.shadowBlur = isOverdrive ? 15 : 12;
        const ringArcs = [
          [-0.45, 0.45],
          [0.72, 2.38],
          [-2.38, -0.72],
        ];
        for (const [a0, a1] of ringArcs) {
          ctx.strokeStyle = isOverdrive ? '#fde047' : '#f8fafc';
          ctx.lineWidth = 4.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(-1.5, 0, 17.8, a0, a1);
          ctx.stroke();

          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(-1.5, 0, 17.8, a0 + 0.08, a1 - 0.08);
          ctx.stroke();
        }

        // Detached floating wing-chevron stabilizers outside the ring
        ctx.shadowBlur = 0;
        const finGrad = ctx.createLinearGradient(-14, -22, 16, 22);
        if (isOverdrive) {
          finGrad.addColorStop(0, '#fffbeb');
          finGrad.addColorStop(0.6, '#fde047');
          finGrad.addColorStop(1, '#b45309');
        } else {
          finGrad.addColorStop(0, '#ffffff');
          finGrad.addColorStop(0.55, '#e9d5ff');
          finGrad.addColorStop(1, '#6b21a8');
        }
        ctx.fillStyle = finGrad;
        ctx.strokeStyle = hi;
        ctx.lineWidth = 1.05;
        for (const sgn of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(10.5, sgn * 15.5);
          ctx.lineTo(1.5, sgn * 22.8);
          ctx.lineTo(-9.5, sgn * 19.5);
          ctx.lineTo(-1.0, sgn * 16.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Central floating alabaster-ivory teardrop spire
        ctx.shadowColor = accent;
        ctx.shadowBlur = 10;
        const spireGrad = ctx.createLinearGradient(-15, -6, 25, 6);
        if (isOverdrive) {
          spireGrad.addColorStop(0, '#f59e0b');
          spireGrad.addColorStop(0.5, '#fef08a');
          spireGrad.addColorStop(1, '#ffffff');
        } else {
          spireGrad.addColorStop(0, '#7e22ce');
          spireGrad.addColorStop(0.4, '#ede9fe');
          spireGrad.addColorStop(0.85, '#ffffff');
          spireGrad.addColorStop(1, '#e0f2fe');
        }
        ctx.fillStyle = spireGrad;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(25.0, 0);
        ctx.quadraticCurveTo(11.0, -7.8, -6.5, -5.8);
        ctx.lineTo(-16.5, 0);
        ctx.lineTo(-6.5, 5.8);
        ctx.quadraticCurveTo(11.0, 7.8, 25.0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sacred-geometry gold/cyan filigree trim along spire
        ctx.shadowBlur = 0;
        ctx.strokeStyle = trim;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(17.5, 0);
        ctx.lineTo(2.0, -4.0);
        ctx.lineTo(-10.5, 0);
        ctx.lineTo(2.0, 4.0);
        ctx.closePath();
        ctx.stroke();

        // Crystalline faceted astral prism core
        const jewel = ctx.createRadialGradient(4, 0, 0.8, 4, 0, 5.5);
        jewel.addColorStop(0, '#ffffff');
        jewel.addColorStop(0.45, accent);
        jewel.addColorStop(1, '#3b0764');
        ctx.fillStyle = jewel;
        ctx.beginPath();
        ctx.moveTo(11.5, 0);
        ctx.lineTo(3.5, -3.4);
        ctx.lineTo(-2.5, 0);
        ctx.lineTo(3.5, 3.4);
        ctx.closePath();
        ctx.fill();

        // Halo thruster jewel emitters
        for (const [ex, ey] of [[-16.0, 0], [-13.2, -10.5], [-13.2, 10.5]]) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex, ey, 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },

    {
      id: 'ronin',
      name: 'RONIN ZERO-X',
      classTag: 'CYBER-BLADE RACER',
      tagline: 'Asymmetric razor-needle fuselage, port stabilizer blade & starboard reactor pod.',
      accent: '#ff2a6d',
      accentRgb: [1.0, 0.16, 0.43],
      trailRgb: [1.0, 0.16, 0.43],
      flameRgb: [1.0, 0.25, 0.52],
      thrusters: [
        { back: 19.0, lat: -1.5, w: 12.5, lenScale: 1.2 },
        { back: 14.0, lat: 9.8, w: 8.5, lenScale: 0.88 },
      ],
      draw(ctx, isOverdrive) {
        const accent = isOverdrive ? '#ffd600' : '#ff2a6d';
        const hi = isOverdrive ? '#fffbeb' : '#ffe4e6';

        // Hyper-crimson cyber aura
        const halo = ctx.createRadialGradient(0, 0, 8, 0, 0, 29);
        halo.addColorStop(0, isOverdrive ? 'rgba(255, 214, 0, 0.36)' : 'rgba(255, 42, 109, 0.30)');
        halo.addColorStop(0.58, 'rgba(219, 39, 119, 0.13)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, 29, 0, Math.PI * 2);
        ctx.fill();

        // Swept-back twin V-tail hyper-fins
        ctx.fillStyle = isOverdrive ? '#78350f' : '#18181b';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.1;
        for (const sgn of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(-6.5, sgn * 3.5);
          ctx.lineTo(-19.5, sgn * 14.5);
          ctx.lineTo(-15.5, sgn * 16.0);
          ctx.lineTo(-11.5, sgn * 5.0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // ASYMMETRIC PORT-SIDE (-Y) Extended Katana Stabilizer Blade
        ctx.shadowColor = accent;
        ctx.shadowBlur = isOverdrive ? 14 : 11;
        const bladeGrad = ctx.createLinearGradient(-14, -22, 18, -5);
        if (isOverdrive) {
          bladeGrad.addColorStop(0, '#b45309');
          bladeGrad.addColorStop(0.55, '#fde047');
          bladeGrad.addColorStop(1, '#ffffff');
        } else {
          bladeGrad.addColorStop(0, '#4c0519');
          bladeGrad.addColorStop(0.45, '#e11d48');
          bladeGrad.addColorStop(0.85, '#ff4d84');
          bladeGrad.addColorStop(1, '#ffffff');
        }
        ctx.fillStyle = bladeGrad;
        ctx.strokeStyle = hi;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(14.5, -5.2);
        ctx.lineTo(1.5, -22.2);
        ctx.lineTo(-9.5, -20.5);
        ctx.lineTo(-6.5, -13.0);
        ctx.lineTo(-15.5, -10.5);
        ctx.lineTo(-11.0, -4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // White cyber racing livery stripe on port blade
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(6.5, -9.5);
        ctx.lineTo(-2.5, -19.0);
        ctx.stroke();

        // ASYMMETRIC STARBOARD-SIDE (+Y) Compact Overclocked Reactor Outrigger Pod
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(1.5, 4.0);
        ctx.lineTo(-2.0, 10.5);
        ctx.moveTo(-7.5, 4.0);
        ctx.lineTo(-9.5, 10.5);
        ctx.stroke();

        const podGrad = ctx.createLinearGradient(-14, 7, 10, 15);
        podGrad.addColorStop(0, '#18181b');
        podGrad.addColorStop(0.6, '#3f3f46');
        podGrad.addColorStop(1, '#f4f4f5');
        ctx.fillStyle = podGrad;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(11.5, 10.0);
        ctx.lineTo(4.5, 14.5);
        ctx.lineTo(-13.5, 13.8);
        ctx.lineTo(-14.5, 7.2);
        ctx.lineTo(4.5, 6.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Glowing exposed reactor coils inside starboard pod
        ctx.fillStyle = accent;
        for (let cx = -9.5; cx <= 1.5; cx += 4.2) {
          ctx.fillRect(cx, 8.6, 2.4, 3.4);
        }
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-14.0, 10.2, 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Razor-long needle-nose racing fuselage
        ctx.shadowColor = accent;
        ctx.shadowBlur = 9;
        const noseGrad = ctx.createLinearGradient(-16, -5, 27, 5);
        if (isOverdrive) {
          noseGrad.addColorStop(0, '#92400e');
          noseGrad.addColorStop(0.5, '#fde047');
          noseGrad.addColorStop(1, '#ffffff');
        } else {
          noseGrad.addColorStop(0, '#18181b');
          noseGrad.addColorStop(0.35, '#27272a');
          noseGrad.addColorStop(0.72, '#e11d48');
          noseGrad.addColorStop(1, '#ffffff');
        }
        ctx.fillStyle = noseGrad;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(27.0, -0.5);
        ctx.lineTo(10.5, -5.2);
        ctx.lineTo(-14.5, -4.6);
        ctx.lineTo(-18.5, -1.5);
        ctx.lineTo(-14.5, 4.4);
        ctx.lineTo(10.5, 4.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sleek cyber holographic visor strip
        ctx.shadowBlur = 0;
        const visor = ctx.createLinearGradient(15, -2.5, -4, 2.5);
        visor.addColorStop(0, '#ffffff');
        visor.addColorStop(0.3, '#00f0ff');
        visor.addColorStop(1, '#083344');
        ctx.fillStyle = visor;
        ctx.beginPath();
        ctx.moveTo(15.5, -0.4);
        ctx.lineTo(3.0, -3.0);
        ctx.lineTo(-4.5, -0.4);
        ctx.lineTo(3.0, 2.2);
        ctx.closePath();
        ctx.fill();

        // Aft main exhaust port
        ctx.fillStyle = '#09090b';
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(-16.8, -1.0, 2.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-16.8, -1.0, 1.2, 0, Math.PI * 2);
        ctx.fill();
      },
    },
  ];

  const SHIP_BY_ID = new Map(SHIPS.map((s) => [s.id, s]));
  const PREVIEW_CACHE = new Map();

  let selectedId = 'valkyrie';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SHIP_BY_ID.has(saved)) selectedId = saved;
  } catch {}

  function getSelectedId() {
    return selectedId;
  }

  function setSelectedId(id) {
    if (!SHIP_BY_ID.has(id)) return false;
    selectedId = id;
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {}
    return true;
  }

  function getShip(id) {
    return SHIP_BY_ID.get(id || selectedId) || SHIPS[0];
  }

  function getPreviewUrl(id) {
    if (PREVIEW_CACHE.has(id)) return PREVIEW_CACHE.get(id);
    const ship = getShip(id);
    const size = 160;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    // Slight heroic upward-right 28° tilt for Hangar showcase readability
    ctx.rotate(-0.48);
    ctx.scale(2.45, 2.45);
    ship.draw(ctx, false);
    ctx.restore();
    const url = c.toDataURL('image/png');
    PREVIEW_CACHE.set(id, url);
    return url;
  }

  function prebakePreviews() {
    for (let i = 0; i < SHIPS.length; i++) {
      getPreviewUrl(SHIPS[i].id);
    }
  }

  window.ChaosShips = {
    list: SHIPS,
    get: getShip,
    getSelectedId,
    setSelectedId,
    getPreviewUrl,
    prebakePreviews,
  };
})();
