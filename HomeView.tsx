import { useState, useEffect } from 'react';
import { Home, Search, User, Settings, Lock, Unlock, List, History, Tv, Sparkles, LogOut, Info, FileText, Sun, Moon, Film, UserCog, X, Eye, EyeOff, Play, Plus, Clock, Radio, Trash2, Download, Smartphone } from 'lucide-react';
import { Profile, TMDBMovie, TMDBShow, WatchlistItem } from '../types';
import { tmdbFetch, getTMDBImageUrl } from '../lib/tmdb';
import { getWatchlist, addToWatchlist, removeFromWatchlist, getWatchHistory, isInWatchlist, generateId, saveProfile, removeProfileData, getSearchHistoryEnabled, setSearchHistoryEnabled, clearSearchHistory, getCustomAvatar } from '../lib/storage';
import { useTheme } from '../context/ThemeContext';
import { DownloadAppDialog } from './DownloadAppDialog';

interface HomeViewProps {
  profile: Profile;
  onLogout: () => void;
  onShowDetail: (id: number, type: 'movie' | 'tv') => void;
  onShowLiveTV: () => void;
  onProfileUpdate: () => void;
  onShowAbout: () => void;
  onShowTerms: () => void;
  onShowSurprise: () => void;
  onShowSearch: () => void;
  onGoHome: () => void;
}

