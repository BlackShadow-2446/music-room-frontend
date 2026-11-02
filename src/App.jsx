import React, { useState } from 'react';
import { useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import LobbyModal from './components/LobbyModal';
import UniversalPlayer from './components/Player/UniversalPlayer';
import QueueList from './components/Queue/QueueList';
import MembersList from './components/Sidebar/MembersList';
import HostControlsPanel from './components/Sidebar/HostControlsPanel';
import ChatPanel from './components/Sidebar/ChatPanel';
import NotificationToast from './components/Common/NotificationToast';
import { Users, MessageSquare, Sparkles } from 'lucide-react';

export default function App() {
  const { room } = useSocket();
  const [showLobby, setShowLobby] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' | 'members'

  return (
    <div className="min-h-screen bg-dark-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Notification Container */}
      <NotificationToast />

      {/* Top Navigation */}
      <Navbar onOpenLobby={() => setShowLobby(true)} />

      {/* Main Content Area */}
      {!room ? (
        <main className="flex-1 flex items-center justify-center p-4">
          <LobbyModal />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left / Center Section: Player + Round-Robin Queue (8 cols) */}
            <section className="lg:col-span-8 space-y-6">
              {/* Universal Synced Player */}
              <UniversalPlayer />

              {/* Interleaved Round-Robin Queue */}
              <QueueList />
            </section>

            {/* Right Sidebar: Members & Real-time Chat (4 cols) */}
            <aside className="lg:col-span-4 space-y-4">
              {/* Host Controls if Host */}
              <HostControlsPanel />

              {/* Sidebar Navigation Tabs */}
              <div className="flex bg-dark-900/90 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => setSidebarTab('chat')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    sidebarTab === 'chat'
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Room Chat</span>
                </button>
                <button
                  onClick={() => setSidebarTab('members')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                    sidebarTab === 'members'
                      ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Listeners ({room.members?.length || 0}/10)</span>
                </button>
              </div>

              {/* Tab Content */}
              {sidebarTab === 'chat' ? (
                <ChatPanel />
              ) : (
                <div className="glass-card rounded-2xl p-4 border border-white/5">
                  <MembersList />
                </div>
              )}
            </aside>
          </div>
        </main>
      )}

      {/* Manual Lobby Modal Toggle */}
      {showLobby && !room && <LobbyModal />}
    </div>
  );
}

