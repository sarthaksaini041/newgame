/*
 * CHAOS TETHER — Studio-Grade Procedural Cosmic Web Audio Engine.
 *
 * Routing:
 *   SFX voices  -> sfxBus   ─┐
 *   Cosmic Pad  -> padBus   ─┼─> musicBus ─> master -> compressor/limiter -> destination
 *   Solar Wind  -> windBus  ─┤     └─> spaceReverb (3.0s stereo IR) + stereoEcho -> musicBus
 *   Star Bells  -> bellBus  ─┘
 *
 * Features:
 *   - Custom warm harmonic PeriodicWave pad (zero harsh sawtooth buzz, flat Q=0.7 Butterworth LPF).
 *   - Slow evolving 4-chord interstellar progression (Am9 -> Fmaj7#11 -> Cmaj9 -> G6/9).
 *   - True-stereo procedural algorithmic space reverb (ConvolverNode) + ping-pong shimmer echo.
 *   - Velvet pink/brown filtered solar wind (zero white-noise hiss).
 *   - Per-sound throttling, 28-voice polyphony cap, pre-allocated analyser buffer, and clean pause/tab sleep.
 */
(() => {
  const PENTATONIC_HZ = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const MAX_VOICES = 18;

  // Lush interstellar chord progression: [subRoot, padVoice1, padVoice2, padVoice3, padVoice4, bellScaleHz[]]
  const COSMIC_CHORDS = [
    {
      // Am9 (A1, E2, B2, C3, G3)
      sub: 55.0,
      voices: [110.0, 164.81, 246.94, 329.63],
      bells: [440.0, 493.88, 523.25, 659.25, 783.99, 987.77, 1318.51],
    },
    {
      // Fmaj7#11 (F1, C2, A2, B2, E3)
      sub: 43.65,
      voices: [87.31, 130.81, 220.0, 329.63],
      bells: [392.0, 440.0, 493.88, 523.25, 659.25, 880.0, 1174.66],
    },
    {
      // Cmaj9 (C2, G2, D3, E3, B3)
      sub: 65.41,
      voices: [130.81, 196.0, 293.66, 329.63],
      bells: [523.25, 587.33, 659.25, 783.99, 987.77, 1174.66, 1318.51],
    },
    {
      // G6/9 (G1, D2, A2, B2, E3)
      sub: 49.0,
      voices: [98.0, 146.83, 220.0, 293.66],
      bells: [440.0, 493.88, 587.33, 659.25, 783.99, 987.77, 1174.66],
    },
  ];

  const THROTTLE = {
    hit: 0.065,
    xp: 0.055,
    dash: 0.07,
    catapult: 0.09,
    wall: 0.08,
    hurt: 0.16,
    overdrive: 0.3,
    levelup: 0.3,
    gameover: 0.5,
    boss: 0.5,
    explosion: 0.08,
  };

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.muted = false;
      this.paused = false;
      this.noiseBuffer = null;
      this.pinkNoiseBuffer = null;
      this.reverbIR = null;
      this.warmWave = null;
      this._timeDomainBuf = null;
      this.lastPlayed = {};
      this.activeVoices = 0;
      this.ambient = null;
      this.motion = null;
      this._motionLastUpdate = -1;
      this._motionLastSp = -1;
      this._motionLastTension = -1;
      this._motionLastActive = false;
      this.masterVolume = 0.85;
      this.musicVolume = 0.38;
      this.sfxVolume = 0.88;
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
        this.compressor.threshold.value = -16;
        this.compressor.knee.value = 14;
        this.compressor.ratio.value = 6;
        this.compressor.attack.value = 0.005;
        this.compressor.release.value = 0.22;

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 1024;
        this._timeDomainBuf = new Float32Array(1024);

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
        this.pinkNoiseBuffer = this._createPinkNoiseBuffer(3.0);
        this.reverbIR = this._createSpaceReverbIR(3.0, 2.6);
        this.warmWave = this._createWarmPadWave();
      }
      if (this.ctx.state === 'suspended' && !document.hidden) {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    _bindLifecycle() {
      const unlock = () => {
        this.ensureContext();
        window.removeEventListener('pointerdown', unlock, true);
        window.removeEventListener('keydown', unlock, true);
      };
      window.addEventListener('pointerdown', unlock, true);
      window.addEventListener('keydown', unlock, true);

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

    // Velvety stereo pink/brown noise for ultra-smooth solar wind (zero white-noise hiss)
    _createPinkNoiseBuffer(durationSec) {
      const sr = this.ctx.sampleRate;
      const len = Math.floor(sr * durationSec);
      const buffer = this.ctx.createBuffer(2, len, sr);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        let lp = 0;
        for (let i = 0; i < len; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.085;
          b6 = white * 0.115926;
          // Extra one-pole low-pass silk smoothing
          lp = lp * 0.82 + pink * 0.18;
          data[i] = lp;
        }
        // Seamless loop crossfade over last 4096 samples
        const fade = Math.min(4096, len >> 2);
        for (let i = 0; i < fade; i++) {
          const k = i / fade;
          data[len - fade + i] = data[len - fade + i] * (1 - k) + data[i] * k;
        }
      }
      return buffer;
    }

    // Lush true-stereo cosmic cathedral reverb impulse response with soft diffusion attack & warm damping
    _createSpaceReverbIR(durationSec, decayPower) {
      const sr = this.ctx.sampleRate;
      const len = Math.floor(sr * durationSec);
      const buffer = this.ctx.createBuffer(2, len, sr);
      const attackSamples = Math.floor(sr * 0.055);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        let lp1 = 0;
        let lp2 = 0;
        for (let i = 0; i < len; i++) {
          const t = i / len;
          const env = Math.pow(1 - t, decayPower);
          const attack = i < attackSamples ? i / attackSamples : 1.0;
          const raw = (Math.random() * 2 - 1) * env * attack;
          // Progressive high-frequency absorption so tail becomes warmer and darker over time
          const damp = 0.52 + t * 0.44;
          lp1 = lp1 * damp + raw * (1 - damp);
          lp2 = lp2 * (damp * 0.85) + lp1 * (1 - damp * 0.85);
          data[i] = lp2 * 0.65;
        }
      }
      return buffer;
    }

    // Warm cosmic synth waveform: rich fundamental + smooth lower harmonics, zero harsh sawtooth buzz
    _createWarmPadWave() {
      const real = new Float32Array(9);
      const imag = new Float32Array([0, 1.0, 0.36, 0.16, 0.075, 0.032, 0.014, 0.006, 0.002]);
      return this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    }

    _createPanner(panVal) {
      if (typeof this.ctx.createStereoPanner === 'function') {
        const p = this.ctx.createStereoPanner();
        p.pan.value = panVal;
        return p;
      }
      const g = this.ctx.createGain();
      return g;
    }

    _voice(name, cost = 1) {
      if (this.muted) return null;
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return null;
      const now = ctx.currentTime;
      const baseGap = THROTTLE[name] || 0;
      const gap = this.activeVoices >= 16 ? baseGap * 1.75 : baseGap;
      if (this.lastPlayed[name] !== undefined && now - this.lastPlayed[name] < gap) return null;
      if (this.activeVoices + cost > MAX_VOICES) return null;
      this.lastPlayed[name] = now;
      return ctx;
    }

    _track(node, cost, stopAt, cleanupNodes = null) {
      this.activeVoices += cost;
      node.onended = () => {
        this.activeVoices = Math.max(0, this.activeVoices - cost);
        node.onended = null;
        try { node.disconnect(); } catch {}
        if (cleanupNodes) {
          for (let i = 0; i < cleanupNodes.length; i++) {
            try { cleanupNodes[i].disconnect(); } catch {}
          }
        }
      };
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
      this._track(osc, 1, t0 + dur + 0.02, [gain]);
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
      this._track(src, 1, t0 + dur + 0.02, [filter, gain]);
    }

    // ---------- Mute / volume ----------
    setMuted(muted) {
      this.muted = Boolean(muted);
      if (this.ctx) {
        const now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setTargetAtTime(this.muted ? 0 : this.masterVolume, now, 0.04);
      }
    }

    isMuted() {
      return this.muted;
    }

    // ---------- Smooth Cosmic Deep-Space Ambient Soundtrack ----------
    startAmbient() {
      const ctx = this.ensureContext();
      if (!ctx || this.ambient) return;
      const now = ctx.currentTime;

      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, now);
      out.gain.linearRampToValueAtTime(1.0, now + 3.5);
      out.connect(this.musicBus);

      // Lush stereo space reverb send
      const reverb = ctx.createConvolver();
      reverb.buffer = this.reverbIR;
      const reverbWet = ctx.createGain();
      reverbWet.gain.value = 0.62;
      reverb.connect(reverbWet);
      reverbWet.connect(out);

      // Gentle stereo cosmic shimmer echo (for star-bells & high pad bloom)
      const echoL = ctx.createDelay(1.0);
      const echoR = ctx.createDelay(1.0);
      echoL.delayTime.value = 0.42;
      echoR.delayTime.value = 0.63;
      const echoFilter = ctx.createBiquadFilter();
      echoFilter.type = 'lowpass';
      echoFilter.frequency.value = 1800;
      echoFilter.Q.value = 0.6;
      const echoFb = ctx.createGain();
      echoFb.gain.value = 0.30;
      const echoPanL = this._createPanner(-0.55);
      const echoPanR = this._createPanner(0.55);
      const echoOut = ctx.createGain();
      echoOut.gain.value = 0.42;

      // Non-cyclic dual-tap stereo shimmer echo (keeps Web Audio on 128-sample SIMD blocks!)
      echoL.connect(echoPanL);
      echoPanL.connect(echoOut);
      echoL.connect(echoFilter);
      echoFilter.connect(echoFb);
      echoFb.connect(echoR);
      echoR.connect(echoPanR);
      echoPanR.connect(echoOut);
      echoOut.connect(reverb);
      echoOut.connect(out);

      // Main warm Butterworth low-pass pad filter (Q=0.72 -> zero nasal resonance!)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 460;
      filter.Q.value = 0.72;

      const padDry = ctx.createGain();
      padDry.gain.value = 0.58;
      filter.connect(padDry);
      padDry.connect(out);
      filter.connect(reverb);

      // Slow organic breathing LFO on the warm pad filter (22-second cycle)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.045;
      lfoGain.gain.value = 135;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start(now);

      const nodes = [lfo];
      const chord0 = COSMIC_CHORDS[0];

      // 1. Deep silky pure-sine sub foundation (warm low-end weight, zero buzz)
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.value = chord0.sub;
      subGain.gain.value = 0.24;
      subOsc.connect(subGain);
      subGain.connect(out);
      subOsc.start(now);
      nodes.push(subOsc);

      // 2. Lush stereo-spread warm harmonic pad voices (4 notes × stereo detuned pair)
      const padOscGroups = [];
      const voicePans = [-0.62, -0.24, 0.24, 0.62];
      const voiceGains = [0.11, 0.095, 0.075, 0.055];

      chord0.voices.forEach((freq, i) => {
        const pair = [];
        [-5.5, 5.5].forEach((detune, side) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          const pan = this._createPanner(voicePans[i] * (side === 0 ? 1 : -0.7));
          o.setPeriodicWave(this.warmWave);
          o.frequency.value = freq;
          o.detune.value = detune + i * 1.1;
          g.gain.value = voiceGains[i];
          o.connect(g);
          g.connect(pan);
          pan.connect(filter);
          o.start(now);
          nodes.push(o);
          pair.push(o);
        });
        padOscGroups.push(pair);
      });

      // 3. Soft shimmering upper-octave cosmic air layer (pure sine, fades in gently with intensity)
      const airGain = ctx.createGain();
      airGain.gain.value = 0.028;
      airGain.connect(reverb);
      const airOscs = [];
      [chord0.voices[2] * 2, chord0.voices[3] * 2].forEach((freq, i) => {
        const o = ctx.createOscillator();
        const pan = this._createPanner(i === 0 ? -0.45 : 0.45);
        o.type = 'sine';
        o.frequency.value = freq;
        o.detune.value = i === 0 ? -4 : 4;
        o.connect(pan);
        pan.connect(airGain);
        o.start(now);
        nodes.push(o);
        airOscs.push(o);
      });

      // 4. Velvety stereo solar wind (pink/brown noise through gentle low-Q moving filter)
      const wind = ctx.createBufferSource();
      wind.buffer = this.pinkNoiseBuffer;
      wind.loop = true;
      const windFilter = ctx.createBiquadFilter();
      windFilter.type = 'lowpass';
      windFilter.frequency.value = 340;
      windFilter.Q.value = 0.65;
      const windGain = ctx.createGain();
      windGain.gain.value = 0.095;
      const windLfo = ctx.createOscillator();
      const windLfoGain = ctx.createGain();
      windLfo.type = 'sine';
      windLfo.frequency.value = 0.032;
      windLfoGain.gain.value = 140;
      windLfo.connect(windLfoGain);
      windLfoGain.connect(windFilter.frequency);
      wind.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(reverb);
      windGain.connect(out);
      wind.start(now);
      windLfo.start(now);
      nodes.push(wind, windLfo);

      let chordIdx = 0;

      // 5. Slow evolving interstellar chord drift every 9.5 seconds (silky 2.6s portamento glide)
      const chordTimer = setInterval(() => {
        if (!this.ctx || this.ctx.state !== 'running' || this.paused || document.hidden) return;
        chordIdx = (chordIdx + 1) % COSMIC_CHORDS.length;
        const ch = COSMIC_CHORDS[chordIdx];
        const t = this.ctx.currentTime;
        subOsc.frequency.cancelScheduledValues(t);
        subOsc.frequency.setTargetAtTime(ch.sub, t, 2.4);
        for (let i = 0; i < padOscGroups.length; i++) {
          const targetF = ch.voices[i];
          const pair = padOscGroups[i];
          pair[0].frequency.cancelScheduledValues(t);
          pair[1].frequency.cancelScheduledValues(t);
          pair[0].frequency.setTargetAtTime(targetF, t, 2.6);
          pair[1].frequency.setTargetAtTime(targetF, t, 2.8);
        }
        airOscs[0].frequency.cancelScheduledValues(t);
        airOscs[1].frequency.cancelScheduledValues(t);
        airOscs[0].frequency.setTargetAtTime(ch.voices[2] * 2, t, 3.0);
        airOscs[1].frequency.setTargetAtTime(ch.voices[3] * 2, t, 3.0);
      }, 9500);

      // 6. Ethereal stereo glass star-bells bathed in space reverb + ping-pong echo
      const chimeTimer = setInterval(() => {
        if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
        if (this.paused || document.hidden) return;
        if (Math.random() < 0.35) return;
        const t = this.ctx.currentTime;
        const scale = COSMIC_CHORDS[chordIdx].bells;
        const f = scale[Math.floor(Math.random() * scale.length)];

        const pan = this._createPanner((Math.random() * 2 - 1) * 0.72);
        const env = this.ctx.createGain();
        env.gain.setValueAtTime(0.0001, t);
        env.gain.linearRampToValueAtTime(0.042, t + 0.38);
        env.gain.exponentialRampToValueAtTime(0.0001, t + 4.0);

        // Fundamental pure sine
        const o1 = this.ctx.createOscillator();
        o1.type = 'sine';
        o1.frequency.value = f;

        // Delicate crystalline octave shimmer overtone
        const o2 = this.ctx.createOscillator();
        const o2g = this.ctx.createGain();
        o2.type = 'sine';
        o2.frequency.value = f * 2;
        o2.detune.value = 3.5;
        o2g.gain.value = 0.16;

        o1.connect(env);
        o2.connect(o2g);
        o2g.connect(env);
        env.connect(pan);
        pan.connect(reverb);
        pan.connect(echoL);

        o1.onended = () => {
          o1.onended = null;
          try { o1.disconnect(); o2.disconnect(); o2g.disconnect(); env.disconnect(); pan.disconnect(); } catch {}
        };
        o1.start(t);
        o2.start(t);
        o1.stop(t + 4.15);
        o2.stop(t + 4.15);
      }, 2800);

      this.ambient = { out, filter, airGain, nodes, chimeTimer, chordTimer };
    }

    stopAmbient() {
      if (!this.ambient || !this.ctx) return;
      const { out, nodes, chimeTimer, chordTimer } = this.ambient;
      const now = this.ctx.currentTime;
      clearInterval(chimeTimer);
      clearInterval(chordTimer);
      out.gain.cancelScheduledValues(now);
      out.gain.setTargetAtTime(0.0001, now, 0.4);
      nodes.forEach((n) => { try { n.stop(now + 2); } catch {} });
      this.ambient = null;
    }

    // Dynamic intensity: smoothly blooms pad warmth & cosmic air layer without harsh resonance
    setIntensity(level) {
      if (!this.ambient || !this.ctx) return;
      const now = this.ctx.currentTime;
      const k = Math.min(1, Math.max(0, level));
      const targetCutoff = 400 + k * 680; // Smooth 400Hz -> 1080Hz (never harsh or piercing)
      this.ambient.filter.frequency.cancelScheduledValues(now);
      this.ambient.filter.frequency.setTargetAtTime(targetCutoff, now, 0.6);
      if (this.ambient.airGain) {
        this.ambient.airGain.gain.cancelScheduledValues(now);
        this.ambient.airGain.gain.setTargetAtTime(0.025 + k * 0.045, now, 0.7);
      }
    }

    // Duck the music while paused / in menus (also silences continuous spinner/tether motion audio)
    setMusicDucked(ducked) {
      this.paused = Boolean(ducked);
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setTargetAtTime(ducked ? this.musicVolume * 0.35 : this.musicVolume, now, 0.2);
      if (ducked) this.updateMotionAudio(0, 0, 0, false);
    }

    // ---------- Continuous Subtle Spinner Motion & Elastic Tether Stretch Synth ----------
    _ensureMotionAudio() {
      if (this.motion || !this.ctx || !this.pinkNoiseBuffer) return this.motion;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const bus = ctx.createGain();
      bus.gain.value = 1.0;
      bus.connect(this.sfxBus);

      // 1. Subtle plasma gyro-spinner orbital hum (smooth triangle -> lowpass)
      const spinOsc = ctx.createOscillator();
      spinOsc.type = 'triangle';
      spinOsc.frequency.value = 110;
      const spinFilter = ctx.createBiquadFilter();
      spinFilter.type = 'lowpass';
      spinFilter.frequency.value = 320;
      spinFilter.Q.value = 0.85;
      const spinGain = ctx.createGain();
      spinGain.gain.value = 0.0001;
      spinOsc.connect(spinFilter);
      spinFilter.connect(spinGain);
      spinGain.connect(bus);
      spinOsc.start(now);

      // 2. Silky bandpass pink-noise plasma whoosh (scales with orb whip speed)
      const whooshSrc = ctx.createBufferSource();
      whooshSrc.buffer = this.pinkNoiseBuffer;
      whooshSrc.loop = true;
      const whooshFilter = ctx.createBiquadFilter();
      whooshFilter.type = 'bandpass';
      whooshFilter.frequency.value = 340;
      whooshFilter.Q.value = 1.35;
      const whooshGain = ctx.createGain();
      whooshGain.gain.value = 0.0001;
      whooshSrc.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(bus);
      whooshSrc.start(now);

      // 3. Elastic tether stretch / Yank tension harmonic (warm sine+overtone shimmer)
      const stretchOsc = ctx.createOscillator();
      stretchOsc.type = 'sine';
      stretchOsc.frequency.value = 155;
      const stretchOsc2 = ctx.createOscillator();
      stretchOsc2.type = 'triangle';
      stretchOsc2.frequency.value = 310;
      const stretchFilter = ctx.createBiquadFilter();
      stretchFilter.type = 'bandpass';
      stretchFilter.frequency.value = 420;
      stretchFilter.Q.value = 1.1;
      const stretchGain = ctx.createGain();
      stretchGain.gain.value = 0.0001;
      stretchOsc.connect(stretchFilter);
      stretchOsc2.connect(stretchFilter);
      stretchFilter.connect(stretchGain);
      stretchGain.connect(bus);
      stretchOsc.start(now);
      stretchOsc2.start(now);

      this.motion = {
        bus,
        spinOsc,
        spinFilter,
        spinGain,
        whooshFilter,
        whooshGain,
        stretchOsc,
        stretchOsc2,
        stretchFilter,
        stretchGain,
      };
      return this.motion;
    }

    updateMotionAudio(speedNorm = 0, stretchNorm = 0, yankCharge = 0, active = true) {
      if (!this.ctx || this.ctx.state !== 'running') return;
      if (!active && !this.motion) return;
      const m = this._ensureMotionAudio();
      if (!m) return;

      const now = this.ctx.currentTime;
      const shouldRun = Boolean(active && !this.muted && !this.paused && !document.hidden);

      if (!shouldRun) {
        if (!this._motionLastActive && this._motionLastUpdate >= 0) return;
        this._motionLastActive = false;
        this._motionLastUpdate = now;
        this._motionLastSp = 0;
        this._motionLastTension = 0;
        m.spinGain.gain.cancelScheduledValues(now);
        m.whooshGain.gain.cancelScheduledValues(now);
        m.stretchGain.gain.cancelScheduledValues(now);
        m.spinGain.gain.setTargetAtTime(0.0001, now, 0.06);
        m.whooshGain.gain.setTargetAtTime(0.0001, now, 0.06);
        m.stretchGain.gain.setTargetAtTime(0.0001, now, 0.06);
        return;
      }

      // Throttle to <= 20 Hz (50ms) and dirty-check so AudioParamTimeline never accumulates events
      const sp = Math.min(1.25, Math.max(0, speedNorm));
      const st = Math.min(1.2, Math.max(0, stretchNorm));
      const yk = Math.min(1, Math.max(0, yankCharge));
      const tension = Math.min(1.2, Math.max(st, yk * 1.15));

      if (
        this._motionLastActive &&
        now - this._motionLastUpdate < 0.05 &&
        Math.abs(sp - this._motionLastSp) < 0.04 &&
        Math.abs(tension - this._motionLastTension) < 0.04
      ) {
        return;
      }
      this._motionLastActive = true;
      this._motionLastUpdate = now;
      this._motionLastSp = sp;
      this._motionLastTension = tension;

      // Subtle gyro hum + whoosh rises smoothly with spinner speed
      const spinVol = sp > 0.12 ? Math.min(0.042, (sp - 0.12) * 0.036) : 0.0001;
      const whooshVol = sp > 0.18 ? Math.min(0.068, (sp - 0.18) * 0.062) : 0.0001;
      m.spinOsc.frequency.cancelScheduledValues(now);
      m.spinFilter.frequency.cancelScheduledValues(now);
      m.spinGain.gain.cancelScheduledValues(now);
      m.spinOsc.frequency.setTargetAtTime(98 + sp * 178, now, 0.06);
      m.spinFilter.frequency.setTargetAtTime(260 + sp * 780, now, 0.06);
      m.spinGain.gain.setTargetAtTime(spinVol, now, 0.07);

      m.whooshFilter.frequency.cancelScheduledValues(now);
      m.whooshGain.gain.cancelScheduledValues(now);
      m.whooshFilter.frequency.setTargetAtTime(260 + sp * 1120, now, 0.05);
      m.whooshGain.gain.setTargetAtTime(whooshVol, now, 0.06);

      // Elastic tether tension hum rises smoothly when stretched or charging Yank
      const stretchVol = tension > 0.10 ? Math.min(0.046, (tension - 0.10) * 0.042) : 0.0001;
      const stretchHz = 148 + tension * 285 + yk * 130;
      m.stretchOsc.frequency.cancelScheduledValues(now);
      m.stretchOsc2.frequency.cancelScheduledValues(now);
      m.stretchFilter.frequency.cancelScheduledValues(now);
      m.stretchGain.gain.cancelScheduledValues(now);
      m.stretchOsc.frequency.setTargetAtTime(stretchHz, now, 0.05);
      m.stretchOsc2.frequency.setTargetAtTime(stretchHz * 1.5, now, 0.05);
      m.stretchFilter.frequency.setTargetAtTime(320 + tension * 980, now, 0.05);
      m.stretchGain.gain.setTargetAtTime(stretchVol, now, 0.06);
    }

    // ---------- Sound effects ----------
    playWallBounce(speedNorm = 0.7) {
      const ctx = this._voice('wall', 3);
      if (!ctx) return;
      const now = ctx.currentTime;
      const k = Math.min(1.4, Math.max(0.25, speedNorm));
      // Deep plasma perimeter barrier thump
      this._osc('triangle', 155 + k * 45, 44, now, 0.12, 0.22 * k);
      // Resonant metallic shield ricochet ping
      this._osc('sine', 580 + k * 340, 320 + k * 120, now, 0.16, 0.095 * k);
      // Crisp electric spark crackle
      this._noise(now, 0.09, 0.14 * k, 'bandpass', 2200, 620, 1.3);
    }

    playHit(intensity = 1, combo = 1, isSupersonic = false) {
      const ctx = this._voice('hit', isSupersonic ? 4 : 3);
      if (!ctx) return;
      const now = ctx.currentTime;
      const k = Math.min(1.6, Math.max(0.3, intensity));
      this._noise(now, isSupersonic ? 0.16 : 0.12, (isSupersonic ? 0.34 : 0.26) * k, 'lowpass', (isSupersonic ? 2100 : 1450) * k, 85, 0.85);
      this._osc('triangle', (isSupersonic ? 175 : 145) * k + Math.random() * 20, 38, now, isSupersonic ? 0.15 : 0.11, 0.40 * k);
      if (isSupersonic) {
        // Extra sub-bass sonic crack + metallic harmonic overtone on supersonic smash
        this._osc('sine', 108, 32, now, 0.18, 0.34);
        this._osc('sine', 920 + Math.random() * 180, 420, now, 0.11, 0.085);
      }
      const idx = Math.min(PENTATONIC_HZ.length - 1, Math.floor((combo - 1) / 2));
      this._osc('sine', PENTATONIC_HZ[idx], null, now, 0.16, 0.085);
    }

    playExplosion(big = false, isSupersonic = false) {
      const ctx = this._voice('explosion', big || isSupersonic ? 3 : 2);
      if (!ctx) return;
      const now = ctx.currentTime;
      const dur = big ? 0.88 : (isSupersonic ? 0.44 : 0.34);
      this._noise(now, dur, big ? 0.56 : (isSupersonic ? 0.36 : 0.28), 'lowpass', big ? 2400 : (isSupersonic ? 1900 : 1350), 50, 0.72);
      this._osc('sine', big ? 86 : (isSupersonic ? 104 : 118), 28, now, dur, big ? 0.52 : (isSupersonic ? 0.34 : 0.27));
      if (big || isSupersonic) {
        // Crystalline plasma-hull shatter crackle
        this._noise(now + 0.015, 0.14, big ? 0.22 : 0.15, 'bandpass', 3200, 900, 1.4);
      }
    }

    playDash() {
      const ctx = this._voice('dash', 2);
      if (!ctx) return;
      const now = ctx.currentTime;
      this._noise(now, 0.18, 0.16, 'bandpass', 2800, 480, 1.0);
      this._osc('triangle', 440, 130, now, 0.14, 0.11);
    }

    playCatapult() {
      const ctx = this._voice('catapult', 2);
      if (!ctx) return;
      const now = ctx.currentTime;
      this._osc('triangle', 210, 860, now, 0.13, 0.12);
      this._noise(now, 0.2, 0.15, 'highpass', 800, 3800, 0.7);
    }

    playXp() {
      const ctx = this._voice('xp', 1);
      if (!ctx) return;
      const now = ctx.currentTime;
      this._osc('sine', 700 + Math.random() * 200, 1250, now, 0.07, 0.055);
    }

    playOverdrive() {
      const ctx = this._voice('overdrive', 5);
      if (!ctx) return;
      const now = ctx.currentTime;
      [220, 329.63, 440, 659.25].forEach((f, i) => {
        this._osc('triangle', f, f * 1.5, now + i * 0.035, 0.58, 0.09);
      });
      this._noise(now, 0.65, 0.18, 'bandpass', 320, 4200, 1.1);
    }

    playLevelUp() {
      const ctx = this._voice('levelup', 4);
      if (!ctx) return;
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        this._osc('triangle', f, null, now + i * 0.07, 0.3, 0.15);
      });
    }

    playBossWarning() {
      const ctx = this._voice('boss', 4);
      if (!ctx) return;
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        this._osc('triangle', 440, 330, now + i * 0.32, 0.22, 0.11, 'lin');
      }
      this._osc('sine', 65, 45, now, 1.1, 0.28, 'lin');
    }

    playPlayerHurt() {
      const ctx = this._voice('hurt', 3);
      if (!ctx) return;
      const now = ctx.currentTime;
      this._osc('sawtooth', 165, 45, now, 0.26, 0.28, 'lin');
      this._noise(now, 0.24, 0.26, 'lowpass', 2000, 120, 0.8);
    }

    playGameOver() {
      const ctx = this._voice('gameover', 5);
      if (!ctx) return;
      const now = ctx.currentTime;
      [330, 277.18, 220, 146.83].forEach((f, i) => {
        this._osc('triangle', f, f * 0.97, now + i * 0.12, 0.36, 0.15, 'lin');
      });
      this._noise(now, 1.1, 0.30, 'lowpass', 1600, 50, 0.6);
    }

    // ---------- Diagnostics ----------
    getLevel() {
      if (!this.analyser) return 0;
      const buf = this._timeDomainBuf || (this._timeDomainBuf = new Float32Array(this.analyser.fftSize));
      this.analyser.getFloatTimeDomainData(buf);
      let peak = 0;
      for (let i = 0; i < buf.length; i++) peak = Math.max(peak, Math.abs(buf[i]));
      return peak;
    }

    getDiagnostics() {
      return {
        state: this.ctx ? this.ctx.state : 'none',
        muted: this.muted,
        paused: this.paused,
        activeVoices: this.activeVoices,
        ambient: Boolean(this.ambient),
        level: this.getLevel(),
      };
    }
  }

  window.ChaosAudio = new SoundEngine();
})();
