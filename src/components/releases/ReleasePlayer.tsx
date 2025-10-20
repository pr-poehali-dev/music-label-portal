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
  userId: number;
  releaseId: number;
}

export default function ReleasePlayer({ userId, releaseId }: ReleasePlayerProps) {
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
      console.log('Loading tracks with userId:', userId, 'releaseId:', releaseId);
      const response = await fetch(`${API_URL}?release_id=${releaseId}`, {
        headers: {
          'X-User-Id': String(userId)
        }
      });
      
      if (!response.ok) {
        console.error('HTTP', response.status, ':', `${API_URL}?release_id=${releaseId}`);
        setTracks([]);
        return;
      }
      
      const data = await response.json();
      console.log('[ReleasePlayer] Loaded data:', data);
      
      const tracksArray = Array.isArray(data) ? data : (data.tracks || []);
      console.log('[ReleasePlayer] Extracted tracks:', tracksArray, 'count:', tracksArray.length);
      
      setTracks(tracksArray);
    } catch (error) {
      console.error('Failed to load tracks:', error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  }, [userId, releaseId]);

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
    <div className="bg-muted/20 rounded border p-2 space-y-2">
      <audio ref={audioRef} />
      
      {/* Compact Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevTrack}
          disabled={currentTrack === 0}
          className="h-7 w-7"
        >
          <Icon name="SkipBack" size={14} />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="h-8 w-8"
          onClick={togglePlay}
        >
          <Icon name={isPlaying ? 'Pause' : 'Play'} size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextTrack}
          disabled={currentTrack === tracks.length - 1}
          className="h-7 w-7"
        >
          <Icon name="SkipForward" size={14} />
        </Button>
        
        <div className="flex-1 min-w-0">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
        </div>
        
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Track List */}
      <div className="space-y-0.5">
        {tracks.map((track, index) => (
          <button
            key={track.track_number}
            onClick={() => playTrack(index)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors text-left ${
              currentTrack === index ? 'bg-muted/70' : ''
            }`}
          >
            <div className="w-4 flex items-center justify-center flex-shrink-0">
              {currentTrack === index && isPlaying ? (
                <Icon name="Volume2" size={12} className="text-primary" />
              ) : (
                <span className="text-[10px] text-muted-foreground">{track.track_number}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs truncate ${currentTrack === index ? 'font-medium' : ''}`}>
                {track.title}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
              {track.composer}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}