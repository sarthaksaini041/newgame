(() => {
  const canvas = document.getElementById('gameCanvas');

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
  const dashBar = document.getElementById('dashBar');
  const buffBar = document.getElementById('buffBar');
  const scoreText = document.getElementById('scoreText');
  const comboText = document.getElementById('comboText');
  const timeText = document.getElementById('timeText');
  const waveText = document.getElementById('waveText');
  const bossHud = document.getElementById('bossHud');
  const bossNameEl = document.getElementById('bossName');
  const bossBar = document.getElementById('bossBar');
  const sideComboCard = document.getElementById('sideComboCard');
  const sideComboRank = document.getElementById('sideComboRank');
  const sideComboMult = document.getElementById('sideComboMult');
  const sideComboBonus = document.getElementById('sideComboBonus');
  const sideComboTimerBar = document.getElementById('sideComboTimerBar');
  const comboFeedList = document.getElementById('comboFeedList');
  const controlsHint = document.getElementById('controlsHint');
  const muteBtn = document.getElementById('muteBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const bestScoreStart = document.getElementById('bestScoreStart');
  const bestComboStart = document.getElementById('bestComboStart');
  const armoryBtn = document.getElementById('armoryBtn');
  const controlsBtn = document.getElementById('controlsBtn');
  const titleMuteBtn = document.getElementById('titleMuteBtn');
  const titleMuteLabel = document.getElementById('titleMuteLabel');
  const armoryDialog = document.getElementById('armoryDialog');
  const armoryGrid = document.getElementById('armoryGrid');
  const closeArmoryBtn = document.getElementById('closeArmoryBtn');
  const hangarBtn = document.getElementById('hangarBtn');
  const hangarBtnShipName = document.getElementById('hangarBtnShipName');
  const hangarBtnShipPreview = document.getElementById('hangarBtnShipPreview');
  const hangarDialog = document.getElementById('hangarDialog');
  const hangarGrid = document.getElementById('hangarGrid');
  const closeHangarBtn = document.getElementById('closeHangarBtn');
  const controlsDialog = document.getElementById('controlsDialog');
  const closeControlsBtn = document.getElementById('closeControlsBtn');

  // Touch Controls
  const touchControlsEl = document.getElementById('touchControls');
  const touchStickZone = document.getElementById('touchStickZone');
  const touchStickKnob = document.getElementById('touchStickKnob');
  const touchDashBtn = document.getElementById('touchDashBtn');
  const touchYankBtn = document.getElementById('touchYankBtn');
  const touchNovaBtn = document.getElementById('touchNovaBtn');

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
  const MAX_PARTICLES = 360;
  const MAX_ENEMIES = 95;
  const MAX_BOSSES = 2;
  const MAX_GEMS = 140;
  const MAX_SHOCKWAVES = 40;
  const MAX_FLOATING_TEXTS = 40;
  const MAX_ENEMY_BULLETS = 96;
  const MAX_LIGHTNINGS = 36;
  const MAX_PERM_ORBS = 5;
  const MAX_BLACK_HOLES = 4;
  const MAX_PROJECTILES = 140;
  const ENEMY_SPECS = {
    swarmer: { r: 15, hpBase: 18, speedBase: 145, speedWave: 5, color: '#ff2a6d', xp: 2, score: 25 },
    mini: { r: 10, hpBase: 10, speedBase: 205, speedWave: 5, color: '#d946ef', xp: 1, score: 15 },
    splitter: { r: 22, hpBase: 42, speedBase: 105, speedWave: 3, color: '#b829ff', xp: 4, score: 55 },
    tank: { r: 29, hpBase: 95, speedBase: 78, speedWave: 2, color: '#ff9e00', xp: 7, score: 90 },
    dasher: { r: 17, hpBase: 28, speedBase: 120, speedWave: 0, color: '#ff0099', xp: 4, score: 60 },
    bomber: { r: 20, hpBase: 26, speedBase: 130, speedWave: 0, color: '#05ffa1', xp: 5, score: 70 },
  };
  const DASH_BASE_CD = 0.85;
  const DASH_MIN_CD = 0.28;
  const OVERDRIVE_DURATION = 6.5;
  const FIXED_DT = 1 / 60;
  const MAX_SUBSTEPS = 3;
  const TRAIL_SAMPLE_INTERVAL = 1 / 60;
  const PLAYER_DRAG = Math.exp(-7.2 * FIXED_DT);
  const ORB_DRAG = Math.exp(-0.55 * FIXED_DT);
  const DASH_BRAKE = Math.exp(-9.75 * FIXED_DT);
  const GEM_DRAG = Math.exp(-5.0 * FIXED_DT);
  const PARTICLE_DRAG = Math.exp(-4.35 * FIXED_DT);
  const FT_DRAG = Math.exp(-2.8 * FIXED_DT);
  const CELL_SIZE = 128;
  const GRID_COLS = Math.ceil(ARENA_W / CELL_SIZE) + 1;
  const GRID_ROWS = Math.ceil(ARENA_H / CELL_SIZE) + 1;

  const ICON_SOUND_ON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.8 5.8a9 9 0 0 1 0 12.4"/></svg>`;
  const ICON_SOUND_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>`;

  // Zero-allocation in-place Text node mutation (avoids Blink destroying/creating Text nodes on .textContent =)
  function setText(el, str) {
    if (!el) return;
    const s = String(str);
    const first = el.firstChild;
    if (first && first.nodeType === 3 && !first.nextSibling) {
      if (first.nodeValue !== s) first.nodeValue = s;
    } else {
      el.textContent = s;
    }
  }

  // Fast integer comma formatter (avoids V8 ICU toLocaleString() overhead in hot HUD loop)
  function formatCommas(n) {
    const s = String(Math.floor(n));
    const len = s.length;
    if (len <= 3) return s;
    let out = '';
    const rem = len % 3 || 3;
    out = s.slice(0, rem);
    for (let i = rem; i < len; i += 3) out += ',' + s.slice(i, i + 3);
    return out;
  }

  // O(1) swap-and-pop removal to avoid O(N) array splice shifts and GC churn
  function swapPop(arr, idx) {
    const last = arr.length - 1;
    if (idx < last) arr[idx] = arr[last];
    arr.pop();
  }

  function getPowerupIconHtml(upg) {
    if (window.PowerupIcons && typeof window.PowerupIcons.html === 'function') {
      return window.PowerupIcons.html(upg.id, upg.title);
    }
    return upg.svg;
  }

  const UPGRADES = [
    {
      id: 'twin_orb',
      tier: 'ORBITAL',
      shortName: 'TWIN ORBIT',
      color: '#00f0ff',
      maxStacks: MAX_PERM_ORBS - 1,
      svg: `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <polygon points="24,2.5 39.5,9 45.5,24 39.5,39 24,45.5 8.5,39 2.5,24 8.5,9" fill="#061224" stroke="#00f0ff" stroke-opacity="0.38" stroke-width="1.2"/>
        <circle cx="24" cy="24" r="18.5" stroke="#00f0ff" stroke-opacity="0.22" stroke-width="1" stroke-dasharray="2.5 3.5"/>
        <ellipse cx="24" cy="24" rx="18" ry="7.8" transform="rotate(-32 24 24)" stroke="#38bdf8" stroke-width="2.4" stroke-opacity="0.32"/>
        <ellipse cx="24" cy="24" rx="18" ry="7.8" transform="rotate(-32 24 24)" stroke="#aef6ff" stroke-width="1.35"/>
        <ellipse cx="24" cy="24" rx="17" ry="6.2" transform="rotate(32 24 24)" stroke="#00f0ff" stroke-opacity="0.28" stroke-width="1" stroke-dasharray="4 4"/>
        <circle cx="12.5" cy="31" r="7.2" fill="#07223a" stroke="#7ceeff" stroke-width="1.4"/>
        <circle cx="12.5" cy="31" r="5" fill="#00f0ff" fill-opacity="0.38" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.9"/>
        <circle cx="12.5" cy="31" r="2.7" fill="#ffffff"/>
        <circle cx="10.8" cy="29.3" r="1" fill="#ffffff" fill-opacity="0.85"/>
        <circle cx="35.5" cy="17" r="7.2" fill="#07223a" stroke="#7ceeff" stroke-width="1.4"/>
        <circle cx="35.5" cy="17" r="5" fill="#00f0ff" fill-opacity="0.38" stroke="#ffffff" stroke-opacity="0.55" stroke-width="0.9"/>
        <circle cx="35.5" cy="17" r="2.7" fill="#ffffff"/>
        <circle cx="33.8" cy="15.3" r="1" fill="#ffffff" fill-opacity="0.85"/>
        <circle cx="24" cy="24" r="3.4" fill="#0c2640" stroke="#7ceeff" stroke-width="1.1"/>
        <circle cx="24" cy="24" r="1.4" fill="#ffffff"/>
      </svg>`,
      title: 'Twin Orbit',
      getDesc: (next) => `Manifest an additional Plasma Gyro-Core (${next + 1}/${MAX_PERM_ORBS} active) and +${next * 6}% orbital resonance whip power.`,
      apply: (g) => {
        if (g.orbs.length < MAX_PERM_ORBS) {
          const orb = g.spawnOrb(false);
          g._pushShockwave(orb.x, orb.y, 12, 115, '#00f0ff', 0.95);
          g.spawnBurst(orb.x, orb.y, '#00f0ff', 16, 260);
        }
      },
    },
    {
      id: 'chain_lightning',
      tier: 'ARC TECH',
      shortName: 'ARC CONDUCTOR',
      color: '#38bdf8',
      maxStacks: 5,
      svg: `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <polygon points="24,3 41,12.5 41,35.5 24,45 7,35.5 7,12.5" fill="#07152a" stroke="#38bdf8" stroke-opacity="0.48" stroke-width="1.4"/>
        <polygon points="24,7 37.5,14.5 37.5,33.5 24,41 10.5,33.5 10.5,14.5" stroke="#7dd3fc" stroke-opacity="0.25" stroke-width="1" stroke-dasharray="3 3"/>
        <circle cx="24" cy="6.5" r="2" fill="#38bdf8"/>
        <circle cx="24" cy="41.5" r="2" fill="#38bdf8"/>
        <circle cx="9.5" cy="14" r="1.7" fill="#7dd3fc"/>
        <circle cx="38.5" cy="34" r="1.7" fill="#7dd3fc"/>
        <path d="M9.5 14 L15 18.5 M38.5 34 L33 29.5 M37.5 13 L32.5 17 M10.5 35 L15.5 31" stroke="#38bdf8" stroke-opacity="0.72" stroke-width="1.3" stroke-linecap="round"/>
        <polygon points="28,7.5 13.5,25.5 22.5,25.5 18.5,41 35,21 25,21" fill="#0ea5e9" fill-opacity="0.45" stroke="#e0f2fe" stroke-width="1.6" stroke-linejoin="round"/>
        <polygon points="26.2,12 17.5,24.2 23.8,24.2 21.4,35.5 31.2,22.2 24.4,22.2" fill="#ffffff"/>
      </svg>`,
      title: 'Arc Conductor',
      getDesc: (next) => `Supersonic impacts chain to ${2 + next} hostiles (${230 + next * 30}px arc) for ${Math.round(Math.min(0.95, 0.48 + next * 0.09) * 100)}% impact damage.`,
      apply: () => {},
    },
    {
      id: 'black_hole',
      tier: 'GRAVITY',
      shortName: 'SINGULARITY',
      color: '#b829ff',
      maxStacks: 5,
      svg: `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="20.5" fill="#0d061c" stroke="#b829ff" stroke-opacity="0.42" stroke-width="1.2"/>
        <circle cx="24" cy="24" r="17.5" fill="#b829ff" fill-opacity="0.16"/>
        <ellipse cx="24" cy="24" rx="19" ry="7.2" transform="rotate(-22 24 24)" stroke="#f0abfc" stroke-width="1.8" stroke-opacity="0.88"/>
        <ellipse cx="24" cy="24" rx="15.5" ry="5.5" transform="rotate(-22 24 24)" stroke="#c084fc" stroke-width="1.1" stroke-opacity="0.65"/>
        <path d="M24 5.5 A18.5 18.5 0 0 1 42.5 24" stroke="#e879f9" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.72"/>
        <path d="M24 42.5 A18.5 18.5 0 0 1 5.5 24" stroke="#e879f9" stroke-width="1.6" stroke-linecap="round" stroke-opacity="0.72"/>
        <circle cx="24" cy="24" r="9.2" fill="#03020a" stroke="#f5d0fe" stroke-width="2"/>
        <circle cx="24" cy="24" r="6.2" fill="#010105" stroke="#a855f7" stroke-opacity="0.7" stroke-width="1"/>
        <path d="M18.5 19.5 A7 7 0 0 1 28.5 18.2" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.85"/>
      </svg>`,
      title: 'Singularity Core',
      getDesc: (next) => `Supersonic kills have ${Math.round(Math.min(0.85, 0.25 + next * 0.12) * 100)}% chance to spawn a ${(2.6 + next * 0.55).toFixed(1)}s gravity well that implodes for ${32 + next * 14} base AoE damage.`,
      apply: () => {},
    },
    {
      id: 'laser_tether',
      tier: 'TETHER',
      shortName: 'PLASMA CHAIN',
      color: '#ff2a6d',
      maxStacks: 5,
      svg: `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="40" height="40" rx="8" fill="#170713" stroke="#ff2a6d" stroke-opacity="0.38" stroke-width="1.2"/>
        <line x1="10.5" y1="37.5" x2="37.5" y2="10.5" stroke="#ff2a6d" stroke-width="10" stroke-opacity="0.26" stroke-linecap="round"/>
        <line x1="10.5" y1="37.5" x2="37.5" y2="10.5" stroke="#ff5c91" stroke-width="4.4" stroke-linecap="round"/>
        <line x1="10.5" y1="37.5" x2="37.5" y2="10.5" stroke="#ffffff" stroke-width="1.7" stroke-linecap="round"/>
        <path d="M15 21 L20 16 M28 32 L33 27 M17 31 L20 28 M28 20 L31 17" stroke="#fda4af" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="11" cy="37" r="6" fill="#23091a" stroke="#fda4af" stroke-width="1.6"/>
        <circle cx="11" cy="37" r="2.4" fill="#ff2a6d"/>
        <circle cx="37" cy="11" r="6.5" fill="#ff2a6d" fill-opacity="0.45" stroke="#ffffff" stroke-width="1.6"/>
        <circle cx="37" cy="11" r="2.8" fill="#ffffff"/>
        <circle cx="24" cy="24" r="3.2" fill="#ffffff" stroke="#ff2a6d" stroke-width="1.4"/>
      </svg>`,
      title: 'Plasma Chain',
      getDesc: (next) => `Superheat every tether beam to slice hostiles on contact (${14 + (next - 1) * 9} base plasma damage, wider beam, zero orb conflict).`,
      apply: () => {},
    },
    {
      id: 'elastic_whip',
      tier: 'KINETIC',
      shortName: 'HYPER-ELASTIC',
      color: '#ffd600',
      maxStacks: 5,
      svg: `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="20.5" fill="#181205" stroke="#ffd600" stroke-opacity="0.38" stroke-width="1.2"/>
        <polygon points="24,4 28.5,14.5 39,9 33.5,19.5 44,24 33.5,28.5 39,39 28.5,33.5 24,44 19.5,33.5 9,39 14.5,28.5 4,24 14.5,19.5 9,9 19.5,14.5" fill="#f59e0b" fill-opacity="0.3" stroke="#fde047" stroke-width="1.5" stroke-linejoin="round"/>
        <circle cx="24" cy="24" r="10.5" fill="#291a04" stroke="#ffd600" stroke-width="1.7"/>
        <circle cx="24" cy="24" r="7.2" fill="#f59e0b" fill-opacity="0.5" stroke="#fef08a" stroke-width="1.2"/>
        <circle cx="24" cy="24" r="3.8" fill="#ffffff"/>
        <circle cx="22.4" cy="22.4" r="1.1" fill="#ffffff"/>
      </svg>`,
      title: 'Hyper-Elasticity',
      getDesc: (next) => `Core size +${next * 16}%, whip snap force +${next * 26}%, and +${next * 22}% impact damage across all Gyro-Cores.`,
      apply: () => {},
    },
    {
      id: 'shrapnel',
      tier: 'ORDNANCE',
      shortName: 'SHATTER NOVA',
      color: '#ff9e00',
      maxStacks: 5,
      svg: `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="20" fill="#190e04" stroke="#ff9e00" stroke-opacity="0.36" stroke-width="1.2"/>
        <circle cx="24" cy="24" r="14.5" stroke="#ff9e00" stroke-opacity="0.38" stroke-width="1.2" stroke-dasharray="3.5 3.5"/>
        <polygon points="24,3.5 28.2,13.5 24,18 19.8,13.5" fill="#ff9e00" stroke="#fef08a" stroke-width="1.2"/>
        <polygon points="44.5,24 34.5,28.2 30,24 34.5,19.8" fill="#ff9e00" stroke="#fef08a" stroke-width="1.2"/>
        <polygon points="24,44.5 19.8,34.5 24,30 28.2,34.5" fill="#ff9e00" stroke="#fef08a" stroke-width="1.2"/>
        <polygon points="3.5,24 13.5,19.8 18,24 13.5,28.2" fill="#ff9e00" stroke="#fef08a" stroke-width="1.2"/>
        <path d="M11 11 L16 16 M37 11 L32 16 M37 37 L32 32 M11 37 L16 32" stroke="#fdba74" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="24" cy="24" r="5.5" fill="#2b1404" stroke="#fde047" stroke-width="1.5"/>
        <circle cx="24" cy="24" r="2.8" fill="#ffffff"/>
      </svg>`,
      title: 'Shatter Nova',
      getDesc: (next) => `Shattered hostiles erupt into ${2 + next * 2} homing plasma bolts (${16 + next * 5} base dmg, ${240 + next * 24}px lock range).`,
      apply: () => {},
    },
    {
      id: 'vampiric',
      tier: 'SURVIVAL',
      shortName: 'SIPHON CORE',
      color: '#05ffa1',
      maxStacks: 5,
      svg: `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 3.5 L40.5 10.5 V24 C40.5 34.6 32.6 41 24 44.5 C15.4 41 7.5 34.6 7.5 24 V10.5 Z" fill="#041c15" stroke="#05ffa1" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M24 7.5 L36.8 13 V23.8 C36.8 32 30.8 37.2 24 40 C17.2 37.2 11.2 32 11.2 23.8 V13 Z" fill="#05ffa1" fill-opacity="0.18" stroke="#6ee7b7" stroke-opacity="0.55" stroke-width="1.1"/>
        <circle cx="24" cy="23.5" r="9" fill="#05ffa1" fill-opacity="0.16"/>
        <path d="M24 15.2 V31.8 M15.7 23.5 H32.3" stroke="#05ffa1" stroke-width="5.2" stroke-opacity="0.35" stroke-linecap="round"/>
        <path d="M24 15.8 V31.2 M16.3 23.5 H31.7" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round"/>
      </svg>`,
      title: 'Siphon Core',
      getDesc: (next) => `+20 Max Hull (max 200), restore +20 Hull now, and repair +20 Hull every ${Math.max(6, 18 - next * 3)} kills (or +${10 + next * 4}% Nova at full Hull).`,
      apply: (g) => {
        if (g.player.maxHp < 200) g.player.maxHp = Math.min(200, g.player.maxHp + 20);
        g.player.hp = Math.min(g.player.maxHp, g.player.hp + 20);
      },
    },
    {
      id: 'berserker',
      tier: 'THRUSTER',
      shortName: 'OVERCLOCK',
      color: '#38bdf8',
      maxStacks: 5,
      svg: `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <polygon points="24,3 41,11 44,28 33,43 15,43 4,28 7,11" fill="#07172b" stroke="#38bdf8" stroke-opacity="0.4" stroke-width="1.2"/>
        <path d="M24 6 L34.5 21.5 H28.2 V32.5 H19.8 V21.5 H13.5 Z" fill="#0ea5e9" fill-opacity="0.4" stroke="#e0f2fe" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M24 10.5 L29.5 19.5 H25.6 V29 H22.4 V19.5 H18.5 Z" fill="#ffffff"/>
        <path d="M16 35.5 L24 42.5 L32 35.5" stroke="#ffd600" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M19.5 34.5 L24 38.8 L28.5 34.5" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7.5 19 L12 15.5 M40.5 19 L36 15.5 M7.5 25 L11.5 23 M40.5 25 L36.5 23" stroke="#7dd3fc" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`,
      title: 'Thruster Overclock',
      getDesc: (next) => `Thrust +${next * 16}%, Dash cooldown ${(Math.max(DASH_MIN_CD, DASH_BASE_CD * Math.pow(0.80, next))).toFixed(2)}s, and +${next * 25}% Nova charge gain.`,
      apply: () => {},
    },
  ];

  const OVERCLOCK_FALLBACK = {
    id: 'core_surge',
    tier: 'OVERFLOW',
    shortName: 'CORE SURGE',
    color: '#ffd600',
    maxStacks: 99,
    svg: `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20.5" fill="#1a1204" stroke="#ffd600" stroke-opacity="0.45" stroke-width="1.3"/>
      <polygon points="24,4 30,18 44,24 30,30 24,44 18,30 4,24 18,18" fill="#ffd600" fill-opacity="0.34" stroke="#fef08a" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="24" cy="24" r="7.5" fill="#f59e0b" fill-opacity="0.45" stroke="#ffffff" stroke-width="1.4"/>
      <circle cx="24" cy="24" r="3.6" fill="#ffffff"/>
    </svg>`,
    title: 'Core Surge',
    getDesc: () => 'Repair +20 Hull, gain +45% Nova charge, and amplify all core damage by +15%.',
    apply: (g) => {
      g.player.hp = Math.min(g.player.maxHp, g.player.hp + 20);
      if (g.overdriveTimer <= 0) g.overdrive = Math.min(100, g.overdrive + 45);
    },
  };

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
      this._out = { x: 0, y: 0, angle: 0 };
    }
    add(amount) { this.trauma = Math.min(1, this.trauma + amount); }
    update(dt) { this.trauma = Math.max(0, this.trauma - this.decay * dt); }
    getOffset() {
      const o = this._out;
      if (this.trauma <= 0.001) {
        o.x = 0; o.y = 0; o.angle = 0;
        return o;
      }
      const s = this.trauma * this.trauma;
      o.x = (Math.random() * 2 - 1) * this.maxOffset * s;
      o.y = (Math.random() * 2 - 1) * this.maxOffset * s;
      o.angle = (Math.random() * 2 - 1) * this.maxAngle * s;
      return o;
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
      this.isCoarsePointer = Boolean(
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 0)
      );
      if (this.isCoarsePointer) {
        const mouseRadio = document.querySelector('input[name="controlMode"][value="mouse"]');
        if (mouseRadio) mouseRadio.checked = true;
      }
      this.controlMode = this.isCoarsePointer ? 'mouse' : 'hybrid';

      this.shaker = new CameraShaker();
      this.screenFlash = { alpha: 0, color: '#00f0ff' };

      this.keys = new Set();
      this.mouse = { x: this.viewW / 2, y: this.viewH / 2, worldX: ARENA_W / 2, worldY: ARENA_H / 2, active: false };
      this.touchStick = { active: false, pointerId: null, originX: 0, originY: 0, ax: 0, ay: 0 };
      this.camera = { x: ARENA_W / 2, y: ARENA_H / 2, prevX: ARENA_W / 2, prevY: ARENA_H / 2 };

      // Pre-allocated uniform spatial hash grid (tombstone-safe ref table) & zero-GC object pools
      this._gridHead = new Int32Array(GRID_COLS * GRID_ROWS);
      this._gridNext = new Int32Array(1024);
      this._gridRef = new Array(1024);
      this._particlePool = [];
      this._gemPool = [];
      this._projPool = [];
      this._bulletPool = [];
      this._swPool = [];
      this._flarePool = [];
      this._lightningPool = [];
      this._ftPool = [];
      this._enemyPool = [];
      this._allOrbs = [];
      this._orbsDirty = true;
      this._gridDirty = true;
      this._bhHits = [];
      this._bomberHits = [];
      this._comboFeedPool = [];
      this._comboFeedSlots = [];
      this._hudCache = {};
      this._accumulator = 0;
      this._trailTimer = 0;
      this.selectedShipId = window.ChaosShips ? window.ChaosShips.getSelectedId() : 'valkyrie';

      // Procedural deep-space backdrop + Orbital Citadel Title Scene + WebGL2 Instanced Renderer
      this.space = new window.SpaceBackdrop(ARENA_W, ARENA_H);
      this.titleScene = window.TitleCitadelScene ? new window.TitleCitadelScene() : null;
      this.renderer = new window.ChaosRenderer(canvas, this.space);

      // Pre-warm both self-hosted WOFF2 fonts immediately to prevent any swap flash when opening HUD/modals
      if (document.fonts && document.fonts.load) {
        document.fonts.load('700 16px "Orbitron"').catch(() => {});
        document.fonts.load('600 14px "Chakra Petch"').catch(() => {});
      }

      this._initComboFeedSlots();
      this.resetEntities();
      this._populateArmory();
      this._populateHangar();
      this.bindEvents();
      this.resize();
      refreshStartRecords();

      this._rafId = 0;
      this.lastTime = 0;
      window.__CHAOS_GAME__ = this;
      this._scheduleLoop(true);
    }

    _scheduleLoop(resetClock = false) {
      if (resetClock) this.lastTime = 0;
      if (this._rafId || document.hidden) return;
      this._rafId = requestAnimationFrame((t) => {
        this._rafId = 0;
        this.loop(t);
      });
    }

    _stopLoop() {
      if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = 0;
      }
      this.lastTime = 0;
    }

    _closeAllDialogs() {
      if (armoryDialog && armoryDialog.open) armoryDialog.close();
      if (hangarDialog && hangarDialog.open) hangarDialog.close();
      if (controlsDialog && controlsDialog.open) controlsDialog.close();
      if (upgradeDialog && upgradeDialog.open) upgradeDialog.close();
      if (pauseDialog && pauseDialog.open) pauseDialog.close();
      if (gameOverDialog && gameOverDialog.open) gameOverDialog.close();
    }

    _initComboFeedSlots() {
      this._comboFeedSlots = [];
      if (!comboFeedList) return;
      const children = comboFeedList.children;
      for (let i = 0; i < children.length; i++) {
        const slot = children[i];
        slot.textContent = '';
        const ptsEl = document.createElement('span');
        ptsEl.className = 'combo-feed-pts';
        const tagEl = document.createElement('span');
        tagEl.className = 'combo-feed-tag';
        slot.appendChild(ptsEl);
        slot.appendChild(tagEl);
        this._comboFeedSlots.push({
          el: slot,
          ptsEl,
          tagEl,
          lastPts: '',
          lastTag: '',
          lastAccent: '',
          empty: true,
        });
      }
    }

    _populateHangar() {
      if (!window.ChaosShips) return;
      window.ChaosShips.prebakePreviews();
      if (hangarGrid) {
        hangarGrid.innerHTML = '';
        const ships = window.ChaosShips.list;
        for (let i = 0; i < ships.length; i++) {
          const sh = ships[i];
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'hangar-card';
          btn.dataset.shipId = sh.id;
          btn.style.setProperty('--ship-accent', sh.accent);
          btn.innerHTML = `
            <div class="hangar-card-head">
              <span class="hangar-class">${sh.classTag}</span>
              <span class="hangar-status">EQUIPPED</span>
            </div>
            <div class="hangar-preview-wrap" aria-hidden="true">
              <img class="hangar-preview-img" src="${window.ChaosShips.getPreviewUrl(sh.id)}" alt="${sh.name}" width="112" height="112">
            </div>
            <span class="hangar-name">${sh.name}</span>
            <span class="hangar-tagline">${sh.tagline}</span>
          `;
          btn.addEventListener('click', () => this.selectShip(sh.id));
          hangarGrid.appendChild(btn);
        }
      }
      this._syncHangarUi();
    }

    selectShip(id) {
      if (!window.ChaosShips || !window.ChaosShips.setSelectedId(id)) return;
      this.selectedShipId = id;
      this._syncHangarUi();
      if (window.ChaosAudio && typeof window.ChaosAudio.playXp === 'function') {
        window.ChaosAudio.playXp();
      }
    }

    _syncHangarUi() {
      if (!window.ChaosShips) return;
      const active = window.ChaosShips.get(this.selectedShipId);
      if (hangarBtnShipName) hangarBtnShipName.textContent = active.name;
      if (hangarBtn) hangarBtn.style.setProperty('--ship-accent', active.accent);
      if (hangarBtnShipPreview) {
        hangarBtnShipPreview.src = window.ChaosShips.getPreviewUrl(active.id);
        hangarBtnShipPreview.alt = active.name;
      }
      if (hangarGrid) {
        const cards = hangarGrid.children;
        for (let i = 0; i < cards.length; i++) {
          const isSel = cards[i].dataset.shipId === active.id;
          cards[i].classList.toggle('is-selected', isSel);
          cards[i].setAttribute('aria-pressed', isSel ? 'true' : 'false');
        }
      }
    }

    _populateArmory() {
      if (!armoryGrid) return;
      if (window.PowerupIcons && typeof window.PowerupIcons.prebakeAll === 'function') {
        window.PowerupIcons.prebakeAll();
      }
      armoryGrid.innerHTML = '';
      for (let i = 0; i < UPGRADES.length; i++) {
        const upg = UPGRADES[i];
        const card = document.createElement('div');
        card.className = 'armory-card';
        card.style.setProperty('--arm-color', upg.color);
        card.innerHTML = `
          <div class="armory-icon" aria-hidden="true">${getPowerupIconHtml(upg)}</div>
          <span class="armory-tier">${upg.tier}</span>
          <span class="armory-name">${upg.title}</span>
        `;
        armoryGrid.appendChild(card);
      }
    }

    _clearTransientInputs() {
      this.keys.clear();
      if (this.player) {
        this.player.yanking = false;
        this.player.yankCharge = 0;
      }
      if (touchYankBtn) touchYankBtn.classList.remove('charging');
      this.touchStick.active = false;
      this.touchStick.pointerId = null;
      this.touchStick.ax = 0;
      this.touchStick.ay = 0;
      if (touchStickKnob) touchStickKnob.style.transform = 'translate3d(0, 0, 0)';
    }

    resetEntities() {
      this.elapsed = 0;
      this.score = 0;
      this.kills = 0;
      this.vampiricKillCounter = 0;
      this.combo = 1;
      this.maxCombo = 1;
      this.comboTimer = 0;
      this.comboScore = 0;
      this._lastFeedTime = -1;
      this._scorePopTimer = 0;
      this._sideBumpTimer = 0;
      this._comboFeed = [];
      this._comboFeedDirty = true;
      this._activeBoss = null;
      this._orbMaxSpeed = 0;
      this._orbMaxStretch = 0;
      this._lightningStamp = 0;
      this._bomberHits = [];
      if (sideComboCard) sideComboCard.classList.add('is-idle');
      if (this._comboFeedSlots && this._comboFeedSlots.length > 0) {
        for (let i = 0; i < this._comboFeedSlots.length; i++) {
          this._comboFeedSlots[i].el.classList.add('is-empty');
          this._comboFeedSlots[i].empty = true;
        }
      }
      if (scoreText) scoreText.classList.remove('score-pop');
      this.wave = 1;
      this.nextBossLevel = 5;
      this.spawnTimer = 0;
      this.overdrive = 0;
      this.overdriveTimer = 0;
      this.tempOrbs = [];
      this.upgradeLevels = Object.create(null);
      this._coreSurgeStacks = 0;
      this._orbsDirty = true;
      this._hudCache = {};

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
        prevX: ARENA_W / 2,
        prevY: ARENA_H / 2,
        vx: 0,
        vy: 0,
        angle: 0,
        aimAngle: 0,
        bank: 0,
        radius: 17,
        hp: 100,
        maxHp: 100,
        invuln: 0,
        dashTimer: 0,
        dashCd: 0,
        dashCdMax: DASH_BASE_CD,
        dashBuffer: 0,
        dashDirX: 1,
        dashDirY: 0,
        yanking: false,
        yankCharge: 0,
        xp: 0,
        xpToNext: 12,
        level: 1,
        trailX: new Float32Array(12),
        trailY: new Float32Array(12),
        trailDash: new Uint8Array(12),
        trailHead: 0,
        trailCount: 0,
      };
      this._accumulator = 0;
      this._trailTimer = 0;

      this.orbs = [];
      this.spawnOrb(false);

      const recycle = (arr, pool, cap) => {
        if (!arr) return;
        for (let i = 0; i < arr.length; i++) {
          if (pool.length < cap) pool.push(arr[i]);
        }
      };
      recycle(this.particles, this._particlePool, MAX_PARTICLES);
      recycle(this.gems, this._gemPool, 320);
      recycle(this.projectiles, this._projPool, 160);
      recycle(this.enemyBullets, this._bulletPool, 160);
      recycle(this.shockwaves, this._swPool, 96);
      recycle(this.impactFlares, this._flarePool, 64);
      recycle(this.lightnings, this._lightningPool, 64);
      recycle(this.floatingTexts, this._ftPool, 96);
      recycle(this.enemies, this._enemyPool, 256);

      this.enemies = [];
      this.gems = [];
      this.particles = [];
      this.shockwaves = [];
      this.impactFlares = [];
      this.lightnings = [];
      this.blackHoles = [];
      this.projectiles = [];
      this.enemyBullets = [];
      this.floatingTexts = [];
    }

    spawnOrb(isTemp = false) {
      // Spread permanent cores via golden angle and temporary Overdrive cores 180° opposite each other
      const angle = isTemp
        ? this.tempOrbs.length * Math.PI + Math.PI * 0.5 + this.elapsed * 0.7
        : this.orbs.length * 2.399963229728653;
      const dist = isTemp ? 152 : 140;
      const ox = clamp(this.player.x + Math.cos(angle) * dist, 30, ARENA_W - 30);
      const oy = clamp(this.player.y + Math.sin(angle) * dist, 30, ARENA_H - 30);
      const orb = {
        x: ox,
        y: oy,
        prevX: ox,
        prevY: oy,
        vx: -Math.sin(angle) * 360,
        vy: Math.cos(angle) * 360,
        baseRadius: 22 * this.mods.orbScale,
        radius: 22 * this.mods.orbScale,
        trailX: new Float32Array(20),
        trailY: new Float32Array(20),
        trailHead: 0,
        trailCount: 0,
        isTemp,
      };
      if (isTemp) this.tempOrbs.push(orb);
      else this.orbs.push(orb);
      this._orbsDirty = true;
      return orb;
    }

    resize() {
      this.viewW = window.innerWidth;
      this.viewH = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (this.space) this.space.resize(this.viewW, this.viewH);
      if (this.renderer) {
        this.renderer.resize(this.viewW, this.viewH, this.dpr);
      } else {
        canvas.width = Math.floor(this.viewW * this.dpr);
        canvas.height = Math.floor(this.viewH * this.dpr);
      }
      if (this.state !== 'playing' && this.state !== 'title') {
        this.render();
      }
    }

    _updateTouchControlsVisibility() {
      if (!touchControlsEl) return;
      const showTouch = this.state === 'playing' && (this.controlMode === 'mouse' || this.isCoarsePointer);
      touchControlsEl.classList.toggle('hidden', !showTouch);
      if (controlsHint) {
        controlsHint.classList.toggle('hidden', showTouch);
      }
    }

    bindEvents() {
      window.addEventListener('resize', () => this.resize());

      window.addEventListener('blur', () => {
        this._clearTransientInputs();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this._clearTransientInputs();
          this._stopLoop();
        } else if (this.state === 'playing' || this.state === 'title') {
          this._scheduleLoop(true);
        }
      });

      window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        this.keys.add(key);

        if (this.state === 'title' && (key === ' ' || key === 'enter')) {
          if ((armoryDialog && armoryDialog.open) || (hangarDialog && hangarDialog.open) || (controlsDialog && controlsDialog.open)) return;
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
        this.mouse.active = true;
      });

      canvas.addEventListener('pointerdown', (e) => {
        if (this.state !== 'playing') return;
        window.ChaosAudio.ensureContext();
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouse.active = true;
        if (e.pointerType === 'touch') {
          this.isCoarsePointer = true;
          this._updateTouchControlsVisibility();
          return;
        }
        if (e.button === 2) {
          this.player.yanking = true;
        } else if (e.button === 0) {
          this.triggerDash();
        }
      });

      canvas.addEventListener('pointerup', (e) => {
        if (e.button === 2 && this.player.yanking) this.releaseCatapult();
      });

      canvas.addEventListener('contextmenu', (e) => e.preventDefault());

      // Virtual thumbstick multi-touch handlers
      if (touchStickZone) {
        const updateStick = (clientX, clientY) => {
          const dx = clientX - this.touchStick.originX;
          const dy = clientY - this.touchStick.originY;
          const maxR = 40;
          const dist = Math.hypot(dx, dy);
          const clamped = Math.min(maxR, dist);
          const nx = dist > 0.001 ? dx / dist : 0;
          const ny = dist > 0.001 ? dy / dist : 0;
          this.touchStick.ax = dist > 5 ? nx * (clamped / maxR) : 0;
          this.touchStick.ay = dist > 5 ? ny * (clamped / maxR) : 0;
          if (touchStickKnob) {
            touchStickKnob.style.transform = `translate3d(${(nx * clamped).toFixed(1)}px, ${(ny * clamped).toFixed(1)}px, 0)`;
          }
        };

        const resetStick = () => {
          this.touchStick.active = false;
          this.touchStick.pointerId = null;
          this.touchStick.ax = 0;
          this.touchStick.ay = 0;
          if (touchStickKnob) {
            touchStickKnob.style.transform = 'translate3d(0, 0, 0)';
          }
        };

        touchStickZone.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.ChaosAudio.ensureContext();
          const rect = touchStickZone.getBoundingClientRect();
          this.touchStick.active = true;
          this.touchStick.pointerId = e.pointerId;
          this.touchStick.originX = rect.left + rect.width / 2;
          this.touchStick.originY = rect.top + rect.height / 2;
          try { touchStickZone.setPointerCapture(e.pointerId); } catch {}
          updateStick(e.clientX, e.clientY);
        });

        touchStickZone.addEventListener('pointermove', (e) => {
          if (!this.touchStick.active || e.pointerId !== this.touchStick.pointerId) return;
          e.preventDefault();
          updateStick(e.clientX, e.clientY);
        });

        touchStickZone.addEventListener('pointerup', (e) => {
          if (e.pointerId === this.touchStick.pointerId) resetStick();
        });
        touchStickZone.addEventListener('pointercancel', (e) => {
          if (e.pointerId === this.touchStick.pointerId) resetStick();
        });
      }

      if (touchDashBtn) {
        touchDashBtn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.ChaosAudio.ensureContext();
          if (this.state === 'playing') this.triggerDash();
        });
      }

      if (touchYankBtn) {
        touchYankBtn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.ChaosAudio.ensureContext();
          if (this.state !== 'playing') return;
          this.player.yanking = true;
          touchYankBtn.classList.add('charging');
          try { touchYankBtn.setPointerCapture(e.pointerId); } catch {}
        });
        const endTouchYank = (e) => {
          e.preventDefault();
          e.stopPropagation();
          touchYankBtn.classList.remove('charging');
          if (this.player.yanking) this.releaseCatapult();
        };
        touchYankBtn.addEventListener('pointerup', endTouchYank);
        touchYankBtn.addEventListener('pointercancel', endTouchYank);
      }

      if (touchNovaBtn) {
        touchNovaBtn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          window.ChaosAudio.ensureContext();
          if (this.state === 'playing') this.triggerOverdrive();
        });
      }

      startBtn.addEventListener('click', () => this.startGame());
      if (hangarBtn && hangarDialog) {
        hangarBtn.addEventListener('click', () => hangarDialog.showModal());
      }
      if (closeHangarBtn && hangarDialog) {
        closeHangarBtn.addEventListener('click', () => hangarDialog.close());
      }
      if (armoryBtn && armoryDialog) {
        armoryBtn.addEventListener('click', () => armoryDialog.showModal());
      }
      if (closeArmoryBtn && armoryDialog) {
        closeArmoryBtn.addEventListener('click', () => armoryDialog.close());
      }
      if (controlsBtn && controlsDialog) {
        controlsBtn.addEventListener('click', () => controlsDialog.showModal());
      }
      if (closeControlsBtn && controlsDialog) {
        closeControlsBtn.addEventListener('click', () => controlsDialog.close());
      }
      if (titleMuteBtn) {
        titleMuteBtn.addEventListener('click', () => this.toggleMute());
      }
      muteBtn.addEventListener('click', () => this.toggleMute());
      if (odReady) {
        odReady.addEventListener('click', () => {
          if (this.state === 'playing') this.triggerOverdrive();
        });
      }
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
        if (this.state === 'paused') {
          this.state = 'playing';
          window.ChaosAudio.setMusicDucked(false);
          this._scheduleLoop(true);
        }
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
      muteBtn.innerHTML = next ? ICON_SOUND_OFF : ICON_SOUND_ON;
      muteBtn.classList.toggle('is-muted', next);
      if (titleMuteBtn) {
        titleMuteBtn.classList.toggle('is-muted', next);
        const iconWrap = titleMuteBtn.querySelector('.title-mute-icon');
        if (iconWrap) iconWrap.innerHTML = next ? ICON_SOUND_OFF : ICON_SOUND_ON;
      }
      if (titleMuteLabel) {
        titleMuteLabel.textContent = next ? 'AUDIO OFF' : 'AUDIO ON';
      }
    }

    startGame() {
      this._closeAllDialogs();
      window.ChaosAudio.ensureContext();
      window.ChaosAudio.startAmbient();
      window.ChaosAudio.setMusicDucked(false);
      this.lastIntensity = -1;
      const selectedMode = document.querySelector('input[name="controlMode"]:checked');
      this.controlMode = selectedMode ? selectedMode.value : (this.isCoarsePointer ? 'mouse' : 'hybrid');
      this.resetEntities();
      this.state = 'playing';
      startScreen.classList.add('hidden');
      hudEl.classList.remove('hidden');
      bossHud.classList.add('hidden');
      controlsHint.classList.remove('faded');
      this._updateTouchControlsVisibility();
      this.camera.x = this.player.x;
      this.camera.y = this.player.y;
      this.camera.prevX = this.player.x;
      this.camera.prevY = this.player.y;
      this.updateHud();
      this._scheduleLoop(true);
    }

    toTitleScreen() {
      this._closeAllDialogs();
      window.ChaosAudio.updateMotionAudio(0, 0, 0, false);
      this.resetEntities();
      this.state = 'title';
      hudEl.classList.add('hidden');
      if (touchControlsEl) touchControlsEl.classList.add('hidden');
      startScreen.classList.remove('hidden');
      refreshStartRecords();
      this._scheduleLoop(true);
    }

    pauseGame() {
      if (this.state !== 'playing') return;
      this.state = 'paused';
      this._clearTransientInputs();
      window.ChaosAudio.setMusicDucked(true);
      this.render();
      this._stopLoop();
      pauseDialog.showModal();
    }

    resumeGame() {
      if (this.state !== 'paused') return;
      pauseDialog.close();
      this.state = 'playing';
      window.ChaosAudio.setMusicDucked(false);
      this._scheduleLoop(true);
    }

    triggerDash() {
      const p = this.player;
      if (p.dashCd > 0 || p.dashTimer > 0) {
        // 120ms input buffer so early taps right before Dash cooldown completes fire automatically
        if (p.dashCd <= 0.14 && p.dashTimer <= 0) p.dashBuffer = 0.12;
        return;
      }
      p.dashBuffer = 0;

      let dx = 0;
      let dy = 0;
      if (this.touchStick.active && (Math.abs(this.touchStick.ax) > 0.05 || Math.abs(this.touchStick.ay) > 0.05)) {
        dx = this.touchStick.ax;
        dy = this.touchStick.ay;
      } else if (this.controlMode === 'hybrid') {
        if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
        if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
        if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
        if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;
      }
      if (dx === 0 && dy === 0) {
        if (this.mouse.active) {
          dx = this.mouse.worldX - p.x;
          dy = this.mouse.worldY - p.y;
        } else {
          dx = Math.cos(p.angle);
          dy = Math.sin(p.angle);
        }
      }
      const len = Math.hypot(dx, dy) || 1;
      p.dashDirX = dx / len;
      p.dashDirY = dy / len;
      p.dashTimer = 0.16;
      const cd = Math.max(DASH_MIN_CD, DASH_BASE_CD * this.mods.dashCdMult);
      p.dashCd = cd;
      p.dashCdMax = cd;
      p.invuln = Math.max(p.invuln, 0.24);
      this.shaker.add(0.2);
      window.ChaosAudio.playDash();
      this._pushShockwave(p.x, p.y, 12, 86, '#00f0ff', 0.85);
      this.spawnBurst(p.x, p.y, '#00f0ff', 14, 280);
    }

    releaseCatapult() {
      const p = this.player;
      p.yanking = false;
      if (p.yankCharge < 0.15) {
        p.yankCharge = 0;
        return;
      }
      let aimX = 0;
      let aimY = 0;
      if (this.touchStick.active && (Math.abs(this.touchStick.ax) > 0.05 || Math.abs(this.touchStick.ay) > 0.05)) {
        aimX = this.touchStick.ax;
        aimY = this.touchStick.ay;
      } else if (this.mouse.active) {
        aimX = this.mouse.worldX - p.x;
        aimY = this.mouse.worldY - p.y;
      } else {
        aimX = Math.cos(p.angle);
        aimY = Math.sin(p.angle);
      }
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
      this._pushShockwave(p.x, p.y, 16, 135, '#ffd600', 0.95);
    }

    _pushShockwave(x, y, r, maxR, color, alpha) {
      let sw;
      if (this.shockwaves.length >= MAX_SHOCKWAVES) {
        sw = this.shockwaves[0];
        swapPop(this.shockwaves, 0);
      } else {
        sw = this._swPool.pop() || {};
      }
      sw.x = x; sw.y = y; sw.r = r; sw.maxR = maxR; sw.color = color; sw.alpha = alpha;
      this.shockwaves.push(sw);
    }

    _pushImpactFlare(x, y, size, color, life = 0.2) {
      if (this.impactFlares.length >= 48) return;
      const fl = this._flarePool.pop() || {};
      fl.x = x;
      fl.y = y;
      fl.size = size;
      fl.color = color;
      fl.life = life;
      fl.maxLife = life;
      fl.rot = (Math.random() - 0.5) * 0.8;
      this.impactFlares.push(fl);
    }

    pushFloatingText(x, y, text, color, life, scale, vx = 0, vy = -46) {
      // Cap floating texts permanently: skip low-priority damage/score pops in O(1) when full
      if (this.floatingTexts.length >= MAX_FLOATING_TEXTS) {
        if (scale < 1.35) return;
        let evictIdx = -1;
        for (let i = 0; i < this.floatingTexts.length; i++) {
          if (this.floatingTexts[i].scale < 1.35) { evictIdx = i; break; }
        }
        if (evictIdx === -1) evictIdx = 0;
        const old = this.floatingTexts[evictIdx];
        if (this._ftPool.length < 96) this._ftPool.push(old);
        swapPop(this.floatingTexts, evictIdx);
      }
      // Bounded vertical de-overlap (max 2 passes) so banners & numbers stay legible in O(1) bounded work
      let adjY = y;
      const len = this.floatingTexts.length;
      for (let pass = 0; pass < 2; pass++) {
        let shifted = false;
        for (let i = 0; i < len; i++) {
          const other = this.floatingTexts[i];
          if (Math.abs(other.x - x) < 76 && Math.abs(other.y - adjY) < 25) {
            adjY = other.y - 26;
            shifted = true;
          }
        }
        if (!shifted) break;
      }
      const ft = this._ftPool.pop() || {};
      ft.x = x;
      ft.y = adjY;
      ft.vx = vx;
      ft.vy = vy;
      ft.text = text;
      ft.color = color;
      ft.life = life;
      ft.maxLife = life;
      ft.scale = scale;
      this.floatingTexts.push(ft);
    }

    _getComboTier(combo) {
      if (combo >= 28) return { rank: 'GODLIKE!', cls: 'tier-cosmic', color: '#c084fc' };
      if (combo >= 18) return { rank: 'OVERKILL', cls: 'tier-magenta', color: '#ff2a6d' };
      if (combo >= 10) return { rank: 'HYPER', cls: 'tier-gold', color: '#ffd600' };
      if (combo >= 5) return { rank: 'SURGE', cls: 'tier-gold', color: '#ffd600' };
      return { rank: 'CHAIN', cls: 'tier-cyan', color: '#00f0ff' };
    }

    _pushComboFeed(pts, enemy, isSupersonic) {
      if (!comboFeedList) return;
      const now = this.elapsed;
      if (!enemy.isBoss && this.combo < 2) return;
      if (!enemy.isBoss && now - this._lastFeedTime < 0.095) return;
      this._lastFeedTime = now;

      const tier = this._getComboTier(this.combo);
      const accent = enemy.isBoss ? '#ff2a6d' : (isSupersonic ? '#ffd600' : tier.color);
      const tag = enemy.isBoss
        ? 'BOSS SHATTER'
        : isSupersonic
          ? `SONIC x${this.combo}`
          : `${tier.rank} x${this.combo}`;
      const item = this._comboFeedPool.pop() || {};
      item.pts = pts;
      item.tag = tag;
      item.accent = accent;
      item.life = 2.15;
      this._comboFeed.unshift(item);
      if (this._comboFeed.length > 4) {
        const evicted = this._comboFeed.pop();
        if (evicted && this._comboFeedPool.length < 16) this._comboFeedPool.push(evicted);
      }
      this._comboFeedDirty = true;
    }

    triggerOverdrive() {
      if (this.overdrive < 100 || this.overdriveTimer > 0) return;
      this.overdrive = 0;
      this.overdriveTimer = OVERDRIVE_DURATION;
      if (this.tempOrbs.length > 0) {
        this.tempOrbs.length = 0;
        this._orbsDirty = true;
      }
      this.shaker.add(0.5);
      this.screenFlash = { alpha: 0.32, color: '#b829ff' };
      window.ChaosAudio.playOverdrive();
      this._pushShockwave(this.player.x, this.player.y, 20, 420, '#b829ff', 1);
      this.pushFloatingText(this.player.x, this.player.y - 42, 'HYPER-NOVA OVERDRIVE!', '#ffd600', 1.5, 1.45);
      const orbA = this.spawnOrb(true);
      const orbB = this.spawnOrb(true);
      this._pushShockwave(orbA.x, orbA.y, 10, 96, '#ffd600', 0.9);
      this._pushShockwave(orbB.x, orbB.y, 10, 96, '#ffd600', 0.9);
      this.spawnBurst(orbA.x, orbA.y, '#ffd600', 12, 240);
      this.spawnBurst(orbB.x, orbB.y, '#ffd600', 12, 240);
      this.updateHud();
    }

    getAllOrbs() {
      if (this._orbsDirty) {
        this._allOrbs.length = 0;
        for (let i = 0; i < this.orbs.length; i++) this._allOrbs.push(this.orbs[i]);
        for (let i = 0; i < this.tempOrbs.length; i++) this._allOrbs.push(this.tempOrbs[i]);
        this._orbsDirty = false;
      }
      return this._allOrbs;
    }

    _triggerUpgradeVfx(upg, newLevel) {
      const p = this.player;
      this._pushShockwave(p.x, p.y, 18, 220, upg.color, 0.96);
      this.spawnBurst(p.x, p.y, upg.color, 20, 320);
      this.screenFlash = { alpha: 0.14, color: upg.color };
      this.shaker.add(0.22);
      const tag = upg.id === OVERCLOCK_FALLBACK.id
        ? `${upg.shortName}!`
        : `${upg.shortName} LVL ${newLevel}`;
      this.pushFloatingText(p.x, p.y - 42, tag, upg.color, 1.35, 1.25);
    }

    getUpgradeDefs() {
      return UPGRADES;
    }

    recomputeStats() {
      const lvls = this.upgradeLevels;
      const twinLvl = lvls.twin_orb || 0;
      const elasticLvl = lvls.elastic_whip || 0;
      const berserkLvl = lvls.berserker || 0;
      const surgeStacks = this._coreSurgeStacks || 0;

      this.mods.lightning = lvls.chain_lightning || 0;
      this.mods.blackHole = lvls.black_hole || 0;
      this.mods.laserTether = lvls.laser_tether || 0;
      this.mods.shrapnel = lvls.shrapnel || 0;
      this.mods.vampiric = lvls.vampiric || 0;

      this.mods.orbScale = 1 + elasticLvl * 0.16;
      this.mods.whipForce = (1 + elasticLvl * 0.26) * (1 + twinLvl * 0.06);
      this.mods.damageMult = 1 + elasticLvl * 0.22 + surgeStacks * 0.15;
      this.mods.speedMult = Math.min(2.1, 1 + berserkLvl * 0.16);
      this.mods.dashCdMult = Math.pow(0.80, berserkLvl);
      this.mods.odGainMult = 1 + berserkLvl * 0.25;

      const allOrbs = this.getAllOrbs();
      for (let i = 0; i < allOrbs.length; i++) {
        allOrbs[i].baseRadius = 22 * this.mods.orbScale;
      }
    }

    applyUpgrade(upg) {
      let target = upg;
      const curLvl = this.upgradeLevels[target.id] || 0;
      // Edge-case guard: duplicate/max-level pickups automatically convert to Core Surge overflow
      if (target.id !== OVERCLOCK_FALLBACK.id && curLvl >= target.maxStacks) {
        target = OVERCLOCK_FALLBACK;
      }
      let nextLvl;
      if (target.id === OVERCLOCK_FALLBACK.id) {
        this._coreSurgeStacks = (this._coreSurgeStacks || 0) + 1;
        nextLvl = this._coreSurgeStacks;
      } else {
        nextLvl = curLvl + 1;
        this.upgradeLevels[target.id] = nextLvl;
      }
      target.apply(this);
      this.recomputeStats();
      this._triggerUpgradeVfx(target, nextLvl);
      return nextLvl;
    }

    openUpgradeModal() {
      this.state = 'upgrade';
      this._clearTransientInputs();
      window.ChaosAudio.playLevelUp();
      window.ChaosAudio.setMusicDucked(true);

      const eligible = UPGRADES.filter((u) => (this.upgradeLevels[u.id] || 0) < u.maxStacks);
      // Fisher-Yates shuffle for unbiased mutation selection
      for (let i = eligible.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = eligible[i];
        eligible[i] = eligible[j];
        eligible[j] = tmp;
      }
      const pool = eligible.slice(0, 3);
      while (pool.length < 3) pool.push(OVERCLOCK_FALLBACK);

      upgradeChoicesEl.innerHTML = '';

      pool.forEach((upg, index) => {
        const curLvl = this.upgradeLevels[upg.id] || 0;
        const nextLvl = curLvl + 1;
        const isMaxNext = nextLvl >= upg.maxStacks && upg.id !== OVERCLOCK_FALLBACK.id;
        const lvlBadge = curLvl === 0
          ? `<span class="upgrade-lvl is-new">NEW</span>`
          : `<span class="upgrade-lvl">LVL ${curLvl} &gt; ${nextLvl}${isMaxNext ? ' MAX' : ''}</span>`;
        const descText = typeof upg.getDesc === 'function' ? upg.getDesc(nextLvl) : upg.desc;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'upgrade-card';
        btn.dataset.upgradeId = upg.id;
        btn.style.setProperty('--upg-color', upg.color);
        if (index === 0) btn.autofocus = true;
        const maxPips = upg.id === OVERCLOCK_FALLBACK.id ? 5 : upg.maxStacks;
        let pipsHtml = '';
        for (let pIdx = 0; pIdx < maxPips; pIdx++) {
          const pipCls = pIdx < curLvl ? 'is-owned' : (pIdx === curLvl ? 'is-next' : '');
          pipsHtml += `<span class="upgrade-pip ${pipCls}"></span>`;
        }
        btn.innerHTML = `
          <div class="upgrade-top-row">
            <div class="upgrade-emblem" aria-hidden="true">${getPowerupIconHtml(upg)}</div>
            <div class="upgrade-meta">
              <span class="upgrade-tier">${upg.tier}</span>
              ${lvlBadge}
              <div class="upgrade-pips" aria-hidden="true">${pipsHtml}</div>
            </div>
          </div>
          <span class="upgrade-title">${upg.title}</span>
          <span class="upgrade-desc">${descText}</span>
          <span class="upgrade-key"><span>KEY [${index + 1}]</span><span>INSTALL &gt;&gt;</span></span>
        `;
        btn.addEventListener('click', () => {
          if (this.state !== 'upgrade') return;
          this.applyUpgrade(upg);
          upgradeDialog.close();
          // Handle simultaneous / multi-level XP overflow cleanly
          if (this.player.xp >= this.player.xpToNext) {
            this.player.xp -= this.player.xpToNext;
            this.player.level += 1;
            this.player.xpToNext = Math.round(this.player.xpToNext * 1.32 + 6);
            this.updateHud();
            this.openUpgradeModal();
            return;
          }
          this.state = 'playing';
          window.ChaosAudio.setMusicDucked(false);
          this.updateHud();
          this._scheduleLoop(true);
        });
        upgradeChoicesEl.appendChild(btn);
      });

      this.render();
      this._stopLoop();
      upgradeDialog.showModal();
    }

    triggerGameOver() {
      this.state = 'gameover';
      this._clearTransientInputs();
      window.ChaosAudio.playGameOver();
      window.ChaosAudio.setMusicDucked(true);
      const rec = saveRecords(this.score, this.maxCombo);
      finalScoreEl.textContent = this.score.toLocaleString();
      finalTimeEl.textContent = formatTime(this.elapsed);
      finalComboEl.textContent = `x${this.maxCombo}`;
      finalKillsEl.textContent = this.kills.toLocaleString();
      newRecordBanner.classList.toggle('hidden', !rec.isNew);
      this.render();
      this._stopLoop();
      gameOverDialog.showModal();
    }

    _snapshotPrevPositions() {
      const p = this.player;
      p.prevX = p.x;
      p.prevY = p.y;
      this.camera.prevX = this.camera.x;
      this.camera.prevY = this.camera.y;
      const allOrbs = this.getAllOrbs();
      for (let i = 0; i < allOrbs.length; i++) {
        allOrbs[i].prevX = allOrbs[i].x;
        allOrbs[i].prevY = allOrbs[i].y;
      }
      for (let i = 0; i < this.enemies.length; i++) {
        this.enemies[i].prevX = this.enemies[i].x;
        this.enemies[i].prevY = this.enemies[i].y;
      }
      for (let i = 0; i < this.projectiles.length; i++) {
        this.projectiles[i].prevX = this.projectiles[i].x;
        this.projectiles[i].prevY = this.projectiles[i].y;
      }
      for (let i = 0; i < this.enemyBullets.length; i++) {
        this.enemyBullets[i].prevX = this.enemyBullets[i].x;
        this.enemyBullets[i].prevY = this.enemyBullets[i].y;
      }
      for (let i = 0; i < this.gems.length; i++) {
        this.gems[i].prevX = this.gems[i].x;
        this.gems[i].prevY = this.gems[i].y;
      }
    }

    _pushPlayerTrail(p) {
      const cap = p.trailX.length;
      p.trailX[p.trailHead] = p.x;
      p.trailY[p.trailHead] = p.y;
      p.trailDash[p.trailHead] = p.dashTimer > 0 ? 1 : 0;
      p.trailHead = (p.trailHead + 1) % cap;
      if (p.trailCount < cap) p.trailCount++;
    }

    _pushOrbTrail(orb) {
      const cap = orb.trailX.length;
      orb.trailX[orb.trailHead] = orb.x;
      orb.trailY[orb.trailHead] = orb.y;
      orb.trailHead = (orb.trailHead + 1) % cap;
      if (orb.trailCount < cap) orb.trailCount++;
    }

    loop(now) {
      if (this.lastTime === 0) {
        this.lastTime = now;
      }
      const rawDt = Math.min(0.05, Math.max(0, (now - this.lastTime) / 1000));
      this.lastTime = now;

      if (this.state === 'title') {
        if (rawDt > 0) {
          this.space.update(rawDt);
          this._snapshotPrevPositions();
          this.updateTitleDemo(rawDt);
        }
        this.render(1);
        this._scheduleLoop(false);
      } else if (this.state === 'playing') {
        if (rawDt > 0) {
          this.space.update(rawDt);
          // 60 Hz fixed-timestep physics accumulator with render interpolation (bounded substeps, zero spiral-of-death)
          this._accumulator = Math.min(this._accumulator + rawDt, FIXED_DT * MAX_SUBSTEPS);
          let steps = Math.floor(this._accumulator / FIXED_DT);
          while (steps > 0 && this.state === 'playing') {
            if (steps === 1) this._snapshotPrevPositions();
            this.update(FIXED_DT);
            this._accumulator -= FIXED_DT;
            steps--;
          }
          if (this.state === 'playing') {
            this.updateHud();
            window.ChaosAudio.updateMotionAudio(this._orbMaxSpeed / 1150, this._orbMaxStretch / 260, this.player.yankCharge, true);
          }
        }
        const alpha = this.state === 'playing' ? this._accumulator / FIXED_DT : 1;
        this.render(alpha);
        if (this.state === 'playing') {
          this._scheduleLoop(false);
        }
      } else {
        // Paused, Upgrade, or GameOver state: render once and sleep (0% background CPU/GPU)
        this.render(1);
      }
    }

    updateTitleDemo(dt) {
      this.elapsed += dt;
      if (this.titleScene) this.titleScene.update(dt);
    }

    _swapPopEnemy(idx) {
      const enemies = this.enemies;
      const last = enemies.length - 1;
      const removed = enemies[idx];
      if (idx < last) {
        const moved = enemies[last];
        enemies[idx] = moved;
        moved._idx = idx;
      }
      enemies.pop();
      if (removed) removed._idx = -1;
      this._gridDirty = true;
      return removed;
    }

    _ensureSpatialGrid() {
      if (this._gridDirty) this._rebuildSpatialGrid();
    }

    _rebuildSpatialGrid() {
      this._gridDirty = false;
      const head = this._gridHead;
      head.fill(-1);
      const enemies = this.enemies;
      const n = enemies.length;
      if (n > this._gridNext.length) {
        const cap = Math.max(n * 2, 1024);
        this._gridNext = new Int32Array(cap);
        this._gridRef = new Array(cap);
      }
      const next = this._gridNext;
      const ref = this._gridRef;
      for (let i = 0; i < n; i++) {
        const e = enemies[i];
        e._idx = i;
        ref[i] = e;
        const cx = clamp((e.x / CELL_SIZE) | 0, 0, GRID_COLS - 1);
        const cy = clamp((e.y / CELL_SIZE) | 0, 0, GRID_ROWS - 1);
        const cellIdx = cy * GRID_COLS + cx;
        next[i] = head[cellIdx];
        head[cellIdx] = i;
      }
    }

    update(dt) {
      this._vfxThisStep = 0;
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
          for (let i = 0; i < this.tempOrbs.length; i++) {
            const to = this.tempOrbs[i];
            this._pushShockwave(to.x, to.y, to.radius * 0.6, to.radius * 3.8, '#b829ff', 0.9);
            this.spawnBurst(to.x, to.y, '#ffd600', 10, 260);
          }
          this.tempOrbs.length = 0;
          this._orbsDirty = true;
        }
      }

      if (this.combo > 1) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 1;
          this.comboTimer = 0;
          this.comboScore = 0;
        }
      }
      if (this._scorePopTimer > 0) this._scorePopTimer = Math.max(0, this._scorePopTimer - dt);
      if (this._sideBumpTimer > 0) this._sideBumpTimer = Math.max(0, this._sideBumpTimer - dt);
      if (this._comboFeed.length > 0) {
        for (let i = this._comboFeed.length - 1; i >= 0; i--) {
          this._comboFeed[i].life -= dt;
          if (this._comboFeed[i].life <= 0) {
            const expired = this._comboFeed[i];
            this._comboFeed.splice(i, 1);
            if (expired && this._comboFeedPool.length < 16) this._comboFeedPool.push(expired);
            this._comboFeedDirty = true;
          }
        }
      }

      // Dynamic soundtrack intensity (uses active boss state tracked in updateEnemies)
      const intensity = this.overdriveTimer > 0 ? 1 : Math.min(0.85, (this._activeBoss ? 0.55 : 0.1) + this.combo * 0.012);
      if (Math.abs(intensity - (this.lastIntensity ?? -1)) > 0.05) {
        this.lastIntensity = intensity;
        window.ChaosAudio.setIntensity(intensity);
      }

      this._trailTimer += dt;
      const sampleTrail = this._trailTimer >= TRAIL_SAMPLE_INTERVAL;
      if (sampleTrail) this._trailTimer -= TRAIL_SAMPLE_INTERVAL;

      this.updatePlayer(dt, sampleTrail);
      this.updateOrbs(dt, sampleTrail);
      this.updateSpawning(dt);
      this._rebuildSpatialGrid();
      this.updateBlackHoles(dt);
      this.updateEnemies(dt);
      this._rebuildSpatialGrid();
      this.updateProjectiles(dt);
      this.updateGems(dt);
      this.updateParticles(dt);

      const lookX = this.touchStick.active
        ? this.touchStick.ax * 70
        : clamp((this.mouse.x - this.viewW / 2) * 0.14, -120, 120);
      const lookY = this.touchStick.active
        ? this.touchStick.ay * 55
        : clamp((this.mouse.y - this.viewH / 2) * 0.14, -90, 90);
      const minCamX = Math.min(ARENA_W * 0.5, this.viewW * 0.35);
      const maxCamX = Math.max(ARENA_W * 0.5, ARENA_W - this.viewW * 0.35);
      const minCamY = Math.min(ARENA_H * 0.5, this.viewH * 0.35);
      const maxCamY = Math.max(ARENA_H * 0.5, ARENA_H - this.viewH * 0.35);
      const targetCamX = clamp(this.player.x + lookX, minCamX, maxCamX);
      const targetCamY = clamp(this.player.y + lookY, minCamY, maxCamY);
      this.camera.x += (targetCamX - this.camera.x) * Math.min(1, 8 * dt);
      this.camera.y += (targetCamY - this.camera.y) * Math.min(1, 8 * dt);
    }

    updatePlayer(dt, sampleTrail = true) {
      const p = this.player;
      p.invuln = Math.max(0, p.invuln - dt);
      p.dashCd = Math.max(0, p.dashCd - dt);
      if (p.dashBuffer > 0) {
        p.dashBuffer = Math.max(0, p.dashBuffer - dt);
        if (p.dashCd <= 0 && p.dashTimer <= 0) {
          this.triggerDash();
        }
      }

      if (this.keys.has('shift') && !p.yanking) p.yanking = true;
      if (p.yanking) p.yankCharge = Math.min(1, p.yankCharge + dt * 1.4);

      const speedBoost = (this.overdriveTimer > 0 ? 1.45 : 1) * this.mods.speedMult;
      let ax = 0;
      let ay = 0;

      if (p.dashTimer > 0) {
        p.dashTimer -= dt;
        const dashSpeed = 1100 * speedBoost;
        p.vx = p.dashDirX * dashSpeed;
        p.vy = p.dashDirY * dashSpeed;
        ax = p.dashDirX;
        ay = p.dashDirY;
      } else {
        if (this.touchStick.active) {
          ax = this.touchStick.ax;
          ay = this.touchStick.ay;
        } else {
          if (this.keys.has('w') || this.keys.has('arrowup')) ay -= 1;
          if (this.keys.has('s') || this.keys.has('arrowdown')) ay += 1;
          if (this.keys.has('a') || this.keys.has('arrowleft')) ax -= 1;
          if (this.keys.has('d') || this.keys.has('arrowright')) ax += 1;
          const len = Math.hypot(ax, ay);
          if (len > 0) {
            ax /= len;
            ay /= len;
          } else if (this.controlMode === 'mouse' && this.mouse.active) {
            // Smooth proportional deadzone ramp for zero-jitter cursor flight control
            const dx = this.mouse.worldX - p.x;
            const dy = this.mouse.worldY - p.y;
            const d = Math.hypot(dx, dy);
            if (d > 12) {
              const throttle = clamp((d - 12) / 100, 0.22, 1.0);
              ax = (dx / d) * throttle;
              ay = (dy / d) * throttle;
            }
          }
        }

        // Snappier counter-thrust retro-braking when reversing direction against momentum
        const velDot = ax * p.vx + ay * p.vy;
        const retroBoost = velDot < -60 ? 1.35 : 1.0;
        const accel = 2650 * speedBoost * retroBoost;
        p.vx += ax * accel * dt;
        p.vy += ay * accel * dt;

        p.vx *= PLAYER_DRAG;
        p.vy *= PLAYER_DRAG;
      }

      // Compute exact live aim angle for smooth Catapult vector guide
      if (this.touchStick.active && (Math.abs(this.touchStick.ax) > 0.05 || Math.abs(this.touchStick.ay) > 0.05)) {
        p.aimAngle = Math.atan2(this.touchStick.ay, this.touchStick.ax);
      } else if (this.mouse.active) {
        p.aimAngle = Math.atan2(this.mouse.worldY - p.y, this.mouse.worldX - p.x);
      } else {
        p.aimAngle = p.angle;
      }

      // Smooth shortest-arc heading & 2.5D flight banking into turns
      const speed = Math.hypot(p.vx, p.vy);
      let targetAngle = p.angle;
      if (speed > 22) {
        targetAngle = Math.atan2(p.vy, p.vx);
      } else if (this.mouse.active) {
        targetAngle = p.aimAngle;
      }
      let diff = targetAngle - p.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const turnRate = p.dashTimer > 0 ? 34 : 20;
      p.angle += diff * Math.min(1, turnRate * dt);

      // Lateral banking response from turn rate + strafe cross product
      const hx = Math.cos(p.angle);
      const hy = Math.sin(p.angle);
      const targetBank = clamp(diff * 2.2 + (hx * ay - hy * ax) * 0.55, -1, 1);
      p.bank += (targetBank - p.bank) * Math.min(1, 12 * dt);

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < p.radius) { p.x = p.radius; p.vx = Math.abs(p.vx) * 0.6; }
      if (p.x > ARENA_W - p.radius) { p.x = ARENA_W - p.radius; p.vx = -Math.abs(p.vx) * 0.6; }
      if (p.y < p.radius) { p.y = p.radius; p.vy = Math.abs(p.vy) * 0.6; }
      if (p.y > ARENA_H - p.radius) { p.y = ARENA_H - p.radius; p.vy = -Math.abs(p.vy) * 0.6; }

      if (sampleTrail) this._pushPlayerTrail(p);
    }

    updateOrbs(dt, sampleTrail = true) {
      const p = this.player;
      const allOrbs = this.getAllOrbs();
      const restLen = p.yanking ? 36 : 138;
      const stiffness = (p.yanking ? 26 : 11.5) * this.mods.whipForce;
      let maxSpeed = 0;
      let maxStretch = 0;

      for (let i = 0; i < allOrbs.length; i++) {
        const orb = allOrbs[i];
        const dx = p.x - orb.x;
        const dy = p.y - orb.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        const nx = dx / dist;
        const ny = dy / dist;

        if (dist > restLen) {
          const stretch = dist - restLen;
          if (stretch > maxStretch) maxStretch = stretch;
          orb.vx += nx * stretch * stiffness * dt;
          orb.vy += ny * stretch * stiffness * dt;

          const tx = -ny;
          const ty = nx;
          const tangSpeed = orb.vx * tx + orb.vy * ty;
          const sign = tangSpeed >= 0 ? 1 : -1;
          orb.vx += tx * sign * 115 * this.mods.whipForce * dt;
          orb.vy += ty * sign * 115 * this.mods.whipForce * dt;
        }

        orb.vx *= ORB_DRAG;
        orb.vy *= ORB_DRAG;

        const speed = Math.hypot(orb.vx, orb.vy);
        if (speed > 1650) {
          orb.vx = (orb.vx / speed) * 1650;
          orb.vy = (orb.vy / speed) * 1650;
        }
        if (speed > maxSpeed) maxSpeed = speed;

        orb.x += orb.vx * dt;
        orb.y += orb.vy * dt;
        orb.radius = orb.baseRadius * (1 + Math.min(0.45, speed / 2200));

        let bounced = false;
        let wnx = 0;
        let wny = 0;
        if (orb.x < orb.radius) { orb.x = orb.radius; orb.vx = Math.abs(orb.vx) * 0.88; bounced = true; wnx = 1; }
        if (orb.x > ARENA_W - orb.radius) { orb.x = ARENA_W - orb.radius; orb.vx = -Math.abs(orb.vx) * 0.88; bounced = true; wnx = -1; }
        if (orb.y < orb.radius) { orb.y = orb.radius; orb.vy = Math.abs(orb.vy) * 0.88; bounced = true; wny = 1; }
        if (orb.y > ARENA_H - orb.radius) { orb.y = ARENA_H - orb.radius; orb.vy = -Math.abs(orb.vy) * 0.88; bounced = true; wny = -1; }
        if (bounced && speed > 320) {
          const wallNorm = Math.min(1.4, speed / 1000);
          const isHard = speed > 650;
          this.shaker.add(isHard ? 0.22 : 0.11);
          window.ChaosAudio.playWallBounce(wallNorm);
          this._pushShockwave(orb.x, orb.y, orb.radius * 0.6, isHard ? 128 : 78, isHard ? '#ffd600' : '#00f0ff', isHard ? 0.92 : 0.72);
          this._pushImpactFlare(orb.x, orb.y, isHard ? 92 : 58, isHard ? '#ffd600' : '#00f0ff', isHard ? 0.2 : 0.14);
          this.spawnDirectionalBurst(orb.x, orb.y, wnx, wny, isHard ? '#ffd600' : '#00f0ff', isHard ? 14 : 8, 260 + speed * 0.22, 0, 1.05);
        }

        if (sampleTrail) this._pushOrbTrail(orb);
      }

      this._orbMaxSpeed = maxSpeed;
      this._orbMaxStretch = maxStretch;
    }

    updateSpawning(dt) {
      // Spawn a Colossal Milestone Boss after every 5 player levels (LVL 5, 10, 15, 20, ...)
      if (this.player.level >= this.nextBossLevel) {
        let bossCount = 0;
        for (let i = 0; i < this.enemies.length; i++) {
          if (this.enemies[i].isBoss) bossCount++;
        }
        if (bossCount < MAX_BOSSES) {
          const milestone = this.nextBossLevel;
          const tier = Math.max(1, Math.floor(milestone / 5));
          this.spawnBoss(milestone, tier);
          this.nextBossLevel += 5;
        }
      }

      const interval = Math.max(0.28, 1.15 - this.elapsed * 0.008);
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnTimer = interval;
        const avail = MAX_ENEMIES - this.enemies.length;
        if (avail > 0) {
          const pack = Math.min(avail, Math.min(5, 1 + Math.floor(this.wave / 3)));
          for (let i = 0; i < pack; i++) this.spawnEnemy();
        }
      }
    }

    spawnEnemy(forceType = null, customX = null, customY = null) {
      const cap = forceType === 'mini' ? MAX_ENEMIES + 10 : MAX_ENEMIES;
      if (this.enemies.length >= cap) return;

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
      const s = ENEMY_SPECS[type];
      const hp = s.hpBase * hpScale;
      const e = this._enemyPool.pop() || {};
      e.type = type;
      e.name = '';
      e.x = x;
      e.y = y;
      e.prevX = x;
      e.prevY = y;
      e.vx = 0;
      e.vy = 0;
      e.angle = 0;
      e.radius = s.r;
      e.hp = hp;
      e.maxHp = hp;
      e.speed = s.speedBase + Math.min(240, this.wave * s.speedWave);
      e.color = s.color;
      e.xp = s.xp;
      e.score = s.score;
      e.flash = 0;
      e.hitCd = 0;
      e.beamHitCd = 0;
      e.dashState = 0;
      e.dashTimer = 0;
      e.shootTimer = 0;
      e.isBoss = false;
      e._boltStamp = 0;
      e._idx = this.enemies.length;
      this.enemies.push(e);
      this._gridDirty = true;
    }

    spawnBoss(milestoneLevel = null, bossTier = null) {
      const lvl = milestoneLevel || Math.max(5, Math.ceil(this.player.level / 5) * 5);
      const tier = bossTier || Math.max(1, Math.floor(lvl / 5));
      const titles = ['OMEGA DREADNOUGHT', 'HYPER-LEVIATHAN', 'VOID COLOSSUS', 'SOLAR ANNIHILATOR'];
      const baseTitle = tier <= titles.length ? titles[tier - 1] : `GALACTIC OVERLORD MK-${tier}`;
      const angle = Math.random() * Math.PI * 2;
      const x = clamp(this.player.x + Math.cos(angle) * 560, 140, ARENA_W - 140);
      const y = clamp(this.player.y + Math.sin(angle) * 560, 140, ARENA_H - 140);
      // 3x+ bigger radius (105px vs Tank 29px / Swarmer 15px) & significantly stronger escalating HP
      const hp = Math.round((1800 + tier * 1400 + this.wave * 420) * (1 + (tier - 1) * 0.25));
      const boss = this._enemyPool.pop() || {};
      boss.type = 'boss';
      boss.name = `LVL ${lvl} ${baseTitle}`;
      boss.bossTier = tier;
      boss.x = x;
      boss.y = y;
      boss.prevX = x;
      boss.prevY = y;
      boss.vx = 0;
      boss.vy = 0;
      boss.angle = 0;
      boss.radius = 105;
      boss.hp = hp;
      boss.maxHp = hp;
      boss.speed = Math.min(145, 86 + tier * 6);
      boss.color = '#ff2a6d';
      boss.xp = 65 + tier * 15;
      boss.score = 3500 * tier;
      boss.flash = 0;
      boss.hitCd = 0;
      boss.beamHitCd = 0;
      boss.dashState = 0;
      boss.dashTimer = 0;
      boss.shootTimer = Math.max(1.5, 2.3 - tier * 0.12);
      boss.isBoss = true;
      boss._boltStamp = 0;
      boss._idx = this.enemies.length;
      this.enemies.push(boss);
      this._gridDirty = true;
      window.ChaosAudio.playBossWarning();
      this.shaker.add(0.65);
      this.screenFlash = { alpha: 0.24, color: '#ff2a6d' };
      this._pushShockwave(x, y, 40, 340, '#ff2a6d', 0.95);
      this.pushFloatingText(this.player.x, this.player.y - 58, `⚠ ${boss.name}!`, '#ff2a6d', 2.4, 1.5);
    }

    updateBlackHoles(dt) {
      const head = this._gridHead;
      const next = this._gridNext;
      const gridRef = this._gridRef;
      const enemies = this.enemies;
      for (let i = this.blackHoles.length - 1; i >= 0; i--) {
        const bh = this.blackHoles[i];
        bh.life -= dt;
        if (bh.life <= 0) {
          const impR = bh.implodeR || 170;
          const impDmg = bh.implodeDmg || Math.round((32 + Math.max(1, this.mods.blackHole) * 14) * this.mods.damageMult);
          this._pushShockwave(bh.x, bh.y, 16, impR, '#b829ff', 0.95);
          this._pushShockwave(bh.x, bh.y, 10, impR * 0.72, '#ffd600', 0.75);
          this._pushImpactFlare(bh.x, bh.y, impR * 0.9, '#c084fc', 0.24);
          this.spawnBurst(bh.x, bh.y, '#d8b4fe', 16, 330);
          // Deal real gravitational implosion AoE damage on collapse via tombstone-safe spatial grid
          const impR2 = impR * impR;
          const hits = this._bhHits;
          hits.length = 0;
          const ix0 = Math.max(0, ((bh.x - impR) / CELL_SIZE) | 0);
          const ix1 = Math.min(GRID_COLS - 1, ((bh.x + impR) / CELL_SIZE) | 0);
          const iy0 = Math.max(0, ((bh.y - impR) / CELL_SIZE) | 0);
          const iy1 = Math.min(GRID_ROWS - 1, ((bh.y + impR) / CELL_SIZE) | 0);
          for (let cy = iy0; cy <= iy1; cy++) {
            const rowOff = cy * GRID_COLS;
            for (let cx = ix0; cx <= ix1; cx++) {
              for (let ei = head[rowOff + cx]; ei !== -1; ei = next[ei]) {
                const e = gridRef[ei];
                if (e && e.hp > 0 && e._idx >= 0 && distSq(bh.x, bh.y, e.x, e.y) <= impR2) {
                  hits.push(e);
                }
              }
            }
          }
          swapPop(this.blackHoles, i);
          for (let h = 0; h < hits.length; h++) {
            const target = hits[h];
            if (!target || target.hp <= 0) continue;
            const realIdx = target._idx;
            if (realIdx !== undefined && realIdx >= 0 && enemies[realIdx] === target) {
              this.damageEnemy(realIdx, impDmg, 0, 0, false);
            }
          }
          hits.length = 0;
          continue;
        }
        const pullForce = bh.pullForce || 540;
        const pullR = bh.pullR || 260;
        const pullR2 = pullR * pullR;
        const cx0 = Math.max(0, ((bh.x - pullR) / CELL_SIZE) | 0);
        const cx1 = Math.min(GRID_COLS - 1, ((bh.x + pullR) / CELL_SIZE) | 0);
        const cy0 = Math.max(0, ((bh.y - pullR) / CELL_SIZE) | 0);
        const cy1 = Math.min(GRID_ROWS - 1, ((bh.y + pullR) / CELL_SIZE) | 0);
        for (let cy = cy0; cy <= cy1; cy++) {
          const rowOff = cy * GRID_COLS;
          for (let cx = cx0; cx <= cx1; cx++) {
            for (let ei = head[rowOff + cx]; ei !== -1; ei = next[ei]) {
              const e = gridRef[ei];
              if (!e || e.hp <= 0 || e._idx < 0) continue;
              const dx = bh.x - e.x;
              const dy = bh.y - e.y;
              const d2 = dx * dx + dy * dy;
              if (d2 > 25 && d2 < pullR2) {
                const d = Math.sqrt(d2);
                const pull = (1 - d / pullR) * pullForce;
                e.vx += (dx / d) * pull * dt;
                e.vy += (dy / d) * pull * dt;
              }
            }
          }
        }
      }
    }

    updateEnemies(dt) {
      const p = this.player;
      const allOrbs = this.getAllOrbs();
      const dashBrake = DASH_BRAKE;
      let activeBoss = null;

      for (let i = this.enemies.length - 1; i >= 0; i--) {
        if (i >= this.enemies.length) {
          i = this.enemies.length - 1;
          if (i < 0) break;
        }
        const e = this.enemies[i];
        if (!e) continue;
        if (e.isBoss) activeBoss = e;
        e.flash = Math.max(0, e.flash - dt);
        e.hitCd = Math.max(0, e.hitCd - dt);
        e.beamHitCd = Math.max(0, (e.beamHitCd || 0) - dt);

        const dx = p.x - e.x;
        const dy = p.y - e.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        if (e.type === 'dasher') {
          e.dashTimer -= dt;
          if (e.dashState === 0 && dist < 340 && e.dashTimer <= 0) {
            e.dashState = 1;
            e.dashTimer = 0.45;
            e.aimX = nx;
            e.aimY = ny;
          } else if (e.dashState === 1) {
            e.vx *= dashBrake;
            e.vy *= dashBrake;
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
          e.shootTimer -= dt;
          if (e.shootTimer <= 0) {
            const tier = e.bossTier || 1;
            e.shootTimer = Math.max(1.5, 2.4 - tier * 0.12);
            const salvoSize = Math.min(22, 12 + tier * 2);
            const availBullets = MAX_ENEMY_BULLETS - this.enemyBullets.length;
            const count = Math.min(salvoSize, availBullets);
            const bSpd = Math.min(340, 235 + tier * 16);
            for (let k = 0; k < count; k++) {
              const a = (k / Math.max(1, count)) * Math.PI * 2 + this.elapsed;
              const b = this._bulletPool.pop() || {};
              b.x = e.x + Math.cos(a) * (e.radius * 0.72);
              b.y = e.y + Math.sin(a) * (e.radius * 0.72);
              b.prevX = b.x; b.prevY = b.y;
              b.vx = Math.cos(a) * bSpd; b.vy = Math.sin(a) * bSpd;
              b.radius = 9; b.life = 4.8; b.isBullet = true;
              this.enemyBullets.push(b);
            }
          }
        }

        e.x += e.vx * dt;
        e.y += e.vy * dt;
        e.x = clamp(e.x, e.radius, ARENA_W - e.radius);
        e.y = clamp(e.y, e.radius, ARENA_H - e.radius);

        for (let k = 0; k < allOrbs.length; k++) {
          const orb = allOrbs[k];
          const hitDist = e.radius + orb.radius;
          if (e.hitCd <= 0 && distSq(e.x, e.y, orb.x, orb.y) <= hitDist * hitDist) {
            const orbSpeed = Math.hypot(orb.vx, orb.vy);
            const speedMult = Math.max(0.7, orbSpeed / 260);
            const dmg = Math.round(24 * speedMult * this.mods.damageMult);
            this.damageEnemy(i, dmg, orb.vx, orb.vy, orbSpeed > 650);
            break;
          }
        }
        if (this.enemies[i] !== e) continue;

        if (this.mods.laserTether > 0 && e.beamHitCd <= 0) {
          const beamPad = 6 + this.mods.laserTether * 2.2;
          const beamHitR2 = (e.radius + beamPad) * (e.radius + beamPad);
          for (let k = 0; k < allOrbs.length; k++) {
            const orb = allOrbs[k];
            const d2 = pointToSegmentDistSq(e.x, e.y, p.x, p.y, orb.x, orb.y);
            if (d2 <= beamHitR2) {
              const beamDmg = Math.round((14 + (this.mods.laserTether - 1) * 9) * this.mods.damageMult);
              e.beamHitCd = 0.18;
              this.spawnBurst(e.x, e.y, '#ff2a6d', 4, 220);
              // Pass skipOrbCd=true so Plasma Chain NEVER blocks or conflicts with Orb hits!
              this.damageEnemy(i, beamDmg, 0, 0, false, true);
              break;
            }
          }
        }
        if (this.enemies[i] !== e) continue;

        const pHit = e.radius + p.radius - 3;
        if (p.invuln <= 0 && distSq(e.x, e.y, p.x, p.y) <= pHit * pHit) {
          this.hurtPlayer(e);
        }
      }

      this._activeBoss = activeBoss;
    }

    damageEnemy(index, dmg, impulseX, impulseY, isSupersonic, skipOrbCd = false) {
      const e = this.enemies[index];
      if (!e) return;

      e.hp -= dmg;
      e.flash = 0.12;
      if (!skipOrbCd) e.hitCd = 0.12;

      const kb = e.isBoss ? 0.12 : e.type === 'tank' ? 0.35 : 0.85;
      e.vx += impulseX * kb;
      e.vy += impulseY * kb;

      const intensity = clamp(dmg / 45, 0.4, 1.4);
      this.shaker.add(intensity * (isSupersonic ? 0.36 : 0.16));

      this.comboTimer = 2.6;
      if (++this._vfxThisStep <= 18) {
        window.ChaosAudio.playHit(intensity, this.combo, isSupersonic);
        const impLen = Math.hypot(impulseX, impulseY);
        if (impLen > 40) {
          this.spawnDirectionalBurst(e.x, e.y, impulseX / impLen, impulseY / impLen, isSupersonic ? '#ff2a6d' : '#ffd600', isSupersonic ? 16 : 9, isSupersonic ? 420 : 300, 0, 0.72);
          this.spawnDirectionalBurst(e.x, e.y, impulseX / impLen, impulseY / impLen, '#ffffff', isSupersonic ? 6 : 3, isSupersonic ? 340 : 240, 1, 0.9);
        } else {
          this.spawnBurst(e.x, e.y, isSupersonic ? '#ff2a6d' : '#ffd600', isSupersonic ? 14 : 8, 290);
        }
        if (isSupersonic) {
          this._pushImpactFlare(e.x, e.y, 88 + e.radius * 1.4, '#ffd600', 0.17);
          this._pushShockwave(e.x, e.y, e.radius * 0.4, e.radius * 2.8, '#ffd600', 0.78);
        } else {
          this._pushImpactFlare(e.x, e.y, 48 + e.radius, '#ffffff', 0.11);
        }
        const kickX = impLen > 40 ? (impulseX / impLen) * (isSupersonic ? 72 : 42) : (Math.random() - 0.5) * 34;
        this.pushFloatingText(
          e.x + (Math.random() - 0.5) * 18,
          e.y - e.radius,
          `${dmg}${isSupersonic ? '!' : ''}`,
          isSupersonic ? '#ffd600' : '#eef6ff',
          isSupersonic ? 0.78 : 0.65,
          isSupersonic ? 1.28 : 0.96,
          kickX,
          isSupersonic ? -76 : -54
        );
      }

      if (this.mods.lightning > 0 && isSupersonic) {
        const arcScale = Math.min(0.95, 0.48 + this.mods.lightning * 0.09);
        const arcRange = 230 + this.mods.lightning * 30;
        this.triggerLightning(e, 2 + this.mods.lightning, Math.round(dmg * arcScale), arcRange);
      }

      if (e.hp <= 0) {
        const curIdx = e._idx;
        if (curIdx !== undefined && curIdx >= 0 && this.enemies[curIdx] === e) {
          this.killEnemy(curIdx, isSupersonic);
        }
      }
    }

    triggerLightning(source, chains, dmg, range = 260) {
      let curr = source;
      const stamp = ++this._lightningStamp;
      source._boltStamp = stamp;
      const head = this._gridHead;
      const next = this._gridNext;
      const gridRef = this._gridRef;
      const enemies = this.enemies;
      const range2 = range * range;
      for (let c = 0; c < chains; c++) {
        let best = null;
        let bestD2 = range2;
        const cx0 = Math.max(0, ((curr.x - range) / CELL_SIZE) | 0);
        const cx1 = Math.min(GRID_COLS - 1, ((curr.x + range) / CELL_SIZE) | 0);
        const cy0 = Math.max(0, ((curr.y - range) / CELL_SIZE) | 0);
        const cy1 = Math.min(GRID_ROWS - 1, ((curr.y + range) / CELL_SIZE) | 0);
        for (let cy = cy0; cy <= cy1; cy++) {
          const rowOff = cy * GRID_COLS;
          for (let cx = cx0; cx <= cx1; cx++) {
            for (let ei = head[rowOff + cx]; ei !== -1; ei = next[ei]) {
              const other = gridRef[ei];
              if (!other || other._boltStamp === stamp || other.hp <= 0 || other._idx < 0) continue;
              const d2 = distSq(curr.x, curr.y, other.x, other.y);
              if (d2 < bestD2) { bestD2 = d2; best = other; }
            }
          }
        }
        if (!best) break;
        best._boltStamp = stamp;
        if (this.lightnings.length < MAX_LIGHTNINGS) {
          const bolt = this._lightningPool.pop() || {};
          bolt.x1 = curr.x; bolt.y1 = curr.y; bolt.x2 = best.x; bolt.y2 = best.y; bolt.life = 0.16;
          this.lightnings.push(bolt);
        }
        this.spawnBurst(best.x, best.y, '#38bdf8', 5, 230);
        this._pushShockwave(best.x, best.y, 8, 42, '#38bdf8', 0.65);
        best.hp -= dmg;
        best.flash = 0.1;
        if (best.hp <= 0) {
          const idx = best._idx;
          if (idx !== undefined && idx >= 0 && enemies[idx] === best) {
            this.killEnemy(idx, false);
          }
        }
        curr = best;
      }
    }

    killEnemy(index, isSupersonic) {
      const e = this._swapPopEnemy(index);
      if (!e) return;
      const ex = e.x;
      const ey = e.y;
      const eRadius = e.radius;
      const eColor = e.color;
      const eType = e.type;
      const eXp = e.xp;
      const eIsBoss = e.isBoss;
      const eScore = e.score;
      const isBig = eIsBoss || eType === 'tank';
      window.ChaosAudio.playExplosion(isBig, isSupersonic);

      this.kills += 1;
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.comboTimer = 2.8;
      const pts = eScore * Math.min(25, 1 + Math.floor(this.combo / 4));
      this.score += pts;
      this.comboScore += pts;
      this._scorePopTimer = 0.14;
      this._sideBumpTimer = 0.12;
      this._pushComboFeed(pts, e, isSupersonic);

      // Arcing pop-in score reward number
      const scoreColor = eIsBoss ? '#ffd600' : (isSupersonic || this.combo >= 10 ? '#ffd600' : '#7ceeff');
      this.pushFloatingText(
        ex + (Math.random() - 0.5) * 14,
        ey - eRadius - 10,
        `+${pts}`,
        scoreColor,
        eIsBoss ? 1.15 : 0.82,
        eIsBoss ? 1.4 : (isSupersonic ? 1.08 : 0.9),
        (Math.random() - 0.5) * 64,
        eIsBoss ? -95 : -68
      );

      if (this.overdriveTimer <= 0) {
        this.overdrive = Math.min(100, this.overdrive + 4.5 * this.mods.odGainMult);
      }

      if (this.mods.vampiric > 0) {
        this.vampiricKillCounter += 1;
        const threshold = Math.max(6, 18 - this.mods.vampiric * 3);
        if (this.vampiricKillCounter >= threshold) {
          this.vampiricKillCounter = 0;
          if (this.player.hp < this.player.maxHp) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
            this._pushShockwave(this.player.x, this.player.y, 14, 125, '#05ffa1', 0.92);
            this.spawnBurst(this.player.x, this.player.y, '#05ffa1', 14, 240);
            this.pushFloatingText(this.player.x, this.player.y - 36, '+20 HULL', '#05ffa1', 1.15, 1.15);
          } else if (this.overdriveTimer <= 0 && this.overdrive < 100) {
            const novaGain = 10 + this.mods.vampiric * 4;
            this.overdrive = Math.min(100, this.overdrive + novaGain);
            this._pushShockwave(this.player.x, this.player.y, 14, 110, '#ffd600', 0.85);
            this.pushFloatingText(this.player.x, this.player.y - 36, `+${novaGain}% NOVA`, '#ffd600', 1.0, 1.08);
          }
        }
      }

      // Multi-layered enemy ship blast detonation: core flare + shockwave rings + metallic hull debris + plasma sparks!
      this._pushShockwave(ex, ey, eRadius * 0.45, eIsBoss ? 270 : eRadius * 3.8, eColor, 0.95);
      if (isBig || isSupersonic) {
        this._pushShockwave(ex, ey, eRadius * 0.8, eIsBoss ? 360 : eRadius * 5.2, isSupersonic ? '#ffd600' : '#ffffff', 0.78);
      }
      this._pushImpactFlare(ex, ey, eIsBoss ? 260 : (isSupersonic ? 132 : 92), isSupersonic ? '#ffd600' : eColor, eIsBoss ? 0.34 : 0.22);
      this.spawnBurst(ex, ey, eColor, eIsBoss ? 44 : 18, eIsBoss ? 480 : 340, 0);
      this.spawnBurst(ex, ey, eIsBoss ? '#ffd600' : '#eef6ff', eIsBoss ? 18 : 7, eIsBoss ? 360 : 250, 1);

      if (eIsBoss) this.screenFlash = { alpha: 0.35, color: '#ff2a6d' };

      if (eType === 'splitter') {
        this.spawnEnemy('mini', ex - 14, ey);
        this.spawnEnemy('mini', ex + 14, ey);
      } else if (eType === 'bomber') {
        this._pushShockwave(ex, ey, 15, 135, '#05ffa1', 0.95);
        // Tombstone-safe spatial-grid bomber blast (ZERO mid-cascade grid rebuilds!)
        const hits = [];
        const head = this._gridHead;
        const next = this._gridNext;
        const gridRef = this._gridRef;
        const enemies = this.enemies;
        const cx0 = Math.max(0, ((ex - 135) / CELL_SIZE) | 0);
        const cx1 = Math.min(GRID_COLS - 1, ((ex + 135) / CELL_SIZE) | 0);
        const cy0 = Math.max(0, ((ey - 135) / CELL_SIZE) | 0);
        const cy1 = Math.min(GRID_ROWS - 1, ((ey + 135) / CELL_SIZE) | 0);
        for (let cy = cy0; cy <= cy1; cy++) {
          const rowOff = cy * GRID_COLS;
          for (let cx = cx0; cx <= cx1; cx++) {
            for (let ei = head[rowOff + cx]; ei !== -1; ei = next[ei]) {
              const other = gridRef[ei];
              if (other && other !== e && other.hp > 0 && other._idx >= 0 && distSq(ex, ey, other.x, other.y) <= 135 * 135) {
                hits.push(other);
              }
            }
          }
        }
        for (let h = 0; h < hits.length; h++) {
          const other = hits[h];
          if (other.hp <= 0) continue;
          const realIdx = other._idx;
          if (realIdx !== undefined && realIdx >= 0 && enemies[realIdx] === other) {
            this.damageEnemy(realIdx, 38, 0, 0, false);
          }
        }
      }

      if (this.mods.blackHole > 0 && isSupersonic) {
        const bhLvl = this.mods.blackHole;
        const bhChance = Math.min(0.85, 0.25 + bhLvl * 0.12);
        if (Math.random() < bhChance) {
          const bhLife = 2.6 + bhLvl * 0.55;
          const pullForce = 540 + (bhLvl - 1) * 95;
          const pullR = 230 + bhLvl * 22;
          const implodeR = 155 + bhLvl * 15;
          const implodeDmg = Math.round((32 + bhLvl * 14) * this.mods.damageMult);

          // Edge case: if spawning near an existing Singularity, refresh & supercharge it instead of overlapping
          let merged = false;
          for (let b = 0; b < this.blackHoles.length; b++) {
            const existing = this.blackHoles[b];
            if (distSq(existing.x, existing.y, ex, ey) <= 110 * 110) {
              existing.life = Math.max(existing.life, bhLife);
              existing.maxLife = Math.max(existing.maxLife, bhLife);
              existing.pullForce = Math.max(existing.pullForce, pullForce);
              existing.pullR = Math.max(existing.pullR || 260, pullR);
              existing.implodeDmg = Math.round((existing.implodeDmg || implodeDmg) * 1.15);
              this._pushShockwave(existing.x, existing.y, 14, 130, '#f0abfc', 0.92);
              merged = true;
              break;
            }
          }
          if (!merged) {
            if (this.blackHoles.length >= MAX_BLACK_HOLES) {
              const oldest = this.blackHoles.shift();
              if (oldest) {
                this._pushShockwave(oldest.x, oldest.y, 14, 120, '#b829ff', 0.8);
                this.spawnBurst(oldest.x, oldest.y, '#d8b4fe', 8, 220);
              }
            }
            this.blackHoles.push({ x: ex, y: ey, life: bhLife, maxLife: bhLife, pullForce, pullR, implodeR, implodeDmg });
            this._pushShockwave(ex, ey, 12, 115, '#b829ff', 0.9);
          }
        }
      }

      if (this.mods.shrapnel > 0) {
        const shLvl = this.mods.shrapnel;
        const count = Math.min(2 + shLvl * 2, Math.max(0, MAX_PROJECTILES - this.projectiles.length));
        const shardDmg = Math.round((16 + shLvl * 5) * this.mods.damageMult);
        const boltSpeed = 440 + shLvl * 35;
        for (let s = 0; s < count; s++) {
          const a = (s / count) * Math.PI * 2 + Math.random() * 0.4;
          const pr = this._projPool.pop() || {};
          pr.x = ex; pr.y = ey; pr.prevX = ex; pr.prevY = ey;
          pr.vx = Math.cos(a) * boltSpeed; pr.vy = Math.sin(a) * boltSpeed;
          pr.life = 1.25 + shLvl * 0.08; pr.dmg = shardDmg;
          pr.target = null; pr.retargetCd = (s % 4) * 0.03;
          this.projectiles.push(pr);
        }
      }

      const gemCount = eIsBoss ? 16 : Math.max(2, Math.round(eXp / 2));
      const baseAngle = Math.random() * Math.PI * 2;
      const gemVal = eIsBoss ? 3 : Math.max(1, Math.round(eXp / gemCount));
      for (let g = 0; g < gemCount; g++) {
        if (this.gems.length >= MAX_GEMS) {
          // Consolidate XP into an existing gem so ZERO XP is ever lost while keeping gem count permanently bounded
          const target = this.gems[(g * 17) % this.gems.length];
          target.val += gemVal;
          continue;
        }
        const gm = this._gemPool.pop() || {};
        const a = baseAngle + (g / gemCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.42;
        const scatterSp = (eIsBoss ? 240 : 185) + Math.random() * (eIsBoss ? 210 : 170);
        const gx = ex + Math.cos(a) * (8 + Math.random() * 10);
        const gy = ey + Math.sin(a) * (8 + Math.random() * 10);
        gm.x = gx; gm.y = gy; gm.prevX = gx; gm.prevY = gy;
        gm.vx = Math.cos(a) * scatterSp;
        gm.vy = Math.sin(a) * scatterSp;
        gm.val = gemVal;
        this.gems.push(gm);
      }
      // Radiant scatter glitter sparks accompanying XP/points shard fountain
      this.spawnBurst(ex, ey, '#00f0ff', eIsBoss ? 16 : 6, eIsBoss ? 340 : 240, 0);

      // Recycle enemy object ONLY AFTER all death effects & splitter spawns finish (prevents pool aliasing!)
      if (this._enemyPool.length < 256) this._enemyPool.push(e);
    }

    getEnemyDamage(source) {
      // Base 20 hull dmg on Wave 1, increasing +8% after every single wave
      const waveMult = 1 + Math.max(0, this.wave - 1) * 0.08;
      let mult = 1.0;
      if (source && source.isBoss) mult = 1.5;
      else if (source && source.isBullet) mult = 0.85;
      else if (source && source.type === 'tank') mult = 1.15;
      return Math.max(1, Math.round(20 * waveMult * mult));
    }

    hurtPlayer(source) {
      const p = this.player;
      const dmg = this.getEnemyDamage(source);
      p.hp = Math.max(0, p.hp - dmg);
      p.invuln = 1.1;
      this.combo = 1;
      this.comboTimer = 0;
      this.comboScore = 0;
      this.shaker.add(source && source.isBoss ? 0.78 : 0.6);
      this.screenFlash = { alpha: 0.38, color: '#ff2a6d' };
      window.ChaosAudio.playPlayerHurt();
      this.spawnBurst(p.x, p.y, '#ff2a6d', 24, 360);
      this.pushFloatingText(p.x, p.y - 34, `-${dmg} HULL`, '#ff2a6d', 1.05, 1.38);

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
      const head = this._gridHead;
      const next = this._gridNext;
      const gridRef = this._gridRef;
      const enemies = this.enemies;
      const lockR = 240 + this.mods.shrapnel * 24;
      const lockR2 = lockR * lockR;

      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const pr = this.projectiles[i];
        pr.life -= dt;
        if (pr.life <= 0) {
          pr.target = null;
          if (this._projPool.length < 160) this._projPool.push(pr);
          swapPop(this.projectiles, i);
          continue;
        }

        // Cached homing target with staggered 0.12s re-acquisition (tombstone-safe, ZERO mid-loop grid rebuilds!)
        pr.retargetCd = (pr.retargetCd || 0) - dt;
        let nearest = pr.target;
        let bestD2 = lockR2;
        if (nearest && nearest.hp > 0 && nearest._idx >= 0 && enemies[nearest._idx] === nearest) {
          const td2 = distSq(pr.x, pr.y, nearest.x, nearest.y);
          if (td2 < lockR2 * 1.44) {
            bestD2 = td2;
          } else {
            nearest = null;
            pr.target = null;
          }
        } else {
          nearest = null;
          pr.target = null;
        }

        if (!nearest || pr.retargetCd <= 0) {
          pr.retargetCd = 0.12;
          const cx0 = Math.max(0, ((pr.x - lockR) / CELL_SIZE) | 0);
          const cx1 = Math.min(GRID_COLS - 1, ((pr.x + lockR) / CELL_SIZE) | 0);
          const cy0 = Math.max(0, ((pr.y - lockR) / CELL_SIZE) | 0);
          const cy1 = Math.min(GRID_ROWS - 1, ((pr.y + lockR) / CELL_SIZE) | 0);
          bestD2 = lockR2;
          nearest = null;
          for (let cy = cy0; cy <= cy1; cy++) {
            const rowOff = cy * GRID_COLS;
            for (let cx = cx0; cx <= cx1; cx++) {
              for (let ei = head[rowOff + cx]; ei !== -1; ei = next[ei]) {
                const e = gridRef[ei];
                if (!e || e.hp <= 0 || e._idx < 0) continue;
                const d2 = distSq(pr.x, pr.y, e.x, e.y);
                if (d2 < bestD2) { bestD2 = d2; nearest = e; }
              }
            }
          }
          pr.target = nearest;
        }

        if (nearest) {
          const dx = nearest.x - pr.x;
          const dy = nearest.y - pr.y;
          const d = Math.sqrt(bestD2) || 1;
          pr.vx += (dx / d) * 1150 * dt;
          pr.vy += (dy / d) * 1150 * dt;
        }
        pr.x += pr.vx * dt;
        pr.y += pr.vy * dt;

        // Tombstone-safe spatial grid impact check (120px margin covers colossal r=105 Milestone Bosses!)
        const hcx0 = Math.max(0, ((pr.x - 120) / CELL_SIZE) | 0);
        const hcx1 = Math.min(GRID_COLS - 1, ((pr.x + 120) / CELL_SIZE) | 0);
        const hcy0 = Math.max(0, ((pr.y - 120) / CELL_SIZE) | 0);
        const hcy1 = Math.min(GRID_ROWS - 1, ((pr.y + 120) / CELL_SIZE) | 0);
        let hit = false;
        for (let cy = hcy0; cy <= hcy1 && !hit; cy++) {
          const rowOff = cy * GRID_COLS;
          for (let cx = hcx0; cx <= hcx1 && !hit; cx++) {
            for (let ei = head[rowOff + cx]; ei !== -1; ei = next[ei]) {
              const e = gridRef[ei];
              if (!e || e.hp <= 0 || e._idx < 0) continue;
              const hitR = e.radius + 6;
              if (distSq(pr.x, pr.y, e.x, e.y) <= hitR * hitR) {
                const realIdx = e._idx;
                if (realIdx >= 0 && enemies[realIdx] === e) {
                  this.damageEnemy(realIdx, Math.round(pr.dmg), pr.vx * 0.2, pr.vy * 0.2, false);
                  pr.target = null;
                  if (this._projPool.length < 160) this._projPool.push(pr);
                  swapPop(this.projectiles, i);
                  hit = true;
                  break;
                }
              }
            }
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
          if (this._bulletPool.length < 160) this._bulletPool.push(b);
          swapPop(this.enemyBullets, i);
          continue;
        }
        if (p.invuln <= 0 && distSq(b.x, b.y, p.x, p.y) <= (p.radius + b.radius) * (p.radius + b.radius)) {
          if (this._bulletPool.length < 160) this._bulletPool.push(b);
          swapPop(this.enemyBullets, i);
          this.hurtPlayer(b);
        }
      }
    }

    updateGems(dt) {
      const p = this.player;
      const magnetR2 = 215 * 215;
      const drag = GEM_DRAG;
      for (let i = this.gems.length - 1; i >= 0; i--) {
        const g = this.gems[i];
        g.vx *= drag;
        g.vy *= drag;

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
          if (this._gemPool.length < 320) this._gemPool.push(g);
          swapPop(this.gems, i);
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

    spawnBurst(x, y, color, count, speed, kind = 0) {
      const avail = Math.max(0, MAX_PARTICLES - this.particles.length);
      const n = Math.min(count, avail);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = (0.3 + Math.random() * 0.7) * speed;
        const pt = this._particlePool.pop() || {};
        pt.x = x;
        pt.y = y;
        pt.vx = Math.cos(a) * sp;
        pt.vy = Math.sin(a) * sp;
        pt.rot = Math.random() * Math.PI * 2;
        pt.vrot = (Math.random() - 0.5) * (kind === 1 ? 18 : 14);
        pt.life = (kind === 1 ? 0.34 : 0.25) + Math.random() * 0.35;
        pt.maxLife = kind === 1 ? 0.69 : 0.6;
        pt.size = (kind === 1 ? 3.2 : 3.0) + Math.random() * 4.5;
        pt.color = color;
        pt.kind = kind;
        this.particles.push(pt);
      }
    }

    spawnDirectionalBurst(x, y, dirX, dirY, color, count, speed, kind = 0, spread = 0.72) {
      const avail = Math.max(0, MAX_PARTICLES - this.particles.length);
      const n = Math.min(count, avail);
      const baseAngle = Math.atan2(dirY, dirX);
      for (let i = 0; i < n; i++) {
        const a = baseAngle + (Math.random() - 0.5) * 2 * spread;
        const sp = (0.38 + Math.random() * 0.72) * speed;
        const pt = this._particlePool.pop() || {};
        pt.x = x;
        pt.y = y;
        pt.vx = Math.cos(a) * sp;
        pt.vy = Math.sin(a) * sp;
        pt.rot = Math.random() * Math.PI * 2;
        pt.vrot = (Math.random() - 0.5) * (kind === 1 ? 20 : 12);
        pt.life = (kind === 1 ? 0.32 : 0.22) + Math.random() * 0.3;
        pt.maxLife = kind === 1 ? 0.62 : 0.52;
        pt.size = (kind === 1 ? 3.2 : 2.8) + Math.random() * 4.0;
        pt.color = color;
        pt.kind = kind;
        this.particles.push(pt);
      }
    }

    updateParticles(dt) {
      const pDrag = PARTICLE_DRAG;
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const pt = this.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) {
          if (this._particlePool.length < MAX_PARTICLES) this._particlePool.push(pt);
          swapPop(this.particles, i);
          continue;
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.rot += pt.vrot * dt;
        pt.vx *= pDrag;
        pt.vy *= pDrag;
      }

      for (let i = this.shockwaves.length - 1; i >= 0; i--) {
        const sw = this.shockwaves[i];
        sw.r += (sw.maxR - sw.r) * 10 * dt + 95 * dt;
        sw.alpha -= 2.4 * dt;
        if (sw.alpha <= 0) {
          if (this._swPool.length < 96) this._swPool.push(sw);
          swapPop(this.shockwaves, i);
        }
      }

      for (let i = this.impactFlares.length - 1; i >= 0; i--) {
        const fl = this.impactFlares[i];
        fl.life -= dt;
        fl.rot += 1.6 * dt;
        if (fl.life <= 0) {
          if (this._flarePool.length < 64) this._flarePool.push(fl);
          swapPop(this.impactFlares, i);
        }
      }

      for (let i = this.lightnings.length - 1; i >= 0; i--) {
        const l = this.lightnings[i];
        l.life -= dt;
        if (l.life <= 0) {
          if (this._lightningPool.length < 64) this._lightningPool.push(l);
          swapPop(this.lightnings, i);
        }
      }

      const ftDrag = FT_DRAG;
      for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
        const ft = this.floatingTexts[i];
        ft.life -= dt;
        ft.x += (ft.vx || 0) * dt;
        ft.y += (ft.vy !== undefined ? ft.vy : -38) * dt;
        if (ft.vx) ft.vx *= ftDrag;
        if (ft.vy !== undefined) ft.vy = ft.vy * ftDrag - 16 * dt;
        if (ft.life <= 0) {
          if (this._ftPool.length < 96) this._ftPool.push(ft);
          swapPop(this.floatingTexts, i);
        }
      }
    }

    updateHud() {
      const p = this.player;
      const c = this._hudCache;

      const cellCount = Math.max(5, Math.round(p.maxHp / 20));
      if (c.maxHpCells !== cellCount) {
        hpCellsEl.innerHTML = '';
        for (let i = 0; i < cellCount; i++) {
          const cell = document.createElement('div');
          cell.className = 'hp-cell';
          hpCellsEl.appendChild(cell);
        }
        c.maxHpCells = cellCount;
        c.hp = -1;
      }

      const hpInt = Math.ceil(p.hp);
      if (c.hp !== hpInt || c.maxHpVal !== p.maxHp) {
        const activeCells = hpInt > 0 ? Math.max(1, Math.ceil((hpInt / p.maxHp) * cellCount)) : 0;
        const children = hpCellsEl.children;
        for (let i = 0; i < children.length; i++) {
          children[i].classList.toggle('active', i < activeCells);
        }
        setText(hpText, `${hpInt}/${p.maxHp}`);
        c.hp = hpInt;
        c.maxHpVal = p.maxHp;
      }

      if (c.level !== p.level) {
        setText(lvlText, p.level);
        c.level = p.level;
      }

      const odActive = this.overdriveTimer > 0;
      if (c.odActive !== odActive) {
        odBar.classList.toggle('active', odActive);
        c.odActive = odActive;
      }

      const isOdReady = this.overdrive >= 100 && this.overdriveTimer <= 0;
      if (c.isOdReady !== isOdReady) {
        odReady.classList.toggle('hidden', !isOdReady);
        if (touchNovaBtn) touchNovaBtn.classList.toggle('hidden', !isOdReady);
        c.isOdReady = isOdReady;
      }

      // Throttle high-frequency cosmetic HUD text/bar writes to ~20 Hz (zero visible latency, ~70% fewer DOM layouts/recalcs)
      const nowHud = this.elapsed;
      const cosmeticTick = c.lastCosmeticTime === undefined || nowHud - c.lastCosmeticTime >= 0.05 || nowHud < c.lastCosmeticTime;
      if (!cosmeticTick) return;
      c.lastCosmeticTime = nowHud;

      const xpRatio = clamp(p.xp / p.xpToNext, 0, 1).toFixed(3);
      if (c.xpPct !== xpRatio) {
        xpBar.style.transform = `scaleX(${xpRatio})`;
        c.xpPct = xpRatio;
      }

      const odRatio = clamp(this.overdriveTimer > 0 ? this.overdriveTimer / OVERDRIVE_DURATION : this.overdrive / 100, 0, 1).toFixed(3);
      if (c.odPct !== odRatio) {
        odBar.style.transform = `scaleX(${odRatio})`;
        c.odPct = odRatio;
      }

      if (dashBar) {
        const dashRatio = clamp(1 - p.dashCd / (p.dashCdMax || DASH_BASE_CD), 0, 1).toFixed(3);
        if (c.dashPct !== dashRatio) {
          dashBar.style.transform = `scaleX(${dashRatio})`;
          c.dashPct = dashRatio;
        }
      }

      if (buffBar) {
        let buffSig = '';
        for (let i = 0; i < UPGRADES.length; i++) {
          const lvl = this.upgradeLevels[UPGRADES[i].id] || 0;
          if (lvl > 0) buffSig += `${UPGRADES[i].id}:${lvl}|`;
        }
        if (c.buffSig !== buffSig) {
          c.buffSig = buffSig;
          buffBar.innerHTML = '';
          for (let i = 0; i < UPGRADES.length; i++) {
            const upg = UPGRADES[i];
            const lvl = this.upgradeLevels[upg.id] || 0;
            if (lvl <= 0) continue;
            const chip = document.createElement('div');
            chip.className = 'buff-chip';
            chip.style.setProperty('--buff-color', upg.color);
            chip.title = `${upg.title} (LVL ${lvl}/${upg.maxStacks})`;
            chip.innerHTML = `${getPowerupIconHtml(upg)}${lvl > 1 ? `<span class="buff-stack">×${lvl}</span>` : ''}`;
            buffBar.appendChild(chip);
          }
        }
      }

      if (c.score !== this.score) {
        setText(scoreText, this.score < 100000 ? String(this.score).padStart(6, '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',') : formatCommas(this.score));
        c.score = this.score;
      }

      const scorePop = this._scorePopTimer > 0 && this.combo >= 2;
      if (c.scorePop !== scorePop) {
        scoreText.classList.toggle('score-pop', scorePop);
        c.scorePop = scorePop;
      }

      if (c.combo !== this.combo) {
        setText(comboText, `x${this.combo}`);
        comboText.style.transform = `scale(${Math.min(1.45, 1 + this.combo * 0.015).toFixed(3)})`;
        c.combo = this.combo;
      }

      if (sideComboCard) {
        const showSide = this.combo >= 2;
        if (c.showSideCombo !== showSide) {
          sideComboCard.classList.toggle('is-idle', !showSide);
          c.showSideCombo = showSide;
        }
        if (showSide) {
          const tier = this._getComboTier(this.combo);
          if (c.sideTier !== tier.cls) {
            sideComboCard.classList.remove('tier-cyan', 'tier-gold', 'tier-magenta', 'tier-cosmic');
            sideComboCard.classList.add(tier.cls);
            setText(sideComboRank, tier.rank);
            c.sideTier = tier.cls;
          }
          if (c.sideMult !== this.combo) {
            setText(sideComboMult, `x${this.combo}`);
            c.sideMult = this.combo;
          }
          if (c.sideBonus !== this.comboScore) {
            setText(sideComboBonus, `+${formatCommas(this.comboScore)}`);
            c.sideBonus = this.comboScore;
          }
          const sideBump = this._sideBumpTimer > 0;
          if (c.sideBump !== sideBump) {
            sideComboCard.classList.toggle('bump', sideBump);
            c.sideBump = sideBump;
          }
          if (sideComboTimerBar) {
            const ratio = clamp(this.comboTimer / 2.8, 0, 1).toFixed(2);
            if (c.sideTimerPct !== ratio) {
              sideComboTimerBar.style.transform = `scaleX(${ratio})`;
              c.sideTimerPct = ratio;
            }
          }
        }
      }

      if (comboFeedList && this._comboFeedDirty) {
        this._comboFeedDirty = false;
        const slots = this._comboFeedSlots;
        for (let i = 0; i < slots.length; i++) {
          const s = slots[i];
          const item = this._comboFeed[i];
          if (item) {
            if (s.lastAccent !== item.accent) {
              s.el.style.borderRightColor = item.accent;
              s.lastAccent = item.accent;
            }
            const ptsStr = `+${formatCommas(item.pts)}`;
            if (s.lastPts !== ptsStr) {
              setText(s.ptsEl, ptsStr);
              s.lastPts = ptsStr;
            }
            if (s.lastTag !== item.tag) {
              setText(s.tagEl, item.tag);
              s.lastTag = item.tag;
            }
            if (s.empty) {
              s.el.classList.remove('is-empty');
              s.empty = false;
            }
          } else if (!s.empty) {
            s.el.classList.add('is-empty');
            s.empty = true;
          }
        }
      }

      const elapsedSec = Math.floor(this.elapsed);
      if (c.elapsedSec !== elapsedSec) {
        setText(timeText, formatTime(elapsedSec));
        c.elapsedSec = elapsedSec;
      }

      if (c.wave !== this.wave) {
        setText(waveText, String(this.wave).padStart(2, '0'));
        c.wave = this.wave;
      }

      if (this.elapsed > 8 && !c.hintFaded) {
        controlsHint.classList.add('faded');
        c.hintFaded = true;
      }

      const activeBoss = this._activeBoss;
      if (activeBoss && activeBoss.hp > 0) {
        if (!c.bossActive) {
          bossHud.classList.remove('hidden');
          c.bossActive = true;
        }
        if (c.bossName !== activeBoss.name) {
          setText(bossNameEl, activeBoss.name);
          c.bossName = activeBoss.name;
        }
        const ratio = clamp(activeBoss.hp / activeBoss.maxHp, 0, 1).toFixed(3);
        if (c.bossPct !== ratio) {
          bossBar.style.transform = `scaleX(${ratio})`;
          c.bossPct = ratio;
        }
      } else if (c.bossActive !== false) {
        bossHud.classList.add('hidden');
        c.bossActive = false;
      }
    }

    render(alpha = 1) {
      this.renderer.render(this, alpha);
    }

    // Legacy draw hooks retained as no-ops for backward-compatible method instrumentation
    drawGrid() {}
    drawArenaBounds() {}
    drawBlackHoles() {}
    drawGems() {}
    drawShockwaves() {}
    drawTethersAndOrbs() {}
    drawPlayer() {}
    drawEnemies() {}
    drawProjectiles() {}
    drawLightnings() {}
    drawParticles() {}
    drawFloatingTexts() {}
  }

  window.addEventListener('DOMContentLoaded', () => {
    new ChaosGame();
  });
})();
