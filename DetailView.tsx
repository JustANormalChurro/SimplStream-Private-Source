import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Plus, Star, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Profile, TMDBDetail } from '../types';
import { tmdbFetch, getTMDBImageUrl } from '../lib/tmdb';
import { getRating, saveRating, isInWatchlist, addToWatchlist, removeFromWatchlist, generateId } from '../lib/storage';
import { formatDuration } from '../lib/formatDuration';

interface DetailViewProps {
  profile: Profile;
  tmdbId: number;
  mediaType: 'movie' | 'tv';
  onBack: () => void;
  onPlay: (tmdbId: number, mediaType: 'movie' | 'tv', season?: number, episode?: number) => void;
  onShowCast: (castId: number) => void;
  onGoHome: () => void;
  onShowDetail?: (id: number, type: 'movie' | 'tv') => void;
}

export function DetailView({ profile, tmdbId, mediaType, onBack, onPlay, onShowCast, onGoHome, onShowDetail }: DetailViewProps) {
  const [detail, setDetail] = useState<TMDBDetail | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [similar, setSimilar] = useState<any[]>([]);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [seasonDetails, setSeasonDetails] = useState<any>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const { effectiveTheme } = useTheme();

  useEffect(() => {
    loadDetail();
    loadUserRating();
    loadSimilar();
    checkWatchlist();
  }, [tmdbId, mediaType]);

  useEffect(() => {
    if (mediaType === 'tv' && detail) {
      loadSeasonDetails();
    }
  }, [selectedSeason, detail]);

  async function loadDetail() {
    try {
      const data = await tmdbFetch(`/${mediaType}/${tmdbId}?append_to_response=videos,credits`);
      setDetail(data);
    } catch (error) {
      console.error('Error loading detail:', error);
    }
  }

  function loadUserRating() {
    try {
      const rating = getRating(profile.id, tmdbId, mediaType);
      if (rating) {
        setUserRating(rating.rating);
      }
    } catch (error) {
      console.error('Error loading rating:', error);
    }
  }

  async function loadSimilar() {
    try {
      const data = await tmdbFetch(`/${mediaType}/${tmdbId}/similar`);
      setSimilar(data.results?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error loading similar:', error);
    }
  }

  async function loadSeasonDetails() {
    try {
      const data = await tmdbFetch(`/tv/${tmdbId}/season/${selectedSeason}`);
      setSeasonDetails(data);
    } catch (error) {
      console.error('Error loading season details:', error);
    }
  }

  function checkWatchlist() {
    try {
      setInWatchlist(isInWatchlist(profile.id, tmdbId));
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  }

  function handleRating(rating: number) {
    try {
      saveRating({
        id: generateId(),
        profile_id: profile.id,
        tmdb_id: tmdbId,
        media_type: mediaType,
        rating,
        genres: detail?.genres || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      setUserRating(rating);
    } catch (error) {
      console.error('Error saving rating:', error);
    }
  }

  function toggleWatchlist() {
    try {
      if (inWatchlist) {
        removeFromWatchlist(profile.id, tmdbId);
        setInWatchlist(false);
      } else {
        addToWatchlist({
          id: generateId(),
          profile_id: profile.id,
          tmdb_id: tmdbId,
          media_type: mediaType,
          title: detail?.title || detail?.name || '',
          poster_path: detail?.poster_path || undefined,
          created_at: new Date().toISOString()
        });
        setInWatchlist(true);
      }
    } catch (error) {
      console.error('Error toggling watchlist:', error);
    }
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  const title = detail.title || detail.name;
  const releaseDate = detail.release_date || detail.first_air_date;
  const trailer = detail.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
  const bgClass = effectiveTheme === 'dark' ? 'bg-black' : 'bg-gray-50';
  const textClass = effectiveTheme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      <div className={`fixed top-0 left-0 right-0 z-50 ${effectiveTheme === 'dark' ? 'glass-header' : 'glass-header-light'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 2k:px-8 4k:px-12 py-2 sm:py-3 2k:py-4 4k:py-6 flex items-center justify-between">
          <button onClick={onBack} className={`flex items-center gap-2 4k:gap-4 ${textClass} hover:text-blue-400 transition-all hover:scale-105`}>
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 2k:w-8 2k:h-8 4k:w-12 4k:h-12" />
            <span className="font-medium text-sm sm:text-base 2k:text-lg 4k:text-4xl">Back</span>
          </button>
          <button onClick={onGoHome} className="text-base sm:text-xl 2k:text-2xl 4k:text-5xl font-bold hover:opacity-80 transition-opacity">
            <span className="text-blue-500">Simpl</span>Stream
          </button>
        </div>
      </div>

      <div className="pt-16">
        <div className="relative h-[60vh] overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center opacity-95" style={{ backgroundImage: `url(${getTMDBImageUrl(detail.backdrop_path, 'original')})` }}>
            <div className={`absolute inset-0 ${effectiveTheme === 'dark' ? 'bg-gradient-to-r from-black via-black/70 to-transparent' : 'bg-gradient-to-r from-white via-white/70 to-transparent'}`}></div>
            <div className={`absolute inset-0 ${effectiveTheme === 'dark' ? 'bg-gradient-to-t from-black to-transparent' : 'bg-gradient-to-t from-white to-transparent'}`}></div>
          </div>
          <div className="relative z-10 h-full flex items-center max-w-7xl mx-auto px-6">
            <div className="max-w-2xl">
              <h1 className={`text-4xl font-bold mb-3 drop-shadow-2xl ${textClass}`}>{title}</h1>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-base ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{releaseDate?.slice(0, 4)}</span>
                {detail.vote_average > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={18} fill="#FFD700" className="text-yellow-500" />
                    <span className={`text-base font-bold ${textClass}`}>{detail.vote_average.toFixed(1)}</span>
                  </div>
                )}
                {detail.runtime && <span className={`text-base ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>{formatDuration(detail.runtime)}</span>}
              </div>
              <p className={`text-base mb-4 line-clamp-3 ${effectiveTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{detail.overview}</p>
              <div className="flex gap-4 mb-6">
              <button onClick={() => onPlay(tmdbId, mediaType, selectedSeason, selectedEpisode)} className={`px-8 py-4 ${effectiveTheme === 'dark' ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'} rounded-lg font-bold flex items-center gap-2 shadow-xl`}>
                <Play size={24} fill="currentColor" /> Play
              </button>
              {trailer && (
                <button onClick={() => setShowTrailer(true)} className={`px-8 py-4 ${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} rounded-lg font-bold flex items-center gap-2`}>
                  <Play size={24} /> Trailer
                </button>
              )}
                <button onClick={toggleWatchlist} className={`px-8 py-4 ${effectiveTheme === 'dark' ? 'bg-gray-600/80 hover:bg-gray-500/80' : 'bg-gray-300 hover:bg-gray-400'} rounded-lg font-bold flex items-center gap-2`}>
                  {inWatchlist ? <X size={24} /> : <Plus size={24} />}
                  {inWatchlist ? 'Remove' : 'My Library'}
                </button>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} onClick={() => handleRating(star)}>
                    <Star size={28} fill={star <= userRating ? '#FFD700' : 'none'} className={star <= userRating ? 'text-yellow-500' : 'text-gray-400'} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {mediaType === 'tv' && detail.number_of_seasons && (
            <div className="mb-12">
              <h2 className={`text-2xl sm:text-3xl 4k:text-7xl font-bold mb-6 4k:mb-12 ${textClass}`}>Episodes</h2>
              <div className="mb-6">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
                  {Array.from({ length: detail.number_of_seasons || 1 }, (_, i) => i + 1).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSeason(s)}
                      className={`px-4 sm:px-6 4k:px-12 py-2 sm:py-3 4k:py-6 rounded-lg font-medium whitespace-nowrap text-sm sm:text-base 4k:text-3xl transition-all ${
                        selectedSeason === s
                          ? 'bg-blue-600 text-white shadow-lg scale-105'
                          : effectiveTheme === 'dark' ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-gray-200 text-black hover:bg-gray-300'
                      }`}
                    >
                      Season {s}
                    </button>
                  ))}
                </div>
              </div>
              {seasonDetails && seasonDetails.episodes && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 4k:gap-12">
                  {seasonDetails.episodes.map((episode: any) => (
                    <button
                      key={episode.episode_number}
                      onClick={() => {
                        setSelectedEpisode(episode.episode_number);
                        onPlay(tmdbId, mediaType, selectedSeason, episode.episode_number);
                      }}
                      className={`${effectiveTheme === 'dark' ? 'bg-gray-900 hover:bg-gray-800' : 'bg-white hover:bg-gray-50 border border-gray-200'} rounded-xl overflow-hidden transition-all hover-lift text-left group`}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-6 4k:p-12">
                        <div className="flex-shrink-0 w-full sm:w-40 4k:w-80 aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
                          {episode.still_path ? (
                            <img 
                              src={getTMDBImageUrl(episode.still_path, 'w300')} 
                              alt={episode.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play size={32} className="4k:w-24 4k:h-24 text-white/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2 4k:mb-4">
                            <h3 className={`font-bold text-base sm:text-lg 4k:text-4xl ${textClass} line-clamp-1`}>
                              {episode.episode_number}. {episode.name}
                            </h3>
                            {episode.vote_average > 0 && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Star size={16} className="4k:w-8 4k:h-8 text-yellow-500" fill="#FFD700" />
                                <span className={`text-sm 4k:text-3xl font-bold ${textClass}`}>{episode.vote_average.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <p className={`text-xs sm:text-sm 4k:text-3xl ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 sm:line-clamp-3`}>
                            {episode.overview || 'No description available.'}
                          </p>
                          {episode.runtime && (
                            <p className={`text-xs 4k:text-2xl ${effectiveTheme === 'dark' ? 'text-gray-500' : 'text-gray-500'} mt-2 4k:mt-4`}>
                              {episode.runtime} min
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {detail.genres && detail.genres.length > 0 && (
            <div className="mb-12">
              <h2 className={`text-3xl font-bold mb-4 ${textClass}`}>Genres</h2>
              <div className="flex flex-wrap gap-2">
                {detail.genres.map((genre: any) => (
                  <span key={genre.id} className="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium">{genre.name}</span>
                ))}
              </div>
            </div>
          )}

          {detail.credits && detail.credits.cast && detail.credits.cast.length > 0 && (
            <div className="mb-12">
              <h2 className={`text-3xl font-bold mb-4 ${textClass}`}>Cast</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {detail.credits.cast.slice(0, 12).map((cast: any) => (
                  <button 
                    key={cast.id} 
                    onClick={() => onShowCast(cast.id)}
                    className="text-center group cursor-pointer hover-lift"
                  >
                    <div className="w-full aspect-square rounded-full overflow-hidden mb-2 group-hover:ring-4 group-hover:ring-blue-500 transition-all">
                      <img src={getTMDBImageUrl(cast.profile_path, 'w185')} alt={cast.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <p className={`font-medium ${textClass} group-hover:text-blue-500 transition-colors`}>{cast.name}</p>
                    <p className={`text-sm ${effectiveTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{cast.character}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {similar.length > 0 && (
            <div>
              <h2 className={`text-3xl font-bold mb-4 ${textClass}`}>Similar Titles</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {similar.map((item: any) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      const itemMediaType = item.media_type || mediaType;
                      if (onShowDetail) {
                        onShowDetail(item.id, itemMediaType);
                      }
                    }}
                    className="cursor-pointer group text-left"
                  >
                    <div className="rounded-lg overflow-hidden transition-all transform group-hover:scale-105">
                      <img src={getTMDBImageUrl(item.poster_path, 'w342')} alt={item.title || item.name} className="w-full h-72 object-cover" />
                    </div>
                    <p className={`mt-2 text-sm font-medium line-clamp-2 ${textClass}`}>{item.title || item.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowTrailer(false)}>
          <div className="relative w-full max-w-5xl max-h-[90dvh] bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            >
              <X size={28} />
            </button>
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
