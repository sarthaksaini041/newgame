(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // UI Elements
  const hudEl = document.getElementById('hud');
  const startScreen = document.getElementById('startScreen');
  const startBtn = document.getElementById('startBtn');
  const hpCellsEl = document.getElementById('hpCells');
  const hpText = document.getElementById('hpText');
  const xpBar = document.getElementById('xpBar');
  const lvlText = document.getElementById('lvlText');
  const odBar = document.getElementById('odBar');
  const odReady = document.getElementById('odReady');
  const scoreText = document.getElementById('scoreText');
  const comboText = document.getElementById('comboText');
  const timeText = document.getElementById('timeText');
  const waveText = document.getElementById('waveText');
  const bossHud = document.getElementById('bossHud');
  const bossNameEl = document.getElementById('bossName');
  const bossBar = document.getElementById('bossBar');
  const controlsHint = document.getElementById('controlsHint');
  const muteBtn = document.getElementById('muteBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const bestScoreStart = document.getElementById('bestScoreStart');
  const bestComboStart = document.getElementById('bestComboStart');

  const upgradeDialog = document.getElementById('upgradeDialog');
  const upgradeChoicesEl = document.getElementById('upgradeChoices');
  const pauseDialog = document.getElementById('pauseDialog');
  const resumeBtn = document.getElementById('resumeBtn');
  const restartFromPauseBtn = document.getElementById('restartFromPauseBtn');
  const gameOverDialog = document.getElementById('gameOverDialog');
  const retryBtn = document.getElementById('retryBtn');
  const menuBtn = document.getElementById('menuBtn');
  const finalScoreEl = document.getElementById('finalScore');
  const finalTimeEl = document.getElementById('finalTime');
  const finalComboEl = document.getElementById('finalCombo');
  const finalKillsEl = document.getElementById('finalKills');
  const newRecordBanner = document.getElementById('newRecordBanner');

  const ARENA_W = 2200;
  const ARENA_H = 1600;
  const STORAGE_KEY = 'chaos_tether_records_v1';

  const UPGRADES = [
    {
      id: 'twin_orb',
      tier: 'ORBITAL',
      color: '#00f0ff',
      svg: `<svg viewBox="0 0 48 48" fill="none">
        <defs>
          <radialGradient id="gTwin" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="45%" stop-color="#00f0ff"/>
            <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="19" stroke="#00f0ff" stroke-opacity="0.25" stroke-dasharray="3 3"/>
        <ellipse cx="24" cy="24" rx="18" ry="8" transform="rotate(-28 24 24)" stroke="#00f0ff" stroke-width="1.6" stroke-opacity="0.75"/>
        <circle cx="13" cy="30" r="7" fill="url(#gTwin)"/>
        <circle cx="13" cy="30" r="3" fill="#fff"/>
        <circle cx="35" cy="18" r="7" fill="url(#gTwin)"/>
        <circle cx="35" cy="18" r="3" fill="#fff"/>
      </svg>`,
      title: 'Twin Orbit',
      desc: 'Manifest an extra tethered Wrecking Core to multiply your chaos.',
      apply: (g) => g.spawnOrb(),
    },
    {
      id: 'chain_lightning',
      tier: 'ARC TECH',
      color: '#38bdf8',
      svg: `<svg viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="gArc" x1="12" y1="4" x2="34" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="50%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0284c7"/>
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="18" stroke="#38bdf8" stroke-opacity="0.28" stroke-width="1.2"/>
        <polygon points="27,5 12,25 22,25 19,43 36,21 25,21" fill="url(#gArc)" stroke="#e0f2fe" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M7 14L12 16M37 32L42 34M34 9L38 6" stroke="#7dd3fc" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`,
      title: 'Arc Conductor',
      desc: 'Supersonic impacts arc high-voltage lightning to nearby hostiles.',
      apply: (g) => { g.mods.lightning += 1; },
    },
    {
      id: 'black_hole',
      tier: 'GRAVITY',
      color: '#b829ff',
      svg: `<svg viewBox="0 0 48 48" fill="none">
        <defs>
          <radialGradient id="gHole" cx="50%" cy="50%" r="50%">
            <stop offset="28%" stop-color="#020308"/>
            <stop offset="55%" stop-color="#b829ff"/>
            <stop offset="100%" stop-color="#b829ff" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="24" cy="24" r="20" fill="url(#gHole)"/>
        <path d="M24 7 A17 17 0 0 1 41 24" stroke="#e9d5ff" stroke-width="2" stroke-linecap="round"/>
        <path d="M24 41 A17 17 0 0 1 7 24" stroke="#e9d5ff" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 13 A14 14 0 0 1 36 13" stroke="#d8b4fe" stroke-width="1.5" stroke-opacity="0.7" stroke-linecap="round"/>
        <circle cx="24" cy="24" r="6.5" fill="#03050c" stroke="#f5d0fe" stroke-width="1.6"/>
      </svg>`,
      title: 'Singularity Core',
      desc: 'Supersonic kills can spawn mini Black Holes that pull enemies in.',
      apply: (g) => { g.mods.blackHole += 1; },
    },
    {
      id: 'laser_tether',
      tier: 'TETHER',
      color: '#ff2a6d',
      svg: `<svg viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="gBeam" x1="8" y1="40" x2="40" y2="8" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ff2a6d"/>
            <stop offset="50%" stop-color="#ffffff"/>
            <stop offset="100%" stop-color="#ff2a6d"/>
          </linearGradient>
        </defs>
        <line x1="9" y1="39" x2="39" y2="9" stroke="#ff2a6d" stroke-width="8" stroke-opacity="0.32" stroke-linecap="round"/>
        <line x1="9" y1="39" x2="39" y2="9" stroke="url(#gBeam)" stroke-width="3" stroke-linecap="round"/>
        <circle cx="10" cy="38" r="5" fill="#ff2a6d" stroke="#fff" stroke-width="1.5"/>
        <circle cx="38" cy="10" r="6.5" fill="#ff2a6d" stroke="#fff" stroke-width="1.5"/>
        <path d="M17 18L21 14M27 34L31 30" stroke="#fda4af" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`,
      title: 'Plasma Chain',
      desc: 'Your elastic tether beam superheats and slices hostiles on contact.',
      apply: (g) => { g.mods.laserTether += 1; },
    },
    {
      id: 'elastic_whip',
      tier: 'KINETIC',
      color: '#ffd600',
      svg: `<svg viewBox="0 0 48 48" fill="none">
        <defs>
          <radialGradient id="gWhip" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="55%" stop-color="#ffd600"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </radialGradient>
        </defs>
        <polygon points="24,4 29,14 39,9 34,19 44,24 34,29 39,39 29,34 24,44 19,34 9,39 14,29 4,24 14,19 9,9 19,14" fill="url(#gWhip)" stroke="#fef08a" stroke-width="1.3" stroke-linejoin="round"/>
        <circle cx="24" cy="24" r="6" fill="#070b18" stroke="#fff" stroke-width="1.5"/>
      </svg>`,
      title: 'Hyper-Elasticity',
      desc: '+25% Core size, +30% whip snap force, and +25% smash damage.',
      apply: (g) => {
        g.mods.orbScale += 0.25;
        g.mods.whipForce += 0.3;
        g.mods.damageMult += 0.25;
        g.orbs.forEach((o) => { o.baseRadius = 22 * g.mods.orbScale; });
      },
    },
    {
      id: 'shrapnel',
      tier: 'ORDNANCE',
      color: '#ff9e00',
      svg: `<svg viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="16" stroke="#ff9e00" stroke-opacity="0.28" stroke-dasharray="4 4"/>
        <polygon points="24,4 28,15 24,19 20,15" fill="#ff9e00" stroke="#fef08a" stroke-width="1"/>
        <polygon points="44,24 33,28 29,24 33,20" fill="#ff9e00" stroke="#fef08a" stroke-width="1"/>
        <polygon points="24,44 20,33 24,29 28,33" fill="#ff9e00" stroke="#fef08a" stroke-width="1"/>
        <polygon points="4,24 15,20 19,24 15,28" fill="#ff9e00" stroke="#fef08a" stroke-width="1"/>
        <circle cx="24" cy="24" r="4.5" fill="#fff"/>
      </svg>`,
      title: 'Shatter Nova',
      desc: 'Shattered hostiles erupt into homing plasma shards.',
      apply: (g) => { g.mods.shrapnel += 1; },
    },
    {
      id: 'vampiric',
      tier: 'SURVIVAL',
      color: '#05ffa1',
      svg: `<svg viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="gShield" x1="24" y1="5" x2="24" y2="43" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#05ffa1" stop-opacity="0.45"/>
            <stop offset="100%" stop-color="#059669" stop-opacity="0.12"/>
          </linearGradient>
        </defs>
        <path d="M24 5 L40 12 V24 C40 34 32 40 24 43 C16 40 8 34 8 24 V12 Z" fill="url(#gShield)" stroke="#05ffa1" stroke-width="2" stroke-linejoin="round"/>
        <path d="M24 16 V32 M16 24 H32" stroke="#ffffff" stroke-width="3.2" stroke-linecap="round"/>
      </svg>`,
      title: 'Siphon Core',
      desc: '+1 Max Hull, repair +1 Hull now, and repair every 15 kills.',
      apply: (g) => {
        g.mods.vampiric += 1;
        g.player.maxHp += 1;
        g.player.hp = Math.min(g.player.maxHp, g.player.hp + 1);
      },
    },
    {
      id: 'berserker',
      tier: 'THRUSTER',
      color: '#38bdf8',
      svg: `<svg viewBox="0 0 48 48" fill="none">
        <defs>
          <linearGradient id="gBoost" x1="24" y1="5" x2="24" y2="35" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ffffff"/>
            <stop offset="55%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
        </defs>
        <path d="M24 5 L34 21 H28 V34 H20 V21 H14 Z" fill="url(#gBoost)" stroke="#e0f2fe" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M17 37 L24 44 L31 37" stroke="#ffd600" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8 20 L12 16 M40 20 L36 16" stroke="#7dd3fc" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`,
      title: 'Thruster Overclock',
      desc: '+22% Move speed, -30% Dash cooldown, +25% Nova charge.',
      apply: (g) => {
        g.mods.speedMult += 0.22;
        g.mods.dashCdMult *= 0.7;
        g.mods.odGainMult += 0.25;
      },
    },
  ];

  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { bestScore: 0, bestCombo: 1 };
  }

  function saveRecords(score, combo) {
    const prev = loadRecords();
    const isNew = score > prev.bestScore;
    const next = {
      bestScore: Math.max(prev.bestScore, score),
      bestCombo: Math.max(prev.bestCombo, combo),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    return { isNew, ...next };
  }

  function refreshStartRecords() {
    const rec = loadRecords();
    bestScoreStart.textContent = rec.bestScore.toLocaleString();
    bestComboStart.textContent = `x${rec.bestCombo}`;
  }

  class CameraShaker {
    constructor() {
      this.trauma = 0;
      this.decay = 1.9;
      this.maxOffset = 24;
      this.maxAngle = 0.032;
    }
    add(amount) { this.trauma = Math.min(1, this.trauma + amount); }
    update(dt) { this.trauma = Math.max(0, this.trauma - this.decay * dt); }
    getOffset() {
      if (this.trauma <= 0.001) return { x: 0, y: 0, angle: 0 };
      const s = this.trauma * this.trauma;
      return {
        x: (Math.random() * 2 - 1) * this.maxOffset * s,
        y: (Math.random() * 2 - 1) * this.maxOffset * s,
        angle: (Math.random() * 2 - 1) * this.maxAngle * s,
      };
    }
  }

  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function distSq(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  function pointToSegmentDistSq(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return distSq(px, py, x1, y1);
    const t = clamp(((px - x1) * dx + (py - y1) * dy) / lenSq, 0, 1);
    return distSq(px, py, x1 + t * dx, y1 + t * dy);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  class ChaosGame {
    constructor() {
      this.viewW = window.innerWidth;
      this.viewH = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.state = 'title';
      this.controlMode = 'hybrid';
      this.shaker = new CameraShaker();
      this.hitStopFrames = 0;
      this.screenFlash = { alpha: 0, color: '#00f0ff' };

      this.keys = new Set();
      this.mouse = { x: this.viewW / 2, y: this.viewH / 2, worldX: ARENA_W / 2, worldY: ARENA_H / 2 };
      this.camera = { x: ARENA_W / 2, y: ARENA_H / 2 };

      // Pre-rendered multi-layer procedural deep-space backdrop
      this.space = new window.SpaceBackdrop(ARENA_W, ARENA_H);

      this.resetEntities();
      this.bindEvents();
      this.resize();
      refreshStartRecords();

      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    }

    resetEntities() {
      this.elapsed = 0;
      this.score = 0;
      this.kills = 0;
      this.combo = 1;
      this.maxCombo = 1;
      this.comboTimer = 0;
      this.wave = 1;
      this.nextBossTime = 40;
      this.spawnTimer = 0;
      this.overdrive = 0;
      this.overdriveTimer = 0;
      this.tempOrbs = [];

      this.mods = {
        lightning: 0,
        blackHole: 0,
        laserTether: 0,
        orbScale: 1,
        whipForce: 1,
        damageMult: 1,
        shrapnel: 0,
        vampiric: 0,
        speedMult: 1,
        dashCdMult: 1,
        odGainMult: 1,
      };

      this.player = {
        x: ARENA_W / 2,
        y: ARENA_H / 2,
        vx: 0,
        vy: 0,
        angle: 0,
        radius: 17,
        hp: 5,
        maxHp: 5,
        invuln: 0,
        dashTimer: 0,
        dashCd: 0,
        dashDirX: 1,
        dashDirY: 0,
        yanking: false,
        yankCharge: 0,
        xp: 0,
        xpToNext: 12,
        level: 1,
        trail: [],
      };

      this.orbs = [];
      this.spawnOrb();

      this.enemies = [];
      this.gems = [];
      this.particles = [];
      this.shockwaves = [];
      this.lightnings = [];
      this.blackHoles = [];
      this.projectiles = [];
      this.enemyBullets = [];
      this.floatingTexts = [];
    }

    spawnOrb(isTemp = false) {
      const angle = (this.orbs.length * Math.PI * 2) / Math.max(1, this.orbs.length + 1);
      const orb = {
        x: this.player.x + Math.cos(angle) * 140,
        y: this.player.y + Math.sin(angle) * 140,
        vx: -Math.sin(angle) * 340,
        vy: Math.cos(angle) * 340,
        baseRadius: 22 * this.mods.orbScale,
        radius: 22 * this.mods.orbScale,
        trail: [],
        isTemp,
      };
      if (isTemp) this.tempOrbs.push(orb);
      else this.orbs.push(orb);
      return orb;
    }

    resize() {
      this.viewW = window.innerWidth;
      this.viewH = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(this.viewW * this.dpr);
      canvas.height = Math.floor(this.viewH * this.dpr);
      if (this.space) this.space.resize(this.viewW, this.viewH);
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());

      window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        this.keys.add(key);

        if (this.state === 'title' && (key === ' ' || key === 'enter')) {
          e.preventDefault();
          this.startGame();
          return;
        }
        if (this.state === 'gameover' && (key === ' ' || key === 'enter')) {
          e.preventDefault();
          gameOverDialog.close();
          this.startGame();
          return;
        }
        if (this.state === 'upgrade' && ['1', '2', '3'].includes(key)) {
          const cards = upgradeChoicesEl.querySelectorAll('.upgrade-card');
          const idx = Number(key) - 1;
          if (cards[idx]) cards[idx].click();
          return;
        }

        if (this.state === 'playing') {
          if (key === ' ' || key === 'spacebar') {
            e.preventDefault();
            this.triggerDash();
          } else if (key === 'q' || key === 'f') {
            this.triggerOverdrive();
          } else if (key === 'p' || key === 'escape') {
            this.pauseGame();
          } else if (key === 'm') {
            this.toggleMute();
          }
        } else if (this.state === 'paused' && (key === 'p' || key === 'escape')) {
          this.resumeGame();
        }
      });

      window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        this.keys.delete(key);
        if (key === 'shift' && this.player.yanking) this.releaseCatapult();
      });

      canvas.addEventListener('pointermove', (e) => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
      });

      canvas.addEventListener('pointerdown', (e) => {
        if (this.state !== 'playing') return;
        window.ChaosAudio.ensureContext();
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        if (e.button === 2) {
          this.player.yanking = true;
        } else if (e.button === 0) {
          this.triggerDash();
        }
      });

      window.addEventListener('pointerup', (e) => {
        if (e.button === 2 && this.player.yanking) this.releaseCatapult();
      });

      canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      startBtn.addEventListener('click', () => this.startGame());
      muteBtn.addEventListener('click', () => this.toggleMute());
      pauseBtn.addEventListener('click', () => {
        if (this.state === 'playing') this.pauseGame();
        else if (this.state === 'paused') this.resumeGame();
      });

      resumeBtn.addEventListener('click', () => this.resumeGame());
      restartFromPauseBtn.addEventListener('click', () => {
        pauseDialog.close();
        this.startGame();
      });
      pauseDialog.addEventListener('close', () => {
        pauseDialog.returnValue = '';
        if (this.state === 'paused') this.state = 'playing';
        if (this.state === 'playing') window.ChaosAudio.setMusicDucked(false);
      });

      retryBtn.addEventListener('click', () => {
        gameOverDialog.close();
        this.startGame();
      });
      menuBtn.addEventListener('click', () => {
        gameOverDialog.close();
        this.toTitleScreen();
      });
      gameOverDialog.addEventListener('close', () => { gameOverDialog.returnValue = ''; });
      upgradeDialog.addEventListener('close', () => { upgradeDialog.returnValue = ''; });
    }

    toggleMute() {
      const next = !window.ChaosAudio.isMuted();
      window.ChaosAudio.setMuted(next);
      muteBtn.textContent = next ? '🔇' : '🔊';
    }

    startGame() {
      window.ChaosAudio.ensureContext();
      window.ChaosAudio.startAmbient();
      window.ChaosAudio.setMusicDucked(false);
      this.lastIntensity = -1;
      const selectedMode = document.querySelector('input[name="controlMode"]:checked');
      this.controlMode = selectedMode ? selectedMode.value : 'hybrid';
      this.resetEntities();
      this.state = 'playing';
      startScreen.classList.add('hidden');
      hudEl.classList.remove('hidden');
      bossHud.classList.add('hidden');
      controlsHint.classList.remove('faded');
      this.camera.x = this.player.x;
      this.camera.y = this.player.y;
      this.updateHud();
    }

    toTitleScreen() {
      this.resetEntities();
      this.state = 'title';
      hudEl.classList.add('hidden');
      startScreen.classList.remove('hidden');
      refreshStartRecords();
    }

    pauseGame() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      window.ChaosAudio.setMusicDucked(true);
      pauseDialog.showModal();
    }

    resumeGame() {
      if (this.state !== 'paused') return;
      pauseDialog.close();
      this.state = 'playing';
      window.ChaosAudio.setMusicDucked(false);
    }

    triggerDash() {
      const p = this.player;
      if (p.dashCd > 0 || p.dashTimer > 0) return;

      let dx = 0;
      let dy = 0;
      if (this.controlMode === 'hybrid') {
        if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
        if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
        if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
        if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;
      }
      if (dx === 0 && dy === 0) {
        dx = this.mouse.worldX - p.x;
        dy = this.mouse.worldY - p.y;
      }
      const len = Math.hypot(dx, dy) || 1;
      p.dashDirX = dx / len;
      p.dashDirY = dy / len;
      p.dashTimer = 0.16;
      p.dashCd = 0.85 * this.mods.dashCdMult;
      p.invuln = Math.max(p.invuln, 0.24);
      this.shaker.add(0.2);
      window.ChaosAudio.playDash();
      this.spawnBurst(p.x, p.y, '#00f0ff', 14, 280);
    }

    releaseCatapult() {
      const p = this.player;
      p.yanking = false;
      if (p.yankCharge < 0.15) {
        p.yankCharge = 0;
        return;
      }
      const aimX = this.mouse.worldX - p.x;
      const aimY = this.mouse.worldY - p.y;
      const len = Math.hypot(aimX, aimY) || 1;
      const nx = aimX / len;
      const ny = aimY / len;
      const power = 980 + 680 * Math.min(1, p.yankCharge);

      for (const orb of this.getAllOrbs()) {
        orb.vx = nx * power + (Math.random() - 0.5) * 120;
        orb.vy = ny * power + (Math.random() - 0.5) * 120;
      }
      p.yankCharge = 0;
      this.shaker.add(0.35);
      window.ChaosAudio.playCatapult();
      this.shockwaves.push({ x: p.x, y: p.y, r: 16, maxR: 135, color: '#ffd600', alpha: 0.95 });
    }

    triggerOverdrive() {
      if (this.overdrive < 100 || this.overdriveTimer > 0) return;
      this.overdrive = 0;
      this.overdriveTimer = 6.5;
      this.shaker.add(0.6);
      this.hitStopFrames = 4;
      this.screenFlash = { alpha: 0.35, color: '#b829ff' };
      window.ChaosAudio.playOverdrive();
      this.shockwaves.push({ x: this.player.x, y: this.player.y, r: 20, maxR: 420, color: '#b829ff', alpha: 1 });
      this.floatingTexts.push({
        x: this.player.x,
        y: this.player.y - 42,
        text: 'HYPER-NOVA OVERDRIVE!',
        color: '#ffd600',
        life: 1.5,
        scale: 1.45,
      });
      this.spawnOrb(true);
      this.spawnOrb(true);
    }

    getAllOrbs() {
      return this.tempOrbs.length ? [...this.orbs, ...this.tempOrbs] : this.orbs;
    }

    openUpgradeModal() {
      this.state = 'upgrade';
      window.ChaosAudio.playLevelUp();
      window.ChaosAudio.setMusicDucked(true);

      const pool = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
      upgradeChoicesEl.innerHTML = '';

      pool.forEach((upg, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'upgrade-card';
        btn.style.setProperty('--upg-color', upg.color);
        if (index === 0) btn.autofocus = true;
        btn.innerHTML = `
          <div class="upgrade-top-row">
            <div class="upgrade-emblem" aria-hidden="true">${upg.svg}</div>
            <span class="upgrade-tier">${upg.tier}</span>
          </div>
          <span class="upgrade-title">${upg.title}</span>
          <span class="upgrade-desc">${upg.desc}</span>
          <span class="upgrade-key"><span>PRESS [${index + 1}]</span><span>EQUIP ▸</span></span>
        `;
        btn.addEventListener('click', () => {
          upg.apply(this);
          upgradeDialog.close();
          this.state = 'playing';
          window.ChaosAudio.setMusicDucked(false);
          this.updateHud();
        });
        upgradeChoicesEl.appendChild(btn);
      });

      upgradeDialog.showModal();
    }

    triggerGameOver() {
      this.state = 'gameover';
      window.ChaosAudio.playGameOver();
      window.ChaosAudio.setMusicDucked(true);
      const rec = saveRecords(this.score, this.maxCombo);
      finalScoreEl.textContent = this.score.toLocaleString();
      finalTimeEl.textContent = formatTime(this.elapsed);
      finalComboEl.textContent = `x${this.maxCombo}`;
      finalKillsEl.textContent = this.kills.toLocaleString();
      newRecordBanner.classList.toggle('hidden', !rec.isNew);
      gameOverDialog.showModal();
    }

    loop(now) {
      const rawDt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this.space.update(rawDt);

      if (this.state === 'title') {
        this.updateTitleDemo(rawDt);
        this.render();
      } else if (this.state === 'playing') {
        if (this.hitStopFrames > 0) {
          this.hitStopFrames--;
          this.shaker.update(rawDt);
          this.render();
        } else {
          this.update(rawDt);
          this.render();
        }
      } else {
        this.render();
      }

      requestAnimationFrame((t) => this.loop(t));
    }

    updateTitleDemo(dt) {
      this.elapsed += dt;
      const p = this.player;
      const nx = ARENA_W / 2 + Math.cos(this.elapsed * 1.15) * 210;
      const ny = ARENA_H / 2 + Math.sin(this.elapsed * 1.75) * 140;
      p.vx = (nx - p.x) / Math.max(0.01, dt);
      p.vy = (ny - p.y) / Math.max(0.01, dt);
      p.angle = Math.atan2(p.vy, p.vx);
      p.x = nx;
      p.y = ny;
      p.trail.push({ x: p.x, y: p.y, angle: p.angle, dash: false });
      if (p.trail.length > 12) p.trail.shift();

      const camBiasX = this.viewW > 820 ? -this.viewW * 0.18 : 0;
      this.camera.x += (p.x + camBiasX - this.camera.x) * 3 * dt;
      this.camera.y += (p.y - this.camera.y) * 3 * dt;
      this.updateOrbs(dt);
      this.updateParticles(dt);
    }

    update(dt) {
      this.elapsed += dt;
      this.wave = 1 + Math.floor(this.elapsed / 15);
      this.shaker.update(dt);
      this.screenFlash.alpha = Math.max(0, this.screenFlash.alpha - 1.8 * dt);

      this.mouse.worldX = this.camera.x - this.viewW / 2 + this.mouse.x;
      this.mouse.worldY = this.camera.y - this.viewH / 2 + this.mouse.y;

      if (this.overdriveTimer > 0) {
        this.overdriveTimer -= dt;
        if (this.overdriveTimer <= 0) {
          this.overdriveTimer = 0;
          this.tempOrbs = [];
        }
      }

      if (this.combo > 1) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) this.combo = 1;
      }

      // Dynamic soundtrack intensity (only push changes to the audio graph)
      const hasBoss = this.enemies.some((en) => en.isBoss);
      const intensity = this.overdriveTimer > 0 ? 1 : Math.min(0.85, (hasBoss ? 0.55 : 0.1) + this.combo * 0.012);
      if (Math.abs(intensity - (this.lastIntensity ?? -1)) > 0.05) {
        this.lastIntensity = intensity;
        window.ChaosAudio.setIntensity(intensity);
      }

      this.updatePlayer(dt);
      this.updateOrbs(dt);
      this.updateSpawning(dt);
      this.updateBlackHoles(dt);
      this.updateEnemies(dt);
      this.updateProjectiles(dt);
      this.updateGems(dt);
      this.updateParticles(dt);

      const lookX = clamp((this.mouse.x - this.viewW / 2) * 0.14, -120, 120);
      const lookY = clamp((this.mouse.y - this.viewH / 2) * 0.14, -90, 90);
      const targetCamX = clamp(this.player.x + lookX, this.viewW * 0.35, ARENA_W - this.viewW * 0.35);
      const targetCamY = clamp(this.player.y + lookY, this.viewH * 0.35, ARENA_H - this.viewH * 0.35);
      this.camera.x += (targetCamX - this.camera.x) * Math.min(1, 8 * dt);
      this.camera.y += (targetCamY - this.camera.y) * Math.min(1, 8 * dt);

      this.updateHud();
    }

    updatePlayer(dt) {
      const p = this.player;
      p.invuln = Math.max(0, p.invuln - dt);
      p.dashCd = Math.max(0, p.dashCd - dt);

      if (this.keys.has('shift') && !p.yanking) p.yanking = true;
      if (p.yanking) p.yankCharge = Math.min(1, p.yankCharge + dt * 1.4);

      const speedBoost = (this.overdriveTimer > 0 ? 1.45 : 1) * this.mods.speedMult;

      if (p.dashTimer > 0) {
        p.dashTimer -= dt;
        const dashSpeed = 1100 * speedBoost;
        p.vx = p.dashDirX * dashSpeed;
        p.vy = p.dashDirY * dashSpeed;
      } else {
        let ax = 0;
        let ay = 0;

        if (this.controlMode === 'mouse') {
          const dx = this.mouse.worldX - p.x;
          const dy = this.mouse.worldY - p.y;
          const d = Math.hypot(dx, dy);
          if (d > 14) { ax = dx / d; ay = dy / d; }
        } else {
          if (this.keys.has('w') || this.keys.has('arrowup')) ay -= 1;
          if (this.keys.has('s') || this.keys.has('arrowdown')) ay += 1;
          if (this.keys.has('a') || this.keys.has('arrowleft')) ax -= 1;
          if (this.keys.has('d') || this.keys.has('arrowright')) ax += 1;
          const len = Math.hypot(ax, ay);
          if (len > 0) { ax /= len; ay /= len; }
        }

        const accel = 2650 * speedBoost;
        p.vx += ax * accel * dt;
        p.vy += ay * accel * dt;

        const drag = Math.exp(-7.2 * dt);
        p.vx *= drag;
        p.vy *= drag;
      }

      if (Math.hypot(p.vx, p.vy) > 25) {
        p.angle = Math.atan2(p.vy, p.vx);
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < p.radius) { p.x = p.radius; p.vx = Math.abs(p.vx) * 0.6; }
      if (p.x > ARENA_W - p.radius) { p.x = ARENA_W - p.radius; p.vx = -Math.abs(p.vx) * 0.6; }
      if (p.y < p.radius) { p.y = p.radius; p.vy = Math.abs(p.vy) * 0.6; }
      if (p.y > ARENA_H - p.radius) { p.y = ARENA_H - p.radius; p.vy = -Math.abs(p.vy) * 0.6; }

      p.trail.push({ x: p.x, y: p.y, angle: p.angle, dash: p.dashTimer > 0 });
      if (p.trail.length > 12) p.trail.shift();
    }

    updateOrbs(dt) {
      const p = this.player;
      const allOrbs = this.getAllOrbs();
      const restLen = p.yanking ? 36 : 138;
      const stiffness = (p.yanking ? 26 : 11.5) * this.mods.whipForce;

      for (const orb of allOrbs) {
        const dx = p.x - orb.x;
        const dy = p.y - orb.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const nx = dx / dist;
        const ny = dy / dist;

        if (dist > restLen) {
          const stretch = dist - restLen;
          orb.vx += nx * stretch * stiffness * dt;
          orb.vy += ny * stretch * stiffness * dt;

          const tx = -ny;
          const ty = nx;
          const tangSpeed = orb.vx * tx + orb.vy * ty;
          const sign = tangSpeed >= 0 ? 1 : -1;
          orb.vx += tx * sign * 115 * this.mods.whipForce * dt;
          orb.vy += ty * sign * 115 * this.mods.whipForce * dt;
        }

        const damp = Math.exp(-0.55 * dt);
        orb.vx *= damp;
        orb.vy *= damp;

        const speed = Math.hypot(orb.vx, orb.vy);
        if (speed > 1650) {
          orb.vx = (orb.vx / speed) * 1650;
          orb.vy = (orb.vy / speed) * 1650;
        }

        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
        orb.radius = orb.baseRadius * (1 + Math.min(0.45, speed / 2200));

        let bounced = false;
        if (orb.x < orb.radius) { orb.x = orb.radius; orb.vx = Math.abs(orb.vx) * 0.88; bounced = true; }
        if (orb.x > ARENA_W - orb.radius) { orb.x = ARENA_W - orb.radius; orb.vx = -Math.abs(orb.vx) * 0.88; bounced = true; }
        if (orb.y < orb.radius) { orb.y = orb.radius; orb.vy = Math.abs(orb.vy) * 0.88; bounced = true; }
        if (orb.y > ARENA_H - orb.radius) { orb.y = ARENA_H - orb.radius; orb.vy = -Math.abs(orb.vy) * 0.88; bounced = true; }
        if (bounced && speed > 500) {
          this.shaker.add(0.14);
          this.spawnBurst(orb.x, orb.y, '#00f0ff', 7, 200);
        }

        orb.trail.push({ x: orb.x, y: orb.y, speed });
        if (orb.trail.length > 20) orb.trail.shift();
      }
    }

    updateSpawning(dt) {
      if (this.elapsed >= this.nextBossTime) {
        this.spawnBoss();
        this.nextBossTime += 45;
      }

      const interval = Math.max(0.22, 1.15 - this.elapsed * 0.0085);
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = interval;
        const pack = 1 + Math.floor(this.wave / 3);
        for (let i = 0; i < pack; i++) this.spawnEnemy();
      }
    }

    spawnEnemy(forceType = null, customX = null, customY = null) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.max(this.viewW, this.viewH) * 0.58 + 80;
      const x = customX ?? clamp(this.player.x + Math.cos(angle) * dist, 40, ARENA_W - 40);
      const y = customY ?? clamp(this.player.y + Math.sin(angle) * dist, 40, ARENA_H - 40);

      const roll = Math.random();
      let type = forceType || 'swarmer';
      if (!forceType) {
        if (this.wave >= 4 && roll < 0.14) type = 'bomber';
        else if (this.wave >= 3 && roll < 0.30) type = 'dasher';
        else if (this.wave >= 2 && roll < 0.48) type = 'splitter';
        else if (this.wave >= 2 && roll < 0.62) type = 'tank';
      }

      const hpScale = 1 + this.wave * 0.18;
      const specs = {
        swarmer: { r: 15, hp: 18 * hpScale, speed: 145 + this.wave * 5, color: '#ff2a6d', xp: 2, score: 25 },
        mini: { r: 10, hp: 10 * hpScale, speed: 205 + this.wave * 5, color: '#d946ef', xp: 1, score: 15 },
        splitter: { r: 22, hp: 42 * hpScale, speed: 105 + this.wave * 3, color: '#b829ff', xp: 4, score: 55 },
        tank: { r: 29, hp: 95 * hpScale, speed: 78 + this.wave * 2, color: '#ff9e00', xp: 7, score: 90 },
        dasher: { r: 17, hp: 28 * hpScale, speed: 120, color: '#ff0099', xp: 4, score: 60 },
        bomber: { r: 20, hp: 26 * hpScale, speed: 130, color: '#05ffa1', xp: 5, score: 70 },
      };

      const s = specs[type];
      this.enemies.push({
        type,
        x,
        y,
        vx: 0,
        vy: 0,
        angle: 0,
        radius: s.r,
        hp: s.hp,
        maxHp: s.hp,
        speed: s.speed,
        color: s.color,
        xp: s.xp,
        score: s.score,
        flash: 0,
        hitCd: 0,
        dashState: 0,
        dashTimer: 0,
        isBoss: false,
      });
    }

    spawnBoss() {
      const angle = Math.random() * Math.PI * 2;
      const x = clamp(this.player.x + Math.cos(angle) * 520, 80, ARENA_W - 80);
      const y = clamp(this.player.y + Math.sin(angle) * 520, 80, ARENA_H - 80);
      const hp = 520 + this.wave * 180;
      const boss = {
        type: 'boss',
        name: this.wave >= 6 ? 'HYPER-LEVIATHAN' : 'OMEGA CORE',
        x,
        y,
        vx: 0,
        vy: 0,
        angle: 0,
        radius: 50,
        hp,
        maxHp: hp,
        speed: 92,
        color: '#ff2a6d',
        xp: 45,
        score: 1200,
        flash: 0,
        hitCd: 0,
        shootTimer: 2.2,
        isBoss: true,
      };
      this.enemies.push(boss);
      window.ChaosAudio.playBossWarning();
      this.shaker.add(0.45);
      this.floatingTexts.push({
        x: this.player.x,
        y: this.player.y - 54,
        text: `⚠ ${boss.name} DETECTED!`,
        color: '#ff2a6d',
        life: 2.0,
        scale: 1.45,
      });
    }

    updateBlackHoles(dt) {
      for (let i = this.blackHoles.length - 1; i >= 0; i--) {
        const bh = this.blackHoles[i];
        bh.life -= dt;
        if (bh.life <= 0) { this.blackHoles.splice(i, 1); continue; }
        for (const e of this.enemies) {
          const dx = bh.x - e.x;
          const dy = bh.y - e.y;
          const d = Math.hypot(dx, dy);
          if (d > 5 && d < 260) {
            const pull = (1 - d / 260) * 540;
            e.vx += (dx / d) * pull * dt;
            e.vy += (dy / d) * pull * dt;
          }
        }
      }
    }

    updateEnemies(dt) {
      const slowFactor = this.overdriveTimer > 0 ? 0.42 : 1;
      const p = this.player;
      const allOrbs = this.getAllOrbs();
      let activeBoss = null;

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (e.isBoss) activeBoss = e;
        e.flash = Math.max(0, e.flash - dt);
        e.hitCd = Math.max(0, e.hitCd - dt);

        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        if (e.type === 'dasher') {
          e.dashTimer -= dt * slowFactor;
          if (e.dashState === 0 && dist < 340 && e.dashTimer <= 0) {
            e.dashState = 1;
            e.dashTimer = 0.45;
            e.aimX = nx;
            e.aimY = ny;
          } else if (e.dashState === 1) {
            e.vx *= 0.85;
            e.vy *= 0.85;
            if (e.dashTimer <= 0) {
              e.dashState = 2;
              e.dashTimer = 0.35;
              e.vx = e.aimX * 700;
              e.vy = e.aimY * 700;
            }
          } else if (e.dashState === 2) {
            if (e.dashTimer <= 0) { e.dashState = 0; e.dashTimer = 1.6; }
          } else {
            e.vx += (nx * e.speed - e.vx) * 5 * dt;
            e.vy += (ny * e.speed - e.vy) * 5 * dt;
          }
        } else {
          e.vx += (nx * e.speed - e.vx) * 4 * dt;
          e.vy += (ny * e.speed - e.vy) * 4 * dt;
        }

        e.angle = Math.atan2(ny, nx);

        if (e.isBoss) {
          e.shootTimer -= dt * slowFactor;
          if (e.shootTimer <= 0) {
            e.shootTimer = 2.6;
            const count = 10;
            for (let k = 0; k < count; k++) {
              const a = (k / count) * Math.PI * 2 + this.elapsed;
              this.enemyBullets.push({
                x: e.x, y: e.y,
                vx: Math.cos(a) * 235, vy: Math.sin(a) * 235,
                radius: 7, life: 4.5,
              });
            }
          }
        }

        e.x += e.vx * dt * slowFactor;
        e.y += e.vy * dt * slowFactor;
        e.x = clamp(e.x, e.radius, ARENA_W - e.radius);
        e.y = clamp(e.y, e.radius, ARENA_H - e.radius);

        for (const orb of allOrbs) {
          const hitDist = e.radius + orb.radius;
          if (e.hitCd <= 0 && distSq(e.x, e.y, orb.x, orb.y) <= hitDist * hitDist) {
            const orbSpeed = Math.hypot(orb.vx, orb.vy);
            const speedMult = Math.max(0.7, orbSpeed / 260);
            const dmg = Math.round(24 * speedMult * this.mods.damageMult);
            this.damageEnemy(i, dmg, orb.vx, orb.vy, orbSpeed > 650);
            break;
          }
        }
        if (!this.enemies[i]) continue;

        if (this.mods.laserTether > 0 && e.hitCd <= 0) {
          for (const orb of allOrbs) {
            const d2 = pointToSegmentDistSq(e.x, e.y, p.x, p.y, orb.x, orb.y);
            if (d2 <= (e.radius + 7) * (e.radius + 7)) {
              this.damageEnemy(i, 14 * this.mods.laserTether * this.mods.damageMult, 0, 0, false);
              break;
            }
          }
        }
        if (!this.enemies[i]) continue;

        const pHit = e.radius + p.radius - 3;
        if (p.invuln <= 0 && distSq(e.x, e.y, p.x, p.y) <= pHit * pHit) {
          this.hurtPlayer(e);
        }
      }

      if (activeBoss) {
        bossHud.classList.remove('hidden');
        bossNameEl.textContent = activeBoss.name;
        bossBar.style.width = `${Math.max(0, (activeBoss.hp / activeBoss.maxHp) * 100)}%`;
      } else {
        bossHud.classList.add('hidden');
      }
    }

    damageEnemy(index, dmg, impulseX, impulseY, isSupersonic) {
      const e = this.enemies[index];
      if (!e) return;

      e.hp -= dmg;
      e.flash = 0.12;
      e.hitCd = 0.12;

      const kb = e.isBoss ? 0.12 : e.type === 'tank' ? 0.35 : 0.85;
      e.vx += impulseX * kb;
      e.vy += impulseY * kb;

      const intensity = clamp(dmg / 45, 0.4, 1.4);
      this.shaker.add(intensity * (isSupersonic ? 0.38 : 0.18));
      if (isSupersonic) this.hitStopFrames = Math.max(this.hitStopFrames, 2);

      this.comboTimer = 2.6;
      window.ChaosAudio.playHit(intensity, this.combo);
      this.spawnBurst(e.x, e.y, isSupersonic ? '#ff2a6d' : '#ffd600', isSupersonic ? 14 : 8, 290);
      this.floatingTexts.push({
        x: e.x + (Math.random() - 0.5) * 18,
        y: e.y - e.radius,
        text: `${dmg}${isSupersonic ? '!' : ''}`,
        color: isSupersonic ? '#ffd600' : '#eef6ff',
        life: 0.68,
        scale: isSupersonic ? 1.25 : 0.95,
      });

      if (this.mods.lightning > 0 && isSupersonic) {
        this.triggerLightning(e, 2 + this.mods.lightning, Math.round(dmg * 0.55));
      }

      if (e.hp <= 0) this.killEnemy(index, isSupersonic);
    }

    triggerLightning(source, chains, dmg) {
      let curr = source;
      const hitSet = new Set([source]);
      for (let c = 0; c < chains; c++) {
        let best = null;
        let bestD2 = 240 * 240;
        for (const other of this.enemies) {
          if (hitSet.has(other) || other.hp <= 0) continue;
          const d2 = distSq(curr.x, curr.y, other.x, other.y);
          if (d2 < bestD2) { bestD2 = d2; best = other; }
        }
        if (!best) break;
        hitSet.add(best);
        this.lightnings.push({ x1: curr.x, y1: curr.y, x2: best.x, y2: best.y, life: 0.16 });
        best.hp -= dmg;
        best.flash = 0.1;
        if (best.hp <= 0) {
          const idx = this.enemies.indexOf(best);
          if (idx !== -1) this.killEnemy(idx, false);
        }
        curr = best;
      }
    }

    killEnemy(index, isSupersonic) {
      const e = this.enemies[index];
      if (!e) return;
      this.enemies.splice(index, 1);
      window.ChaosAudio.playExplosion(e.isBoss || e.type === 'tank');

      this.kills += 1;
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.comboTimer = 2.8;
      this.score += e.score * Math.min(25, 1 + Math.floor(this.combo / 4));

      if (this.overdriveTimer <= 0) {
        this.overdrive = Math.min(100, this.overdrive + 4.5 * this.mods.odGainMult);
      }

      if (this.mods.vampiric > 0 && this.kills % 15 === 0) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
      }

      this.shockwaves.push({
        x: e.x, y: e.y,
        r: e.radius * 0.5,
        maxR: e.isBoss ? 250 : e.radius * 3.4,
        color: e.color, alpha: 0.9,
      });
      this.spawnBurst(e.x, e.y, e.color, e.isBoss ? 50 : 18, e.isBoss ? 460 : 310);

      if (e.isBoss) this.screenFlash = { alpha: 0.35, color: '#ff2a6d' };

      if (e.type === 'splitter') {
        this.spawnEnemy('mini', e.x - 14, e.y);
        this.spawnEnemy('mini', e.x + 14, e.y);
      } else if (e.type === 'bomber') {
        this.shockwaves.push({ x: e.x, y: e.y, r: 15, maxR: 135, color: '#05ffa1', alpha: 0.95 });
        for (let k = this.enemies.length - 1; k >= 0; k--) {
          const other = this.enemies[k];
          if (distSq(e.x, e.y, other.x, other.y) <= 135 * 135) {
            this.damageEnemy(k, 38, 0, 0, false);
          }
        }
      }

      if (this.mods.blackHole > 0 && isSupersonic && Math.random() < 0.35) {
        this.blackHoles.push({ x: e.x, y: e.y, life: 2.6 + this.mods.blackHole * 0.6 });
      }

      if (this.mods.shrapnel > 0) {
        const count = 2 + this.mods.shrapnel * 2;
        for (let s = 0; s < count; s++) {
          const a = (s / count) * Math.PI * 2 + Math.random() * 0.4;
          this.projectiles.push({
            x: e.x, y: e.y,
            vx: Math.cos(a) * 440, vy: Math.sin(a) * 440,
            life: 1.2, dmg: 18 * this.mods.damageMult,
          });
        }
      }

      const gemCount = e.isBoss ? 14 : Math.max(1, Math.round(e.xp / 2));
      for (let g = 0; g < gemCount; g++) {
        this.gems.push({
          x: e.x + (Math.random() - 0.5) * 26,
          y: e.y + (Math.random() - 0.5) * 26,
          vx: (Math.random() - 0.5) * 120,
          vy: (Math.random() - 0.5) * 120,
          val: e.isBoss ? 3 : Math.max(1, Math.round(e.xp / gemCount)),
        });
      }
    }

    hurtPlayer(source) {
      const p = this.player;
      p.hp -= 1;
      p.invuln = 1.1;
      this.combo = 1;
      this.shaker.add(0.65);
      this.hitStopFrames = 5;
      this.screenFlash = { alpha: 0.4, color: '#ff2a6d' };
      window.ChaosAudio.playPlayerHurt();
      this.spawnBurst(p.x, p.y, '#ff2a6d', 24, 360);

      if (source) {
        const dx = p.x - source.x;
        const dy = p.y - source.y;
        const d = Math.hypot(dx, dy) || 1;
        p.vx += (dx / d) * 420;
        p.vy += (dy / d) * 420;
      }

      if (p.hp <= 0) {
        p.hp = 0;
        this.updateHud();
        this.triggerGameOver();
      }
    }

    updateProjectiles(dt) {
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        pr.life -= dt;
        if (pr.life <= 0) { this.projectiles.splice(i, 1); continue; }
        let nearest = null;
        let bestD2 = 260 * 260;
        for (const e of this.enemies) {
          const d2 = distSq(pr.x, pr.y, e.x, e.y);
          if (d2 < bestD2) { bestD2 = d2; nearest = e; }
        }
        if (nearest) {
          const dx = nearest.x - pr.x;
          const dy = nearest.y - pr.y;
          const d = Math.hypot(dx, dy) || 1;
          pr.vx += (dx / d) * 1150 * dt;
          pr.vy += (dy / d) * 1150 * dt;
        }
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;

        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (distSq(pr.x, pr.y, e.x, e.y) <= (e.radius + 6) * (e.radius + 6)) {
            this.damageEnemy(j, Math.round(pr.dmg), pr.vx * 0.2, pr.vy * 0.2, false);
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }

      const p = this.player;
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const b = this.enemyBullets[i];
        b.life -= dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.life <= 0 || b.x < 0 || b.x > ARENA_W || b.y < 0 || b.y > ARENA_H) {
          this.enemyBullets.splice(i, 1);
          continue;
        }
        if (p.invuln <= 0 && distSq(b.x, b.y, p.x, p.y) <= (p.radius + b.radius) * (p.radius + b.radius)) {
          this.enemyBullets.splice(i, 1);
          this.hurtPlayer(b);
        }
      }
    }

    updateGems(dt) {
      const p = this.player;
      const magnetR2 = 215 * 215;
      for (let i = this.gems.length - 1; i >= 0; i--) {
        const g = this.gems[i];
        g.vx *= Math.exp(-5 * dt);
        g.vy *= Math.exp(-5 * dt);

        const dx = p.x - g.x;
        const dy = p.y - g.y;
        const d2 = dx * dx + dy * dy;

        if (d2 < magnetR2) {
          const d = Math.sqrt(d2) || 1;
          const pull = 700 * (1 - d / 215) + 180;
          g.vx += (dx / d) * pull * dt * 8;
          g.vy += (dy / d) * pull * dt * 8;
        }

        g.x += g.vx * dt;
        g.y += g.vy * dt;

        if (d2 <= (p.radius + 14) * (p.radius + 14)) {
          p.xp += g.val;
          this.gems.splice(i, 1);
          window.ChaosAudio.playXp();
          if (p.xp >= p.xpToNext) {
            p.xp -= p.xpToNext;
            p.level += 1;
            p.xpToNext = Math.round(p.xpToNext * 1.32 + 6);
            this.openUpgradeModal();
            return;
          }
        }
      }
    }

    spawnBurst(x, y, color, count, speed) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (0.3 + Math.random() * 0.7) * speed;
        this.particles.push({
          x, y,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 14,
          life: 0.25 + Math.random() * 0.35,
          maxLife: 0.6,
          size: 3 + Math.random() * 4.5,
          color,
        });
      }
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) { this.particles.splice(i, 1); continue; }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.rot += pt.vrot * dt;
        pt.vx *= 0.93;
        pt.vy *= 0.93;
      }

      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.r += (sw.maxR - sw.r) * 10 * dt + 95 * dt;
        sw.alpha -= 2.4 * dt;
        if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
      }

      for (let i = this.lightnings.length - 1; i >= 0; i--) {
        this.lightnings[i].life -= dt;
        if (this.lightnings[i].life <= 0) this.lightnings.splice(i, 1);
      }

      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        ft.y -= 38 * dt;
        if (ft.life <= 0) this.floatingTexts.splice(i, 1);
      }
    }

    updateHud() {
      const p = this.player;
      if (hpCellsEl.childElementCount !== p.maxHp) {
        hpCellsEl.innerHTML = '';
        for (let i = 0; i < p.maxHp; i++) {
          const cell = document.createElement('div');
          cell.className = 'hp-cell';
          hpCellsEl.appendChild(cell);
        }
      }
      Array.from(hpCellsEl.children).forEach((cell, i) => {
        cell.classList.toggle('active', i < p.hp);
      });

      hpText.textContent = `${p.hp}/${p.maxHp}`;
      xpBar.style.width = `${Math.min(100, (p.xp / p.xpToNext) * 100)}%`;
      lvlText.textContent = p.level;
      odBar.style.width = `${this.overdriveTimer > 0 ? (this.overdriveTimer / 6.5) * 100 : this.overdrive}%`;
      odReady.classList.toggle('hidden', this.overdrive < 100 || this.overdriveTimer > 0);

      scoreText.textContent = String(this.score).padStart(6, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      comboText.textContent = `x${this.combo}`;
      comboText.style.transform = `scale(${Math.min(1.45, 1 + this.combo * 0.015)})`;
      timeText.textContent = formatTime(this.elapsed);
      waveText.textContent = String(this.wave).padStart(2, '0');
      if (this.elapsed > 8 && !controlsHint.classList.contains('faded')) {
        controlsHint.classList.add('faded');
      }
    }

    render() {
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

      const shake = this.shaker.getOffset();

      // Parallax deep-space backdrop (nebula, galaxies, stars, planet, shooting stars)
      this.space.draw(ctx, this.camera.x, this.camera.y, this.player.vx, this.player.vy, this.overdriveTimer > 0);

      ctx.save();
      ctx.translate(this.viewW / 2 + shake.x, this.viewH / 2 + shake.y);
      ctx.rotate(shake.angle);
      ctx.translate(-this.camera.x, -this.camera.y);

      this.drawGrid();
      this.drawArenaBounds();
      this.drawBlackHoles();
      this.drawGems();
      this.drawShockwaves();
      this.drawTethersAndOrbs();
      this.drawPlayer();
      this.drawEnemies();
      this.drawProjectiles();
      this.drawLightnings();
      this.drawParticles();
      this.drawFloatingTexts();

      ctx.restore();

      if (this.screenFlash.alpha > 0.01) {
        ctx.save();
        ctx.globalAlpha = this.screenFlash.alpha;
        ctx.fillStyle = this.screenFlash.color;
        ctx.fillRect(0, 0, this.viewW, this.viewH);
        ctx.restore();
      }
    }

    drawGrid() {
      // Subtle sector reference beacons (no full-screen graph lines cluttering space)
      const step = 180;
      const startX = Math.max(step, Math.floor((this.camera.x - this.viewW / 2) / step) * step);
      const endX = Math.min(ARENA_W - step, Math.ceil((this.camera.x + this.viewW / 2) / step) * step);
      const startY = Math.max(step, Math.floor((this.camera.y - this.viewH / 2) / step) * step);
      const endY = Math.min(ARENA_H - step, Math.ceil((this.camera.y + this.viewH / 2) / step) * step);

      ctx.fillStyle = this.overdriveTimer > 0 ? 'rgba(255, 214, 0, 0.25)' : 'rgba(150, 220, 255, 0.12)';
      for (let x = startX; x <= endX; x += step) {
        for (let y = startY; y <= endY; y += step) {
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }
    }

    drawArenaBounds() {
      ctx.save();
      // Dim the void outside the arena so the play-space reads clearly
      ctx.fillStyle = 'rgba(1, 2, 8, 0.55)';
      ctx.beginPath();
      ctx.rect(-4000, -4000, ARENA_W + 8000, ARENA_H + 8000);
      ctx.rect(0, 0, ARENA_W, ARENA_H);
      ctx.fill('evenodd');

      // Outer soft plasma barrier
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 10;
      ctx.strokeRect(0, 0, ARENA_W, ARENA_H);

      // Inner razor laser line
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 22;
      ctx.strokeRect(0, 0, ARENA_W, ARENA_H);

      // Corner anchor pylons
      const corners = [[0, 0], [ARENA_W, 0], [ARENA_W, ARENA_H], [0, ARENA_H]];
      ctx.fillStyle = '#00f0ff';
      for (const [cx, cy] of corners) {
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawBlackHoles() {
      for (const bh of this.blackHoles) {
        ctx.save();
        const grad = ctx.createRadialGradient(bh.x, bh.y, 4, bh.x, bh.y, 64);
        grad.addColorStop(0, '#000000');
        grad.addColorStop(0.45, 'rgba(184, 41, 255, 0.85)');
        grad.addColorStop(1, 'rgba(184, 41, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(bh.x, bh.y, 64, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    drawGems() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const g of this.gems) {
        ctx.save();
        ctx.translate(g.x, g.y);
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.moveTo(0, -6.5);
        ctx.lineTo(4.5, 0);
        ctx.lineTo(0, 6.5);
        ctx.lineTo(-4.5, 0);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -1.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    drawShockwaves() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const sw of this.shockwaves) {
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawTethersAndOrbs() {
      const p = this.player;
      for (const orb of this.getAllOrbs()) {
        const speed = Math.hypot(orb.vx, orb.vy);
        const color = speed > 650 ? '#ff2a6d' : speed > 360 ? '#ffd600' : '#00f0ff';

        // Segmented glowing plasma tether
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = this.mods.laserTether > 0 ? '#ff2a6d' : color;
        ctx.lineWidth = this.mods.laserTether > 0 ? 4 : 2.5;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(orb.x, orb.y);
        ctx.stroke();

        // Energy nodes along chain
        const links = 6;
        for (let k = 1; k < links; k++) {
          const t = k / links;
          const lx = p.x + (orb.x - p.x) * t;
          const ly = p.y + (orb.y - p.y) * t;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(lx, ly, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Additive Comet Motion Trail
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < orb.trail.length - 1; i++) {
          const t = orb.trail[i];
          const frac = (i + 1) / orb.trail.length;
          ctx.globalAlpha = frac * 0.42;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, orb.radius * frac * 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Detailed Multi-Ring Wrecking Core
        ctx.save();
        ctx.translate(orb.x, orb.y);

        // Supersonic Mach Shock Cone
        if (speed > 650) {
          const moveAngle = Math.atan2(orb.vy, orb.vx);
          ctx.save();
          ctx.rotate(moveAngle);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, orb.radius + 11, -0.85, 0.85);
          ctx.stroke();
          ctx.restore();
        }

        ctx.rotate(this.elapsed * (3.5 + speed * 0.012));
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = speed > 650 ? 28 : 16;

        // Outer saw-blades
        ctx.beginPath();
        const spikes = 10;
        for (let s = 0; s < spikes * 2; s++) {
          const a = (s / (spikes * 2)) * Math.PI * 2;
          const r = s % 2 === 0 ? orb.radius + 6 : orb.radius * 0.76;
          if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();

        // Dark armored inner ring
        ctx.fillStyle = '#070b18';
        ctx.beginPath();
        ctx.arc(0, 0, orb.radius * 0.62, 0, Math.PI * 2);
        ctx.fill();

        // Hot reactor core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, orb.radius * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    drawPlayer() {
      const p = this.player;

      // Ship Afterimage Trail
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const frac = (i + 1) / p.trail.length;
        ctx.globalAlpha = frac * (t.dash ? 0.55 : 0.16);
        ctx.fillStyle = t.dash ? '#ffd600' : '#00f0ff';
        ctx.beginPath();
        ctx.arc(t.x, t.y, p.radius * frac * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Yank charge ring
      if (p.yanking && p.yankCharge > 0) {
        ctx.save();
        ctx.strokeStyle = '#ffd600';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 14 + p.yankCharge * 18, 0, Math.PI * 2 * p.yankCharge);
        ctx.stroke();
        ctx.restore();
      }

      if (p.invuln > 0 && Math.floor(p.invuln * 20) % 2 === 0) return;

      const shipSpeed = Math.hypot(p.vx, p.vy);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);

      // Twin Layered Thruster Flames (outer plasma + white-hot inner core)
      const flameLen = 10 + Math.min(24, shipSpeed * 0.03) + Math.random() * 6;
      ctx.fillStyle = p.dashTimer > 0 ? '#ffd600' : '#00f0ff';
      ctx.beginPath();
      ctx.moveTo(-12, -7);
      ctx.lineTo(-12 - flameLen, -4);
      ctx.lineTo(-12, -1);
      ctx.moveTo(-12, 1);
      ctx.lineTo(-12 - flameLen, 4);
      ctx.lineTo(-12, 7);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-12, -5.5);
      ctx.lineTo(-12 - flameLen * 0.55, -4);
      ctx.lineTo(-12, -2.5);
      ctx.moveTo(-12, 2.5);
      ctx.lineTo(-12 - flameLen * 0.55, 4);
      ctx.lineTo(-12, 5.5);
      ctx.fill();

      // Interceptor Hull with Metallic Shading (same size & shape)
      const hullGrad = ctx.createLinearGradient(-14, -15, 20, 15);
      if (this.overdriveTimer > 0) {
        hullGrad.addColorStop(0, '#fef08a');
        hullGrad.addColorStop(0.5, '#f59e0b');
        hullGrad.addColorStop(1, '#92400e');
      } else {
        hullGrad.addColorStop(0, '#bae6fd');
        hullGrad.addColorStop(0.45, '#0284c7');
        hullGrad.addColorStop(1, '#0c2d57');
      }

      ctx.fillStyle = hullGrad;
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.6;
      ctx.shadowColor = this.overdriveTimer > 0 ? '#ffd600' : '#00f0ff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-10, -15);
      ctx.lineTo(-14, -6);
      ctx.lineTo(-9, 0);
      ctx.lineTo(-14, 6);
      ctx.lineTo(-10, 15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Armor Panel Seams & Wing Stripes
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(4, 10, 24, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-9, 0);
      ctx.moveTo(4, -5);
      ctx.lineTo(-10, -10);
      ctx.moveTo(4, 5);
      ctx.lineTo(-10, 10);
      ctx.stroke();

      // Accent Wing Stripes
      ctx.strokeStyle = this.overdriveTimer > 0 ? '#fff' : '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-3, -11);
      ctx.lineTo(-10, -13.5);
      ctx.moveTo(-3, 11);
      ctx.lineTo(-10, 13.5);
      ctx.stroke();

      // Wingtip Emitters
      ctx.fillStyle = '#00f0ff';
      ctx.beginPath();
      ctx.arc(-10, -14.5, 1.8, 0, Math.PI * 2);
      ctx.arc(-10, 14.5, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Shaded Glass Cockpit Canopy
      const glassGrad = ctx.createLinearGradient(10, -4, -1, 4);
      glassGrad.addColorStop(0, '#ffffff');
      glassGrad.addColorStop(0.5, '#67e8f9');
      glassGrad.addColorStop(1, '#0369a1');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(11, 0);
      ctx.lineTo(-1, -4.5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-1, 4.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    drawEnemies() {
      for (const e of this.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);

        // Dasher laser sight telegraph
        if (e.type === 'dasher' && e.dashState === 1) {
          ctx.strokeStyle = 'rgba(255, 0, 153, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([7, 5]);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(e.aimX * 280, e.aimY * 280);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        const fill = e.flash > 0 ? '#ffffff' : e.color;
        ctx.fillStyle = fill;
        ctx.shadowColor = e.color;
        ctx.shadowBlur = e.isBoss ? 26 : 12;

        if (e.isBoss) {
          // Multi-layered Boss Reactor
          ctx.rotate(this.elapsed * 0.9);
          ctx.beginPath();
          for (let s = 0; s < 16; s++) {
            const a = (s / 16) * Math.PI * 2;
            const r = s % 2 === 0 ? e.radius + 8 : e.radius * 0.82;
            if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#090d1a';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.56, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffd600';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.28, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'swarmer' || e.type === 'mini') {
          ctx.rotate(e.angle);
          ctx.beginPath();
          ctx.moveTo(e.radius, 0);
          ctx.lineTo(-e.radius * 0.8, -e.radius * 0.75);
          ctx.lineTo(-e.radius * 0.4, 0);
          ctx.lineTo(-e.radius * 0.8, e.radius * 0.75);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(e.radius * 0.2, 0, e.radius * 0.22, 0, Math.PI * 2);
          ctx.fill();
        } else if (e.type === 'tank') {
          ctx.rotate(e.angle);
          ctx.beginPath();
          for (let s = 0; s < 6; s++) {
            const a = (s / 6) * Math.PI * 2;
            const rx = Math.cos(a) * e.radius;
            const ry = Math.sin(a) * e.radius;
            if (s === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.closePath();
          ctx.fill();

          // Front Energy Shield Arc
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 3.5;
          ctx.beginPath();
          ctx.arc(0, 0, e.radius + 5, -0.9, 0.9);
          ctx.stroke();
        } else {
          ctx.rotate(this.elapsed * 2.2);
          const sides = e.type === 'splitter' ? 5 : 4;
          ctx.beginPath();
          for (let s = 0; s < sides; s++) {
            const a = (s / sides) * Math.PI * 2;
            const rx = Math.cos(a) * e.radius;
            const ry = Math.sin(a) * e.radius;
            if (s === 0) ctx.moveTo(rx, ry);
            else ctx.lineTo(rx, ry);
          }
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#070b18';
          ctx.beginPath();
          ctx.arc(0, 0, e.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    drawProjectiles() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#ffd600';
      for (const pr of this.projectiles) {
        ctx.beginPath();
        ctx.arc(pr.x, pr.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ff2a6d';
      for (const b of this.enemyBullets) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    drawLightnings() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const l of this.lightnings) {
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        const mx = (l.x1 + l.x2) / 2 + (Math.random() - 0.5) * 28;
        const my = (l.y1 + l.y2) / 2 + (Math.random() - 0.5) * 28;
        ctx.lineTo(mx, my);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawParticles() {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const pt of this.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.rot);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.moveTo(pt.size, 0);
        ctx.lineTo(-pt.size * 0.7, -pt.size * 0.6);
        ctx.lineTo(-pt.size * 0.7, pt.size * 0.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    drawFloatingTexts() {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(4, 6, 14, 0.9)';
      for (const ft of this.floatingTexts) {
        ctx.globalAlpha = Math.min(1, ft.life * 1.6);
        ctx.font = `900 ${Math.round(15 * ft.scale)}px Orbitron, sans-serif`;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
      }
      ctx.restore();
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new ChaosGame();
  });
})();
