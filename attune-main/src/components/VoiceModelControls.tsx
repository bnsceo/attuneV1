import React from "react";
import { HarmonyVoice } from "../types";
import { Sliders, RefreshCw, AudioLines, Sparkles, Volume2, VolumeX } from "lucide-react";

interface VoiceModelControlsProps {
  voices: HarmonyVoice[];
  selectedVoiceId: string;
  onSelectVoice: (id: string) => void;
  onUpdateVoice: (updatedVoice: HarmonyVoice) => void;
  soloedVoiceId: string | null;
  onToggleSolo: (id: string) => void;
}

export default function VoiceModelControls({
  voices,
  selectedVoiceId,
  onSelectVoice,
  onUpdateVoice,
  soloedVoiceId,
  onToggleSolo,
}: VoiceModelControlsProps) {
  const currentVoice = voices.find((v) => v.id === selectedVoiceId) || voices[0];

  const updateParam = (key: keyof HarmonyVoice, value: any) => {
    if (currentVoice) {
      onUpdateVoice({
        ...currentVoice,
        [key]: value,
      });
    }
  };

  const vowels: ("Ah" | "Ee" | "Oh" | "Oo" | "Eh")[] = ["Ah", "Ee", "Oh", "Oo", "Eh"];
  const genders = ["Neutral", "Higher Formant", "Lower Formant"];
  const timbres = ["Normal", "Warm & Airy", "Crisp & Sibilant", "Deep & Resonant"];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans font-semibold text-base text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-fuchsia-400" />
            Vocal Console Strips
          </h3>
          <span className="font-sans text-[10px] uppercase tracking-wider bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 px-2 py-0.5 rounded-full font-bold">
            DSP Mixer
          </span>
        </div>

        {/* Voice Channel Strips (Each Voice gets a Row) */}
        <div className="space-y-2 mb-5">
          {voices.map((v) => {
            const isSelected = v.id === selectedVoiceId;
            const isSoloed = soloedVoiceId === v.id;
            const isMutedBySolo = soloedVoiceId !== null && !isSoloed;
            const isAudible = v.enabled && !isMutedBySolo;
            
            return (
              <div
                key={v.id}
                onClick={() => onSelectVoice(v.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-slate-950 border-fuchsia-500/50 shadow-md shadow-fuchsia-500/5"
                    : "bg-slate-950/40 border-slate-900/60 hover:bg-slate-950/70 hover:border-slate-800"
                }`}
              >
                {/* Voice info & selection indicator */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`w-1 h-7 rounded-full transition-all duration-300 ${
                    isSelected ? "bg-fuchsia-500 shadow-md shadow-fuchsia-500/50 scale-y-110" : "bg-slate-800 scale-y-90"
                  }`} />
                  <div className="flex flex-col min-w-0">
                    <span className={`font-sans text-xs font-bold truncate transition-colors duration-200 ${isSelected ? "text-white" : "text-slate-300"}`}>
                      {v.id === "lead" ? "Lead (Main)" : v.name.replace(" Voice", "")}
                    </span>
                    <span className="font-sans text-[10px] text-slate-500 truncate mt-0.5">
                      {v.id === "lead" ? "Primary vocal" : `${v.intervalSteps > 0 ? `+${v.intervalSteps}` : v.intervalSteps}st offset`}
                    </span>
                  </div>
                </div>

                {/* Controls (Solo & Mute Switches) */}
                <div className="flex items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                  {/* Solo Button */}
                  <button
                    onClick={() => onToggleSolo(v.id)}
                    className={`px-2 py-1 rounded text-[9px] font-mono font-extrabold border uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      isSoloed
                        ? "bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10 scale-105"
                        : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                    }`}
                    title={isSoloed ? "De-solo Voice" : "Solo Voice (mutes others)"}
                  >
                    Solo
                  </button>

                  {/* Tactile Mute/Enable Toggle Switch */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onUpdateVoice({
                          ...v,
                          enabled: !v.enabled
                        });
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-all duration-300 ease-out focus:outline-none hover:scale-105 active:scale-95 ${
                        v.enabled
                          ? isMutedBySolo
                            ? "bg-slate-800 border-slate-700/50"
                            : "bg-fuchsia-500 shadow-md shadow-fuchsia-500/20"
                          : "bg-slate-800"
                      }`}
                      title={v.enabled ? "Disable/Mute Voice" : "Enable/Unmute Voice"}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition-all duration-300 ease-out ${
                          v.enabled ? "translate-x-4 bg-white" : "translate-x-0.5 bg-slate-400"
                        }`}
                      />
                    </button>
                    {isAudible ? (
                      <Volume2 className="w-3.5 h-3.5 text-fuchsia-400/80" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Voice Parameter Header */}
        <div className="border-t border-slate-800/60 pt-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs font-bold uppercase tracking-wider text-slate-400">
              {currentVoice.name} Settings
            </span>
            <span className="font-mono text-[10px] text-slate-500">
              {currentVoice.id === "lead" ? "Dry input voice" : "Pitch-shifted harmony voice"}
            </span>
          </div>
        </div>

        {/* Selected Voice Parameter Sliders */}
        <div className="space-y-4">
          {/* Interval Steps (only for non-lead) */}
          {currentVoice.id !== "lead" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-sans text-slate-300 flex items-center gap-1.5">
                  <AudioLines className="w-3.5 h-3.5 text-fuchsia-400" />
                  Harmonic Interval
                </span>
                <span className="font-mono text-fuchsia-400 font-bold">
                  {currentVoice.intervalSteps > 0 ? `+${currentVoice.intervalSteps}` : currentVoice.intervalSteps} semitones
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={currentVoice.intervalSteps}
                onChange={(e) => updateParam("intervalSteps", parseInt(e.target.value))}
                className="w-full accent-fuchsia-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between font-mono text-[9px] text-slate-500">
                <span>Octave Down</span>
                <span>Unison</span>
                <span>Octave Up</span>
              </div>
            </div>
          )}

          {/* Formant Gender Shift */}
          <div className="space-y-2">
            <label className="font-sans text-xs text-slate-300 block">Formant Scale (Gender Shift)</label>
            <div className="grid grid-cols-3 gap-2">
              {genders.map((g) => (
                <button
                  key={g}
                  onClick={() => updateParam("genderShift", g)}
                  className={`py-2 text-[10px] rounded-lg border text-center font-sans font-medium transition-all ${
                    currentVoice.genderShift === g
                      ? "bg-slate-800 border-fuchsia-500/50 text-fuchsia-400 shadow-sm"
                      : "bg-slate-950/50 border-slate-900/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Timbre / Vocal Quality */}
          <div className="space-y-2">
            <label className="font-sans text-xs text-slate-300 block">Vocal Timbre Profile</label>
            <div className="grid grid-cols-2 gap-2">
              {timbres.map((t) => (
                <button
                  key={t}
                  onClick={() => updateParam("timbreModifier", t)}
                  className={`py-2 text-[10px] rounded-lg border text-center font-sans font-medium transition-all ${
                    currentVoice.timbreModifier === t
                      ? "bg-slate-800 border-fuchsia-500/50 text-fuchsia-400 shadow-sm"
                      : "bg-slate-950/50 border-slate-900/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Vowel Resonance */}
          <div className="space-y-2">
            <label className="font-sans text-xs text-slate-300 block">Vocal Resonance (Vowel Vibe)</label>
            <div className="grid grid-cols-5 gap-1.5">
              {vowels.map((v) => (
                <button
                  key={v}
                  onClick={() => updateParam("vowel", v)}
                  className={`flex-1 py-1.5 text-xs rounded-lg border text-center font-mono font-bold transition-all ${
                    currentVoice.vowel === v
                      ? "bg-fuchsia-500 border-fuchsia-400 text-white shadow-sm"
                      : "bg-slate-950/50 border-slate-900/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  &quot;{v}&quot;
                </button>
              ))}
            </div>
          </div>

          {/* Fine Tuning Detuning (Cents) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-sans text-slate-300">Detuning / Chorusing</span>
              <span className="font-mono text-fuchsia-400 font-bold">{currentVoice.detune} cents</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="1"
              value={currentVoice.detune}
              onChange={(e) => updateParam("detune", parseInt(e.target.value))}
              className="w-full accent-fuchsia-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Timing Offset Humanization */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-sans text-slate-300">Humanization Offset</span>
              <span className="font-mono text-fuchsia-400 font-bold">{currentVoice.delayMs} ms</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={currentVoice.delayMs}
              onChange={(e) => updateParam("delayMs", parseInt(e.target.value))}
              className="w-full accent-fuchsia-500 bg-slate-950 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Voice Modeling Instructions */}
      <div className="mt-5 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-fuchsia-400 mt-0.5 flex-shrink-0 animate-pulse" />
        <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
          <strong>AI Pro-Tip:</strong> Adjust timing offset and detuning values between different harmony parts to mimic different human vocal tract speeds for an exceptionally organic choir texture.
        </p>
      </div>
    </div>
  );
}
