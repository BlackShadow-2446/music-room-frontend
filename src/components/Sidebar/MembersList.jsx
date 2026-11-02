import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Users, Crown, UserX, Shield, Music } from 'lucide-react';

export default function MembersList() {
  const { room, user, isHost, kickMember } = useSocket();
  const [kickTarget, setKickTarget] = useState(null);

  const members = room?.members || [];
  const memberCount = members.length;

  const handleConfirmKick = () => {
    if (!kickTarget) return;
    kickMember(kickTarget.id, 'Removed by Host');
    setKickTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Listeners in Room
          </h4>
        </div>
        <span className="text-xs font-mono font-bold text-slate-400">
          {memberCount}/10
        </span>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        {members.map((member) => {
          const isCurrentUser = member.id === user.id;
          const isTargetHost = member.isHost;

          return (
            <div
              key={member.id}
              className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                isCurrentUser
                  ? 'bg-indigo-950/20 border-indigo-500/30'
                  : 'bg-dark-900/60 border-white/5 hover:border-white/10'
              }`}
            >
              {/* Member Details */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Online / Away Indicator */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-dark-900 transition-colors ${
                      member.isOnline !== false ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    title={member.isOnline !== false ? 'Active' : 'Away in another app/tab'}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[110px]">
                      {member.name}
                    </span>
                    {isTargetHost && (
                      <span className="text-amber-400 text-xs" title="Room Host">
                        👑
                      </span>
                    )}
                    {isCurrentUser && (
                      <span className="text-[10px] text-indigo-400 font-semibold">(You)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="font-mono text-cyan-400">Order #{member.orderIndex}</span>
                    {member.queuedCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-slate-300">
                          <Music className="w-2.5 h-2.5" />
                          <span>{member.queuedCount} queued</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Host Actions (Kick) */}
              {isHost && !isTargetHost && !isCurrentUser && (
                <button
                  onClick={() => setKickTarget(member)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title={`Kick ${member.name}`}
                >
                  <UserX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Kick Confirmation Dialog */}
      {kickTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="bg-dark-900 border border-white/10 rounded-2xl p-5 max-w-xs w-full shadow-2xl space-y-4">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2">
                <UserX className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Kick Listener?</h4>
              <p className="text-xs text-slate-400 mt-1">
                Remove <strong>{kickTarget.name}</strong> from this room?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setKickTarget(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmKick}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition"
              >
                Kick
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

