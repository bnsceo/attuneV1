import React, { useRef, useEffect } from "react";
import { HarmonyVoice } from "../types";
import { AudioLines } from "lucide-react";

interface AudioVisualizerProps {
  voices: HarmonyVoice[];
  activeFrequencies: { [id: string]: number };
  isRecording: boolean;
  isPlaying: boolean;
}

export default function AudioVisualizer({
  voices,
  activeFrequencies,
  isRecording,
  isPlaying,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle & Wave buffers
    const particles: { x: number; y: number; color: string; size: number; speed: number; alpha: number }[] = [];
    let phase = 0;

    const render = () => {
      ctx.fillStyle = "rgba(10, 15, 30, 0.15)"; // Soft trailing background
      ctx.fillRect(0, 0, width, height);

      // Draw subtle pitch/note grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      const horizontalLines = 8;
      for (let i = 1; i < horizontalLines; i++) {
        const y = (height / horizontalLines) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 1. Draw Real-time Waveforms for Active Voices
      phase += 0.05;
      voices.forEach((voice, index) => {
        if (!voice.enabled) return;

        // Check if there is active sound (pitch/frequency)
        const isVoiceActive = isPlaying || (isRecording && activeFrequencies["lead"] > 0);
        if (!isVoiceActive) return;

        const voiceFreq = activeFrequencies[voice.id] || 0;
        const amplitude = voice.volume * (voiceFreq > 0 ? 15 : 4) * (voice.id === "lead" ? 1.5 : 1);
        
        ctx.beginPath();
        ctx.lineWidth = voice.id === "lead" ? 3 : 1.8;
        
        // Define beautiful gradients per voice
        let strokeColor = "rgba(245, 158, 11, 0.8)"; // Lead: Amber
        if (voice.id === "voice-1") strokeColor = "rgba(34, 211, 238, 0.7)"; // Cyan
        if (voice.id === "voice-2") strokeColor = "rgba(232, 121, 249, 0.7)"; // Pink/Fuchsia
        if (voice.id === "voice-3") strokeColor = "rgba(52, 211, 153, 0.7)"; // Green

        ctx.strokeStyle = strokeColor;

        // Calculate custom frequency wave factors
        const waveFreq = (voiceFreq > 0 ? (voiceFreq / 200) : 1) + index * 0.5;

        for (let x = 0; x < width; x += 3) {
          // Centered sine wave combined with pitch variations
          const sinTerm = Math.sin(x * 0.008 * waveFreq + phase + index * Math.PI / 4);
          const noiseTerm = Math.cos(x * 0.02 + phase * 2) * 0.2;
          const y = (height / 2) + (sinTerm + noiseTerm) * amplitude * Math.sin(x / width * Math.PI);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // 2. Emit visual particles on active note spikes
        if (voiceFreq > 0 && Math.random() < 0.15) {
          particles.push({
            x: Math.random() * width,
            y: (height / 2) + (Math.random() - 0.5) * amplitude * 2,
            color: strokeColor,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 1.5 + 0.5,
            alpha: 1,
          });
        }
      });

      // Render Particles
      particles.forEach((p, idx) => {
        p.x -= p.speed;
        p.alpha -= 0.015;
        if (p.alpha <= 0) {
          particles.splice(idx, 1);
          return;
        }
        ctx.beginPath();
        ctx.fillStyle = p.color.replace("0.7", p.alpha.toString()).replace("0.8", p.alpha.toString());
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Pitch Tracking indicator circles (if live recording/playing)
      voices.forEach((voice) => {
        const freq = activeFrequencies[voice.id];
        if (freq && freq > 0 && voice.enabled) {
          // Map frequency logarithmically to stage height
          // Normal singing vocal range: 80Hz (E2) to 600Hz (D5)
          const minLog = Math.log(80);
          const maxLog = Math.log(600);
          const currentLog = Math.log(freq);
          const rawY = (currentLog - minLog) / (maxLog - minLog);
          const yPos = height - Math.max(0.1, Math.min(0.9, rawY)) * height;

          // X position based on voice index
          const xPos = width * 0.8 + (voice.id === "lead" ? 0 : (voices.indexOf(voice) * 35 - 50));

          let pColor = "#f59e0b"; // Amber
          if (voice.id === "voice-1") pColor = "#22d3ee"; // Cyan
          if (voice.id === "voice-2") pColor = "#e879f9"; // Pink
          if (voice.id === "voice-3") pColor = "#34d399"; // Green

          ctx.beginPath();
          ctx.fillStyle = pColor;
          ctx.arc(xPos, yPos, 6, 0, Math.PI * 2);
          ctx.fill();

          // Draw target node label
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.font = "bold 9px monospace";
          ctx.fillText(`${Math.round(freq)}Hz`, xPos - 15, yPos - 12);
        }
      });

      // Status HUD overlay
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "9px monospace";
      if (isRecording) {
        ctx.fillStyle = "#ef4444";
        ctx.fillText("● RECORDING (MIC ACTIVE)", 20, 25);
      } else if (isPlaying) {
        ctx.fillStyle = "#22d3ee";
        ctx.fillText("▶ PLAYING VOCAL MELODY", 20, 25);
      } else {
        ctx.fillText("STAGE STANDBY / ENGINE READY", 20, 25);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [voices, activeFrequencies, isRecording, isPlaying]);

  return (
    <div className="relative w-full h-[140px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden shadow-inner flex flex-col justify-end">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-3 right-4 flex items-center gap-1 bg-slate-900/80 border border-slate-800/80 px-2 py-1 rounded-md text-[10px] text-slate-400 font-sans pointer-events-none z-10">
        <AudioLines className="w-3 h-3 text-cyan-400" />
        Harmonic Neural Waves
      </div>
    </div>
  );
}
