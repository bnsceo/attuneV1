export interface HarmonyVoice {
  id: string;
  name: string;
  intervalSteps: number; // semitone shift from lead
  panning: number; // -100 to 100
  delayMs: number; // 0 to 100ms offset
  volume: number; // 0.0 to 1.0
  timbreModifier: string; // e.g. "Warm & Airy", "Crisp", "Deep"
  genderShift: string; // e.g. "Higher Formant", "Neutral", "Lower Formant"
  enabled: boolean;
  // Live synth parameters
  detune: number; // cents, -50 to 50
  vowel: "Ah" | "Ee" | "Oh" | "Oo" | "Eh";
  x: number; // coordinate on the 3D stage (-1 to 1)
  y: number; // coordinate on the 3D stage (-1 to 1)
}

export interface ChordProgression {
  lyricPhrase: string;
  chord: string;
  beatCount: number;
}

export interface LyricArrangementLine {
  phrase: string;
  voicesActive: string;
  instructions: string;
}

export interface VocalAnalysis {
  detectedKey: string;
  bpm: number;
  genreStyle: string;
  chords: ChordProgression[];
  harmonyVoices: HarmonyVoice[];
  lyricsArrangement: LyricArrangementLine[];
  coachingTips: string[];
}

export interface PreloadedTrack {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  key: string;
  lyrics: string;
  melodyNotes: { time: number; note: string; duration: number; vowel?: "Ah" | "Ee" | "Oh" | "Oo" | "Eh" }[];
}
