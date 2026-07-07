import { HarmonyVoice } from "../types";

// Note to Frequency mapping
export function noteToFreq(note: string): number {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const regex = /^([A-G]#?)(-?\d+)$/;
  const match = note.match(regex);
  if (!match) return 440;
  const name = match[1];
  const octave = parseInt(match[2], 10);
  const keyNumber = notes.indexOf(name) + (octave + 1) * 12;
  return 440 * Math.pow(2, (keyNumber - 69) / 12);
}

// Map semitone shifts to note names relatively
export function shiftNote(note: string, semitones: number): string {
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const regex = /^([A-G]#?)(-?\d+)$/;
  const match = note.match(regex);
  if (!match) return note;
  const name = match[1];
  const octave = parseInt(match[2], 10);
  let keyNumber = notes.indexOf(name) + (octave + 1) * 12 + semitones;
  
  const shiftedOctave = Math.floor(keyNumber / 12) - 1;
  let shiftedNoteIndex = keyNumber % 12;
  if (shiftedNoteIndex < 0) {
    shiftedNoteIndex += 12;
  }
  return `${notes[shiftedNoteIndex]}${shiftedOctave}`;
}

// Formant frequency configurations for vowel filters (Adult Singer model)
export const VOWEL_FORMANTS = {
  Ah: [
    { freq: 800, q: 10, gain: 0 },
    { freq: 1200, q: 8, gain: -4 },
    { freq: 2800, q: 6, gain: -10 }
  ],
  Ee: [
    { freq: 280, q: 12, gain: 0 },
    { freq: 2300, q: 10, gain: -12 },
    { freq: 2900, q: 8, gain: -16 }
  ],
  Oh: [
    { freq: 550, q: 10, gain: 0 },
    { freq: 850, q: 10, gain: -6 },
    { freq: 2400, q: 6, gain: -14 }
  ],
  Oo: [
    { freq: 330, q: 12, gain: 0 },
    { freq: 650, q: 10, gain: -8 },
    { freq: 2200, q: 6, gain: -18 }
  ],
  Eh: [
    { freq: 530, q: 10, gain: 0 },
    { freq: 1840, q: 10, gain: -4 },
    { freq: 2480, q: 8, gain: -8 }
  ]
};

// Autocorrelation pitch detector (for real-time mic tracking)
export function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  // Perform simple Autocorrelation to extract fundamental frequency
  const SIZE = buffer.length;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.008) {
    return -1; // Silent
  }

  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < thres) {
      r1 = i;
      break;
    }
  }
  for (let i = SIZE - 1; i >= SIZE / 2; i--) {
    if (Math.abs(buffer[i]) < thres) {
      r2 = i;
      break;
    }
  }

  const prunedBuffer = buffer.subarray(r1, r2);
  const prunedSize = prunedBuffer.length;

  const correlations = new Float32Array(prunedSize);
  for (let i = 0; i < prunedSize; i++) {
    for (let j = 0; j < prunedSize - i; j++) {
      correlations[i] += prunedBuffer[j] * prunedBuffer[j + i];
    }
  }

  // Find the first peak
  let d = 0;
  while (correlations[d] > correlations[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < prunedSize; i++) {
    if (correlations[i] > maxval) {
      maxval = correlations[i];
      maxpos = i;
    }
  }

  let T0 = maxpos;

  // Refine peak via interpolation
  const x1 = correlations[T0 - 1];
  const x2 = correlations[T0];
  const x3 = correlations[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) {
    T0 = T0 - b / (2 * a);
  }

  const freq = sampleRate / T0;
  if (freq > 60 && freq < 1000) {
    return freq;
  }
  return -1;
}

// Voice Class that manages an oscillator and multi-formant filter banks
export class SynthesizedVoice {
  ctx: AudioContext;
  osc: OscillatorNode | null = null;
  formantFilters: BiquadFilterNode[] = [];
  gainNode: GainNode; // voice-level gain (enabled/volume from setParams)
  noteGain: GainNode; // note on/off envelope (controlled by start()/stop())
  delayNode: DelayNode;
  pannerNode: StereoPannerNode;
  noiseNode: AudioWorkletNode | ScriptProcessorNode | null = null; // for breathiness
  noiseGain: GainNode | null = null;

