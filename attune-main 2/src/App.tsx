import React, { useState, useEffect, useRef } from "react";
import { HarmonyVoice, VocalAnalysis, PreloadedTrack } from "./types";
import { PRELOADED_TRACKS } from "./lib/preloadedTracks";
import { noteToFreq, SynthesizedVoice, autoCorrelate } from "./lib/vocalEngine";
import VoiceRoom from "./components/VoiceRoom";
import VoiceModelControls from "./components/VoiceModelControls";
import AudioVisualizer from "./components/AudioVisualizer";
import ArrangementGrid from "./components/ArrangementGrid";
import LandingPage from "./components/LandingPage";

import { 
  Mic, 
  Play, 
  Square, 
  Sparkles, 
  Settings, 
  Music, 
  Volume2, 
  HelpCircle, 
  Check, 
  AlertCircle,
  Lightbulb,
  Radio,
  RefreshCw,
  Cpu,
  Download,
  ArrowLeft
} from "lucide-react";

// Default standard initial voice arrangement
const DEFAULT_VOICES: HarmonyVoice[] = [
  {
    id: "lead",
    name: "Lead Vocal (Main)",
    intervalSteps: 0,
    panning: 0,
    delayMs: 0,
    volume: 1.0,
    timbreModifier: "Normal",
    genderShift: "Neutral",
    enabled: true,
    detune: 0,
    vowel: "Ah",
    x: 0,
    y: 0.9,
  },
  {
    id: "voice-1",
    name: "Alto Harmony",
    intervalSteps: 4, // Major Third Above
    panning: -45,
    delayMs: 18,
    volume: 0.75,
    timbreModifier: "Warm & Airy",
    genderShift: "Higher Formant",
    enabled: true,
    detune: 8,
    vowel: "Ah",
    x: -0.45,
    y: 0.7,
  },
  {
    id: "voice-2",
    name: "Tenor Companion",
    intervalSteps: -5, // Perfect Fourth Below
    panning: 45,
    delayMs: 25,
    volume: 0.7,
    timbreModifier: "Deep & Resonant",
    genderShift: "Lower Formant",
    enabled: true,
    detune: -6,
    vowel: "Ah",
    x: 0.45,
    y: 0.65,
  },
  {
    id: "voice-3",
    name: "Soprano Echo",
    intervalSteps: 7, // Perfect Fifth Above
    panning: -80,
    delayMs: 35,
    volume: 0.6,
    timbreModifier: "Crisp & Sibilant",
    genderShift: "Higher Formant",
    enabled: true,
    detune: 12,
    vowel: "Oh",
    x: -0.8,
    y: 0.55,
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<"landing" | "studio">("landing");
  const [voices, setVoices] = useState<HarmonyVoice[]>(() => {
    try {
      const saved = localStorage.getItem("attune_voices");
      return saved ? JSON.parse(saved) : DEFAULT_VOICES;
    } catch (e) {
      console.error("Error reading voices from localStorage", e);
      return DEFAULT_VOICES;
    }
  });
  const [showHeader, setShowHeader] = useState<boolean>(true);
  const lastScrollY = useRef<number>(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scroll down - hide header
        setShowHeader(false);
      } else {
        // Scroll up - show header
        setShowHeader(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("attune_voices", JSON.stringify(voices));
    } catch (e) {
      console.error("Error writing voices to localStorage", e);
    }
  }, [voices]);

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("voice-1");
  const [inputMode, setInputMode] = useState<"track" | "mic">(() => {
    try {
      const saved = localStorage.getItem("attune_input_mode");
      return (saved === "track" || saved === "mic") ? saved : "track";
    } catch (e) {
      console.error("Error reading inputMode from localStorage", e);
      return "track";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("attune_input_mode", inputMode);
    } catch (e) {
      console.error("Error writing inputMode to localStorage", e);
    }
  }, [inputMode]);
  
  // Track Mode States
  const [selectedTrack, setSelectedTrack] = useState<PreloadedTrack>(PRELOADED_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPlayTime, setCurrentPlayTime] = useState<number>(0);
  const [totalPlayTime, setTotalPlayTime] = useState<number>(12); // seconds of melody
  const [activeFrequencies, setActiveFrequencies] = useState<{ [id: string]: number }>({});
  const [soloedVoiceId, setSoloedVoiceId] = useState<string | null>(null);

  const handleToggleSolo = (voiceId: string) => {
    setSoloedVoiceId((prev) => (prev === voiceId ? null : voiceId));
  };

  // Lyrics & Custom Analysis States
  const [lyricsText, setLyricsText] = useState<string>(PRELOADED_TRACKS[0].lyrics);
  const [selectedGenre, setSelectedGenre] = useState<string>("Synthpop / Retrowave");
  const [selectedStyle, setSelectedStyle] = useState<string>("Standard Modern Harmonizer");
  const [customKey, setCustomKey] = useState<string>("C# Minor");
  
  const [analysis, setAnalysis] = useState<VocalAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Audio Context Ref & Synth Voices Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthsRef = useRef<{ [id: string]: SynthesizedVoice }>({});
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // Melody Playback intervals
  const playbackTimerRef = useRef<any>(null);

  // Initialize Web Audio context lazily on user gesture
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Create a compressor/limiter before master out to avoid distortion
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-1.5, ctx.currentTime);
      limiter.knee.setValueAtTime(30, ctx.currentTime);
      limiter.ratio.setValueAtTime(12, ctx.currentTime);
      limiter.attack.setValueAtTime(0.003, ctx.currentTime);
      limiter.release.setValueAtTime(0.25, ctx.currentTime);
      limiter.connect(ctx.destination);

      // Setup synthesizer instances
      voices.forEach((v) => {
        const synth = new SynthesizedVoice(ctx);
        synth.connect(limiter);
        synth.setParams(v);
        synthsRef.current[v.id] = synth;
      });
    } else if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Sync vocal engine parameters whenever voices state changes
  useEffect(() => {
    voices.forEach((v) => {
      const synth = synthsRef.current[v.id];
      if (synth && audioCtxRef.current) {
        synth.setParams(v);
        
        // Also if solo mode is active, we should immediately stop non-soloed voices if playing
        const isSoloedMode = soloedVoiceId !== null;
        const isThisVoiceAudible = isSoloedMode ? v.id === soloedVoiceId : v.enabled;
        if (!isThisVoiceAudible) {
          synth.stop();
        }
      }
    });
  }, [voices, soloedVoiceId]);

  // Clean up playback and mic on unmount
  useEffect(() => {
    return () => {
      stopPlayback();
      stopMic();
    };
  }, []);

  // Sync lyrics when changing selected tracks
  const handleTrackChange = (track: PreloadedTrack) => {
    setSelectedTrack(track);
    setLyricsText(track.lyrics);
    setCustomKey(track.key);
    setSelectedGenre(track.genre);
    if (isPlaying) {
      stopPlayback();
    }
  };

  // 1. Core Synthesis Playback loop for Preloaded Tracks
  const startPlayback = () => {
    const ctx = initAudio();
    if (!ctx) return;

    stopPlayback();
    stopMic();
    setIsPlaying(true);
    setCurrentPlayTime(0);

    const startTime = ctx.currentTime;
    const melody = selectedTrack.melodyNotes;
    
    // Total track length in seconds
    const trackDuration = melody[melody.length - 1].time + melody[melody.length - 1].duration + 1;
    setTotalPlayTime(trackDuration);

    let activeNotesTracker: { [time: number]: boolean } = {};

    playbackTimerRef.current = setInterval(() => {
      const elapsed = ctx.currentTime - startTime;
      setCurrentPlayTime(elapsed);

      if (elapsed >= trackDuration) {
        stopPlayback();
        return;
      }

      // Check which melody note falls within this elapsed time
      const currentNote = melody.find(
        (n) => elapsed >= n.time && elapsed < n.time + n.duration
      );

      if (currentNote) {
        const leadFreq = noteToFreq(currentNote.note);
        
        // Setup current frequencies to display in visualizer
        const newFreqs: { [id: string]: number } = {};

        voices.forEach((v) => {
          const isSoloedMode = soloedVoiceId !== null;
          const isThisVoiceAudible = isSoloedMode ? v.id === soloedVoiceId : v.enabled;

          if (!isThisVoiceAudible) {
            const synth = synthsRef.current[v.id];
            if (synth) {
              synth.stop();
            }
            return;
          }

          const synth = synthsRef.current[v.id];
          if (synth) {
            // Apply spacing intervals to determine note frequencies
            const shiftedFreq = leadFreq * Math.pow(2, v.intervalSteps / 12);
            newFreqs[v.id] = shiftedFreq;

            // Apply voice parameters dynamically
            if (currentNote.vowel) {
              synth.vowel = currentNote.vowel;
            }

            if (!synth.osc) {
              synth.start(shiftedFreq, v.detune);
            } else {
              synth.setFrequency(shiftedFreq, v.detune);
            }
          }
        });

        setActiveFrequencies(newFreqs);
      } else {
        // Silent block: stop oscillators
        voices.forEach((v) => {
          const synth = synthsRef.current[v.id];
          if (synth) {
            synth.stop();
          }
        });
        setActiveFrequencies({});
      }
    }, 45);
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    // Stop all synthesizers
    voices.forEach((v) => {
      const synth = synthsRef.current[v.id];
      if (synth) {
        synth.stop();
      }
    });
    setActiveFrequencies({});
    setCurrentPlayTime(0);
  };

  // 2. Microphone live harmonizer pitch detection loop
  const startMic = async () => {
    const ctx = initAudio();
    if (!ctx) return;

    stopPlayback();
    stopMic();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);
      
      // Use standard AnalyserNode for autocorrelation
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      micAnalyserRef.current = analyser;
      source.connect(analyser);

      // Use a ScriptProcessorNode to run raw time-domain autocorrelation calculations
      const processor = ctx.createScriptProcessor(2048, 1, 1);
      micProcessorRef.current = processor;
      analyser.connect(processor);
      processor.connect(ctx.destination);

      const buffer = new Float32Array(analyser.fftSize);

      processor.onaudioprocess = () => {
        analyser.getFloatTimeDomainData(buffer);
        const pitch = autoCorrelate(buffer, ctx.sampleRate);

        if (pitch > 0) {
          // Detected voice frequency! Apply intervals to synthesize backing tracks
          const newFreqs: { [id: string]: number } = {};

          voices.forEach((v) => {
            const isSoloedMode = soloedVoiceId !== null;
            const isThisVoiceAudible = isSoloedMode ? v.id === soloedVoiceId : v.enabled;

            if (!isThisVoiceAudible) {
              const synth = synthsRef.current[v.id];
              if (synth) {
                synth.stop();
              }
              return;
            }

            const synth = synthsRef.current[v.id];
            if (synth) {
              const shiftedFreq = pitch * Math.pow(2, v.intervalSteps / 12);
              newFreqs[v.id] = shiftedFreq;

              if (!synth.osc) {
                synth.start(shiftedFreq, v.detune);
              } else {
                synth.setFrequency(shiftedFreq, v.detune);
              }
            }
          });

          setActiveFrequencies(newFreqs);
        } else {
          // Silent or un-pitched: stop synthesis oscillators
          voices.forEach((v) => {
            const synth = synthsRef.current[v.id];
            if (synth) {
              synth.stop();
            }
          });
          setActiveFrequencies({});
        }
      };

    } catch (err: any) {
      console.error("Failed to access microphone", err);
      alert("Microphone permission denied. Please allow microphone permissions to use real-time singing mode.");
      setInputMode("track");
    }
  };

  const stopMic = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (micProcessorRef.current) {
      micProcessorRef.current.disconnect();
      micProcessorRef.current = null;
    }
    if (micAnalyserRef.current) {
      micAnalyserRef.current.disconnect();
      micAnalyserRef.current = null;
    }
    
    // Stop all synth instances
    voices.forEach((v) => {
      const synth = synthsRef.current[v.id];
      if (synth) {
        synth.stop();
      }
    });
    setActiveFrequencies({});
  };

  // Toggle input mode (track synth vs live microphone)
  const handleToggleInputMode = (mode: "track" | "mic") => {
    if (mode === "track") {
      stopMic();
      setInputMode("track");
    } else {
      stopPlayback();
      setInputMode("mic");
      startMic();
    }
  };

  // Update a single voice configuration (called by sliders and soundstage)
  const handleUpdateVoice = (updatedVoice: HarmonyVoice) => {
    setVoices((prev) => prev.map((v) => (v.id === updatedVoice.id ? updatedVoice : v)));
  };

  // 3. AI Vocal analysis via server-side Gemini call
  const handleAIVocalAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analyze-vocals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lyrics: lyricsText,
          genre: selectedGenre,
          style: selectedStyle,
          selectedKey: customKey,
        }),
      });

      if (!res.ok) {
        throw new Error("Vocal analysis failed. Please check backend log details.");
      }

      const data: VocalAnalysis = await res.json();
      setAnalysis(data);

      // Overwrite current key and BPM with AI detected values
      setCustomKey(data.detectedKey);
      
      // Update harmony voice steps and styling parameters from AI arrangement recommendations!
      if (data.harmonyVoices && data.harmonyVoices.length > 0) {
        setVoices((prev) => {
          return prev.map((oldVoice) => {
            // Find matched AI voice by array index (excluding lead)
            if (oldVoice.id === "lead") return oldVoice;
            const aiIndex = oldVoice.id === "voice-1" ? 0 : oldVoice.id === "voice-2" ? 1 : 2;
            const aiVoice = data.harmonyVoices[aiIndex];
            
            if (aiVoice) {
              return {
                ...oldVoice,
                name: aiVoice.name,
                intervalSteps: aiVoice.intervalSteps,
                panning: aiVoice.panning,
                delayMs: aiVoice.delayMs,
                volume: aiVoice.volume,
                timbreModifier: aiVoice.timbreModifier,
                genderShift: aiVoice.genderShift,
              };
            }
            return oldVoice;
          });
        });
      }
    } catch (err: any) {
      console.warn("Vocal analysis server is offline or statically hosted. Emulating dynamic vocal analysis on the client side...", err);
      
      // Simulate API response time for dynamic feel
      await new Promise((resolve) => setTimeout(resolve, 1400));
      
      const keyToUse = customKey === "Detect Automatically" ? "G Major" : customKey;
      const bpmToUse = selectedGenre === "Jazz" ? 95 : selectedGenre === "Ballad" ? 72 : selectedGenre === "R&B / Soul" ? 88 : 115;
      
      const lines = lyricsText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
      const defaultPhrases = [
        "I hear the melody rising up",
        "Tuning the chords to my heartbeat",
        "Voices align in perfect space",
        "Beautiful echoes in the dark"
      ];
      
      const activePhrases = lines.length > 0 ? lines.slice(0, 4) : defaultPhrases;
      const chordPool = ["Em", "C", "G", "D", "Am", "F", "D/F#", "B7"];
      
      const emulatedChords = activePhrases.map((phrase, idx) => ({
        lyricPhrase: phrase.substring(0, 50),
        chord: chordPool[idx % chordPool.length],
        beatCount: 4
      }));

      const fallbackData: VocalAnalysis = {
        detectedKey: keyToUse,
        bpm: bpmToUse,
        genreStyle: `Emulated ${selectedGenre || "Pop"} Harmonies (${selectedStyle || "Standard"}) [Client Static Fallback]`,
        chords: emulatedChords,
        harmonyVoices: [
          {
            id: "voice-1",
            name: "Ethereal Alto",
            intervalSteps: 4,
            panning: -35,
            delayMs: 18,
            volume: 0.8,
            timbreModifier: "Warm & Airy",
            genderShift: "Neutral",
            enabled: true,
            detune: 0,
            vowel: "Ah",
            x: -0.5,
            y: 0.5
          },
          {
            id: "voice-2",
            name: "Tenor Companion",
            intervalSteps: -5,
            panning: 35,
            delayMs: 25,
            volume: 0.75,
            timbreModifier: "Warm & Airy",
            genderShift: "Neutral",
            enabled: true,
            detune: 0,
            vowel: "Ah",
            x: 0.5,
            y: 0.5
          },
          {
            id: "voice-3",
            name: "Deep Support",
            intervalSteps: -12,
            panning: 0,
            delayMs: 32,
            volume: 0.6,
            timbreModifier: "Deep & Resonant",
            genderShift: "Lower Formant",
            enabled: true,
            detune: 0,
            vowel: "Ah",
            x: 0,
            y: 0.8
          }
        ],
        lyricsArrangement: emulatedChords.map((chordObj, idx) => {
          const vocalRoles = ["Lead + Alto", "Lead + Alto + Tenor", "Full Choir", "Lead Solo"];
          const instructions = ["Build soft texture", "Expand stereo width", "Full harmonic bloom", "Intimate resolution"];
          return {
            phrase: chordObj.lyricPhrase,
            voicesActive: vocalRoles[idx % vocalRoles.length],
            instructions: instructions[idx % instructions.length]
          };
        }),
        coachingTips: [
          "Keep vocal tone light and breathy to let the harmonies sit cleanly in the mix.",
          "Slightly back off the mic during multi-part harmony sections to blend seamlessly.",
          "Note: Running in Client Static Emulation mode. In live server environments, Gemini AI parses lyrics semantically."
        ]
      };

      setAnalysis(fallbackData);
      setCustomKey(fallbackData.detectedKey);

      if (fallbackData.harmonyVoices && fallbackData.harmonyVoices.length > 0) {
        setVoices((prev) => {
          return prev.map((oldVoice) => {
            if (oldVoice.id === "lead") return oldVoice;
            const aiIndex = oldVoice.id === "voice-1" ? 0 : oldVoice.id === "voice-2" ? 1 : 2;
            const aiVoice = fallbackData.harmonyVoices[aiIndex];
            
            if (aiVoice) {
              return {
                ...oldVoice,
                name: aiVoice.name,
                intervalSteps: aiVoice.intervalSteps,
                panning: aiVoice.panning,
                delayMs: aiVoice.delayMs,
                volume: aiVoice.volume,
                timbreModifier: aiVoice.timbreModifier,
                genderShift: aiVoice.genderShift,
              };
            }
            return oldVoice;
          });
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. Apply preset arrangement templates
  const handleApplyPreset = (presetName: string) => {
    setVoices((prev) => {
      return prev.map((voice) => {
        if (voice.id === "lead") return voice;
        
        if (presetName === "Classic Trio") {
          if (voice.id === "voice-1") {
            return { ...voice, enabled: true, intervalSteps: 4, panning: -40, delayMs: 15, volume: 0.8, timbreModifier: "Warm & Airy" };
          }
          if (voice.id === "voice-2") {
            return { ...voice, enabled: true, intervalSteps: -5, panning: 40, delayMs: 25, volume: 0.7, timbreModifier: "Deep & Resonant" };
          }
          if (voice.id === "voice-3") {
            return { ...voice, enabled: false };
          }
        } else if (presetName === "Cathedral Choir") {
          if (voice.id === "voice-1") {
            return { ...voice, enabled: true, intervalSteps: -12, panning: -60, delayMs: 35, volume: 0.85, timbreModifier: "Warm & Airy", genderShift: "Lower Formant" };
          }
          if (voice.id === "voice-2") {
            return { ...voice, enabled: true, intervalSteps: 7, panning: 60, delayMs: 28, volume: 0.75, timbreModifier: "Deep & Resonant", genderShift: "Higher Formant" };
          }
          if (voice.id === "voice-3") {
            return { ...voice, enabled: true, intervalSteps: 12, panning: -85, delayMs: 40, volume: 0.65, timbreModifier: "Crisp & Sibilant", genderShift: "Higher Formant" };
          }
        } else if (presetName === "Modern Pop Duet") {
          if (voice.id === "voice-1") {
            return { ...voice, enabled: true, intervalSteps: 3, panning: -20, delayMs: 12, volume: 0.9, timbreModifier: "Crisp & Sibilant", detune: 15 };
          }
          if (voice.id === "voice-2") {
            return { ...voice, enabled: false };
          }
          if (voice.id === "voice-3") {
            return { ...voice, enabled: false };
          }
        } else if (presetName === "Barbershop Quartet") {
          if (voice.id === "voice-1") {
            return { ...voice, enabled: true, intervalSteps: 4, panning: -30, delayMs: 15, volume: 0.75, timbreModifier: "Warm & Airy" };
          }
          if (voice.id === "voice-2") {
            return { ...voice, enabled: true, intervalSteps: 7, panning: 30, delayMs: 20, volume: 0.7, timbreModifier: "Normal" };
          }
          if (voice.id === "voice-3") {
            return { ...voice, enabled: true, intervalSteps: -12, panning: 80, delayMs: 30, volume: 0.8, timbreModifier: "Deep & Resonant", genderShift: "Lower Formant" };
          }
        }
        return voice;
      });
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 1. Header Navigation */}
      {currentView === "landing" ? (
        <header className={`border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-transform duration-300 ease-in-out ${showHeader ? "translate-y-0" : "-translate-y-full"}`}>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/10 shrink-0">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-sans font-semibold text-lg tracking-tight text-white">
                  Attune AI Vocal Harmonizer
                </h1>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                  v1.5
                </span>
              </div>
              <p className="font-sans text-xs text-slate-400 mt-0.5">
                Neural network multi-part backing arrangements & voice modeling studio
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 w-full md:w-auto justify-between md:justify-end">
            {/* View Toggle Navigation */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
              <button
                onClick={() => {
                  stopPlayback();
                  stopMic();
                  setCurrentView("landing");
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                  currentView === "landing"
                    ? "bg-fuchsia-500 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Features & Guide
              </button>
              <button
                onClick={() => setCurrentView("studio")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                  currentView === "studio"
                    ? "bg-cyan-500 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Interactive Studio
              </button>
            </div>

            {/* Key / BPM Indicators */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-xl">
              <div className="flex flex-col text-right">
                <span className="font-sans text-[9px] uppercase tracking-wider text-slate-500 font-bold">Active Key</span>
                <span className="font-mono text-xs font-bold text-cyan-400">{customKey}</span>
              </div>
              <div className="w-px h-6 bg-slate-800/80 mx-2" />
              <div className="flex flex-col text-right">
                <span className="font-sans text-[9px] uppercase tracking-wider text-slate-500 font-bold">Tempo</span>
                <span className="font-mono text-xs font-bold text-fuchsia-400">{analysis?.bpm || selectedTrack.bpm} BPM</span>
              </div>
            </div>
          </div>
        </header>
      ) : (
        <header className={`border-b border-slate-900 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center transition-transform duration-300 ease-in-out ${showHeader ? "translate-y-0" : "-translate-y-full"}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/10 shrink-0">
              <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse" />
            </div>
            <h1 className="font-sans font-extrabold text-lg sm:text-2xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400">
              Attune
            </h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                const configData = {
                  appName: "Attune Vocal Studio",
                  exportedAt: new Date().toISOString(),
                  key: customKey,
                  tempo: analysis?.bpm || selectedTrack.bpm,
                  voices: voices.map(v => ({
                    id: v.id,
                    name: v.name,
                    enabled: v.enabled,
                    intervalSteps: v.intervalSteps,
                    panning: v.panning,
                    delayMs: v.delayMs,
                    volume: v.volume,
                    timbreModifier: v.timbreModifier,
                    genderShift: v.genderShift,
                    detune: v.detune,
                    vowel: v.vowel,
                    x: v.x,
                    y: v.y,
                  }))
                };
                const blob = new Blob([JSON.stringify(configData, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `attune-setup-${customKey.toLowerCase().replace(/\s+/g, "-")}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-white text-[10px] sm:text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shadow-md shadow-cyan-500/10"
              title="Export Current Vocal Setup"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Setup</span>
              <span className="inline sm:hidden">Export</span>
            </button>
            <button
              onClick={() => {
                stopPlayback();
                stopMic();
                setCurrentView("landing");
              }}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] sm:text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5"
              title="Back to Guide"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Guide</span>
              <span className="inline sm:hidden">Back</span>
            </button>
          </div>
        </header>
      )}

      {/* 2. Content view layout */}
      {currentView === "landing" ? (
        <LandingPage onLaunchStudio={() => setCurrentView("studio")} />
      ) : (
        /* 2. Main Dashboard Layout */
        <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left Hand: Input Sources, Real-time Engine Controls, and Canvas Visualizer (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Audio Input Selector & Playback */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <h3 className="font-sans font-semibold text-base text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              Harmonizer Signal Input
            </h3>

            {/* Input Selection Toggle */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl">
              <button
                onClick={() => handleToggleInputMode("track")}
                className={`py-2 text-xs font-sans font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  inputMode === "track"
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                Interactive AI Vocalist
              </button>
              <button
                onClick={() => handleToggleInputMode("mic")}
                className={`py-2 text-xs font-sans font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  inputMode === "mic"
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                Live Microphone
              </button>
            </div>

            {/* Content for Tracks Playback */}
            {inputMode === "track" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="font-sans text-xs text-slate-400">Select Solo Vocal Melody</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRELOADED_TRACKS.map((track) => (
                      <button
                        key={track.id}
                        onClick={() => handleTrackChange(track)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          selectedTrack.id === track.id
                            ? "bg-slate-950 border-cyan-500/50 text-cyan-400"
                            : "bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="font-sans font-bold text-xs truncate text-white">{track.title}</div>
                        <div className="font-mono text-[9px] text-slate-500 mt-1">{track.key} | {track.bpm} BPM</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Play / Stop buttons */}
                <div className="flex gap-2">
                  {!isPlaying ? (
                    <button
                      onClick={startPlayback}
                      className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3 px-4 rounded-xl font-sans font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Play Vocal Synth Track
                    </button>
                  ) : (
                    <button
                      onClick={stopPlayback}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-3 px-4 rounded-xl font-sans font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-red-400" />
                      Stop Vocal Playback
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <Mic className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0 animate-pulse" />
                  <div>
                    <h4 className="font-sans font-semibold text-xs text-red-400 uppercase tracking-wider">Live Pitch Tracker Active</h4>
                    <p className="font-sans text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Sing or hum into your microphone. The autocorrelation pitch tracker will detect your pitch real-time and synthesize custom backing vocals perfectly aligned to the key!
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={stopMic}
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 py-2.5 rounded-xl font-sans font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Mute / Standby Mic
                  </button>
                  <button
                    onClick={startMic}
                    className="flex-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 py-2.5 rounded-xl font-sans font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Audio Stream
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* AI Vocal Alignment & Analysis Config */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-semibold text-base text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-fuchsia-400" />
                Vocal Lyrics & Style Analyzer
              </h3>
              <span className="text-[10px] bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                Gemini 3.5 AI
              </span>
            </div>

            <div className="space-y-4">
              {/* Lyrics input */}
              <div className="space-y-1.5">
                <label className="font-sans text-xs text-slate-300 flex justify-between">
                  <span>Lyrics or Hum phrasing</span>
                  <span className="text-[10px] text-slate-500">{lyricsText.length} chars</span>
                </label>
                <textarea
                  value={lyricsText}
                  onChange={(e) => setLyricsText(e.target.value)}
                  placeholder="Enter lyrics here to analyze arrangement chords and backing spreads..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-fuchsia-500/50 outline-none rounded-xl p-3 text-xs font-sans text-slate-200 placeholder-slate-600 resize-none"
                />
              </div>

              {/* Genre & Style details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-sans text-xs text-slate-400">Genre Profile</label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-fuchsia-500/50 outline-none rounded-xl p-2.5 text-xs text-slate-300"
                  >
                    <option value="Synthpop / Retrowave">Synthpop / Electro</option>
                    <option value="R&B / Soul / Neo-Soul">R&B / Neo-Soul</option>
                    <option value="Gospel / Liturgical / Classical">Gospel / Choral</option>
                    <option value="Ethereal / Ambient / Shoegaze">Ethereal Ambient</option>
                    <option value="Jazz Quartet / Swing">Jazz Quartet</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="font-sans text-xs text-slate-400">Harmonizer Rig Styling</label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-fuchsia-500/50 outline-none rounded-xl p-2.5 text-xs text-slate-300"
                  >
                    <option value="Standard Modern Harmonizer">Clean Modern (Thirds)</option>
                    <option value="Tight Sibilant Vintage Double">Vintage Panned Double</option>
                    <option value="Ethereal Reverb Prism Wide">Wide Ambient Prism</option>
                    <option value="Gospel Full Multi-Octave Array">Deep Liturgical Spread</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleAIVocalAnalysis}
                disabled={isAnalyzing}
                className="w-full bg-slate-950 hover:bg-slate-900 border border-fuchsia-500/30 hover:border-fuchsia-500/50 text-fuchsia-400 hover:text-fuchsia-300 py-3 rounded-xl font-sans font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-fuchsia-400" />
                    AI Analyzing Spreads & Key Alignment...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    Generate AI Key & Backing Vocals Alignment
                  </>
                )}
              </button>

              {analysisError && (
                <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl flex items-start gap-2 text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="font-sans text-[11px] leading-relaxed">{analysisError}</span>
                </div>
              )}

              {analysis && (
                <div className="p-4 bg-fuchsia-500/5 border border-fuchsia-500/10 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-sans text-fuchsia-400 font-bold uppercase tracking-wider">
                    <Check className="w-4 h-4" />
                    AI Harmony Plan Aligned
                  </div>
                  <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                    <strong>Evaluated:</strong> {analysis.genreStyle}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Real-time active Waveform Canvas Visualizer */}
          <AudioVisualizer
            voices={voices}
            activeFrequencies={activeFrequencies}
            isRecording={inputMode === "mic"}
            isPlaying={isPlaying}
          />

        </div>

        {/* Right Hand Side: Soundstage, Neural voice modeling, presets grids (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Virtual Stage Drag-and-drop soundstage */}
          <VoiceRoom
            voices={voices}
            onUpdateVoice={handleUpdateVoice}
          />

          {/* Neural Voice modeling dials / controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <VoiceModelControls
              voices={voices}
              selectedVoiceId={selectedVoiceId}
              onSelectVoice={setSelectedVoiceId}
              onUpdateVoice={handleUpdateVoice}
              soloedVoiceId={soloedVoiceId}
              onToggleSolo={handleToggleSolo}
            />

            {/* Harmony Grid Alignment, Chords, and Spacing presets */}
            <ArrangementGrid
              voices={voices}
              analysis={analysis}
              onApplyPreset={handleApplyPreset}
              currentPlayTime={currentPlayTime}
              totalPlayTime={totalPlayTime}
              isSynthesizing={Object.keys(activeFrequencies).length > 0}
            />
          </div>

        </div>
      </main>
      )}

      {/* 3. Footer branding */}
      <footer className="border-t border-slate-900 bg-slate-900/10 py-6 text-center text-slate-600 font-sans text-xs mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>
            Powered by high-performance Web Audio API synthesis & Gemini 3.5 Flash neural models.
          </p>
          <div className="flex flex-col md:items-end gap-1 text-right">
            <p className="font-mono text-[10px]">
              © 2026 AI Vocal Studio Inc. All rights reserved.
            </p>
            <p className="text-[11px] text-fuchsia-400 font-semibold font-sans tracking-wide">
              Designed & developed by <span className="text-cyan-400">Anderson</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
