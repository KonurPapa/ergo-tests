// ============================================================================
// Harvest Haven - Procedural Web Audio Sound & Music Synthesizer
// Zero external asset dependencies - runs 100% offline
// ============================================================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = false; // default off until user opts in or clicks play
    this.masterVolume = 0.7;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.4;
    this.musicPlaying = false;
    this.musicTimer = null;
    this.stepCounter = 0;

    // Musical scale notes (frequencies in Hz)
    // C Major Pentatonic / Folk scale: C4, D4, E4, G4, A4, C5, D5, E5, G5
    this.scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
    this.bassNotes = [130.81, 146.83, 164.81, 174.61, 196.0, 220.0]; // C3, D3, E3, F3, G3, A3
    this.chordProgression = [
      { bass: 130.81, harmony: [261.63, 329.63, 392.0] },  // C
      { bass: 220.00, harmony: [220.0, 261.63, 329.63] },  // Am
      { bass: 174.61, harmony: [261.63, 349.23, 440.0] },  // F
      { bass: 196.00, harmony: [293.66, 392.0, 493.88] }   // G
    ];
    this.currentChordIdx = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Sound Effects Synthesizer ---

  playFootstep() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110 + Math.random() * 20, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.06);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.04 * this.sfxVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playTill() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Crunchy noise burst
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(2.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playWater() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Bubbly splash effect
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = i * 0.04;

      osc.type = 'sine';
      const baseFreq = 380 + i * 160 + Math.random() * 80;
      osc.frequency.setValueAtTime(baseFreq, now + delay);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + delay + 0.08);

      gain.gain.setValueAtTime(0.12 * this.sfxVolume, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.1);
    }
  }

  playPlant() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(540, now + 0.08);

    gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playHarvest() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Bright chord arpeggio: C5 -> E5 -> G5 -> C6
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.055;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.22 * this.sfxVolume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.36);
    });
  }

  playCoin() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.06); // E6

    osc2.frequency.setValueAtTime(1975.53, now); // B6
    osc2.frequency.setValueAtTime(2637.02, now + 0.06); // E7

    gain.gain.setValueAtTime(0.18 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  playCrow() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Caw sound: descending saw with vibrato
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(920, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.28);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(28, now);
    lfoGain.gain.setValueAtTime(120, now);
    lfo.connect(osc.frequency);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3.0, now);

    gain.gain.setValueAtTime(0.24 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(now);
    osc.start(now);
    osc.stop(now + 0.3);
    lfo.stop(now + 0.3);
  }

  playThunder() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Low sub rumble + filtered noise
    const bufferSize = this.ctx.sampleRate * 0.9;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(160, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.8);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playExtinguish() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Sizzle hiss
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1800, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playFanfare() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [
      { t: 0.0, freqs: [392.0, 523.25, 659.25] }, // G4 C5 E5
      { t: 0.15, freqs: [440.0, 587.33, 698.46] }, // A4 D5 F5
      { t: 0.32, freqs: [523.25, 659.25, 783.99, 1046.5] } // C5 E5 G5 C6
    ];

    chords.forEach(c => {
      c.freqs.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + c.t;
        const dur = (c.t > 0.3) ? 0.6 : 0.14;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.18 * this.sfxVolume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    });
  }

  playPop() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

    gain.gain.setValueAtTime(0.12 * this.sfxVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // --- Background Music Synthesizer ---

  toggleMusic() {
    this.init();
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  startMusic() {
    if (!this.ctx) this.init();
    if (this.musicPlaying) return;
    this.musicPlaying = true;
    this.stepCounter = 0;
    this.tickMusic();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  tickMusic() {
    if (!this.musicPlaying || !this.musicEnabled || !this.ctx) return;

    const now = this.ctx.currentTime;
    const chord = this.chordProgression[this.currentChordIdx];

    // Every 8 steps (measure), switch chord
    if (this.stepCounter % 8 === 0) {
      // Play mellow warm bass note
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(chord.bass, now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(320, now);

      bassGain.gain.setValueAtTime(0.18 * this.musicVolume, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bassOsc.start(now);
      bassOsc.stop(now + 1.8);
    }

    // Melodic acoustic pluck
    if (Math.random() > 0.25) {
      const melodyFreq = this.scale[Math.floor(Math.random() * this.scale.length)];
      const melOsc = this.ctx.createOscillator();
      const melGain = this.ctx.createGain();

      melOsc.type = 'triangle';
      melOsc.frequency.setValueAtTime(melodyFreq, now);

      melGain.gain.setValueAtTime(0.08 * this.musicVolume, now);
      melGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      melOsc.connect(melGain);
      melGain.connect(this.ctx.destination);

      melOsc.start(now);
      melOsc.stop(now + 0.46);
    }

    this.stepCounter++;
    if (this.stepCounter % 8 === 0) {
      this.currentChordIdx = (this.currentChordIdx + 1) % this.chordProgression.length;
    }

    // Next step in 280ms (~107 BPM eighth notes)
    this.musicTimer = setTimeout(() => this.tickMusic(), 280);
  }
}

// Global sound manager instance
const soundManager = new SoundManager();
