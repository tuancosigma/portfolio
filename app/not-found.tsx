import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-black text-white overflow-hidden px-6">
      {/* Faint grid backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute h-px bg-white/10"
            style={{ top: `${12.5 * (i + 1)}%`, left: 0, right: 0 }}
          />
        ))}
        {[...Array(12)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute w-px bg-white/10"
            style={{ left: `${8.33 * (i + 1)}%`, top: 0, bottom: 0 }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center max-w-xl">
        <span className="inline-flex items-center gap-3 text-sm font-mono text-white/50 mb-8">
          <span className="w-8 h-px bg-white/30" />
          alert: route_not_found
          <span className="w-8 h-px bg-white/30" />
        </span>

        <h1 className="text-[clamp(6rem,20vw,12rem)] font-display leading-none tracking-tight">
          404
        </h1>

        <p className="mt-6 text-xl text-white/60 leading-relaxed">
          This page doesn&rsquo;t exist — the trail went cold.
          No matching route in the logs.
        </p>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-7 h-14 rounded-full bg-white text-black text-base font-medium hover:bg-white/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <span className="text-sm font-mono text-white/40">
            or press <kbd className="px-2 py-1 border border-white/20 rounded text-white/60">Ctrl K</kbd> to navigate
          </span>
        </div>
      </div>
    </main>
  );
}
