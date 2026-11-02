import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Sparkles, Users, Music2, Headphones, Radio, Shield, Zap, ArrowRight } from 'lucide-react';

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
];

export default function LobbyModal() {
  const { user, createRoom, joinRoom } = useSocket();
  const [mode, setMode] = useState('join'); // 'join' | 'create'
  const [userName, setUserName] = useState(user.name);
  const [selectedColor, setSelectedColor] = useState(user.avatarColor);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check URL query parameters for invite link
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
      setMode('join');
    }
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError('Please enter your display name');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await createRoom(userName.trim(), selectedColor);
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError('Please enter your display name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a 6-digit room code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await joinRoom(roomCode.trim(), userName.trim(), selectedColor);
    } catch (err) {
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/85 backdrop-blur-xl">
      <div className="relative w-full max-w-lg rounded-3xl glass-panel p-6 sm:p-8 shadow-2xl border border-white/10 glow-border overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 text-white shadow-glow-indigo mb-3">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Collaborative Music Room
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Listen in real-time sync with friends. Round-robin turn-by-turn playback.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex bg-dark-900/90 p-1.5 rounded-2xl mb-6 border border-white/5">
          <button
            type="button"
            onClick={() => { setMode('join'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              mode === 'join'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Join Room</span>
          </button>
          <button
            type="button"
            onClick={() => { setMode('create'); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              mode === 'create'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Room</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="space-y-4">
          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Your Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={24}
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. BeatMaster, Alex"
                className="w-full px-4 py-3 bg-dark-900/90 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                required
              />
            </div>
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Avatar Glow Accent
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    selectedColor === color
                      ? 'scale-125 ring-2 ring-white shadow-lg'
                      : 'hover:scale-110 opacity-80'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Join Room Code Input (Only in Join mode) */}
          {mode === 'join' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                6-Digit Room Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 849201"
                  className="w-full px-4 py-3 bg-dark-900/90 border border-white/10 rounded-xl text-cyan-300 font-mono tracking-widest text-lg font-bold placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition uppercase"
                  required
                />
              </div>
            </div>
          )}

          {/* Capacity Alert Notice */}
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-3 py-2 rounded-xl">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Room capacity is limited to <strong>10 active members</strong> with fair round-robin queuing.</span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-glow-indigo transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
            ) : mode === 'create' ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Launch New Room (Host)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                <Headphones className="w-4 h-4" />
                <span>Join & Listen</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>

        {/* Feature badges list */}
        <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div className="p-2 rounded-lg bg-white/5">
            <span className="block font-bold text-slate-200">1-2-3-4</span>
            Fair Round-Robin
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <span className="block font-bold text-cyan-300">Live Drift Sync</span>
            &lt;1.5s Accuracy
          </div>
          <div className="p-2 rounded-lg bg-white/5">
            <span className="block font-bold text-purple-300">50% Skip Vote</span>
            Democratic Queue
          </div>
        </div>
      </div>
    </div>
  );
}

