export class AudioManager {
  constructor() {
    this.context = null;
    this.master = null;
    this.enabled = false;
  }

  async unlock() {
    if (!this.context) {
      this.context = new window.AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.context.destination);
    }

    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    this.enabled = this.context.state === "running";
  }

  playTone({
    frequency = 220,
    duration = 0.12,
    type = "triangle",
    volume = 0.06,
    slide = 0.8,
  }) {
    if (!this.enabled || !this.context || !this.master) return;

    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(80, frequency * slide),
      now + duration,
    );

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gain);
    gain.connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  playNoise({ duration = 0.08, volume = 0.04, highpass = 480 }) {
    if (!this.enabled || !this.context || !this.master) return;

    const bufferSize = Math.max(1, Math.floor(this.context.sampleRate * duration));
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    const now = this.context.currentTime;

    filter.type = "highpass";
    filter.frequency.value = highpass;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    source.start(now);
  }

  impact(intensity = 1) {
    this.playTone({
      frequency: 220 + intensity * 40,
      duration: 0.09,
      type: "square",
      volume: 0.03 + intensity * 0.016,
      slide: 0.55,
    });
    this.playNoise({ duration: 0.05 + intensity * 0.02, volume: 0.02 + intensity * 0.014 });
  }

  breakCrash() {
    this.playNoise({ duration: 0.18, volume: 0.08, highpass: 700 });
    this.playTone({
      frequency: 520,
      duration: 0.14,
      type: "sawtooth",
      volume: 0.04,
      slide: 0.35,
    });
  }

  combo(count) {
    this.playTone({
      frequency: 360 + count * 45,
      duration: 0.11,
      type: "triangle",
      volume: 0.04,
      slide: 1.25,
    });
  }

  meow() {
    this.playTone({
      frequency: 520,
      duration: 0.07,
      type: "triangle",
      volume: 0.045,
      slide: 1.5,
    });
    this.playTone({
      frequency: 690,
      duration: 0.09,
      type: "triangle",
      volume: 0.032,
      slide: 0.88,
    });
  }

  ownerAlert() {
    this.playTone({
      frequency: 180,
      duration: 0.18,
      type: "sawtooth",
      volume: 0.06,
      slide: 0.72,
    });
  }
}
