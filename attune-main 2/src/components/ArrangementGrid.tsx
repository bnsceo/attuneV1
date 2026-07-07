import React from "react";
import { HarmonyVoice, VocalAnalysis, ChordProgression } from "../types";
import { Layers, HelpCircle, Music, Star, Landmark, Volume2 } from "lucide-react";

interface ArrangementGridProps {
  voices: HarmonyVoice[];
  analysis: VocalAnalysis | null;
  onApplyPreset: (presetName: string) => void;
  currentPlayTime: number;
  totalPlayTime: number;
  isSynthesizing?: boolean;
}

export default function ArrangementGrid({
  voices,
  analysis,
  onApplyPreset,
  currentPlayTime,
  totalPlayTime,
  isSynthesizing = false,
}: ArrangementGridProps) {
  const presets = [
    {
      name: "Classic Trio",
      description: "Warm Pop/Folk standard matching thirds above and perfect fifths below.",
      icon: Layers,
      color: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5",
    },
    {
      name: "Cathedral Choir",
      description: "Ethereal multi-octave arrangement with wide stereo panned singers.",
      icon: Landmark,
      color: "border-fuchsia-500/20 text-fuchsia-400 bg-fuchsia-500/5",
    },
    {
      name: "Modern Pop Duet",
      description: "Crisp vocal double panned tight with subtle detuning and sibilant timbre.",
      icon: Star,
      color: "border-amber-500/20 text-amber-400 bg-amber-500/5",
    },
    {
      name: "Barbershop Quartet",
      description: "Four distinct voice modeling profiles matching thirds, fifths, and deep bass octaves.",
      icon: Music,
      color: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
    },
  ];

  // Helper to determine active chord index based on approximate track time percentage
  const getActiveChordIndex = (chords: ChordProgression[]) => {
    if (!chords || chords.length === 0) return -1;
    if (totalPlayTime === 0) return 0;
    
    // Distribute chords evenly across the melody length for visual syncing
    const totalBeats = chords.reduce((sum, c) => sum + c.beatCount, 0);
    const progressPercent = currentPlayTime / totalPlayTime;
    const currentBeat = progressPercent * totalBeats;

    let beatCounter = 0;
    for (let i = 0; i < chords.length; i++) {
      beatCounter += chords[i].beatCount;
      if (currentBeat <= beatCounter) {
        return i;
      }
    }
    return chords.length - 1;
  };

  const activeChordIdx = analysis ? getActiveChordIndex(analysis.chords) : -1;

  return (
    <div className={`bg-slate-900 border rounded-2xl p-6 shadow-2xl flex flex-col gap-6 transition-all duration-500 ${
      isSynthesizing 
        ? "border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/10" 
        : "border-slate-800"
    }`}>
      {/* 1. Vocal Arrangement Presets */}
      <div>
        <h3 className="font-sans font-semibold text-base text-white flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-cyan-400" />
          Neural Arrangement rules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {presets.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.name}
                onClick={() => onApplyPreset(preset.name)}
                className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer hover:bg-slate-800/80 hover:border-slate-700/80 ${preset.color}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4" />
                  <span className="font-sans text-xs font-bold uppercase tracking-wider">{preset.name}</span>
                </div>
                <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Harmonized Chords & Progressions Block */}
      {analysis && (
        <div className="border-t border-slate-800/60 pt-5">
          <h4 className="font-sans font-semibold text-xs text-slate-300 uppercase tracking-wider mb-3">
            AI Key & Chords Alignment
          </h4>
          
          <div className="flex flex-wrap gap-2.5">
            {analysis.chords.map((item, index) => {
              const isActive = index === activeChordIdx;
              return (
                <div
                  key={index}
                  className={`p-3 rounded-xl border flex-1 min-w-[120px] transition-all duration-300 flex flex-col justify-between ${
                    isActive
                      ? isSynthesizing
                        ? "bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/30 text-cyan-50 scale-105 animate-[pulse_1.8s_infinite] ring-1 ring-cyan-500/50"
                        : "bg-cyan-500/10 border-cyan-500 shadow-lg text-cyan-100 scale-105"
                      : "bg-slate-950/60 border-slate-900 text-slate-400"
                  }`}
                >
                  <span className={`font-mono text-xs uppercase tracking-wider font-extrabold ${isActive ? "text-cyan-400" : "text-slate-300"}`}>
                    {item.chord}
                  </span>
                  <p className="font-sans text-[11px] truncate mt-1 text-slate-400 italic">
                    &ldquo;{item.lyricPhrase}&rdquo;
                  </p>
                  <div className="flex justify-between items-center mt-2 border-t border-slate-800/80 pt-1.5">
                    <span className="font-mono text-[9px] text-slate-500 uppercase">Beats: {item.beatCount}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Neural Voice Grouping Status */}
      <div className="border-t border-slate-800/60 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="font-sans font-bold text-xs text-slate-300 uppercase tracking-wider mb-2.5">
            Voice Spacing Spreads
          </h4>
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-900">
            {voices.map((v) => {
              if (v.id === "lead") return null;
              return (
                <div key={v.id} className="flex justify-between items-center text-xs">
                  <span className="font-sans font-medium text-slate-400">{v.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">Interval:</span>
                    <span className="font-mono font-bold text-cyan-400 w-8 text-right">
                      {v.intervalSteps > 0 ? `+${v.intervalSteps}` : v.intervalSteps}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Coaching Tips */}
        <div>
          <h4 className="font-sans font-bold text-xs text-slate-300 uppercase tracking-wider mb-2.5">
            Voice Performance Coaching
          </h4>
          <div className="space-y-1.5 max-h-[105px] overflow-y-auto pr-1 bg-slate-950/40 p-3 rounded-xl border border-slate-900/40">
            {analysis?.coachingTips ? (
              analysis.coachingTips.map((tip, idx) => (
                <p key={idx} className="font-sans text-[11px] text-slate-400 leading-snug flex gap-1.5">
                  <span className="text-cyan-400">•</span>
                  {tip}
                </p>
              ))
            ) : (
              <p className="font-sans text-[11px] text-slate-500 leading-snug">
                Enter your lyrics or record your voice. Our model will generate real-time performance coaching and key-alignment tips.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