  targetFreq: number = 220;
  vowel: "Ah" | "Ee" | "Oh" | "Oo" | "Eh" = "Ah";
  genderShift: number = 1.0; // 1.0 = normal, 1.2 = higher, 0.8 = lower
  timbreType: string = "Normal"; // Normal, Warm, Crisp
  enabledVolume: number = 0; // last volume applied via setParams, restored on start()

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);

    // Separate envelope gain so that "note off" (silence between notes/pitches)
    // never permanently clobbers the voice-level volume set by setParams().
    this.noteGain = ctx.createGain();
    this.noteGain.gain.setValueAtTime(0, ctx.currentTime);

    this.delayNode = ctx.createDelay(1.0);
    this.delayNode.delayTime.setValueAtTime(0.015, ctx.currentTime);

    this.pannerNode = ctx.createStereoPanner();

    // Create 3 formant bandpass filters in parallel to simulate the throat/mouth cavity
    // We will connect: Oscillator -> split into 3 formant filters -> combine to gainNode
    for (let i = 0; i < 3; i++) {
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      this.formantFilters.push(filter);
    }

    // Connect filters to delayNode
    this.formantFilters.forEach(f => {
      f.connect(this.delayNode);
    });

    // Connect delay to panner -> note envelope -> voice-level gain
    this.delayNode.connect(this.pannerNode);
    this.pannerNode.connect(this.noteGain);
    this.noteGain.connect(this.gainNode);
  }

  connect(destination: AudioNode) {
    this.gainNode.connect(destination);
  }

  setParams(voice: HarmonyVoice) {
    // Volume (voice-level, independent of note on/off state)
    this.enabledVolume = voice.enabled ? voice.volume : 0;
    this.gainNode.gain.setTargetAtTime(this.enabledVolume, this.ctx.currentTime, 0.05);

    // Panning
    const panVal = voice.panning / 100;
    this.pannerNode.pan.setTargetAtTime(panVal, this.ctx.currentTime, 0.05);

    // Delay humanization
    const dTime = Math.max(0.005, voice.delayMs / 1000);
    this.delayNode.delayTime.setTargetAtTime(dTime, this.ctx.currentTime, 0.05);

    // Vowel selection
    this.vowel = voice.vowel;

    // Gender/Formant shift scale multiplier
    if (voice.genderShift === "Higher Formant") {
      this.genderShift = 1.25;
    } else if (voice.genderShift === "Lower Formant") {
      this.genderShift = 0.82;
    } else {
      this.genderShift = 1.0;
    }

    // Timbre modifiers
    this.timbreType = voice.timbreModifier;

    this.updateFormantFilters();
  }

  updateFormantFilters() {
    const formants = VOWEL_FORMANTS[this.vowel];
    if (!formants) return;

    formants.forEach((f, i) => {
      const filter = this.formantFilters[i];
      if (!filter) return;

      // Adjust formant frequency based on genderShift
      const freq = f.freq * this.genderShift;
      let qVal = f.q;

      // Timbre modifiers adjust Q factor or balance of formants
      if (this.timbreType.includes("Crisp")) {
        qVal = f.q * 1.3; // tighter resonance for crispness
      } else if (this.timbreType.includes("Warm")) {
        qVal = f.q * 0.75; // wider resonance for warmth
      }

      filter.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
      filter.Q.setTargetAtTime(qVal, this.ctx.currentTime, 0.05);
    });
  }

  start(freq: number, detuneCents: number = 0) {
    this.targetFreq = freq;
    
    // Stop previous if exists
    if (this.osc) {
      try {
        this.osc.stop();
      } catch (e) {}
    }

    // Create a pulse/sawtooth-like wave (vocal fold analog is rich in harmonics)
    this.osc = this.ctx.createOscillator();
    this.osc.type = "sawtooth";
    this.osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    this.osc.detune.setValueAtTime(detuneCents, this.ctx.currentTime);

    // Connect oscillator to all three formant filters
    this.formantFilters.forEach(f => {
      this.osc?.connect(f);
    });

    // Add breathiness / whisper noise filter if needed for Ethereal vocal modeling
    this.addBreathNoise();

    this.osc.start();
    this.updateFormantFilters();

    // Bring the note envelope back up (a prior stop() may have ramped this to 0;
    // without this, the voice would stay silent forever after its first pause).
    this.noteGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.noteGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.03);
  }

  addBreathNoise() {
    if (this.timbreType.includes("Airy") || this.timbreType.includes("Resonant")) {
      // Setup a basic white noise generator to simulate breathiness
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      // Filter noise to sound breathy (mostly high-end sibilance)
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(2500, this.ctx.currentTime);
      noiseFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.06, this.ctx.currentTime); // Subtle amount of breathiness

      noiseNode.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      
      // Connect breath noise to formant filters for natural resonance
      this.formantFilters.forEach(f => {
        noiseGain.connect(f);
      });

      noiseNode.start();
    }
  }

  setFrequency(freq: number, detuneCents: number = 0) {
    this.targetFreq = freq;
    if (this.osc) {
      this.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.08);
      this.osc.detune.setTargetAtTime(detuneCents, this.ctx.currentTime, 0.08);
    }
    // Re-affirm the note envelope is up. Handles the case where a pitch is
    // detected again while the previous oscillator hasn't been torn down yet
    // (i.e. within stop()'s 150ms grace window) — otherwise stop()'s gain
    // ramp-to-0 would win and the voice would stay silent.
    this.noteGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.noteGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.03);
  }

  stop() {
    // Only ramp the note envelope down — never touch gainNode here, since
    // that node represents the voice-level (enabled/volume) setting and
    // must persist across notes, not just the current note's duration.
    this.noteGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    setTimeout(() => {
      if (this.osc) {
        try {
          this.osc.stop();
        } catch (e) {}
        this.osc = null;
      }
    }, 150);
  }
}
