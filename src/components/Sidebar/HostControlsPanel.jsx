import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { ShieldAlert, Lock, Unlock, FastForward, Crown } from 'lucide-react';

export default function HostControlsPanel() {
  const { room, isHost, toggleLock, forceSkip } = useSocket();

  if (!isHost) return null;

  const isLocked = room?.isLocked;
  const hasTrack = !!room?.currentTrack;

  return (
    <div className="glass-card rounded-2xl p-4 border border-amber-500/20 bg-amber-950/10 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
        <Crown className="w-4 h-4 text-amber-400" />
        <span>Host Controls</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Toggle Lock */}
        <button
          onClick={toggleLock}
          className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold border transition ${
            isLocked
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
              : 'bg-dark-900 border-white/5 hover:border-white/10 text-slate-300'
          }`}
          title={isLocked ? 'Unlock Room for new members' : 'Lock Room to prevent new joins'}
        >
          {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
          <span>{isLocked ? 'Locked' : 'Lock Room'}</span>
        </button>

        {/* Force Skip */}
        <button
          onClick={forceSkip}
          disabled={!hasTrack}
          className="flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-bold bg-dark-900 border border-white/5 hover:border-amber-500/30 text-amber-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          title="Instantly advance to next turn without waiting for votes"
        >
          <FastForward className="w-3.5 h-3.5" />
          <span>Force Skip</span>
        </button>
      </div>
    </div>
  );
}

