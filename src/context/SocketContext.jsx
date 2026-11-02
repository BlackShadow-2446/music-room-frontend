import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';

const SocketContext = createContext(null);

const STORAGE_KEY_USER = 'syncbeat_user_profile';
const STORAGE_KEY_ACTIVE_ROOM = 'syncbeat_active_room';

// Generate or retrieve persistent user profile
function getInitialUser() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    // Ignore storage error
  }

  const randomColors = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#3b82f6'];
  const newUser = {
    id: 'usr_' + Math.random().toString(36).substring(2, 9),
    name: 'Listener ' + Math.floor(100 + Math.random() * 900),
    avatarColor: randomColors[Math.floor(Math.random() * randomColors.length)],
  };
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(newUser));
  } catch (e) {}
  return newUser;
}

export function SocketProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [reactions, setReactions] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [pendingSync, setPendingSync] = useState(null);

  const socketRef = useRef(null);
  const userRef = useRef(user);
  const activeRoomCodeRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    activeRoomCodeRef.current = room?.code || null;
  }, [room?.code]);

  // Helper to add toast messages
  const addToast = (message, type = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  // Connect Socket.io client with auto-reconnection and tab/device resilience
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_BACKEND_URL || window.location.origin;
    const s = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = s;
    setSocket(s);

    // Rejoin active room on connect or reconnect (after sleep, lock screen, or tab switch)
    s.on('connect', () => {
      setIsConnected(true);
      const activeCode = activeRoomCodeRef.current || sessionStorage.getItem(STORAGE_KEY_ACTIVE_ROOM);
      if (activeCode) {
        s.emit(
          'room:join',
          {
            code: activeCode,
            userId: userRef.current.id,
            userName: userRef.current.name,
            avatarColor: userRef.current.avatarColor,
          },
          (res) => {
            if (res?.success) {
              setRoom(res.room);
              activeRoomCodeRef.current = res.room.code;
              sessionStorage.setItem(STORAGE_KEY_ACTIVE_ROOM, res.room.code);
            }
          }
        );
      }
    });

    s.on('disconnect', () => {
      // Keep room in state during temporary disconnects (e.g. background tab or screen lock)
      setIsConnected(false);
    });

    // Room state full sync
    s.on('room:state', (updatedRoom) => {
      setRoom((prev) => {
        // If track just changed or skip passed, trigger celebratory animation if appropriate
        if (updatedRoom?.currentTrack?.id !== prev?.currentTrack?.id && updatedRoom?.currentTrack) {
          confetti({
            particleCount: 25,
            spread: 50,
            origin: { y: 0.8 },
            colors: ['#6366f1', '#06b6d4', '#ec4899'],
            disableForReducedMotion: true,
          });
        }
        return updatedRoom;
      });
    });

    // Synchronized player state (play, pause, seek)
    s.on('player:sync', (syncPayload) => {
      setPendingSync(syncPayload);
      setRoom((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          isPlaying: syncPayload.isPlaying,
          currentTime: syncPayload.currentTime,
          lastSyncTimestamp: syncPayload.lastSyncTimestamp,
        };
      });
    });

    // Duration updated
    s.on('player:duration_updated', ({ duration }) => {
      setRoom((prev) => {
        if (!prev || !prev.currentTrack) return prev;
        return {
          ...prev,
          currentTrack: { ...prev.currentTrack, duration },
        };
      });
    });

    // In-room chat new message
    s.on('chat:new_message', ({ message }) => {
      setRoom((prev) => {
        if (!prev) return prev;
        const exists = prev.chatMessages?.some((m) => m.id === message.id);
        if (exists) return prev;
        return {
          ...prev,
          chatMessages: [...(prev.chatMessages || []), message],
        };
      });
    });

    // Floating emoji reaction
    s.on('room:reaction', (reaction) => {
      setReactions((prev) => [...prev.slice(-15), reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      }, 2400);
    });

    // Kicked from room by Host
    s.on('room:kicked', ({ reason }) => {
      activeRoomCodeRef.current = null;
      sessionStorage.removeItem(STORAGE_KEY_ACTIVE_ROOM);
      setRoom(null);
      addToast(reason || 'You were kicked from the room by the Host', 'error');
    });

    // Handle Page Visibility, Window Focus & Network Online events
    // When the user switches back to this tab, unlocks their phone, or reconnects:
    const handleWakeup = () => {
      if (!s.connected) {
        s.connect();
      }
      const activeCode = activeRoomCodeRef.current || sessionStorage.getItem(STORAGE_KEY_ACTIVE_ROOM);
      if (activeCode) {
        // Fast re-join & fetch authoritative sync state
        s.emit(
          'room:join',
          {
            code: activeCode,
            userId: userRef.current.id,
            userName: userRef.current.name,
            avatarColor: userRef.current.avatarColor,
          },
          (res) => {
            if (res?.success) {
              setRoom(res.room);
            }
          }
        );

        s.emit('player:sync_request', { code: activeCode }, (syncData) => {
          if (syncData) {
            setPendingSync(syncData);
          }
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleWakeup();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWakeup);
    window.addEventListener('online', handleWakeup);

    // Keep-alive heartbeat: periodically ping server every 20s while tab is open
    const heartbeatInterval = setInterval(() => {
      const activeCode = activeRoomCodeRef.current;
      if (activeCode && s.connected) {
        s.emit('player:sync_request', { code: activeCode });
      }
    }, 20000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWakeup);
      window.removeEventListener('online', handleWakeup);
      clearInterval(heartbeatInterval);
      s.disconnect();
    };
  }, []);

  // Update profile
  const updateUserProfile = (name, avatarColor) => {
    const updated = {
      ...user,
      name: name || user.name,
      avatarColor: avatarColor || user.avatarColor,
    };
    setUser(updated);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updated));
    } catch (e) {}
  };

  // Actions
  const createRoom = (name, avatarColor) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Socket not initialized'));
      const activeUser = {
        ...user,
        name: name || user.name,
        avatarColor: avatarColor || user.avatarColor,
      };
      updateUserProfile(activeUser.name, activeUser.avatarColor);

      socketRef.current.emit(
        'room:create',
        {
          userId: activeUser.id,
          userName: activeUser.name,
          avatarColor: activeUser.avatarColor,
        },
        (res) => {
          if (res?.success) {
            setRoom(res.room);
            activeRoomCodeRef.current = res.room.code;
            sessionStorage.setItem(STORAGE_KEY_ACTIVE_ROOM, res.room.code);
            addToast(`Room ${res.room.code} created! You are the Host 👑`, 'success');
            resolve(res.room);
          } else {
            addToast(res?.error || 'Failed to create room', 'error');
            reject(new Error(res?.error));
          }
        }
      );
    });
  };

  const joinRoom = (code, name, avatarColor) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current) return reject(new Error('Socket not initialized'));
      const cleanCode = (code || '').trim().toUpperCase();
      if (!cleanCode) {
        addToast('Please enter a 6-digit room code', 'warning');
        return reject(new Error('Room code required'));
      }

      const activeUser = {
        ...user,
        name: name || user.name,
        avatarColor: avatarColor || user.avatarColor,
      };
      updateUserProfile(activeUser.name, activeUser.avatarColor);

      socketRef.current.emit(
        'room:join',
        {
          code: cleanCode,
          userId: activeUser.id,
          userName: activeUser.name,
          avatarColor: activeUser.avatarColor,
        },
        (res) => {
          if (res?.success) {
            setRoom(res.room);
            activeRoomCodeRef.current = res.room.code;
            sessionStorage.setItem(STORAGE_KEY_ACTIVE_ROOM, res.room.code);
            addToast(`Joined room ${cleanCode} as Member #${res.member.orderIndex}! 🎧`, 'success');
            resolve(res.room);
          } else {
            addToast(res?.error || 'Could not join room', 'error');
            reject(new Error(res?.error));
          }
        }
      );
    });
  };

  const leaveRoom = () => {
    if (!socketRef.current || !room) return;
    const currentCode = room.code;
    activeRoomCodeRef.current = null;
    sessionStorage.removeItem(STORAGE_KEY_ACTIVE_ROOM);
    socketRef.current.emit('room:leave', { code: currentCode, userId: user.id }, () => {
      setRoom(null);
      addToast('Left the room', 'info');
    });
  };

  const toggleLock = () => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('room:toggle_lock', { code: room.code, userId: user.id }, (res) => {
      if (res?.success) {
        addToast(res.isLocked ? 'Room locked to newcomers 🔒' : 'Room unlocked 🔓', 'info');
      } else if (res?.error) {
        addToast(res.error, 'error');
      }
    });
  };

  const kickMember = (targetUserId, reason = 'Administrative removal') => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit(
      'room:kick_member',
      {
        code: room.code,
        hostUserId: user.id,
        targetUserId,
        reason,
      },
      (res) => {
        if (!res?.success) {
          addToast(res?.error || 'Failed to kick member', 'error');
        }
      }
    );
  };

  const addTrackByUrl = (url) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !room) return reject(new Error('Not connected to a room'));
      socketRef.current.emit(
        'queue:add',
        {
          code: room.code,
          userId: user.id,
          url,
        },
        (res) => {
          if (res?.success) {
            addToast(`Added "${res.track?.title}" to queue!`, 'success');
            resolve(res.track);
          } else {
            addToast(res?.error || 'Failed to add track', 'error');
            reject(new Error(res?.error));
          }
        }
      );
    });
  };

  const addSampleTrack = (sampleTrack) => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !room) return reject(new Error('Not connected to a room'));
      socketRef.current.emit(
        'queue:add',
        {
          code: room.code,
          userId: user.id,
          trackData: sampleTrack,
        },
        (res) => {
          if (res?.success) {
            addToast(`Added "${sampleTrack.title}"!`, 'success');
            resolve(res.track);
          } else {
            addToast(res?.error || 'Failed to add track', 'error');
            reject(new Error(res?.error));
          }
        }
      );
    });
  };

  const removeTrack = (trackId) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('queue:remove', {
      code: room.code,
      userId: user.id,
      trackId,
    });
  };

  const sendPlayerAction = (action, time) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('player:action', {
      code: room.code,
      action,
      time,
    });
  };

  const voteSkip = () => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !room) return reject(new Error('Not in a room'));
      socketRef.current.emit(
        'player:vote_skip',
        {
          code: room.code,
          userId: user.id,
        },
        (res) => {
          if (res?.success) {
            if (res.skipped) {
              addToast('🎉 Skip vote passed! Advanced to next turn', 'success');
            }
            resolve(res);
          } else {
            addToast(res?.error || 'Failed to vote', 'error');
            reject(new Error(res?.error));
          }
        }
      );
    });
  };

  const forceSkip = () => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current || !room) return reject(new Error('Not in a room'));
      socketRef.current.emit(
        'player:force_skip',
        {
          code: room.code,
          hostUserId: user.id,
        },
        (res) => {
          if (res?.success) {
            addToast('⚡ Host force-skipped track', 'info');
            resolve(res);
          } else {
            addToast(res?.error || 'Failed to force-skip', 'error');
            reject(new Error(res?.error));
          }
        }
      );
    });
  };

  const sendChatMessage = (text) => {
    if (!socketRef.current || !room || !text.trim()) return;
    socketRef.current.emit('chat:send', {
      code: room.code,
      userId: user.id,
      text: text.trim(),
    });
  };

  const sendReaction = (emoji) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('reaction:send', {
      code: room.code,
      userId: user.id,
      userName: user.name,
      emoji,
    });
  };

  const updateDuration = (duration) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('player:update_duration', {
      code: room.code,
      duration,
    });
  };

  const reportTrackEnd = (trackId) => {
    if (!socketRef.current || !room) return;
    socketRef.current.emit('player:track_end', {
      code: room.code,
      trackId,
    });
  };

  const isHost = room?.hostId === user.id;

  const value = {
    user,
    updateUserProfile,
    isConnected,
    room,
    isHost,
    reactions,
    toasts,
    pendingSync,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleLock,
    kickMember,
    addTrackByUrl,
    addSampleTrack,
    removeTrack,
    sendPlayerAction,
    voteSkip,
    forceSkip,
    sendChatMessage,
    sendReaction,
    updateDuration,
    reportTrackEnd,
    addToast,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
