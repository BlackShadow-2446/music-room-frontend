import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { ListMusic, Plus, Trash2, Youtube, Disc, Sparkles } from 'lucide-react';
import AddTrackModal from './AddTrackModal';
import MemberTurnIndicator from './MemberTurnIndicator';

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function QueueList() {
  const { room, user, isHost, removeTrack } = useSocket();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const masterQueue = room?.masterQueue || [];

  return (
    <div className="w-full space-y-4">
      {/* Round Robin Member Rotation Banner */}
      <MemberTurnIndicator />

      {/* Queue Header & Add Track Action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-indigo-400" />
          <h3 className="font-extrabold text-base text-white tracking-tight">
            Up Next In Queue
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-dark-800 text-xs font-mono text-cyan-300 border border-white/10">
            {masterQueue.length}
          </span>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-glow-indigo transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Song</span>
        </button>
      </div>

      {/* Queue Items */}
      {masterQueue.length === 0 ? (
        <div className="p-8 rounded-2xl glass-card border border-white/5 text-center text-slate-400 space-y-3">
          <p className="text-sm">No tracks lined up in the queue.</p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Add the next song</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {masterQueue.map((track, idx) => {
            const isFirst = idx === 0;
            const canRemove = track.addedBy?.id === user.id || isHost;

            return (
              <div
                key={track.id + '_' + idx}
                className={`flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all ${
                  isFirst
                    ? 'bg-gradient-to-r from-indigo-950/40 via-dark-850 to-dark-850 border-indigo-500/30 shadow-md'
                    : 'glass-card border-white/5 hover:border-white/10'
                }`}
              >
                {/* Left: Turn Number & Thumbnail */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col items-center justify-center shrink-0 w-8">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    {isFirst && (
                      <span className="text-[9px] font-bold uppercase text-cyan-400 tracking-wider">
                        Next
                      </span>
                    )}
                  </div>

                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-dark-900 shrink-0 border border-white/10">
                    <img
                      src={track.thumbnail}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 right-0 p-0.5 bg-dark-950/80 rounded-tl">
                      {track.source === 'youtube' ? (
                        <Youtube className="w-2.5 h-2.5 text-red-400" />
                      ) : (
                        <Disc className="w-2.5 h-2.5 text-cyan-400" />
                      )}
                    </div>
                  </div>

                  {/* Title & Artist */}
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate" title={track.title}>
                      {track.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="truncate max-w-[140px]">{track.artist}</span>
                      <span>•</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {formatDuration(track.duration)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Queued By User Badge & Remove Action */}
                <div className="flex items-center gap-3 shrink-0">
                  {track.addedBy && (
                    <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-dark-900 border border-white/5 text-xs">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: track.addedBy.avatarColor }}
                      />
                      <span className="text-slate-300 font-medium max-w-[90px] truncate">
                        {track.addedBy.name}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        #{track.addedBy.orderIndex}
                      </span>
                    </div>
                  )}

                  {canRemove && (
                    <button
                      onClick={() => removeTrack(track.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Track Modal */}
      <AddTrackModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

