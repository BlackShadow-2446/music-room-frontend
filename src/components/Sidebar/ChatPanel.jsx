import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
import { MessageSquare, Send, Sparkles } from 'lucide-react';

const QUICK_REACTIONS = ['🎵', '🔥', '❤️', '👏', '🚀', '🎧', '⚡', '💃'];

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatPanel() {
  const { room, user, sendChatMessage, sendReaction } = useSocket();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const messages = room?.chatMessages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChatMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[480px] glass-card rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-white/5 flex items-center justify-between shrink-0 bg-dark-900/50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Room Chat & Activity
          </h4>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="text-center my-1.5 text-[11px] font-medium text-slate-400 bg-white/5 py-1 px-2.5 rounded-lg border border-white/5"
              >
                {msg.text}
              </div>
            );
          }

          const isMe = msg.senderId === user.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-400">
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: msg.senderColor }}
                />
                <span className="font-bold text-slate-300">
                  {msg.senderName}
                </span>
                {msg.isHost && <span className="text-amber-400">👑</span>}
                <span className="text-slate-500 font-mono">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <div
                className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words ${
                  isMe
                    ? 'bg-gradient-to-tr from-indigo-600 to-cyan-600 text-white rounded-tr-sm'
                    : 'bg-dark-850 border border-white/5 text-slate-200 rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Emoji Reactions Quick Bar */}
      <div className="px-3 py-2 bg-dark-900/70 border-t border-white/5 shrink-0">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Quick Reactions</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => sendReaction(emoji)}
              className="text-lg p-1.5 rounded-xl hover:bg-white/10 hover:scale-125 transform transition duration-150 active:scale-95 select-none"
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field */}
      <form onSubmit={handleSend} className="p-2.5 bg-dark-900 border-t border-white/5 flex gap-2 shrink-0">
        <input
          type="text"
          maxLength={300}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Say something to the room..."
          className="flex-1 px-3 py-2 bg-dark-950 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white transition disabled:opacity-40"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}

