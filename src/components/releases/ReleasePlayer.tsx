import { useState, useEffect, useRef } from 'react';
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

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
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

  const loadTracks = async () => {
    try {
      const response = await fetch(`${API_URL}?releaseId=${releaseId}`);
      const data = await response.json();
      setTracks(data);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playTrack = (index: number) => {
    setCurrentTrack(index);
    setIsPlaying(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Треки не найдены
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-lg border p-4 space-y-4">
      <audio ref={audioRef} />
      
      {/* Current Track Info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name="Music" size={24} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{tracks[currentTrack]?.title}</p>
          <p className="text-sm text-muted-foreground truncate">{tracks[currentTrack]?.composer}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentTrack(Math.max(0, currentTrack - 1))}
          disabled={currentTrack === 0}
        >
          <Icon name="SkipBack" size={20} />
        </Button>
        <Button
          variant="default"
          size="icon"
          className="h-12 w-12"
          onClick={togglePlay}
        >
          <Icon name={isPlaying ? 'Pause' : 'Play'} size={24} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentTrack(Math.min(tracks.length - 1, currentTrack + 1))}
          disabled={currentTrack === tracks.length - 1}
        >
          <Icon name="SkipForward" size={20} />
        </Button>
      </div>

      {/* Track List */}
      <div className="border-t pt-3 space-y-1 max-h-48 overflow-y-auto">
        {tracks.map((track, index) => (
          <button
            key={track.track_number}
            onClick={() => playTrack(index)}
            className={`w-full flex items-center gap-3 p-2 rounded hover:bg-muted/50 transition-colors text-left ${
              currentTrack === index ? 'bg-muted' : ''
            }`}
          >
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
              {currentTrack === index && isPlaying ? (
                <Icon name="Volume2" size={16} className="text-primary" />
              ) : (
                <span className="text-xs text-muted-foreground">{track.track_number}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm truncate ${currentTrack === index ? 'font-medium' : ''}`}>
                {track.title}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
