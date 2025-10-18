import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Track, LANGUAGES } from './types';

interface TrackItemProps {
  track: Track;
  index: number;
  totalTracks: number;
  updateTrack: (index: number, field: keyof Track, value: any) => void;
  removeTrack: (index: number) => void;
  moveTrack: (index: number, direction: 'up' | 'down') => void;
}

export default function TrackItem({ track, index, totalTracks, updateTrack, removeTrack, moveTrack }: TrackItemProps) {
  return (
    <Card className="border-l-4 border-l-primary/30 hover:border-l-primary transition-colors">
      <CardContent className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => moveTrack(index, 'up')} 
                disabled={index === 0}
                className="h-6 w-6 p-0 hover:bg-primary/10"
              >
                <Icon name="ChevronUp" size={14} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => moveTrack(index, 'down')} 
                disabled={index === totalTracks - 1}
                className="h-6 w-6 p-0 hover:bg-primary/10"
              >
                <Icon name="ChevronDown" size={14} />
              </Button>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{track.track_number}</span>
            </div>
            <h4 className="font-semibold text-base">Трек #{track.track_number}</h4>
          </div>
          <Button variant="ghost" size="sm" onClick={() => removeTrack(index)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Icon name="Trash2" size={16} />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Название *</label>
            <Input
              placeholder="Название трека"
              value={track.title}
              onChange={(e) => updateTrack(index, 'title', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Композитор *</label>
            <Input
              placeholder="Композитор"
              value={track.composer}
              onChange={(e) => updateTrack(index, 'composer', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Автор слов</label>
            <Input
              placeholder="Автор слов"
              value={track.author_lyrics || ''}
              onChange={(e) => updateTrack(index, 'author_lyrics', e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Язык Аудио *</label>
            <Select value={track.language_audio} onValueChange={(value) => updateTrack(index, 'language_audio', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1.5 block">Аудио файл *</label>
            <div className="relative">
              <Input
                type="file"
                accept=".mp3,.wav,.flac,.m4a"
                onChange={(e) => updateTrack(index, 'file', e.target.files?.[0])}
                className="cursor-pointer"
              />
            </div>
            {track.file && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon name="Music" size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.file.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(track.file.size / 1024 / 1024).toFixed(2)} МБ
                    </p>
                  </div>
                  <Icon name="CheckCircle" size={20} className="text-green-600 flex-shrink-0" />
                </div>
                {track.preview_url && (
                  <audio controls className="w-full h-10">
                    <source src={track.preview_url} />
                    Ваш браузер не поддерживает аудио плеер
                  </audio>
                )}
              </div>
            )}
            {!track.file && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Поддерживаемые форматы: MP3, WAV, FLAC, M4A • Максимум 50 МБ
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Текст песни</label>
            <Textarea
              placeholder="Введите текст песни..."
              value={track.lyrics_text || ''}
              onChange={(e) => updateTrack(index, 'lyrics_text', e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">TikTok превью</label>
            <Input
              type="number"
              placeholder="Время начала (в секундах)"
              value={track.tiktok_preview_start || ''}
              onChange={(e) => updateTrack(index, 'tiktok_preview_start', parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Укажите время начала фрагмента для TikTok
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}