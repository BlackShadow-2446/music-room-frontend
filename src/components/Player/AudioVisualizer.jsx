import React from 'react';

export default function AudioVisualizer({ isPlaying, barCount = 24 }) {
  const bars = Array.from({ length: barCount }, (_, i) => i);

  return (
    <div className="flex items-end justify-center gap-1 h-8 w-full max-w-xs px-2 opacity-85 select-none">
      {bars.map((i) => {
        // Generate pseudo-random animation delays and classes for natural rhythmic wave
        const animationClass = `animate-bar-${(i % 4) + 1}`;
        const delay = (i * 0.08) % 0.8;

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              isPlaying
                ? `${animationClass} bg-gradient-to-t from-cyan-500 via-indigo-500 to-purple-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]`
                : 'h-1 bg-slate-700/60'
            }`}
            style={{
              animationDelay: isPlaying ? `${delay}s` : '0s',
            }}
          />
        );
      })}
    </div>
  );
}

