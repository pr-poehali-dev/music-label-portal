import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import Icon from '@/components/ui/icon';
import { API_URL } from './types';

interface Track {
  track_number: number;
  title: string;
  composer: string;
  file_url?: string;
  language_audio: string;
}

interface ReleasePlayerProps {
  releaseId: number;
}

export default function ReleasePlayer({ releaseId }: ReleasePlayerProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadTracks();
  }, [releaseId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (currentTrack < tracks.length - 1) {
        setCurrentTrack(currentTrack + 1);
      } else {
        setIsPlaying(false);
        setCurrentTrack(0);
      }
    };

    // Use passive listeners for better scroll performance
    audio.addEventListener('timeupdate', updateTime, { passive: true });
    audio.addEventListener('loadedmetadata', updateDuration, { passive: true });
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, tracks.length]);

  useEffect(() => {
    if (audioRef.current && tracks[currentTrack]?.file_url) {
      audioRef.current.src = tracks[currentTrack].file_url!;
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack, tracks]);

  const loadTracks = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}?releaseId=${releaseId}`);
      const data = await response.json();
      setTracks(data);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setLoading(false);
    }
  }, [releaseId]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const playTrack = useCallback((index: number) => {
    setCurrentTrack(index);
    setIsPlaying(true);
  }, []);

  const handlePrevTrack = useCallback(() => {
    setCurrentTrack(Math.max(0, currentTrack - 1));
  }, [currentTrack]);

  const handleNextTrack = useCallback(() => {
    setCurrentTrack(Math.min(tracks.length - 1, currentTrack + 1));
  }, [currentTrack, tracks.length]);

  // Memoize current track info
  const currentTrackInfo = useMemo(() => tracks[currentTrack], [tracks, currentTrack]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 sm:py-8">
        <Icon name="Loader2" size={20} className="sm:w-6 sm:h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 text-muted-foreground text-xs sm:text-sm">
        Треки не найдены
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-lg border p-3 sm:p-4 space-y-3 sm:space-y-4">
      <audio ref={audioRef} />
      
      {/* Current Track Info */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name="Music" size={18} className="sm:w-6 sm:h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm sm:text-base">{currentTrackInfo?.title}</p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{currentTrackInfo?.composer}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 sm:space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer touch-none"
        />
        <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevTrack}
          disabled={currentTrack === 0}
          className="h-10 w-10 sm:h-auto sm:w-auto"
        >
          <Icon name="SkipBack" size={18} className="sm:w-5 sm:h-5" />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12 sm:h-14 sm:w-14"
          onClick={togglePlay}
        >
          <Icon name={isPlaying ? 'Pause' : 'Play'} size={20} className="sm:w-6 sm:h-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextTrack}
          disabled={currentTrack === tracks.length - 1}
          className="h-10 w-10 sm:h-auto sm:w-auto"
        >
          <Icon name="SkipForward" size={18} className="sm:w-5 sm:h-5" />
        </Button>
      </div>

      {/* Track List */}
      <div className="border-t pt-2 sm:pt-3 space-y-1 max-h-40 sm:max-h-48 overflow-y-auto">
        {tracks.map((track, index) => (
          <button
            key={track.track_number}
            onClick={() => playTrack(index)}
            className={`w-full flex items-center gap-2 sm:gap-3 p-2 rounded md:hover:bg-muted/50 active:bg-muted/50 transition-colors text-left min-h-[44px] sm:min-h-0 ${
              currentTrack === index ? 'bg-muted' : ''
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {currentTrack === index && isPlaying ? (
                <Icon name="Volume2" size={14} className="sm:w-4 sm:h-4 text-primary" />
              ) : (
                <span className="text-xs text-muted-foreground">{track.track_number}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs sm:text-sm truncate ${currentTrack === index ? 'font-medium' : ''}`}>
                {track.title}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}