import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { ArrowRight, RotateCw, Users } from 'lucide-react';

export default function MemberTurnIndicator() {
  const { room } = useSocket();

  const members = (room?.members || []).slice().sort((a, b) => a.orderIndex - b.orderIndex);
  if (members.length === 0) return null;

  const currentTrack = room?.currentTrack;
  const currentUserId = currentTrack?.addedBy?.id;

  return (
    <div className="w-full glass-card rounded-2xl p-3 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden">
      <div className="flex items-center gap-2 text-xs font-bold text-slate-300 shrink-0">
        <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
        <span className="uppercase tracking-wider">Round-Robin Rotation:</span>
      </div>

      {/* Member Chain */}
      <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none">
        {members.map((member, idx) => {
          const isTurnActive = currentUserId === member.id;

          return (
            <React.Fragment key={member.id}>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isTurnActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-400/50 text-cyan-200 shadow-glow-cyan'
                    : 'bg-dark-900/60 border border-white/5 text-slate-400'
                }`}
                title={`Member #${member.orderIndex}: ${member.name} (${member.queuedCount || 0} tracks queued)`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: member.avatarColor }}
                />
                <span className="font-mono text-[10px] text-slate-500">#{member.orderIndex}</span>
                <span className="max-w-[80px] truncate">{member.name}</span>

                {member.queuedCount > 0 && (
                  <span className="px-1 py-0.2 rounded-full bg-white/10 text-[10px] font-mono text-slate-300">
                    {member.queuedCount}
                  </span>
                )}
                {isTurnActive && <span className="text-[10px] animate-pulse">▶</span>}
              </div>

              {idx < members.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

