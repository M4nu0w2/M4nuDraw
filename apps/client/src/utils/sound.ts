class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Carica lo stato memorizzato del volume
    const saved = localStorage.getItem('m4nudraw_sound_enabled');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Partita sta iniziando (Melodia festosa ascendente)
  playGameStart() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.30, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Utente indovina la parola (Celebration chime)
  playCorrectGuess() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const playTone = (freqStart: number, freqEnd: number, delay: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqStart, now + delay);
        osc.frequency.exponentialRampToValueAtTime(freqEnd, now + delay + duration);
        gain.gain.setValueAtTime(0.38, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + duration);
      };
      playTone(523.25, 1046.50, 0, 0.22); // C5 -> C6
      playTone(783.99, 1318.51, 0.08, 0.26); // G5 -> E6
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Qualcun altro indovina la parola (Soft high ding)
  playOtherGuess() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880.00, now); // A5 high note
      gain.gain.setValueAtTime(0.20, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Timer che sta per scadere (Warning rhythmic tick-tock)
  playTimerTick(isCritical: boolean = false) {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isCritical ? 580 : 340, now);
      gain.gain.setValueAtTime(isCritical ? 0.32 : 0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Fine di un round/turno (Descending low synth sweep)
  playRoundEnd() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260.00, now);
      osc.frequency.exponentialRampToValueAtTime(75.00, now + 0.5);
      gain.gain.setValueAtTime(0.30, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Special synth for Bomb clear explosion (White Noise & Low Frequency Rumble)
  playBombExplosion() {
    if (!this.enabled) return;
    try {
      const ctx = this.initCtx();
      const now = ctx.currentTime;
      
      // 1. Rumble Oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(30, now + 0.65);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.65);

      // 2. White Noise blast for explosion hiss
      const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds of noise
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(800, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(80, now + 0.5);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.50, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noise.start(now);
      noise.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('m4nudraw_sound_enabled', String(this.enabled));
    // Forza la ripresa del contesto audio all'attivazione
    if (this.enabled) {
      try {
        this.initCtx();
      } catch (e) {
        console.warn('Silent audio init failed:', e);
      }
    }
    return this.enabled;
  }

  isEnabled() {
    return this.enabled;
  }
}

export const soundManager = new SoundManager();
