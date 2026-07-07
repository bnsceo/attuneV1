import { PreloadedTrack } from "../types";

export const PRELOADED_TRACKS: PreloadedTrack[] = [
  {
    id: "neon-dreams",
    title: "Neon Horizon (Synthpop)",
    genre: "Synthpop / Retrowave",
    bpm: 110,
    key: "C# Minor",
    lyrics: "Running through the neon rain, trying to forget your name. The grid is glowing in the dark, electricity strikes a spark.",
    melodyNotes: [
      { time: 0, note: "G#3", duration: 0.8, vowel: "Ah" },
      { time: 1, note: "G#3", duration: 0.8, vowel: "Ah" },
      { time: 2, note: "A3", duration: 0.8, vowel: "Ee" },
      { time: 3, note: "B3", duration: 0.8, vowel: "Ee" },
      { time: 4, note: "C#4", duration: 1.6, vowel: "Oh" },
      { time: 6, note: "B3", duration: 1.6, vowel: "Oh" },
      
      { time: 8, note: "E3", duration: 0.8, vowel: "Oo" },
      { time: 9, note: "F#3", duration: 0.8, vowel: "Oo" },
      { time: 10, note: "G#3", duration: 0.8, vowel: "Eh" },
      { time: 11, note: "A3", duration: 0.8, vowel: "Eh" },
      { time: 12, note: "B3", duration: 1.6, vowel: "Ah" },
      { time: 14, note: "G#3", duration: 1.6, vowel: "Ah" },
    ]
  },
  {
    id: "golden-hour",
    title: "Golden Hour (R&B Soul)",
    genre: "R&B / Soul / Neo-Soul",
    bpm: 78,
    key: "F Major",
    lyrics: "Summer breeze in the warm night air, washing away all the sorrow and care. Hold my hand, let the music play.",
    melodyNotes: [
      { time: 0, note: "F3", duration: 1.2, vowel: "Ah" },
      { time: 1.5, note: "A3", duration: 0.6, vowel: "Ah" },
      { time: 2.2, note: "C4", duration: 1.2, vowel: "Ee" },
      { time: 3.5, note: "D4", duration: 1.2, vowel: "Oo" },
      { time: 5, note: "C4", duration: 2.0, vowel: "Oh" },
      
      { time: 8, note: "Bb3", duration: 1.2, vowel: "Eh" },
      { time: 9.5, note: "G3", duration: 0.6, vowel: "Eh" },
      { time: 10.2, note: "F3", duration: 1.2, vowel: "Ah" },
      { time: 11.5, note: "D3", duration: 1.2, vowel: "Ah" },
      { time: 13, note: "C3", duration: 2.4, vowel: "Oh" },
    ]
  },
  {
    id: "gospel-choral",
    title: "Gospel Grace (Choral)",
    genre: "Gospel / Liturgical / Classical",
    bpm: 82,
    key: "A Major",
    lyrics: "Singing together, voices combine. Filling the cathedral with a spark divine.",
    melodyNotes: [
      { time: 0, note: "A3", duration: 1.5, vowel: "Ah" },
      { time: 1.5, note: "C#4", duration: 1.5, vowel: "Ee" },
      { time: 3, note: "E4", duration: 3.0, vowel: "Oo" },
      
      { time: 6, note: "D4", duration: 1.5, vowel: "Eh" },
      { time: 7.5, note: "B3", duration: 1.5, vowel: "Oh" },
      { time: 9, note: "A3", duration: 3.0, vowel: "Ah" },
    ]
  },
  {
    id: "ethereal-echoes",
    title: "Cathedral Echoes (Ambient)",
    genre: "Ethereal / Ambient / Shoegaze",
    bpm: 65,
    key: "E Minor",
    lyrics: "Floating down the silent stream, living inside a beautiful dream. Eternal light, shadows fade away.",
    melodyNotes: [
      { time: 0, note: "E3", duration: 2.0, vowel: "Ah" },
      { time: 2, note: "G3", duration: 2.0, vowel: "Ee" },
      { time: 4, note: "B3", duration: 2.0, vowel: "Oh" },
      { time: 6, note: "C4", duration: 2.0, vowel: "Oo" },
      { time: 8, note: "B3", duration: 4.0, vowel: "Eh" },
      
      { time: 12, note: "A3", duration: 2.0, vowel: "Ah" },
      { time: 14, note: "F#3", duration: 2.0, vowel: "Ah" },
      { time: 16, note: "E3", duration: 4.0, vowel: "Oh" },
    ]
  }
];
