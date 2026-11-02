import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Radio, Users, Lock, Unlock, Copy, Check, LogOut, Share2, Sparkles } from 'lucide-react';

export default function Navbar({ onOpenLobby }) {
  const { room, user, isHost, leaveRoom, addToast, isConnected } = useSocket();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyRoomCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    addToast(`Room code ${room.code} copied!`, 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyInviteLink = () => {
    if (!room?.code) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${room.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    addToast('Direct invite link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const memberCount = room?.members?.length || 0;
  const isFull = memberCount >= 10;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-dark-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-glow-indigo">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
              SyncBeat
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected
                    ? 'bg-emerald-400 animate-ping'
                    : room
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span>
                {isConnected
                  ? 'Real-Time Sync'
                  : room
                  ? 'Reconnecting...'
                  : 'Connecting...'}
              </span>
            </div>
          </div>
        </div>

        {/* Room Header Controls */}
        {room ? (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Room Code Badge */}
            <div className="flex items-center bg-dark-850 border border-white/10 rounded-xl p-1 pl-3 shadow-inner">
              <span className="text-xs text-slate-400 mr-2 font-mono hidden sm:inline">ROOM:</span>
              <span className="font-mono font-bold text-sm tracking-wider text-cyan-300 mr-2">
                {room.code}
              </span>
              <button
                onClick={copyRoomCode}
                title="Copy Room Code"
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={copyInviteLink}
                title="Copy Shareable Invite Link"
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-cyan-300 transition"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Capacity Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                isFull
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-dark-850 border-white/10 text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{memberCount}/10</span>
              {isFull && <span className="text-[10px] text-rose-400 font-bold uppercase ml-1">Full</span>}
            </div>

            {/* Lock Status */}
            <div
              className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs ${
                room.isLocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-dark-850/60 border-white/5 text-slate-400'
              }`}
              title={room.isLocked ? 'Room is locked to new listeners' : 'Room is open to join'}
            >
              {room.isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{room.isLocked ? 'Locked' : 'Open'}</span>
            </div>

            {/* User Profile Chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md ring-2 ring-white/10"
                style={{ backgroundColor: user.avatarColor }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-200 truncate max-w-[100px] flex items-center gap-1">
                  {user.name}
                  {isHost && <span className="text-[10px] text-amber-400">👑</span>}
                </div>
              </div>
            </div>

            {/* Leave Room Button */}
            <button
              onClick={leaveRoom}
              className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 rounded-xl transition border border-transparent hover:border-rose-500/30"
              title="Leave Room"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenLobby}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-glow-indigo transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create / Join Room</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