export function HomeView({ profile, onLogout, onShowDetail, onShowLiveTV, onProfileUpdate, onShowAbout, onShowTerms, onShowSurprise, onShowSearch, onGoHome }: HomeViewProps) {
  const [scrolled, setScrolled] = useState(false);
  const [hero, setHero] = useState<(TMDBMovie | TMDBShow) | null>(null);
  const [trendingMovies, setTrendingMovies] = useState<TMDBMovie[]>([]);
  const [trendingShows, setTrendingShows] = useState<TMDBShow[]>([]);
  const [popularMovies, setPopularMovies] = useState<TMDBMovie[]>([]);
  const [popularShows, setPopularShows] = useState<TMDBShow[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'tv' | 'mylist' | 'history'>('home');
  const [showWelcome, setShowWelcome] = useState(profile.first_login === true);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState<'add' | 'change' | 'remove' | null>(null);
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [securityWord, setSecurityWord] = useState('');
  const [newName, setNewName] = useState(profile.name);
  const [newColor, setNewColor] = useState(profile.avatar_color);
  const [showPasscode, setShowPasscode] = useState(false);
  const { effectiveTheme, toggleTheme } = useTheme();
  const [showSeasonal, setShowSeasonal] = useState(false);
  const [seasonal, setSeasonal] = useState<any | null>(null);
  const [showRemoveData, setShowRemoveData] = useState(false);
  const [removeWatchlist, setRemoveWatchlist] = useState(false);
  const [removeHistory, setRemoveHistory] = useState(false);
  const [removeSecurity, setRemoveSecurity] = useState(false);
  const [showDownloadApp, setShowDownloadApp] = useState(false);
  const searchHistoryEnabled = getSearchHistoryEnabled(profile.id);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadContent();
    loadWatchlist();
    loadContinueWatching();
  }, [profile.id]);

  useEffect(() => {
    if (profile.first_login === undefined) {
      const updated = { ...profile, first_login: true };
      saveProfile(updated);
      setShowWelcome(true);
    }
    
    const today = new Date();
    const seasonalKey = `${today.getMonth()}-${today.getDate()}`;
    
    if (profile.seasonal_shown !== seasonalKey) {
      const s = getSeasonalData(today);
      if (s) {
        // Ensure poster paths are up to date (avoid stale hardcoded poster filenames)
        (async () => {
          try {
            const details = await Promise.all(
              s.items.map((it: any) => tmdbFetch(`/movie/${it.id}`))
            );
            const updated = {
              ...s,
              items: s.items.map((it: any, idx: number) => ({
                ...it,
                // Prefer fresh poster_path from TMDB, fallback to existing
                poster: details[idx]?.poster_path || it.poster,
              })),
            };
            setSeasonal(updated);
          } catch (e) {
            // Fallback to original seasonal data if fetch fails
            setSeasonal(s);
          }
          setShowSeasonal(true);
        })();
      } else {
        setShowSeasonal(false);
      }
    }
  }, [profile.id]);

  async function loadContent() {
    try {
      const [trending, movies, shows] = await Promise.all([
        tmdbFetch('/trending/all/day'),
        tmdbFetch('/movie/popular'),
        tmdbFetch('/tv/popular')
      ]);

      const heroItem = trending.results?.[0];
      setHero(heroItem);
      setTrendingMovies(trending.results?.filter((i: any) => i.media_type === 'movie').slice(0, 10) || []);
      setTrendingShows(trending.results?.filter((i: any) => i.media_type === 'tv').slice(0, 10) || []);
      setPopularMovies(movies.results?.slice(0, 10) || []);
      setPopularShows(shows.results?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error loading content:', error);
    }
  }

  function loadWatchlist() {
    const list = getWatchlist(profile.id);
    setWatchlist(list);
  }

  function loadContinueWatching() {
    const history = getWatchHistory(profile.id);
    const uniqueHistory = history.reduce((acc: any[], current) => {
      const exists = acc.find(item =>
        item.tmdb_id === current.tmdb_id &&
        item.media_type === current.media_type
      );
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);
    setContinueWatching(uniqueHistory.slice(0, 10));
  }

  function isWatched(tmdbId: number, mediaType: string): boolean {
    const history = getWatchHistory(profile.id);
    return history.some(h => h.tmdb_id === tmdbId && h.media_type === mediaType);
  }

  function handleAddToWatchlist(item: TMDBMovie | TMDBShow, type: 'movie' | 'tv') {
    const watchlistItem: WatchlistItem = {
      id: generateId(),
      profile_id: profile.id,
      tmdb_id: item.id,
      media_type: type,
      title: 'title' in item ? item.title : item.name,
      poster_path: item.poster_path || undefined,
      created_at: new Date().toISOString()
    };
    addToWatchlist(watchlistItem);
    loadWatchlist();
  }

  function handleRemoveFromWatchlist(tmdbId: number) {
    removeFromWatchlist(profile.id, tmdbId);
    loadWatchlist();
  }

  function handleWelcomeClose() {
    const updatedProfile = { ...profile, first_login: false };
    saveProfile(updatedProfile);
    setShowWelcome(false);
    onProfileUpdate();
  }

  function handleSaveProfile() {
    const updatedProfile = { ...profile, name: newName, avatar_color: newColor };
    saveProfile(updatedProfile);
    setShowProfileSettings(false);
    onProfileUpdate();
  }

  function handlePasscodeAction() {
    if (showPasscodeModal === 'add') {
      if (newPasscode.length !== 4 || newPasscode !== confirmPasscode) {
        alert('Passcodes must be 4 digits and match');
        return;
      }
      if (!securityWord.trim()) {
        alert('Security word is required');
        return;
      }
      const updatedProfile = { ...profile, pin: newPasscode, security_word: securityWord };
      saveProfile(updatedProfile);
      onProfileUpdate();
    } else if (showPasscodeModal === 'change') {
      if (newPasscode.length !== 4 || newPasscode !== confirmPasscode) {
        alert('Passcodes must be 4 digits and match');
        return;
      }
      const updatedProfile = { ...profile, pin: newPasscode };
      saveProfile(updatedProfile);
      onProfileUpdate();
    } else if (showPasscodeModal === 'remove') {
      const updatedProfile = { ...profile, pin: null, security_word: null };
      saveProfile(updatedProfile);
      onProfileUpdate();
    }
    setShowPasscodeModal(null);
    setNewPasscode('');
    setConfirmPasscode('');
    setSecurityWord('');
  }

  const getTitle = (item: any) => item.title || item.name;
  const textClass = effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900';

  function getSeasonalData(now: Date) {
    const y = now.getFullYear();
    const inRange = (start: Date, end: Date) => now >= start && now < end;
    if (inRange(new Date(y, 9, 6), new Date(y, 10, 2))) {
      return {
        key: 'halloween',
        title: '🎃 Halloween Special',
        description: "It's the Halloween season, and you know what's SPOOKY? Not having something to watch! We got you covered with a few picks from our SimplStream Team.",
        items: [
          { id: 14836, title: 'Coraline', year: '2009', poster: '/4jeFXQYytChdZYE9JYO7Un87IlW.jpg' },
          { id: 620, title: 'Ghostbusters', year: '1984', poster: '/3FS3oBdrgfBXNNEMWB3m6CmMFyQ.jpg' },
          { id: 9479, title: 'The Nightmare Before Christmas', year: '1993', poster: '/aEUMAoGvZHt16fF7Uh8ULxWzPLv.jpg' }
        ],
        gradient: 'from-orange-600 via-purple-600 to-black',
      };
    }
    if (inRange(new Date(y, 10, 12), new Date(y, 11, 27))) {
      return {
        key: 'christmas',
        title: '🎄 Christmas Magic',
        description: 'Ahh, tis the season. The smell of hot cocoa and Christmas trees. Why not lay down and watch some of our festive movie lineup from our SimplStream Team?',
        items: [
          { id: 771, title: 'Home Alone', year: '1990', poster: '/onTSipZ8R3bliBdKfPtsDuHTdlL.jpg' },
          { id: 8871, title: 'How the Grinch Stole Christmas', year: '2000', poster: '/1TiO4N6OhFfYJGJXy25EwYMC6O7.jpg' },
          { id: 5255, title: 'The Polar Express', year: '2004', poster: '/aqjKHvM8zpHtSJhfx81JHfPD8U5.jpg' },
          { id: 508965, title: 'Klaus', year: '2019', poster: '/q125RHUDgR4gjwh1QkfYuJLYkL3.jpg' }
        ],
        gradient: 'from-red-600 via-green-600 to-emerald-700',
      };
    }
    if (inRange(new Date(y, 1, 1), new Date(y, 1, 21))) {
      return {
        key: 'valentines',
        title: '💕 Valentine\'s Romance',
        description: 'Love is in the air, and you know what that brings? Movie nights with your loved ones! We got you covered with our lineup of romantic picks from our SimplStream Team.',
        items: [
          { id: 4523, title: 'Enchanted', year: '2007', poster: '/fXFJSRbjKhKHQwwNhZXjqfNpJtd.jpg' },
          { id: 10681, title: 'WALL-E', year: '2008', poster: '/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg' },
          { id: 2493, title: 'The Princess Bride', year: '1987', poster: '/gpxjoE0yvRwIhFEJgNArtKtaN7S.jpg' }
        ],
        gradient: 'from-pink-500 via-rose-500 to-red-600',
      };
    }
    if (inRange(new Date(y, 5, 1), new Date(y, 6, 1))) {
      return {
        key: 'summer',
        title: '☀️ Summer Vibes',
        description: "It's summer! No more school, lots of sun, and most importantly... Lots to watch! Here are some peak recommendations for the summer from our SimplStream Team.",
        items: [
          { id: 12, title: 'Finding Nemo', year: '2003', poster: '/eHuGQ10FUzK1mdOY69wF5pGgEf5.jpg' },
          { id: 277834, title: 'Moana', year: '2016', poster: '/4JeejGugONWpJkbnvL12hVoYEDa.jpg' },
          { id: 862, title: 'Toy Story', year: '1995', poster: '/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg' }
        ],
        gradient: 'from-sky-500 via-amber-400 to-emerald-500',
      };
    }
    return null;
  }

  function handleSeasonalClose() {
    const today = new Date();
    const seasonalKey = `${today.getMonth()}-${today.getDate()}`;
    const updatedProfile = { ...profile, seasonal_shown: seasonalKey };
    saveProfile(updatedProfile);
    setShowSeasonal(false);
    onProfileUpdate();
  }

  function handleRemoveData() {
    if (!removeWatchlist && !removeHistory && !removeSecurity) {
      return;
    }
    
    removeProfileData(profile.id, { 
      watchlist: removeWatchlist, 
      watchHistory: removeHistory, 
      security: removeSecurity 
    });
    
    if (removeHistory) {
      clearSearchHistory(profile.id);
    }
    
    // Reload data
    loadWatchlist();
    loadContinueWatching();
    
    setShowRemoveData(false);
    setRemoveWatchlist(false);
    setRemoveHistory(false);
    setRemoveSecurity(false);
    onProfileUpdate();
  }

  function handleToggleSearchHistory() {
    const newEnabled = !searchHistoryEnabled;
    setSearchHistoryEnabled(profile.id, newEnabled);
    if (!newEnabled) {
      clearSearchHistory(profile.id);
    }
    onProfileUpdate();
  }

  return (
    <div className={`min-h-screen ${effectiveTheme === 'dark' ? 'bg-black' : 'bg-gray-50'} ${textClass}`}>
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? effectiveTheme === 'dark' ? 'glass-header' : 'glass-header-light' : 'bg-transparent'}`}>
        <div className="max-w-[1920px] 2k:max-w-[2560px] 4k:max-w-[3440px] mx-auto px-3 sm:px-6 2k:px-8 4k:px-12 py-2 sm:py-3 2k:py-4 4k:py-6 flex items-center justify-between gap-2 sm:gap-4">
          <button onClick={onGoHome} className="text-lg sm:text-2xl 2k:text-3xl 4k:text-5xl font-bold whitespace-nowrap flex-shrink-0 hover:opacity-80 transition-opacity">
            <span className="text-blue-500">Simpl</span>Stream
          </button>
          
          {/* Centered navigation with icon-only buttons */}
          <nav className="hidden min-[1024px]:flex absolute left-1/2 -translate-x-1/2 gap-4 xl:gap-6 2k:gap-8 4k:gap-12">
            <button onClick={() => setActiveTab('home')} className={`group relative p-2 rounded-lg transition-all ${activeTab === 'home' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'}`} title="Home">
              <Home size={20} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Home</span>
            </button>
            <button onClick={() => setActiveTab('movies')} className={`group relative p-2 rounded-lg transition-all ${activeTab === 'movies' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'}`} title="Movies">
              <Film size={20} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Movies</span>
            </button>
            <button onClick={() => setActiveTab('tv')} className={`group relative p-2 rounded-lg transition-all ${activeTab === 'tv' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'}`} title="TV Shows">
              <Tv size={20} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">TV Shows</span>
            </button>
            <button onClick={() => setActiveTab('mylist')} className={`group relative p-2 rounded-lg transition-all ${activeTab === 'mylist' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'}`} title="Watchlist">
              <List size={20} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Watchlist</span>
            </button>
            <button onClick={() => setActiveTab('history')} className={`group relative p-2 rounded-lg transition-all ${activeTab === 'history' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-300'}`} title="History">
              <Clock size={20} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">History</span>
            </button>
            <button onClick={onShowLiveTV} className="group relative p-2 text-gray-400 hover:text-gray-300 rounded-lg transition-all" title="Live TV">
              <Radio size={20} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Live TV</span>
            </button>
            <button onClick={onShowSurprise} className="group relative p-2 text-gray-400 hover:text-gray-300 rounded-lg transition-all" title="Surprise Me">
              <Sparkles size={20} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Surprise Me</span>
            </button>
          </nav>
          <div className="flex items-center gap-1 sm:gap-2 2k:gap-3 4k:gap-4 flex-shrink-0">
            <button onClick={onShowSearch} className="hover:text-blue-500 transition-colors p-1 sm:p-2 2k:p-3 4k:p-4"><Search size={18} className="sm:w-5 sm:h-5 2k:w-6 2k:h-6 4k:w-12 4k:h-12" /></button>
            <button onClick={toggleTheme} className="hover:text-blue-500 transition-colors p-1 sm:p-2 2k:p-3 4k:p-4">{effectiveTheme === 'dark' ? <Sun size={18} className="sm:w-5 sm:h-5 2k:w-6 2k:h-6 4k:w-12 4k:h-12" /> : <Moon size={18} className="sm:w-5 sm:h-5 2k:w-6 2k:h-6 4k:w-12 4k:h-12" />}</button>
            <div className="relative">
              <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="relative w-7 h-7 sm:w-10 sm:h-10 2k:w-12 2k:h-12 4k:w-20 4k:h-20 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-base 2k:text-lg 4k:text-4xl shadow-lg hover:shadow-xl transition-all hover:scale-110 overflow-hidden" style={{ backgroundColor: profile.avatar_color }}>
                {(() => {
                  const avatar = getCustomAvatar(profile.id);
                  if (avatar?.url) {
                    return (
                      <img
                        src={avatar.url}
                        alt={`${profile.name} avatar`}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{
                          objectPosition: `${avatar.position.x}% ${avatar.position.y}%`,
                          transform: `scale(${Math.max(1, avatar.zoom)})`,
                        }}
                      />
                    );
                  }
                  return profile.name[0].toUpperCase();
                })()}
              </button>
              {profile.pin && <Lock className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 2k:w-5 2k:h-5 4k:w-8 4k:h-8 text-green-500 bg-black rounded-full p-0.5" />}
              {showProfileMenu && (
                <div className={`absolute right-0 mt-2 2k:mt-3 4k:mt-4 w-44 sm:w-56 2k:w-64 4k:w-96 ${effectiveTheme === 'dark' ? 'bg-gray-900/95 backdrop-blur-lg border-gray-700' : 'bg-white/95 backdrop-blur-lg border-gray-200'} rounded-lg shadow-xl p-2 2k:p-3 4k:p-4 border max-h-[80vh] overflow-y-auto`}>
                  <button onClick={() => { setShowProfileSettings(true); setShowProfileMenu(false); }} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded transition-colors text-left`}><UserCog size={14} className="2k:w-5 2k:h-5 4k:w-8 4k:h-8" /> Edit Profile</button>
                  {!profile.pin ? (
                    <button onClick={() => { setShowPasscodeModal('add'); setShowProfileMenu(false); }} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded transition-colors text-left`}><Lock size={14} className="2k:w-5 2k:h-5 4k:w-8 4k:h-8" /> Add Passcode</button>
                  ) : (
                    <>
                      <button onClick={() => { setShowPasscodeModal('change'); setShowProfileMenu(false); }} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded transition-colors text-left`}><Lock size={14} className="2k:w-5 2k:h-5 4k:w-8 4k:h-8" /> Change Passcode</button>
                      <button onClick={() => { setShowPasscodeModal('remove'); setShowProfileMenu(false); }} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded transition-colors text-left`}><Lock size={14} className="2k:w-5 2k:h-5 4k:w-8 4k:h-8" /> Remove Passcode</button>
                    </>
                  )}
                  <button onClick={() => { setActiveTab('mylist'); setShowProfileMenu(false); }} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded transition-colors text-left`}><Film size={14} className="2k:w-5 2k:h-5 4k:w-8 4k:h-8" /> Watchlist</button>
                  <button onClick={() => { setActiveTab('history'); setShowProfileMenu(false); }} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded transition-colors text-left`}><History size={14} className="2k:w-5 2k:h-5 4k:w-8 4k:h-8" /> Watch History</button>
                  <button onClick={handleToggleSearchHistory} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded transition-colors text-left`}><Search size={14} className="2k:w-5 2k:h-5 4k:w-8 4k:h-8" /> {searchHistoryEnabled ? 'Remove' : 'Enable'} Search History</button>
                  <button onClick={() => { setShowRemoveData(true); setShowProfileMenu(false); }} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-red-900/30' : 'hover:bg-red-100'} text-red-500 rounded transition-colors text-left`}><Trash2 size={14} className="2k:w-5 2k:h-5 4k:w-8 4k:h-8" /> Remove All Data</button>
                  <div className={`my-1 2k:my-2 4k:my-3 border-t ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>
                  <button 
                    onClick={() => { setShowDownloadApp(true); setShowProfileMenu(false); }} 
                    className={`w-full flex items-center justify-center gap-3 2k:gap-4 4k:gap-6 px-3 sm:px-4 2k:px-5 4k:px-8 py-3 2k:py-4 4k:py-6 text-sm sm:text-base 2k:text-lg 4k:text-3xl font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-lg`}
                  >
                    <Smartphone size={18} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" />
                    <Download size={18} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" />
                    Download APP
                  </button>
                  <div className={`my-1 2k:my-2 4k:my-3 border-t ${effectiveTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}></div>
                  <button onClick={onShowAbout} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded transition-colors text-left`}>About</button>
                  <button onClick={onShowTerms} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded transition-colors text-left`}>Terms</button>
                  <button onClick={onLogout} className={`w-full flex items-center gap-2 2k:gap-3 4k:gap-4 px-3 sm:px-4 2k:px-5 4k:px-8 py-2 2k:py-3 4k:py-4 text-xs sm:text-sm 2k:text-base 4k:text-2xl ${effectiveTheme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} rounded transition-colors text-left`}><LogOut size={14} className="2k:w-5 2k:h-5 4k:w-8 4k:h-8" /> Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation for small screens */}
      <nav className={`tv:hidden 2k:hidden 4k:hidden fixed bottom-0 inset-x-0 z-50 ${effectiveTheme === 'dark' ? 'glass-header' : 'glass-header-light'} max-[1023px]:block hidden`}>
        <div className="max-w-[1920px] mx-auto px-2 py-2 grid grid-cols-7 gap-1 text-xs">
          <button onClick={() => setActiveTab('home')} className="flex flex-col items-center gap-1">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button onClick={() => setActiveTab('movies')} className="flex flex-col items-center gap-1">
            <Film className="w-5 h-5" />
            <span>Movies</span>
          </button>
          <button onClick={() => setActiveTab('tv')} className="flex flex-col items-center gap-1">
            <Tv className="w-5 h-5" />
            <span>TV</span>
          </button>
          <button onClick={() => setActiveTab('mylist')} className="flex flex-col items-center gap-1">
            <List className="w-5 h-5" />
            <span>My List</span>
          </button>
          <button onClick={() => setActiveTab('history')} className="flex flex-col items-center gap-1">
            <Clock className="w-5 h-5" />
            <span>History</span>
          </button>
          <button onClick={onShowLiveTV} className="flex flex-col items-center gap-1">
            <Radio className="w-5 h-5" />
            <span>Live</span>
          </button>
          <button onClick={onShowSurprise} className="flex flex-col items-center gap-1">
            <Sparkles className="w-5 h-5" />
            <span>Surprise</span>
          </button>
        </div>
      </nav>

      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl 2k:rounded-3xl 4k:rounded-[3rem] p-6 sm:p-8 2k:p-12 4k:p-16 max-w-md 2k:max-w-xl 4k:max-w-4xl w-full max-h-[75vh] overflow-y-auto`}>
            <h2 className={`text-2xl sm:text-3xl 2k:text-4xl 4k:text-7xl font-bold mb-4 2k:mb-6 4k:mb-8 ${textClass}`}>Welcome, {profile.name}!</h2>
            <p className={`text-sm sm:text-base 2k:text-lg 4k:text-3xl mb-4 2k:mb-6 4k:mb-8 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Welcome to SimplStream! Enjoy unlimited movies, TV shows, and live TV. We recommend adding a passcode to keep your profile secure.
            </p>
            <button onClick={handleWelcomeClose} className="w-full px-6 py-3 2k:px-8 2k:py-4 4k:px-12 4k:py-6 text-sm sm:text-base 2k:text-lg 4k:text-3xl bg-blue-600 hover:bg-blue-700 text-white rounded-lg 2k:rounded-xl 4k:rounded-2xl font-medium transition-colors">
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Seasonal Popup */}
      {showSeasonal && seasonal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className={`p-[3px] rounded-2xl bg-gradient-to-r ${seasonal.gradient} max-w-3xl 2k:max-w-4xl 4k:max-w-6xl w-full relative`}>
            <div className={`${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-[1rem] p-6 sm:p-8 2k:p-10 4k:p-12 max-h-[85vh] overflow-y-auto relative`}>
              <button
                onClick={handleSeasonalClose}
                className="absolute top-4 right-4 2k:top-6 2k:right-6 4k:top-8 4k:right-8 z-10 p-2 2k:p-3 4k:p-4 rounded-full bg-gray-800/80 hover:bg-gray-700/80 text-white transition-all hover:scale-110"
                aria-label="Close"
              >
                <X size={24} className="2k:w-8 2k:h-8 4k:w-12 4k:h-12" />
              </button>
              <h2 className="text-2xl sm:text-3xl 2k:text-4xl 4k:text-6xl font-bold mb-2 2k:mb-3 4k:mb-4 pr-12 2k:pr-16 4k:pr-20">{seasonal.title}</h2>
              <p className={`text-base sm:text-lg 2k:text-xl 4k:text-3xl mb-6 2k:mb-8 4k:mb-10 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {seasonal.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 2k:gap-5 4k:gap-6 mb-6 2k:mb-8 4k:mb-10">
                {seasonal.items.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleSeasonalClose();
                      onShowDetail(item.id, 'movie');
                    }}
                    className={`${effectiveTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl group`}
                  >
                    <div className="relative">
                      <img
                        src={getTMDBImageUrl(item.poster, 'w342')}
                        alt={item.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-10 h-10 2k:w-12 2k:h-12 4k:w-16 4k:h-16 text-white" fill="white" />
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 2k:p-4 4k:p-5">
                      <p className="font-bold text-xs sm:text-sm 2k:text-base 4k:text-2xl line-clamp-2">{item.title}</p>
                      <p className={`text-xs 2k:text-sm 4k:text-xl ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{item.year}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className={`text-center text-xs sm:text-sm 2k:text-base 4k:text-2xl mt-4 2k:mt-5 4k:mt-6 ${effectiveTheme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                <span className="text-blue-500 font-bold">Simpl</span>Stream
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl 2k:rounded-3xl 4k:rounded-[3rem] p-6 sm:p-8 2k:p-12 4k:p-16 max-w-md 2k:max-w-xl 4k:max-w-4xl w-full my-auto max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6 2k:mb-8 4k:mb-12">
              <h2 className={`text-2xl 2k:text-3xl 4k:text-6xl font-bold ${textClass}`}>Edit Profile</h2>
              <button onClick={() => setShowProfileSettings(false)} className={effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
                <X size={24} className="2k:w-8 2k:h-8 4k:w-12 4k:h-12" />
              </button>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter name"
              className={`w-full px-4 py-3 2k:px-6 2k:py-4 4k:px-8 4k:py-6 text-sm sm:text-base 2k:text-lg 4k:text-3xl rounded-lg 2k:rounded-xl 4k:rounded-2xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border ${textClass} placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 2k:mb-6 4k:mb-8`}
            />
            <div className="mb-4 2k:mb-6 4k:mb-8">
              <label className={`block text-sm 2k:text-base 4k:text-3xl font-medium mb-2 2k:mb-3 4k:mb-4 ${textClass}`}>Choose Color</label>
              <div className="grid grid-cols-8 gap-2 2k:gap-3 4k:gap-4">
                {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`w-10 h-10 2k:w-12 2k:h-12 4k:w-20 4k:h-20 rounded-lg 2k:rounded-xl 4k:rounded-2xl transition-all ${newColor === color ? 'ring-4 2k:ring-5 4k:ring-8 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <button onClick={handleSaveProfile} className="w-full px-6 py-3 2k:px-8 2k:py-4 4k:px-12 4k:py-6 text-sm sm:text-base 2k:text-lg 4k:text-3xl bg-blue-600 hover:bg-blue-700 text-white rounded-lg 2k:rounded-xl 4k:rounded-2xl font-medium transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl 2k:rounded-3xl 4k:rounded-[3rem] p-6 sm:p-8 2k:p-12 4k:p-16 max-w-md 2k:max-w-xl 4k:max-w-4xl w-full my-auto max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6 2k:mb-8 4k:mb-12">
              <h2 className={`text-2xl 2k:text-3xl 4k:text-6xl font-bold ${textClass}`}>
                {showPasscodeModal === 'add' ? 'Add Passcode' : showPasscodeModal === 'change' ? 'Change Passcode' : 'Remove Passcode'}
              </h2>
              <button onClick={() => setShowPasscodeModal(null)} className={effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
                <X size={24} className="2k:w-8 2k:h-8 4k:w-12 4k:h-12" />
              </button>
            </div>
            {showPasscodeModal !== 'remove' && (
              <>
                <div className="relative mb-4 2k:mb-6 4k:mb-8">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    maxLength={4}
                    value={newPasscode}
                    onChange={(e) => setNewPasscode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit passcode"
                    className={`w-full px-4 py-3 2k:px-6 2k:py-4 4k:px-8 4k:py-6 pr-12 2k:pr-14 4k:pr-20 text-center text-2xl 2k:text-3xl 4k:text-6xl tracking-widest rounded-lg 2k:rounded-xl 4k:rounded-2xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border ${textClass} placeholder-gray-400 focus:outline-none focus:border-blue-500`}
                  />
                  <button
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-4 2k:right-5 4k:right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasscode ? <EyeOff size={20} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" /> : <Eye size={20} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" />}
                  </button>
                </div>
                <input
                  type={showPasscode ? 'text' : 'password'}
                  maxLength={4}
                  value={confirmPasscode}
                  onChange={(e) => setConfirmPasscode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirm passcode"
                  className={`w-full px-4 py-3 2k:px-6 2k:py-4 4k:px-8 4k:py-6 text-center text-2xl 2k:text-3xl 4k:text-6xl tracking-widest rounded-lg 2k:rounded-xl 4k:rounded-2xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border ${textClass} placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 2k:mb-6 4k:mb-8`}
                />
                {showPasscodeModal === 'add' && (
                  <input
                    type="text"
                    value={securityWord}
                    onChange={(e) => setSecurityWord(e.target.value)}
                    placeholder="Security word (backup code)"
                    className={`w-full px-4 py-3 2k:px-6 2k:py-4 4k:px-8 4k:py-6 text-sm sm:text-base 2k:text-lg 4k:text-3xl rounded-lg 2k:rounded-xl 4k:rounded-2xl ${effectiveTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'} border ${textClass} placeholder-gray-400 focus:outline-none focus:border-blue-500 mb-4 2k:mb-6 4k:mb-8`}
                  />
                )}
              </>
            )}
            {showPasscodeModal === 'remove' && (
              <p className={`text-sm sm:text-base 2k:text-lg 4k:text-3xl mb-6 2k:mb-8 4k:mb-12 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Are you sure you want to remove your passcode? Your profile will no longer be protected.
              </p>
            )}
            <button onClick={handlePasscodeAction} className="w-full px-6 py-3 2k:px-8 2k:py-4 4k:px-12 4k:py-6 text-sm sm:text-base 2k:text-lg 4k:text-3xl bg-blue-600 hover:bg-blue-700 text-white rounded-lg 2k:rounded-xl 4k:rounded-2xl font-medium transition-colors">
              {showPasscodeModal === 'remove' ? 'Remove' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="pt-16 sm:pt-18 2k:pt-20 4k:pt-32">
        {hero && activeTab === 'home' && (
          <div className="relative h-[70vh] sm:h-[80vh] 2k:h-[85vh] 4k:h-[90vh] overflow-hidden mb-4 sm:mb-6 2k:mb-8 4k:mb-12">
            <div className="absolute inset-0 bg-cover bg-center opacity-95" style={{ backgroundImage: `url(${getTMDBImageUrl(hero.backdrop_path, 'original')})` }}>
              <div className={`absolute inset-0 ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-black via-black/60 to-transparent' : 'bg-gradient-to-r from-white via-white/60 to-transparent'}`}></div>
              <div className={`absolute inset-0 ${effectiveTheme === 'dark' ? 'bg-gradient-to-t from-black via-transparent to-transparent' : 'bg-gradient-to-t from-white via-transparent to-transparent'}`}></div>
            </div>
            <div className="relative z-10 h-full flex items-center max-w-[1920px] 2k:max-w-[2560px] 4k:max-w-[3440px] mx-auto px-4 sm:px-6 2k:px-8 4k:px-12">
              <div className="max-w-2xl 2k:max-w-3xl 4k:max-w-6xl">
                <h1 className={`text-3xl sm:text-5xl 2k:text-6xl 4k:text-9xl font-bold mb-3 sm:mb-4 2k:mb-6 4k:mb-8 drop-shadow-2xl ${textClass} animate-fade-in`}>{getTitle(hero)}</h1>
                <p className={`text-sm sm:text-lg 2k:text-xl 4k:text-4xl mb-4 sm:mb-6 2k:mb-8 4k:mb-12 line-clamp-3 ${effectiveTheme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{hero.overview}</p>
                <div className="flex flex-wrap gap-3 sm:gap-4 2k:gap-5 4k:gap-8">
                  <button onClick={() => onShowDetail(hero.id, 'title' in hero ? 'movie' : 'tv')} className={`px-6 sm:px-8 2k:px-10 4k:px-16 py-2 sm:py-3 2k:py-4 4k:py-6 text-sm sm:text-base 2k:text-lg 4k:text-4xl ${effectiveTheme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} rounded-lg font-bold flex items-center gap-2 2k:gap-3 4k:gap-4 hover-lift`}>
                    <Play size={18} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" fill="currentColor" /> Play
                  </button>
                  {isInWatchlist(profile.id, hero.id) ? (
                    <button onClick={() => handleRemoveFromWatchlist(hero.id)} className={`px-6 sm:px-8 2k:px-10 4k:px-16 py-2 sm:py-3 2k:py-4 4k:py-6 text-sm sm:text-base 2k:text-lg 4k:text-4xl ${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} rounded-lg font-bold hover-lift`}>Remove</button>
                  ) : (
                    <button onClick={() => handleAddToWatchlist(hero, 'title' in hero ? 'movie' : 'tv')} className={`px-6 sm:px-8 2k:px-10 4k:px-16 py-2 sm:py-3 2k:py-4 4k:py-6 text-sm sm:text-base 2k:text-lg 4k:text-4xl ${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} rounded-lg font-bold flex items-center gap-2 2k:gap-3 4k:gap-4 hover-lift`}>
                      <Plus size={18} className="2k:w-6 2k:h-6 4k:w-10 4k:h-10" /> My Library
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 px-4 sm:px-6 2k:px-8 4k:px-12 pb-24 sm:pb-28 2k:pb-32 4k:pb-48">
          <div className="max-w-[1920px] 2k:max-w-[2560px] 4k:max-w-[3440px] mx-auto space-y-8 sm:space-y-12 2k:space-y-16 4k:space-y-24">
            {activeTab === 'home' && (
              <>
                {continueWatching.filter(item => item.media_type !== 'live').length > 0 && (
                  <div>
                    <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">Continue Watching</h2>
                    <div className="flex gap-3 sm:gap-4 2k:gap-6 4k:gap-8 overflow-x-auto scrollbar-hide pb-2">
                      {continueWatching.filter(item => item.media_type !== 'live').map((item: any) => (
                        <button key={item.id} onClick={() => onShowDetail(item.tmdb_id, item.media_type as 'movie' | 'tv')} className="flex-shrink-0 hover-lift">
                          <div className="w-32 sm:w-48 2k:w-56 4k:w-96 rounded-lg overflow-hidden shadow-lg"><img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.title} className="w-full h-auto" /></div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {watchlist.filter(item => item.media_type !== 'live').length > 0 && (
                  <div>
                    <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">My Library</h2>
                    <div className="flex gap-3 sm:gap-4 2k:gap-6 4k:gap-8 overflow-x-auto scrollbar-hide pb-2">
                      {watchlist.filter(item => item.media_type !== 'live').map((item) => (
                        <button key={item.id} onClick={() => onShowDetail(item.tmdb_id!, item.media_type as 'movie' | 'tv')} className="flex-shrink-0 hover-lift">
                          <div className="relative w-32 sm:w-48 2k:w-56 4k:w-96 rounded-lg overflow-hidden shadow-lg">
                            <img src={getTMDBImageUrl(item.poster_path || '', 'w342')} alt={item.title} className="w-full h-auto" />
                            {isWatched(item.tmdb_id!, item.media_type) && (
                              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                Previously Watched
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">Trending Movies</h2>
                  <div className="flex gap-3 sm:gap-4 2k:gap-6 4k:gap-8 overflow-x-auto scrollbar-hide pb-2">
                    {trendingMovies.map((item) => (
                      <button key={item.id} onClick={() => onShowDetail(item.id, 'movie')} className="flex-shrink-0 hover-lift">
                        <div className="relative w-32 sm:w-48 2k:w-56 4k:w-96 rounded-lg overflow-hidden shadow-lg">
                          <img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.title} className="w-full h-auto" />
                          {isWatched(item.id, 'movie') && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              Previously Watched
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">Trending TV Shows</h2>
                  <div className="flex gap-3 sm:gap-4 2k:gap-6 4k:gap-8 overflow-x-auto scrollbar-hide pb-2">
                    {trendingShows.map((item) => (
                      <button key={item.id} onClick={() => onShowDetail(item.id, 'tv')} className="flex-shrink-0 hover-lift">
                        <div className="relative w-32 sm:w-48 2k:w-56 4k:w-96 rounded-lg overflow-hidden shadow-lg">
                          <img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.name} className="w-full h-auto" />
                          {isWatched(item.id, 'tv') && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              Previously Watched
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">Popular Movies</h2>
                  <div className="flex gap-3 sm:gap-4 2k:gap-6 4k:gap-8 overflow-x-auto scrollbar-hide pb-2">
                    {popularMovies.map((item) => (
                      <button key={item.id} onClick={() => onShowDetail(item.id, 'movie')} className="flex-shrink-0 hover-lift">
                        <div className="relative w-32 sm:w-48 2k:w-56 4k:w-96 rounded-lg overflow-hidden shadow-lg">
                          <img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.title} className="w-full h-auto" />
                          {isWatched(item.id, 'movie') && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              Previously Watched
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">Popular TV Shows</h2>
                  <div className="flex gap-3 sm:gap-4 2k:gap-6 4k:gap-8 overflow-x-auto scrollbar-hide pb-2">
                    {popularShows.map((item) => (
                      <button key={item.id} onClick={() => onShowDetail(item.id, 'tv')} className="flex-shrink-0 hover-lift">
                        <div className="relative w-32 sm:w-48 2k:w-56 4k:w-96 rounded-lg overflow-hidden shadow-lg">
                          <img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.name} className="w-full h-auto" />
                          {isWatched(item.id, 'tv') && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              Previously Watched
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {activeTab === 'movies' && (
              <>
                <div>
                  <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">Trending Movies</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 2k:gap-6 4k:gap-8">
                    {trendingMovies.map((item) => (
                      <button key={item.id} onClick={() => onShowDetail(item.id, 'movie')} className="hover-lift">
                        <div className="relative rounded-lg overflow-hidden shadow-lg">
                          <img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.title} className="w-full h-auto" />
                          {isWatched(item.id, 'movie') && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              Previously Watched
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">Popular Movies</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 2k:gap-6 4k:gap-8">
                    {popularMovies.map((item) => (
                      <button key={item.id} onClick={() => onShowDetail(item.id, 'movie')} className="hover-lift">
                        <div className="relative rounded-lg overflow-hidden shadow-lg">
                          <img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.title} className="w-full h-auto" />
                          {isWatched(item.id, 'movie') && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              Previously Watched
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {activeTab === 'tv' && (
              <>
                <div>
                  <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">Trending TV Shows</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 2k:gap-6 4k:gap-8">
                    {trendingShows.map((item) => (
                      <button key={item.id} onClick={() => onShowDetail(item.id, 'tv')} className="hover-lift">
                        <div className="relative rounded-lg overflow-hidden shadow-lg">
                          <img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.name} className="w-full h-auto" />
                          {isWatched(item.id, 'tv') && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              Previously Watched
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">Popular TV Shows</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 2k:gap-6 4k:gap-8">
                    {popularShows.map((item) => (
                      <button key={item.id} onClick={() => onShowDetail(item.id, 'tv')} className="hover-lift">
                        <div className="relative rounded-lg overflow-hidden shadow-lg">
                          <img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.name} className="w-full h-auto" />
                          {isWatched(item.id, 'tv') && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              Previously Watched
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            {activeTab === 'mylist' && (
              <div>
                <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">My Watchlist</h2>
                {watchlist.filter(item => item.media_type !== 'live').length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 2k:gap-6 4k:gap-8">
                    {watchlist.filter(item => item.media_type !== 'live').map((item) => (
                      <button key={item.id} onClick={() => onShowDetail(item.tmdb_id!, item.media_type as 'movie' | 'tv')} className="hover-lift">
                        <div className="relative rounded-lg overflow-hidden shadow-lg">
                          <img src={getTMDBImageUrl(item.poster_path || '', 'w342')} alt={item.title} className="w-full h-auto" />
                          {isWatched(item.tmdb_id!, item.media_type) && (
                            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                              Previously Watched
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16 2k:py-20 4k:py-32">
                    <p className="text-lg sm:text-xl 2k:text-2xl 4k:text-5xl text-gray-400">Your watchlist is empty. Add some content!</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'history' && (
              <div>
                <h2 className="text-xl sm:text-2xl 2k:text-3xl 4k:text-6xl font-bold mb-4 2k:mb-6 4k:mb-8">Watch History</h2>
                {continueWatching.filter(item => item.media_type !== 'live').length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 2k:gap-6 4k:gap-8">
                    {continueWatching.filter(item => item.media_type !== 'live').map((item: any) => (
                      <button key={item.id} onClick={() => onShowDetail(item.tmdb_id, item.media_type as 'movie' | 'tv')} className="hover-lift">
                        <div className="relative rounded-lg overflow-hidden shadow-lg">
                          <img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.title} className="w-full h-auto" />
                          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            Previously Watched
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16 2k:py-20 4k:py-32">
                    <p className="text-lg sm:text-xl 2k:text-2xl 4k:text-5xl text-gray-400">No watch history yet. Start watching!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className={`px-4 sm:px-6 2k:px-8 4k:px-12 py-6 border-t border-white/10 text-center text-gray-400 text-sm 4k:text-2xl`}>
          <p className="mb-2 text-base 4k:text-3xl font-semibold">It's not just streaming - It's SimplStream.</p>
          <p>© {new Date().getFullYear()} SimplStream. Owned by Andy "Churro". All rights reserved.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-4 items-center">
            <button 
              onClick={() => (window as any).navigateToSmartSearch?.()}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Try Smart Search
            </button>
            <span className="text-gray-600">•</span>
            <button 
              onClick={onShowAbout}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              About
            </button>
            <span className="text-gray-600">•</span>
            <button 
              onClick={onShowTerms}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Terms
            </button>
          </div>
          <p className="mt-4 text-xs 4k:text-xl text-gray-500 max-w-3xl mx-auto">
            All video server links are secure and protected. SimplStream does not host content. For DMCA requests, contact hosting providers directly.
          </p>
        </footer>
      </div>

      <DownloadAppDialog open={showDownloadApp} onOpenChange={setShowDownloadApp} />

      {/* Remove All Data Modal */}
      {showRemoveData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className={`${effectiveTheme === 'dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl p-8 max-w-md w-full`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${textClass}`}>Remove All Data</h2>
              <button onClick={() => setShowRemoveData(false)} className={effectiveTheme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}>
                <X size={24} />
              </button>
            </div>
            <p className={`mb-6 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Select which data you want to remove from your profile:
            </p>
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeWatchlist}
                  onChange={(e) => setRemoveWatchlist(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={textClass}>Watchlist</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeHistory}
                  onChange={(e) => setRemoveHistory(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={textClass}>Watch History & Search History</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeSecurity}
                  onChange={(e) => setRemoveSecurity(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={textClass}>Security (PIN & Security Word)</span>
              </label>
            </div>
            <button
              onClick={handleRemoveData}
              disabled={!removeWatchlist && !removeHistory && !removeSecurity}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Remove Selected Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
