import React from 'react';
import { useSocket } from '../../context/SocketContext';

export default function FloatingReactions() {
  const { reactions } = useSocket();

  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {reactions.map((r) => (
        <div
          key={r.id}
          className="absolute bottom-6 animate-float-up flex flex-col items-center select-none"
          style={{ left: `${r.xPos}%` }}
        >
          <span className="text-4xl drop-shadow-[0_0_12px_rgba(255,255,255,0.7)] filter transform hover:scale-125 transition">
            {r.emoji}
          </span>
          <span className="text-[10px] font-bold text-white/90 bg-dark-900/80 px-1.5 py-0.5 rounded-full border border-white/10 mt-1 shadow">
            {r.userName}
          </span>
        </div>
      ))}
    </div>
  );
}

