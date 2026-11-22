// Tiny WebAudio synth: no audio files, everything is generated.
// Footstep ticks pan by the guard's direction so you can hear where they are.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
    } catch (e) { this.ctx = null; }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.16;
    return this.muted;
  }

  blip(freq, dur, type, vol, when = 0) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol || 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  pickup() { this.blip(880, 0.12, 'sine', 0.6); this.blip(1318, 0.18, 'sine', 0.5, 0.07); }
  suspicious() { this.blip(330, 0.16, 'triangle', 0.55); this.blip(262, 0.2, 'triangle', 0.5, 0.12); }
  alert() {
    this.blip(196, 0.22, 'sawtooth', 0.5);
    this.blip(147, 0.3, 'sawtooth', 0.5, 0.16);
    this.blip(196, 0.22, 'sawtooth', 0.45, 0.36);
  }
  caught() { this.blip(110, 0.5, 'sawtooth', 0.6); this.blip(82, 0.7, 'sawtooth', 0.55, 0.2); }
  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.blip(f, 0.22, 'sine', 0.5, i * 0.11));
  }
  step(pan, loud) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const p = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    o.type = 'sine';
    o.frequency.setValueAtTime(loud ? 140 : 95, t);
    g.gain.setValueAtTime(loud ? 0.22 : 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    o.connect(g);
    if (p) { p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); p.connect(this.master); }
    else g.connect(this.master);
    o.start(t); o.stop(t + 0.09);
  }
}
