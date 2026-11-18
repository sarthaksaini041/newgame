/*
 * CHAOS TETHER — Procedural Web Audio engine.
 * Routing:  voices -> sfxBus ─┐
 *           ambient -> musicBus ┼-> master -> compressor/limiter -> analyser -> destination
 * Includes per-sound throttling + a voice cap so swarms never clip or stutter.
 */
(() => {
  const PENTATONIC_HZ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const MAX_VOICES = 28;

  // Minimum seconds between two triggers of the same sound
  const THROTTLE = {
    hit: 0.035,
    xp: 0.03,
    dash: 0.06,
    catapult: 0.08,
    hurt: 0.15,
    overdrive: 0.3,
    levelup: 0.3,
    gameover: 0.5,
    boss: 0.5,
    explosion: 0.05,
  };

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.noiseBuffer = null;
      this.lastPlayed = {};
      this.activeVoices = 0;
      this.ambient = null;
      this.masterVolume = 0.85;
      this.musicVolume = 0.32;
      this.sfxVolume = 0.9;
      this._bindLifecycle();
    }

    // ---------- Context & routing ----------
    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx({ latencyHint: 'interactive' });

        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : this.masterVolume;

        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -14;
        this.compressor.knee.value = 10;
        this.compressor.ratio.value = 8;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.18;

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 1024;

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = this.sfxVolume;
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = this.musicVolume;

        this.sfxBus.connect(this.master);
        this.musicBus.connect(this.master);
        this.master.connect(this.compressor);
        this.compressor.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        this.noiseBuffer = this._createNoiseBuffer(1.0);
      }
      if (this.ctx.state === 'suspended' && !document.hidden) {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    _bindLifecycle() {
      // Unlock audio on the very first user gesture anywhere on the page
      const unlock = () => {
        this.ensureContext();
        window.removeEventListener('pointerdown', unlock, true);
        window.removeEventListener('keydown', unlock, true);
      };
      window.addEventListener('pointerdown', unlock, true);
      window.addEventListener('keydown', unlock, true);

      // Pause audio while the tab is hidden, resume when visible again
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) this.ctx.suspend().catch(() => {});
        else this.ctx.resume().catch(() => {});
      });
    }

    _createNoiseBuffer(durationSec) {
      const len = Math.floor(this.ctx.sampleRate * durationSec);
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      return buffer;
    }

    // Returns the context if the sound is allowed to play right now
    _voice(name, cost = 1) {
      if (this.muted) return null;
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return null;
      const now = ctx.currentTime;
      const gap = THROTTLE[name] || 0;
      if (this.lastPlayed[name] !== undefined && now - this.lastPlayed[name] < gap) return null;
      if (this.activeVoices + cost > MAX_VOICES) return null;
      this.lastPlayed[name] = now;
      return ctx;
    }

    _track(node, cost, stopAt) {
      this.activeVoices += cost;
      node.onended = () => { this.activeVoices = Math.max(0, this.activeVoices - cost); };
      node.stop(stopAt);
    }

    _osc(type, freqStart, freqEnd, t0, dur, vol, rampType = 'exp', dest = this.sfxBus) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, t0);
      if (freqEnd && freqEnd !== freqStart) {
        if (rampType === 'exp') osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
        else osc.frequency.linearRampToValueAtTime(freqEnd, t0 + dur);
      }
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(t0);
      this._track(osc, 1, t0 + dur + 0.02);
      return osc;
    }

    _noise(t0, dur, vol, filterType, fStart, fEnd, q = 0.8) {
      const ctx = this.ctx;
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.Q.value = q;
      filter.frequency.setValueAtTime(fStart, t0);
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), t0 + dur);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxBus);
      src.start(t0, Math.random() * 0.5);
      this._track(src, 1, t0 + dur + 0.02);
    }

    // ---------- Mute / volume ----------
    setMuted(muted) {
      this.muted = Boolean(muted);
      if (this.ctx) {
        const now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setTargetAtTime(this.muted ? 0 : this.masterVolume, now, 0.03);
      }
    }

    isMuted() {
      return this.muted;
    }

    // ---------- Ambient deep-space soundtrack ----------
    startAmbient() {
      const ctx = this.ensureContext();
      if (!ctx || this.ambient) return;
      const now = ctx.currentTime;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, now);
      out.gain.linearRampToValueAtTime(1, now + 3);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 520;
      filter.Q.value = 3;
      filter.connect(out);
      out.connect(this.musicBus);

      // Slow filter LFO => breathing pad
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 260;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      // Detuned drone chord (A minor-ish: A1, E2, A2, C3)
      const nodes = [lfo];
      [[55, 'sawtooth', 0.11], [82.41, 'sawtooth', 0.08], [110, 'triangle', 0.1], [130.81, 'sine', 0.06]].forEach(([f, type, vol], i) => {
        [-6, 6].forEach((detune) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = type;
          o.frequency.value = f;
          o.detune.value = detune + i * 1.5;
          g.gain.value = vol;
          o.connect(g);
          g.connect(filter);
          o.start();
          nodes.push(o);
        });
      });

      // Cosmic wind: band-passed noise with slow sweep
      const wind = ctx.createBufferSource();
      wind.buffer = this.noiseBuffer;
      wind.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 700;
      windFilter.Q.value = 1.4;
      const windGain = ctx.createGain();
      windGain.gain.value = 0.045;
      const windLfo = ctx.createOscillator();
      const windLfoGain = ctx.createGain();
      windLfo.frequency.value = 0.045;
      windLfoGain.gain.value = 420;
      windLfo.connect(windLfoGain);
      windLfoGain.connect(windFilter.frequency);
      wind.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(out);
      wind.start();
      windLfo.start();
      nodes.push(wind, windLfo);

      // Sparse shimmering star-chimes
      const chimeTimer = setInterval(() => {
        if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
        if (Math.random() < 0.45) return;
        const t = this.ctx.currentTime;
        const f = PENTATONIC_HZ[5 + Math.floor(Math.random() * 6)];
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.05, t + 0.4);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
        o.connect(g);
        g.connect(this.musicBus);
        o.start(t);
        o.stop(t + 3.3);
      }, 2600);

      this.ambient = { out, filter, nodes, chimeTimer };
    }

    stopAmbient() {
      if (!this.ambient || !this.ctx) return;
      const { out, nodes, chimeTimer } = this.ambient;
      const now = this.ctx.currentTime;
      clearInterval(chimeTimer);
      out.gain.cancelScheduledValues(now);
      out.gain.setTargetAtTime(0.0001, now, 0.4);
      nodes.forEach((n) => { try { n.stop(now + 2); } catch {} });
      this.ambient = null;
    }

    // Dynamic intensity: opens the pad filter during overdrive / boss fights
    setIntensity(level) {
      if (!this.ambient || !this.ctx) return;
      const now = this.ctx.currentTime;
      const target = 420 + Math.min(1, Math.max(0, level)) * 1600;
      this.ambient.filter.frequency.setTargetAtTime(target, now, 0.4);
    }

    // Duck the music while paused / in menus
    setMusicDucked(ducked) {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.musicBus.gain.setTargetAtTime(ducked ? this.musicVolume * 0.35 : this.musicVolume, now, 0.15);
    }

    // ---------- Sound effects ----------
    playHit(intensity = 1, combo = 1) {
      const ctx = this._voice('hit', 3);
      if (!ctx) return;
      const now = ctx.currentTime;
      const k = Math.min(1.6, Math.max(0.3, intensity));
      this._noise(now, 0.13, 0.32 * k, 'lowpass', 1600 * k, 90, 0.9);
      this._osc('triangle', 150 * k + Math.random() * 20, 40, now, 0.11, 0.42 * k);
      const idx = Math.min(PENTATONIC_HZ.length - 1, Math.floor((combo - 1) / 2));
      this._osc('sine', PENTATONIC_HZ[idx], null, now, 0.16, 0.08);
    }

    playExplosion(big = false) {
      const ctx = this._voice('explosion', 2);
      if (!ctx) return;
      const now = ctx.currentTime;
      const dur = big ? 0.9 : 0.35;
      this._noise(now, dur, big ? 0.6 : 0.3, 'lowpass', big ? 2400 : 1400, 60, 0.7);
      this._osc('sine', big ? 90 : 120, 30, now, dur, big ? 0.55 : 0.3);
    }

    playDash() {
      const ctx = this._voice('dash', 2);
      if (!ctx) return;
      const now = ctx.currentTime;
      this._noise(now, 0.18, 0.18, 'bandpass', 3000, 500, 1.2);
      this._osc('sawtooth', 460, 120, now, 0.14, 0.1);
    }

    playCatapult() {
      const ctx = this._voice('catapult', 2);
      if (!ctx) return;
      const now = ctx.currentTime;
      this._osc('square', 200, 900, now, 0.12, 0.1);
      this._noise(now, 0.2, 0.16, 'highpass', 800, 4000, 0.7);
    }

    playXp() {
      const ctx = this._voice('xp', 1);
      if (!ctx) return;
      const now = ctx.currentTime;
      this._osc('sine', 700 + Math.random() * 200, 1250, now, 0.07, 0.06);
    }

    playOverdrive() {
      const ctx = this._voice('overdrive', 5);
      if (!ctx) return;
      const now = ctx.currentTime;
      [220, 330, 440, 660].forEach((f, i) => {
        this._osc('sawtooth', f, f * 1.5, now + i * 0.03, 0.55, 0.08);
      });
      this._noise(now, 0.7, 0.22, 'bandpass', 300, 5000, 1.5);
    }

    playLevelUp() {
      const ctx = this._voice('levelup', 4);
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        this._osc('triangle', f, null, now + i * 0.07, 0.3, 0.16);
      });
    }

    playBossWarning() {
      const ctx = this._voice('boss', 4);
      if (!ctx) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        this._osc('square', 440, 330, now + i * 0.32, 0.22, 0.1, 'lin');
      }
      this._osc('sawtooth', 55, 45, now, 1.1, 0.22, 'lin');
    }

    playPlayerHurt() {
      const ctx = this._voice('hurt', 3);
      if (!ctx) return;
      const now = ctx.currentTime;
      this._osc('sawtooth', 170, 45, now, 0.28, 0.32, 'lin');
      this._noise(now, 0.25, 0.3, 'lowpass', 2200, 120, 0.8);
    }

    playGameOver() {
      const ctx = this._voice('gameover', 5);
      if (!ctx) return;
      const now = ctx.currentTime;
      [330, 277.18, 220, 146.83].forEach((f, i) => {
        this._osc('sawtooth', f, f * 0.97, now + i * 0.12, 0.32, 0.15, 'lin');
      });
      this._noise(now, 1.2, 0.35, 'lowpass', 1800, 50, 0.6);
    }

    // ---------- Diagnostics (used by automated tests / debugging) ----------
    getLevel() {
      if (!this.analyser) return 0;
      const buf = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(buf);
      let peak = 0;
      for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
      return peak;
    }

    getDiagnostics() {
      return {
        state: this.ctx ? this.ctx.state : 'none',
        muted: this.muted,
        activeVoices: this.activeVoices,
        ambient: Boolean(this.ambient),
        level: this.getLevel(),
      };
    }
  }

  window.ChaosAudio = new SoundEngine();
})();
