// Web Audio API generator for flow-state soundscapes: Brown Noise & Binaural Beats

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private currentMode: 'off' | 'brown-noise' | 'alpha-10hz' | 'theta-6hz' | 'gamma-40hz' = 'off';
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private volume: number = 0.25;

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentMode() {
    return this.currentMode;
  }

  public isPlaying(): boolean {
    return this.currentMode !== 'off';
  }

  public stop() {
    if (this.masterGain && this.ctx) {
      // Smooth fade out
      this.masterGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
      setTimeout(() => {
        this.cleanupNodes();
        this.currentMode = 'off';
      }, 100);
    } else {
      this.cleanupNodes();
      this.currentMode = 'off';
    }
  }

  private cleanupNodes() {
    this.activeNodes.forEach((item) => {
      if (typeof item === 'number') {
        clearInterval(item);
      } else if (item && typeof item === 'object') {
        if ('stop' in item && typeof (item as AudioScheduledSourceNode).stop === 'function') {
          try {
            (item as AudioScheduledSourceNode).stop();
          } catch {
            // ignore
          }
        }
        if ('disconnect' in item && typeof (item as AudioNode).disconnect === 'function') {
          try {
            (item as AudioNode).disconnect();
          } catch {
            // ignore
          }
        }
      }
    });
    this.activeNodes = [];
  }

  public playBrownNoise() {
    this.initContext();
    if (!this.ctx) return;
    this.stop();

    const ctx = this.ctx;
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const outputL = noiseBuffer.getChannelData(0);
    const outputR = noiseBuffer.getChannelData(1);

    // Brown noise integration algorithm (Leaky integrator)
    let lastOutL = 0.0;
    let lastOutR = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const whiteL = Math.random() * 2 - 1;
      const whiteR = Math.random() * 2 - 1;
      lastOutL = (lastOutL + 0.02 * whiteL) / 1.02;
      lastOutR = (lastOutR + 0.02 * whiteR) / 1.02;
      outputL[i] = lastOutL * 3.5;
      outputR[i] = lastOutR * 3.5;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Low pass filter to create comforting warmth
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
    this.masterGain.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.2);

    whiteNoise.connect(filter);
    filter.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, this.masterGain);
    this.currentMode = 'brown-noise';
  }

  /**
   * Generates true binaural beats by splitting stereo channels:
   * Carrier freq in Left Ear, Carrier + Target Difference in Right Ear.
   */
  public playBinauralBeat(carrierFreq: number, beatDiffFreq: number, modeName: 'alpha-10hz' | 'theta-6hz' | 'gamma-40hz') {
    this.initContext();
    if (!this.ctx) return;
    this.stop();

    const ctx = this.ctx;

    // Channel merger for true Left/Right ear split
    const merger = ctx.createChannelMerger(2);

    // Left Ear Oscillator
    const oscL = ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(carrierFreq, ctx.currentTime);

    // Right Ear Oscillator
    const oscR = ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(carrierFreq + beatDiffFreq, ctx.currentTime);

    // Subtle gentle pink/brown background pad to blend the tones comfortably
    const padGain = ctx.createGain();
    padGain.gain.value = 0.08;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
    this.masterGain.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.2);

    oscL.connect(merger, 0, 0); // Left channel
    oscR.connect(merger, 0, 1); // Right channel

    merger.connect(this.masterGain);
    this.masterGain.connect(ctx.destination);

    oscL.start();
    oscR.start();

    this.activeNodes.push(oscL, oscR, merger, this.masterGain);
    this.currentMode = modeName;
  }
}

export const ambientAudio = new AmbientAudioEngine();
