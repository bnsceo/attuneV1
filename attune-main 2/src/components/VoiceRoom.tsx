import React, { useRef, useState, useEffect } from "react";
import { HarmonyVoice } from "../types";
import { Mic, User, Volume2, Move } from "lucide-react";

interface VoiceRoomProps {
  voices: HarmonyVoice[];
  onUpdateVoice: (updatedVoice: HarmonyVoice) => void;
}

export default function VoiceRoom({ voices, onUpdateVoice }: VoiceRoomProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleMouseDown = (id: string) => {
    setDraggingId(id);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingId || !stageRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      
      // Calculate coordinates relative to center (0,0) of the stage
      // X from -1 to 1, Y from -1 to 1 (top is -1, bottom is 1, let's map Y so top is 1, bottom is 0)
      const xPx = e.clientX - rect.left;
      const yPx = e.clientY - rect.top;

      let x = (xPx / rect.width) * 2 - 1; // -1 to 1
      let y = 1 - (yPx / rect.height); // 0 (bottom) to 1 (top)

      // Clamp values
      x = Math.max(-1, Math.min(1, x));
      y = Math.max(0.1, Math.min(1, y));

      const voice = voices.find(v => v.id === draggingId);
      if (voice) {
        // Map X to Panning (-100 to 100)
        // Map Y to Volume (0.1 to 1.0)
        onUpdateVoice({
          ...voice,
          panning: Math.round(x * 100),
          volume: parseFloat(y.toFixed(2)),
          x,
          y
        });
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    if (draggingId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingId, voices, onUpdateVoice]);

  // Color mapping helper
  const getVoiceColor = (id: string) => {
    if (id === "lead") return "from-amber-400 to-yellow-500 shadow-amber-500/50";
    if (id === "voice-1") return "from-cyan-400 to-teal-500 shadow-cyan-500/50";
    if (id === "voice-2") return "from-fuchsia-400 to-pink-500 shadow-fuchsia-500/50";
    if (id === "voice-3") return "from-emerald-400 to-green-500 shadow-emerald-500/50";
    return "from-violet-400 to-purple-500 shadow-violet-500/50";
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-sans font-semibold text-lg text-white flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-400" />
            3D Spatial soundstage
          </h3>
          <p className="font-sans text-xs text-slate-400 mt-1">
            Drag singers to adjust stereo panning (Left/Right) and voice volume (Distance).
          </p>
        </div>
      </div>

      {/* soundstage Canvas Area */}
      <div 
        ref={stageRef}
        className="relative flex-1 min-h-[300px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 100%, rgba(30, 41, 59, 0.4) 0%, transparent 70%),
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 20px 20px, 20px 20px"
        }}
      >
        {/* Stage Perspective Lines */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-800/50 dash-lines border-dashed"></div>
        <div className="absolute left-0 right-0 bottom-1/4 h-px bg-slate-800/30"></div>
        <div className="absolute left-0 right-0 bottom-1/2 h-px bg-slate-800/30"></div>
        <div className="absolute left-0 right-0 bottom-3/4 h-px bg-slate-800/30"></div>

        {/* Audience / Listener marker */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center shadow-lg text-slate-400">
            🎧
          </div>
          <span className="font-sans text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">Listener position</span>
        </div>

        {/* Active Stage Singers */}
        {voices.map((voice) => {
          // Convert from normalized range (-1 to 1 for x, 0.1 to 1.0 for y) to percentages
          const leftPercent = ((voice.x + 1) / 2) * 100;
          const topPercent = (1 - voice.y) * 100;

          return (
            <div
              key={voice.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 transition-shadow cursor-grab active:cursor-grabbing group z-10`}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
              }}
              onMouseDown={() => handleMouseDown(voice.id)}
            >
              {/* Voice Glowing Pulse Aura */}
              <div className={`absolute -inset-4 bg-gradient-to-r ${getVoiceColor(voice.id)} opacity-25 rounded-full blur-md group-hover:opacity-40 transition-opacity`}></div>

              {/* Singer Circle Icon */}
              <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${getVoiceColor(voice.id)} border border-white/20 shadow-lg flex flex-col items-center justify-center text-white transition-all transform group-hover:scale-110 ${!voice.enabled ? "opacity-40 grayscale" : ""}`}>
                {voice.id === "lead" ? (
                  <Mic className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
                <span className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-[9px] px-1 rounded-full font-mono font-bold">
                  {voice.id === "lead" ? "L" : voice.intervalSteps >= 0 ? `+${voice.intervalSteps}` : voice.intervalSteps}
                </span>
              </div>

              {/* Floating label */}
              <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 border border-slate-800 text-[10px] text-slate-200 px-2 py-0.5 rounded-md shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                <span className="font-semibold">{voice.name}</span>
                <span className="font-mono text-[9px] text-slate-400 mt-0.5">
                  Pan: {voice.panning > 0 ? `R${voice.panning}` : voice.panning < 0 ? `L${Math.abs(voice.panning)}` : "C"} | Vol: {Math.round(voice.volume * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* soundstage Panel Metrics Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
        {voices.map((voice) => (
          <button
            key={voice.id}
            onClick={() => onUpdateVoice({ ...voice, enabled: !voice.enabled })}
            className={`p-2.5 rounded-xl border text-left transition-all ${
              voice.enabled 
                ? "bg-slate-800/80 border-slate-700 text-slate-100" 
                : "bg-slate-950/40 border-slate-900/50 text-slate-600"
            }`}
          >
            <div className="flex items-center gap-1.5 justify-between">
              <span className="font-sans text-xs font-medium truncate">{voice.name}</span>
              <div className={`w-2 h-2 rounded-full ${voice.enabled ? "bg-emerald-500 animate-pulse" : "bg-slate-600"}`} />
            </div>
            <div className="font-mono text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Int: {voice.id === "lead" ? "Lead" : voice.intervalSteps > 0 ? `+${voice.intervalSteps}` : voice.intervalSteps}</span>
              <span>Pan: {voice.panning}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
