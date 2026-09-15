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
    this.cleanupNodes();
    this.currentMode = 'off';
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

    // Master gain node
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.01, ctx.currentTime);
    this.masterGain.gain.setTargetAtTime(this.volume, ctx.currentTime, 0.15);
    this.masterGain.connect(ctx.destination);

    // Subtle warm filtered brown noise background pad so the beat feels full and soothing
    const bufferSize = ctx.sampleRate * 2;
    const padBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const padL = padBuffer.getChannelData(0);
    const padR = padBuffer.getChannelData(1);
    let pL = 0;
    let pR = 0;
    for (let i = 0; i < bufferSize; i++) {
      pL = (pL + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      pR = (pR + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      padL[i] = pL * 1.2;
      padR[i] = pR * 1.2;
    }
    const padSource = ctx.createBufferSource();
    padSource.buffer = padBuffer;
    padSource.loop = true;

    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(320, ctx.currentTime);

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.35, ctx.currentTime);

    padSource.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(this.masterGain);
    padSource.start();

    // Stereo Panner Setup: Ensures binaural beats work in headphones AND sum audibly on mono/laptop speakers
    const leftFreq = carrierFreq;
    const rightFreq = carrierFreq + beatDiffFreq;

    // Left Ear / Channel Tone
    const oscL = ctx.createOscillator();
    oscL.type = 'sine';
    oscL.frequency.setValueAtTime(leftFreq, ctx.currentTime);

    const gainL = ctx.createGain();
    gainL.gain.setValueAtTime(0.65, ctx.currentTime);

    let pannerL: StereoPannerNode | GainNode;
    if (typeof ctx.createStereoPanner === 'function') {
      pannerL = ctx.createStereoPanner();
      pannerL.pan.setValueAtTime(-0.85, ctx.currentTime);
      oscL.connect(gainL);
      gainL.connect(pannerL);
      pannerL.connect(this.masterGain);
    } else {
      oscL.connect(gainL);
      gainL.connect(this.masterGain);
      pannerL = gainL;
    }

    // Right Ear / Channel Tone
    const oscR = ctx.createOscillator();
    oscR.type = 'sine';
    oscR.frequency.setValueAtTime(rightFreq, ctx.currentTime);

    const gainR = ctx.createGain();
    gainR.gain.setValueAtTime(0.65, ctx.currentTime);

    let pannerR: StereoPannerNode | GainNode;
    if (typeof ctx.createStereoPanner === 'function') {
      pannerR = ctx.createStereoPanner();
      pannerR.pan.setValueAtTime(0.85, ctx.currentTime);
      oscR.connect(gainR);
      gainR.connect(pannerR);
      pannerR.connect(this.masterGain);
    } else {
      oscR.connect(gainR);
      gainR.connect(this.masterGain);
      pannerR = gainR;
    }

    // Gentle sub-harmonic drone to ground the tones organically
    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(carrierFreq / 2, ctx.currentTime);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.18, ctx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(this.masterGain);

    oscL.start();
    oscR.start();
    subOsc.start();

    this.activeNodes.push(
      oscL,
      gainL,
      pannerL,
      oscR,
      gainR,
      pannerR,
      subOsc,
      subGain,
      padSource,
      padFilter,
      padGain,
      this.masterGain
    );
    this.currentMode = modeName;
  }
}

export const ambientAudio = new AmbientAudioEngine();
