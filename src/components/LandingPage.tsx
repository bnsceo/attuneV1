import React from "react";
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  Download, 
  Sliders, 
  Music, 
  Mic, 
  Play, 
  Info, 
  HelpCircle,
  Volume2,
  Code2,
  Terminal,
  Compass,
  ArrowRight
} from "lucide-react";

interface LandingPageProps {
  onLaunchStudio: () => void;
}

export default function LandingPage({ onLaunchStudio }: LandingPageProps) {
  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Hero Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative px-6 py-16 md:py-24 text-center max-w-4xl mx-auto flex flex-col items-center">
        {/* Sparkle Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen Neural Voice Studio
        </div>

        {/* Display Typography Header */}
        <h2 className="font-sans font-extrabold text-4xl md:text-6xl tracking-tight leading-tight text-white max-w-3xl">
          Modern AI <span className="bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Vocal Harmonizers</span>
        </h2>

        <p className="font-sans text-base md:text-lg text-slate-400 mt-6 max-w-2xl leading-relaxed">
          Process solo vocal recordings to generate realistic backing vocals and multi-part harmonies. 
          Our neural networks detect pitch, tempo, and musical key to build natural group vocal arrangements instantly.
        </p>

        {/* Launch CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center w-full max-w-sm">
          <button
            onClick={onLaunchStudio}
            className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-600 to-cyan-500 hover:opacity-95 text-white font-sans font-bold text-sm tracking-wide shadow-xl shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Launch AI Vocal Studio
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Key Capabilities section */}
      <section className="px-6 py-12 max-w-6xl mx-auto w-full border-t border-slate-900">
        <div className="text-center mb-12">
          <h3 className="font-sans font-bold text-2xl text-white">Engine Key Capabilities</h3>
          <p className="font-sans text-sm text-slate-400 mt-2">Built with zero manual pitch-wheel tracking required</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Key Detection Card */}
          <div className="bg-slate-900/60 border border-slate-900 p-6 rounded-2xl flex flex-col gap-4 relative group hover:border-slate-800 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: "12s" }} />
            </div>
            <div>
              <h4 className="font-sans font-bold text-base text-white">Dynamic Key Detection</h4>
              <p className="font-sans text-xs text-slate-400 mt-2 leading-relaxed">
                Automatically identifies the musical keys and scales of incoming solo signals. Backing layers dynamically snap to the matching key intervals, eliminating harmonic clashes.
              </p>
            </div>
          </div>

          {/* Voice Modeling Card */}
          <div className="bg-slate-900/60 border border-slate-900 p-6 rounded-2xl flex flex-col gap-4 relative group hover:border-slate-800 transition-all">
            <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-base text-white">Neural Voice Modeling</h4>
              <p className="font-sans text-xs text-slate-400 mt-2 leading-relaxed">
                Applies distinct vocal characteristics, formant (gender) scales, and custom sibilant/warm timbre profiles. Backing singers sound like completely separate human performers.
              </p>
            </div>
          </div>

          {/* Arrangement Rules Card */}
          <div className="bg-slate-900/60 border border-slate-900 p-6 rounded-2xl flex flex-col gap-4 relative group hover:border-slate-800 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-base text-white">Harmonic Spacing Presets</h4>
              <p className="font-sans text-xs text-slate-400 mt-2 leading-relaxed">
                Offers high-end preset arrangements like thirds, fifths, barbershop octaves, and wide cathedral choir spreads to space voices perfectly across the virtual soundstage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Workflow Guide */}
      <section className="px-6 py-12 max-w-6xl mx-auto w-full border-t border-slate-900">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="font-sans font-bold text-2xl text-white">Interactive Studio Guide</h3>
            <p className="font-sans text-sm text-slate-400 mt-2 mb-8 leading-relaxed">
              Experience zero-latency backing generation inside our digital workspace with simple steps.
            </p>

            <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs text-fuchsia-400 font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-sm text-white">Feed the Solo Input</h4>
                  <p className="font-sans text-xs text-slate-400 mt-1 leading-relaxed">
                    Select an interactive synthesizer track, or connect your microphone directly to hum or sing your lead melody line.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs text-cyan-400 font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-sm text-white">AI Alignment Call</h4>
                  <p className="font-sans text-xs text-slate-400 mt-1 leading-relaxed">
                    Optionally input lyrics or a genre direction. Our server-side Gemini intelligence will align perfect harmonic keys and chord patterns.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs text-amber-400 font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-sans font-semibold text-sm text-white">Position Singers on Stage</h4>
                  <p className="font-sans text-xs text-slate-400 mt-1 leading-relaxed">
                    Drag the backing vocalists physically inside the 3D stage layout to dynamically adjust panning (left/right) and volumes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Graphical Mockup UI Box */}
          <div className="relative bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-2xl overflow-hidden min-h-[300px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
            
            {/* Mock Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="font-sans text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                Live Soundstage Mockup
              </span>
              <span className="font-mono text-[10px] text-slate-500">A Minor | 110 BPM</span>
            </div>

            {/* Stage visualization visual */}
            <div className="my-6 border border-slate-800 bg-slate-950 rounded-xl p-4 h-40 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(244,63,94,0.06),transparent_60%)] pointer-events-none" />
              
              {/* Virtual elements */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-center group">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-md">
                  🎤
                </div>
                <span className="font-mono text-[9px] text-slate-400 block mt-1">L45 (+3)</span>
              </div>

              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-center">
                <div className="w-10 h-10 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/50 flex items-center justify-center text-fuchsia-300 shadow-md">
                  🎤
                </div>
                <span className="font-mono text-[9px] text-slate-400 block mt-1">R45 (-5)</span>
              </div>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-wider font-mono text-slate-500 bg-slate-900 border border-slate-800/60 px-2 py-0.5 rounded-full">
                🎧 listener position
              </div>
            </div>

            {/* Live Visualizer Waves Mock */}
            <div className="flex gap-1 h-8 items-end justify-center px-4 bg-slate-950 rounded-lg p-2 border border-slate-800">
              <div className="w-1 bg-cyan-400 animate-bounce" style={{ height: "60%", animationDelay: "0.1s" }} />
              <div className="w-1 bg-cyan-500 animate-bounce" style={{ height: "85%", animationDelay: "0.3s" }} />
              <div className="w-1 bg-fuchsia-400 animate-bounce" style={{ height: "40%", animationDelay: "0.2s" }} />
              <div className="w-1 bg-fuchsia-500 animate-bounce" style={{ height: "70%", animationDelay: "0.5s" }} />
              <div className="w-1 bg-amber-400 animate-bounce" style={{ height: "95%", animationDelay: "0.4s" }} />
              <div className="w-1 bg-emerald-400 animate-bounce" style={{ height: "50%", animationDelay: "0.6s" }} />
            </div>
          </div>
        </div>
      </section>

      {/* Prominent CTA to enter Studio */}
      <section className="px-6 py-16 text-center max-w-xl mx-auto w-full">
        <h3 className="font-sans font-bold text-xl text-white">Ready to align your harmonies?</h3>
        <p className="font-sans text-xs text-slate-400 mt-2 mb-6">
          Access our premium interactive soundstage with preloaded vocal runs or live microphone input.
        </p>
        <button
          onClick={onLaunchStudio}
          className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-sans font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/15 cursor-pointer hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2"
        >
          Enter AI Vocal Studio
          <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
  );
}
