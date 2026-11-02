import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import NowPlayingBanner from './NowPlayingBanner';
import PlayerControls from './PlayerControls';
import FloatingReactions from './FloatingReactions';
import { Volume2, AlertCircle } from 'lucide-react';

export default function UniversalPlayer() {
  const {
    room,
    sendPlayerAction,
    updateDuration,
    reportTrackEnd,
    pendingSync,
  } = useSocket();

  const currentTrack = room?.currentTrack;
  const isServerPlaying = room?.isPlaying || false;
  const serverCurrentTime = room?.currentTime || 0;

  const [localCurrentTime, setLocalCurrentTime] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  // References
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const audioRef = useRef(null);
  const isUpdatingFromSync = useRef(false);
  const lastReportedEnd = useRef(null);

  // Calculate authoritative server time including elapsed delta
  const getAuthoritativeServerTime = useCallback(() => {
    if (!room || !isServerPlaying) return serverCurrentTime;
    const elapsed = (Date.now() - (room.lastSyncTimestamp || Date.now())) / 1000;
    return serverCurrentTime + elapsed;
  }, [room, isServerPlaying, serverCurrentTime]);

  // 1. Initialize HTML5 Audio properties
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 2. Initialize YouTube Player
  useEffect(() => {
    if (!currentTrack || currentTrack.source !== 'youtube') {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
        ytPlayerRef.current = null;
      }
      return;
    }

    const initYT = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initYT, 200);
        return;
      }

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
      }

      const mediaId = currentTrack.mediaId;
      ytPlayerRef.current = new window.YT.Player('yt-player-target', {
        height: '100%',
        width: '100%',
        videoId: mediaId,
        playerVars: {
          autoplay: isServerPlaying ? 1 : 0,
          controls: 0, // Custom controls
          disablekb: 1,
          fs: 0,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            const player = event.target;
            player.setVolume(isMuted ? 0 : volume * 100);
            const authTime = getAuthoritativeServerTime();
            player.seekTo(authTime, true);

            if (isServerPlaying) {
              const playPromise = player.playVideo();
              if (playPromise && playPromise.catch) {
                playPromise.catch(() => setNeedsUserInteraction(true));
              }
            }

            const dur = player.getDuration();
            if (dur > 0) {
              setLocalDuration(dur);
              updateDuration(dur);
            }
          },
          onStateChange: (event) => {
            // YT.PlayerState.ENDED = 0
            if (event.data === 0) {
              if (lastReportedEnd.current !== currentTrack.id) {
                lastReportedEnd.current = currentTrack.id;
                reportTrackEnd(currentTrack.id);
              }
            }
          },
          onError: (err) => {
            console.warn('YouTube Player error:', err);
          },
        },
      });
    };

    initYT();

    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
        ytPlayerRef.current = null;
      }
    };
  }, [currentTrack?.mediaId, currentTrack?.source]);

  // 3. React to Server Synchronization events (Play / Pause / Seek / Drift correction)
  useEffect(() => {
    if (!currentTrack) return;

    const authTime = getAuthoritativeServerTime();
    isUpdatingFromSync.current = true;

    // Handle HTML5 Audio
    if (currentTrack.source === 'audio' && audioRef.current) {
      const audio = audioRef.current;
      const drift = Math.abs(audio.currentTime - authTime);

      if (drift > 1.5) {
        audio.currentTime = authTime;
      }

      if (isServerPlaying && audio.paused) {
        audio.play().catch(() => setNeedsUserInteraction(true));
      } else if (!isServerPlaying && !audio.paused) {
        audio.pause();
      }
    }

    // Handle YouTube
    if (currentTrack.source === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.seekTo) {
      try {
        const yt = ytPlayerRef.current;
        const currentYTTime = yt.getCurrentTime() || 0;
        const drift = Math.abs(currentYTTime - authTime);

        if (drift > 1.5) {
          yt.seekTo(authTime, true);
        }

        if (isServerPlaying) {
          yt.playVideo();
        } else {
          yt.pauseVideo();
        }
      } catch (e) {}
    }

    setTimeout(() => {
      isUpdatingFromSync.current = false;
    }, 200);
  }, [pendingSync, isServerPlaying, currentTrack?.id]);

  // 4. Local playback tick loop for smooth UI progress bar
  useEffect(() => {
    if (!currentTrack) {
      setLocalCurrentTime(0);
      return;
    }

    const interval = setInterval(() => {
      if (currentTrack.source === 'audio' && audioRef.current) {
        const t = audioRef.current.currentTime;
        const d = audioRef.current.duration;
        setLocalCurrentTime(t || 0);
        if (d && !isNaN(d) && d > 0 && d !== localDuration) {
          setLocalDuration(d);
          updateDuration(d);
        }
      } else if (currentTrack.source === 'youtube' && ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
        try {
          const t = ytPlayerRef.current.getCurrentTime();
          const d = ytPlayerRef.current.getDuration();
          if (typeof t === 'number') setLocalCurrentTime(t);
          if (typeof d === 'number' && d > 0 && d !== localDuration) {
            setLocalDuration(d);
            updateDuration(d);
          }
        } catch (e) {}
      } else {
        setLocalCurrentTime(getAuthoritativeServerTime());
      }
    }, 350);

    return () => clearInterval(interval);
  }, [currentTrack, localDuration, getAuthoritativeServerTime]);

  // Handle Tab / App Return or Phone Unlock
  useEffect(() => {
    const handleTabWakeup = () => {
      if (document.visibilityState === 'visible' && currentTrack) {
        const authTime = getAuthoritativeServerTime();

        if (currentTrack.source === 'audio' && audioRef.current) {
          const audio = audioRef.current;
          const drift = Math.abs(audio.currentTime - authTime);
          if (drift > 1.5) {
            audio.currentTime = authTime;
          }
          if (isServerPlaying && audio.paused) {
            audio.play().catch(() => setNeedsUserInteraction(true));
          }
        } else if (currentTrack.source === 'youtube' && ytPlayerRef.current?.seekTo) {
          try {
            const yt = ytPlayerRef.current;
            const currentYT = yt.getCurrentTime() || 0;
            const drift = Math.abs(currentYT - authTime);
            if (drift > 1.5) {
              yt.seekTo(authTime, true);
            }
            if (isServerPlaying) {
              yt.playVideo();
            }
          } catch (e) {}
        }
      }
    };

    document.addEventListener('visibilitychange', handleTabWakeup);
    window.addEventListener('focus', handleTabWakeup);

    return () => {
      document.removeEventListener('visibilitychange', handleTabWakeup);
      window.removeEventListener('focus', handleTabWakeup);
    };
  }, [currentTrack, isServerPlaying, getAuthoritativeServerTime]);

  // 5. User Action Handlers
  const handlePlayPause = () => {
    setNeedsUserInteraction(false);
    const nextAction = isServerPlaying ? 'pause' : 'play';
    sendPlayerAction(nextAction, localCurrentTime);
  };

  const handleSeek = (newTime) => {
    setLocalCurrentTime(newTime);

    if (currentTrack?.source === 'audio' && audioRef.current) {
      audioRef.current.currentTime = newTime;
    } else if (currentTrack?.source === 'youtube' && ytPlayerRef.current?.seekTo) {
      try {
        ytPlayerRef.current.seekTo(newTime, true);
      } catch (e) {}
    }

    sendPlayerAction('seek', newTime);
  };

  const handleAudioEnded = () => {
    if (currentTrack && lastReportedEnd.current !== currentTrack.id) {
      lastReportedEnd.current = currentTrack.id;
      reportTrackEnd(currentTrack.id);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (dur > 0) {
        setLocalDuration(dur);
        updateDuration(dur);
      }
      const authTime = getAuthoritativeServerTime();
      audioRef.current.currentTime = authTime;
      if (isServerPlaying) {
        audioRef.current.play().catch(() => setNeedsUserInteraction(true));
      }
    }
  };

  return (
    <div className="relative w-full rounded-3xl glass-panel border border-white/10 glow-border overflow-hidden shadow-2xl">
      {/* Floating Reactions Overlay */}
      <FloatingReactions />

      {/* Autoplay blocked banner (Browsers block sound without user gesture) */}
      {needsUserInteraction && (
        <div className="p-3 bg-indigo-600/90 text-white text-xs font-semibold flex items-center justify-between px-4 z-40 relative">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 animate-bounce" />
            <span>Click here to enable synchronized audio playback on this browser tab</span>
          </div>
          <button
            onClick={() => {
              setNeedsUserInteraction(false);
              if (currentTrack?.source === 'audio' && audioRef.current) {
                audioRef.current.play();
              } else if (ytPlayerRef.current) {
                ytPlayerRef.current.playVideo();
              }
            }}
            className="px-3 py-1 bg-white text-indigo-950 font-bold rounded-lg text-xs hover:bg-slate-100 transition shadow"
          >
            Enable Audio
          </button>
        </div>
      )}

      {/* Video / Visual Container */}
      <div className="relative aspect-video sm:aspect-[21/9] max-h-[360px] w-full bg-dark-950/90 flex items-center justify-center overflow-hidden border-b border-white/5">
        {/* YouTube Container */}
        {currentTrack?.source === 'youtube' && (
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            <div id="yt-player-target" className="w-full h-full" />
          </div>
        )}

        {/* HTML5 Audio Visual Canvas */}
        {currentTrack?.source === 'audio' && (
          <>
            <audio
              ref={audioRef}
              src={currentTrack.mediaId}
              onEnded={handleAudioEnded}
              onLoadedMetadata={handleAudioLoadedMetadata}
              preload="auto"
            />
            {/* Ambient Background Art */}
            <div className="absolute inset-0 overflow-hidden opacity-30 blur-2xl">
              <img
                src={currentTrack.thumbnail}
                alt=""
                className="w-full h-full object-cover scale-125"
              />
            </div>
            <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-cyan-500/30 mb-3">
                <img
                  src={currentTrack.thumbnail}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs text-cyan-400 font-mono tracking-widest uppercase">
                Direct Stream
              </div>
            </div>
          </>
        )}

        {/* Fallback if no track */}
        {!currentTrack && (
          <div className="flex flex-col items-center justify-center text-slate-500 p-8">
            <span className="text-5xl mb-2">🎧</span>
            <span className="text-sm font-semibold">No track currently active</span>
          </div>
        )}
      </div>

      {/* Track Metadata Banner */}
      <NowPlayingBanner track={currentTrack} isPlaying={isServerPlaying} />

      {/* Synchronized Player Controls */}
      <PlayerControls
        currentTime={localCurrentTime}
        duration={currentTrack?.duration || localDuration}
        isPlaying={isServerPlaying}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={setVolume}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(!isMuted)}
      />
    </div>
  );
}

