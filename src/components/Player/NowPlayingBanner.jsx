import React from 'react';
import { Music2, Youtube, Disc, Sparkles } from 'lucide-react';

export default function NowPlayingBanner({ track, isPlaying }) {
  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <div className="w-16 h-16 rounded-2xl bg-dark-850 border border-white/5 flex items-center justify-center mb-3">
          <Disc className="w-8 h-8 text-slate-600 animate-spin" style={{ animationDuration: '8s' }} />
        </div>
        <h3 className="text-base font-semibold text-slate-300">Room Queue is Empty</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Paste a YouTube link or choose a sample track from the queue to start the party!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Thumbnail with Ambient Glow */}
      <div className="relative group shrink-0">
        <div
          className={`absolute -inset-1 rounded-2xl blur-lg opacity-40 transition-opacity duration-500 ${
            isPlaying ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 opacity-60' : 'bg-transparent'
          }`}
        />
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-dark-900 flex items-center justify-center">
          {track.thumbnail ? (
            <img
              src={track.thumbnail}
              alt={track.title}
              className={`w-full h-full object-cover transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100 opacity-80'
              }`}
            />
          ) : (
            <Music2 className="w-12 h-12 text-slate-600" />
          )}

          {/* Source Badge Tag on Thumbnail */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-dark-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1 shadow">
            {track.source === 'youtube' ? (
              <>
                <Youtube className="w-3 h-3 text-red-500" />
                <span>YouTube</span>
              </>
            ) : (
              <>
                <Disc className="w-3 h-3 text-cyan-400" />
                <span>Audio</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Track Information & Attribution */}
      <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-3 h-3" />
          <span>Now Playing</span>
        </div>

        <h2 className="text-lg sm:text-xl font-extrabold text-white truncate tracking-tight" title={track.title}>
          {track.title}
        </h2>

        <p className="text-sm font-medium text-slate-400 truncate">
          {track.artist || 'Unknown Artist'}
        </p>

        {/* Member Attribution Pill */}
        {track.addedBy && (
          <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs text-slate-500">Queued by</span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-dark-850 border border-white/5 shadow-sm text-xs font-medium text-slate-200">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: track.addedBy.avatarColor }}
              />
              <span className="font-semibold">{track.addedBy.name}</span>
              <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/60 px-1 rounded border border-cyan-800/40">
                #{track.addedBy.orderIndex}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

