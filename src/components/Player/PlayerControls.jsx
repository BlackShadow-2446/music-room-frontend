import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Play, Pause, FastForward, Volume2, VolumeX, Flame } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function PlayerControls({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
}) {
  const { room, user, isHost, voteSkip, forceSkip } = useSocket();
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);

  const hasTrack = !!room?.currentTrack;
  const skipVotesCount = room?.skipVotesCount || 0;
  const skipVotesRequired = room?.skipVotesRequired || 1;
  const hasVoted = room?.skipVoters?.includes(user?.id);

  const displayTime = isSeeking ? seekTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, (displayTime / duration) * 100) : 0;

  const handleSeekChange = (e) => {
    const val = parseFloat(e.target.value);
    setSeekTime(val);
  };

  const handleSeekCommit = (e) => {
    const val = parseFloat(e.target.value);
    setIsSeeking(false);
    onSeek(val);
  };

  return (
    <div className="w-full px-4 sm:px-6 pb-6 pt-2 space-y-4">
      {/* Progress Bar & Timestamps */}
      <div className="space-y-1.5">
        <div className="relative group flex items-center">
          <input
            type="range"
            min={0}
            max={duration > 0 ? duration : 100}
            step={0.5}
            disabled={!hasTrack}
            value={displayTime}
            onMouseDown={() => setIsSeeking(true)}
            onTouchStart={() => setIsSeeking(true)}
            onChange={handleSeekChange}
            onMouseUp={handleSeekCommit}
            onTouchEnd={handleSeekCommit}
            className="w-full h-1.5 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none group-hover:h-2 transition-all"
            style={{
              background: `linear-gradient(to right, #06b6d4 ${progressPercent}%, #1e293b ${progressPercent}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>{formatTime(displayTime)}</span>
          <AudioVisualizer isPlaying={isPlaying && hasTrack} barCount={18} />
          <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>
      </div>

      {/* Main Controls Row */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
        {/* Left: Volume Control */}
        <div className="flex items-center gap-2.5 w-32 sm:w-40">
          <button
            onClick={onToggleMute}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-dark-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
          />
        </div>

        {/* Center: Play / Pause */}
        <div className="flex items-center gap-4">
          <button
            onClick={onPlayPause}
            disabled={!hasTrack}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 transform active:scale-95 shadow-xl ${
              hasTrack
                ? 'bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-glow-indigo hover:scale-105'
                : 'bg-dark-800 text-slate-600 cursor-not-allowed'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Skip Voting & Host Skip */}
        <div className="flex items-center gap-2">
          {/* Democratic Skip Voting Button */}
          <button
            onClick={voteSkip}
            disabled={!hasTrack}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              hasVoted
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-glow-cyan'
                : 'bg-dark-850 hover:bg-white/5 border-white/10 text-slate-300 hover:text-white'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title={`Vote to skip (${skipVotesCount}/${skipVotesRequired} votes)`}
          >
            <FastForward className="w-4 h-4" />
            <span>{hasVoted ? 'Skip Voted' : 'Vote Skip'}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-dark-950/80 text-[10px] font-mono border border-white/10 text-cyan-400">
              {skipVotesCount}/{skipVotesRequired}
            </span>
          </button>

          {/* Host Force-Skip Button */}
          {isHost && (
            <button
              onClick={forceSkip}
              disabled={!hasTrack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition disabled:opacity-40"
              title="Host Force Skip (Immediate Advance)"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Force Skip</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

