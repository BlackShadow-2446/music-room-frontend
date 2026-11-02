import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { Plus, X, Youtube, Music, Sparkles, Link, Check, ExternalLink } from 'lucide-react';

const FALLBACK_SAMPLES = [
  {
    title: 'Lofi Hip Hop - Chill Beats',
    artist: 'Lofi Girl',
    source: 'youtube',
    mediaId: 'jfKfPfyJRdk',
    url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
    thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    duration: 180,
  },
  {
    title: 'Synthwave Night Drive',
    artist: 'ChilledCow / Neon Retro',
    source: 'youtube',
    mediaId: '4xDzrJKXOOY',
    url: 'https://www.youtube.com/watch?v=4xDzrJKXOOY',
    thumbnail: 'https://img.youtube.com/vi/4xDzrJKXOOY/hqdefault.jpg',
    duration: 210,
  },
  {
    title: 'Electronic Dreams (Ambient Electro)',
    artist: 'Bensound',
    source: 'audio',
    mediaId: 'https://www.bensound.com/bensound-music/bensound-dreams.mp3',
    url: 'https://www.bensound.com/bensound-music/bensound-dreams.mp3',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80',
    duration: 210,
  },
  {
    title: 'Sunny Days (Acoustic Chill)',
    artist: 'Bensound',
    source: 'audio',
    mediaId: 'https://www.bensound.com/bensound-music/bensound-sunny.mp3',
    url: 'https://www.bensound.com/bensound-music/bensound-sunny.mp3',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    duration: 140,
  },
  {
    title: 'Cyberpunk 2077 Theme - Rebel Path',
    artist: 'P.T. Adamczyk',
    source: 'youtube',
    mediaId: 'gimmCYP0v_s',
    url: 'https://www.youtube.com/watch?v=gimmCYP0v_s',
    thumbnail: 'https://img.youtube.com/vi/gimmCYP0v_s/hqdefault.jpg',
    duration: 245,
  },
  {
    title: 'Deep House Sunset Session',
    artist: 'SoundHelix Audio 1',
    source: 'audio',
    mediaId: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    thumbnail: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&auto=format&fit=crop&q=80',
    duration: 372,
  }
];

export default function AddTrackModal({ isOpen, onClose }) {
  const { addTrackByUrl, addSampleTrack } = useSocket();
  const [url, setUrl] = useState('');
  const [tab, setTab] = useState('samples'); // 'url' | 'samples'
  const [loading, setLoading] = useState(false);
  const [sampleTracks, setSampleTracks] = useState(FALLBACK_SAMPLES);
  const [addedIds, setAddedIds] = useState(new Set());

  // Fetch samples from backend if available
  useEffect(() => {
    fetch('/api/sample-tracks')
      .then((res) => (res.ok ? res.json() : FALLBACK_SAMPLES))
      .then((data) => setSampleTracks(data))
      .catch(() => setSampleTracks(FALLBACK_SAMPLES));
  }, []);

  if (!isOpen) return null;

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      await addTrackByUrl(url.trim());
      setUrl('');
      onClose();
    } catch (err) {
      // Error handled by context toast
    } finally {
      setLoading(false);
    }
  };

  const handleAddSample = async (track) => {
    setLoading(true);
    try {
      await addSampleTrack(track);
      setAddedIds((prev) => new Set(prev).add(track.mediaId));
    } catch (err) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl glass-panel p-6 shadow-2xl border border-white/10 glow-border max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Song to Queue</h3>
              <p className="text-xs text-slate-400">Scheduled fairly in the round-robin queue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-dark-900 p-1 rounded-xl my-4 border border-white/5">
          <button
            onClick={() => setTab('samples')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tab === 'samples'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Library (1-Click)</span>
          </button>
          <button
            onClick={() => setTab('url')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
              tab === 'url'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Paste URL (YouTube / Audio)</span>
          </button>
        </div>

        {/* Tab 1: Paste URL */}
        {tab === 'url' && (
          <form onSubmit={handleUrlSubmit} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Song Link
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube link (https://youtube.com/watch?v=...) or direct .mp3 URL"
                  className="w-full px-4 py-3 bg-dark-900 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition"
                  required
                />
              </div>
            </div>

            <div className="text-xs text-slate-400 space-y-1 bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="font-semibold text-slate-200 block mb-1">Supported Link Formats:</span>
              <div className="flex items-center gap-2">
                <Youtube className="w-3.5 h-3.5 text-red-400" />
                <span>YouTube URLs, Shorts, and Share links</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-3.5 h-3.5 text-cyan-400" />
                <span>Direct audio files (.mp3, .ogg, .wav, audio streams)</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-glow-indigo transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Room Queue</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Sample Tracks Library */}
        {tab === 'samples' && (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
            <p className="text-xs text-slate-400 mb-2">
              Instant royalty-free tracks ready to stream. Click <strong>+ Add</strong> to queue!
            </p>
            {sampleTracks.map((sample) => {
              const isAdded = addedIds.has(sample.mediaId);

              return (
                <div
                  key={sample.mediaId}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-dark-900/70 border border-white/5 hover:border-white/10 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={sample.thumbnail}
                      alt={sample.title}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{sample.title}</div>
                      <div className="text-xs text-slate-400 truncate flex items-center gap-1.5">
                        <span>{sample.artist}</span>
                        <span className="text-[10px] uppercase font-mono px-1 rounded bg-white/5 text-slate-300">
                          {sample.source}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddSample(sample)}
                    disabled={loading}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      isAdded
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

