import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Video, ChevronLeft, ChevronRight, Play, Loader2, Folder, Search, AlertCircle, RefreshCw, SkipBack, SkipForward } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DriveFile {
  id: string;
  name: string;
  thumbnailLink?: string;
  webContentLink?: string;
}

type View = 'menu' | 'folders' | 'videos' | 'player' | 'games';

export default function App() {
  const [view, setView] = useState<View>('menu');
  const [folders, setFolders] = useState<DriveFile[]>([]);
  const [videos, setVideos] = useState<DriveFile[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<DriveFile | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<DriveFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchFolders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/drive/folders');
      if (!res.ok) throw new Error('Could not connect to Google Drive');
      const data = await res.json();
      setFolders(data);
      setView('folders');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch folders');
      console.error('Failed to fetch folders', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (folder: DriveFile) => {
    setLoading(true);
    setError(null);
    setSelectedFolder(folder);
    try {
      const res = await fetch(`/api/drive/videos/${folder.id}`);
      if (!res.ok) throw new Error('Could not fetch videos from this folder');
      const data = await res.json();
      setVideos(data);
      setView('videos');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch videos');
      console.error('Failed to fetch videos', err);
    } finally {
      setLoading(false);
    }
  };

  const playVideo = (video: DriveFile) => {
    setSelectedVideo(video);
    setView('player');
  };

  const playNext = () => {
    if (!selectedVideo || videos.length === 0) return;
    const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
    const nextIndex = (currentIndex + 1) % videos.length;
    setSelectedVideo(videos[nextIndex]);
  };

  const playPrevious = () => {
    if (!selectedVideo || videos.length === 0) return;
    const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
    setSelectedVideo(videos[prevIndex]);
  };

  const filteredVideos = videos.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (selectedVideo) {
      localStorage.setItem(`video_pos_${selectedVideo.id}`, video.currentTime.toString());
    }
  };

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (selectedVideo) {
      const savedPos = localStorage.getItem(`video_pos_${selectedVideo.id}`);
      if (savedPos) {
        video.currentTime = parseFloat(savedPos);
      }
    }
  };

  useEffect(() => {
    if (selectedVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [selectedVideo]);

  const goBack = () => {
    if (view === 'player') setView('videos');
    else if (view === 'videos') setView('folders');
    else if (view === 'folders' || view === 'games') setView('menu');
  };

  return (
    <div className="min-h-screen bg-[#FFFAF0] font-sans text-[#4A4A4A] overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          {view !== 'menu' && (
            <button 
              onClick={goBack}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-[#FF6B6B]" />
            </button>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-[#FF6B6B]">
            Kiddo<span className="text-[#4ECDC4]">Play</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full overflow-y-auto relative">
        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-3xl flex items-center gap-4 text-red-700"
            >
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div className="flex-1 font-bold">{error}</div>
              <button 
                onClick={() => view === 'folders' ? fetchFolders() : fetchVideos(selectedFolder!)}
                className="p-2 hover:bg-red-100 rounded-full transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12"
            >
              <MenuButton 
                icon={<Gamepad2 className="w-24 h-24" />}
                label="Games"
                color="bg-[#FF6B6B]"
                onClick={() => setView('games')}
              />
              <MenuButton 
                icon={<Video className="w-24 h-24" />}
                label="Videos"
                color="bg-[#4ECDC4]"
                onClick={fetchFolders}
              />
            </motion.div>
          )}

          {view === 'folders' && (
            <motion.div 
              key="folders"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-black text-center mb-8 text-[#4A4A4A]">Choose a Playlist!</h2>
              {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-12 h-12 animate-spin text-[#4ECDC4]" /></div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {folders.map((folder: DriveFile) => (
                    <PlaylistCard 
                      key={folder.id} 
                      folder={folder} 
                      onClick={() => fetchVideos(folder)} 
                    />
                  ))}
                  {folders.length === 0 && (
                    <div className="col-span-full text-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                      <p className="text-xl text-gray-400">No folders found in your Drive.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {view === 'videos' && (
            <motion.div 
              key="videos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-3xl font-black text-[#4A4A4A]">{selectedFolder?.name}</h2>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#4ECDC4] transition-colors" />
                  <input 
                    type="text"
                    placeholder="Search videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-12 pr-4 py-3 bg-white border-2 border-gray-100 rounded-2xl focus:border-[#4ECDC4] outline-none transition-all font-bold text-gray-600 shadow-sm"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center p-24 gap-4">
                  <Loader2 className="w-16 h-16 animate-spin text-[#4ECDC4]" />
                  <p className="text-xl font-black text-gray-400 animate-pulse">Loading Cartoons...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredVideos.map((video: DriveFile) => (
                    <VideoCard 
                      key={video.id} 
                      video={video} 
                      onClick={() => playVideo(video)} 
                    />
                  ))}
                  {filteredVideos.length === 0 && (
                    <div className="col-span-full text-center p-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                      <p className="text-xl text-gray-400">No videos match your search.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {view === 'player' && selectedVideo && (
            <motion.div 
              key="player"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-8 border-white relative group">
                <video 
                  ref={videoRef}
                  src={`/api/drive/stream/${selectedVideo.id}`}
                  controls
                  autoPlay
                  onTimeUpdate={handleVideoTimeUpdate}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onEnded={playNext}
                  className="w-full h-full"
                />
                
                {/* Overlay Navigation (Mobile Friendly) */}
                <div className="absolute inset-y-0 left-0 w-1/4 flex items-center justify-start pl-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <button 
                    onClick={(e) => { e.stopPropagation(); playPrevious(); }}
                    className="p-4 bg-black/40 text-white rounded-full pointer-events-auto hover:bg-black/60 transition-colors"
                  >
                    <SkipBack className="w-8 h-8" />
                  </button>
                </div>
                <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <button 
                    onClick={(e) => { e.stopPropagation(); playNext(); }}
                    className="p-4 bg-black/40 text-white rounded-full pointer-events-auto hover:bg-black/60 transition-colors"
                  >
                    <SkipForward className="w-8 h-8" />
                  </button>
                </div>
              </div>

              <div className="w-full flex flex-col items-center gap-2">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={playPrevious}
                    className="p-4 bg-white shadow-md rounded-2xl hover:bg-gray-50 transition-colors text-[#4ECDC4]"
                    title="Previous Video"
                  >
                    <SkipBack className="w-6 h-6" />
                  </button>
                  
                  <div className="px-6 py-2 bg-white shadow-sm rounded-full border-2 border-[#4ECDC4]/20">
                    <span className="font-black text-[#4ECDC4]">
                      Video {videos.findIndex(v => v.id === selectedVideo.id) + 1} of {videos.length}
                    </span>
                  </div>

                  <button 
                    onClick={playNext}
                    className="p-4 bg-white shadow-md rounded-2xl hover:bg-gray-50 transition-colors text-[#4ECDC4]"
                    title="Next Video"
                  >
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>
                <h3 className="text-2xl font-black text-center text-[#4A4A4A] mt-2">{selectedVideo.name}</h3>
              </div>
            </motion.div>
          )}

          {view === 'games' && (
            <motion.div 
              key="games"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center justify-center h-full gap-8 pt-12"
            >
              <div className="text-center space-y-4">
                <div className="relative">
                  <Gamepad2 className="w-48 h-48 mx-auto text-[#FF6B6B]" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-4 border-dashed border-[#FF6B6B]/20 rounded-full"
                  />
                </div>
                <h2 className="text-4xl font-black text-[#FF6B6B]">Games Coming Soon!</h2>
                <p className="text-xl text-gray-500 max-w-md mx-auto">
                  We are building some super fun puzzles and coloring games for you. Stay tuned!
                </p>
              </div>
              <button 
                onClick={() => setView('menu')}
                className="px-12 py-4 bg-[#FF6B6B] text-white rounded-full font-black text-2xl shadow-xl hover:bg-[#FF5252] transition-all active:scale-95"
              >
                Go Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {view === 'menu' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-6 bg-white rounded-3xl shadow-sm border-2 border-dashed border-[#FF6B6B]/20 text-center"
          >
            <h3 className="text-xl font-bold text-[#FF6B6B] mb-2">📱 Install as an App</h3>
            <p className="text-gray-600 text-sm">
              Tap the <strong>three dots (⋮)</strong> in Chrome and select <strong>"Add to Home Screen"</strong> to use KiddoPlay like a real Android app!
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

const MenuButton: React.FC<{ icon: React.ReactNode, label: string, color: string, onClick: () => void }> = ({ icon, label, color, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-12 rounded-[60px] text-white transition-all shadow-2xl hover:scale-105 active:scale-95 border-b-8 border-black/20",
        color
      )}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {icon}
      </motion.div>
      <span className="mt-8 text-5xl font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

const PlaylistCard: React.FC<{ folder: DriveFile, onClick: () => void }> = ({ folder, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center gap-4 p-6 bg-white rounded-[40px] shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 border-b-4 border-gray-100"
    >
      <div className="w-full aspect-square bg-[#FFE66D] rounded-[30px] flex items-center justify-center shadow-inner">
        <Folder className="w-16 h-16 text-white" />
      </div>
      <span className="font-black text-xl text-center line-clamp-2 text-[#4A4A4A]">{folder.name}</span>
    </button>
  );
}

const VideoCard: React.FC<{ video: DriveFile, onClick: () => void }> = ({ video, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col bg-white rounded-[40px] shadow-lg hover:shadow-xl transition-all text-left w-full group border-b-4 border-gray-100 overflow-hidden"
    >
      <div className="relative w-full aspect-video bg-gray-100 flex-shrink-0 shadow-inner">
        {video.thumbnailLink ? (
          <img 
            src={video.thumbnailLink.replace('=s220', '=s600')} 
            alt="" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#4ECDC4] to-[#45B7AF]">
            <Play className="w-16 h-16 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors flex items-center justify-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
            <Play className="w-8 h-8 text-[#4ECDC4] fill-current" />
          </div>
        </div>
      </div>
      <div className="p-6">
        <span className="font-black text-xl line-clamp-2 text-[#4A4A4A] leading-tight group-hover:text-[#4ECDC4] transition-colors">{video.name}</span>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4ECDC4]" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cartoon Movie</span>
        </div>
      </div>
    </button>
  );
}
