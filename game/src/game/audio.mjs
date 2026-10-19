export class GameAudio {
  constructor() {
    this.enabled = true;
    this.context = null;
  }
  async unlock() {
    try {
      const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!this.context && Context) this.context = new Context();
      if (this.context?.state === "suspended") await this.context.resume();
    } catch {
      /* The game remains playable without audio. */
    }
  }
  tone(
    frequency,
    duration = 0.1,
    type = "sine",
    volume = 0.06,
    delay = 0,
    end = frequency,
  ) {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== "running") return;
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    const start = ctx.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, end),
      start + duration,
    );
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
  play(event) {
    switch (event.type) {
      case "collect":
        this.tone(event.value === 5 ? 880 : 660, 0.12, "sine", 0.075, 0, 1100);
        this.tone(event.value === 5 ? 1320 : 990, 0.13, "sine", 0.05, 0.06);
        break;
      case "dash":
        this.tone(180, 0.15, "triangle", 0.045, 0, 700);
        break;
      case "hit":
        this.tone(190, 0.18, "triangle", 0.07, 0, 75);
        break;
      case "rewind":
        this.tone(950, 0.42, "sawtooth", 0.028, 0, 90);
        break;
      case "count":
        this.tone(440, 0.08, "sine", 0.045);
        break;
      case "go":
        [660, 880, 1320].forEach((f, i) =>
          this.tone(f, 0.22, "triangle", 0.045, i * 0.07),
        );
        break;
      case "finish":
        [523, 659, 784, 1047].forEach((f, i) =>
          this.tone(f, 0.5, "triangle", 0.05, i * 0.12),
        );
        break;
    }
  }
  dispose() {
    this.context?.close().catch(() => {});
  }
}
