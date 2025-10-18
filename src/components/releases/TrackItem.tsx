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
  updateTrack: (index: number, field: keyof Track, value: any) => void;
  removeTrack: (index: number) => void;
}

export default function TrackItem({ track, index, updateTrack, removeTrack }: TrackItemProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-medium">Трек #{track.track_number}</h4>
          <Button variant="ghost" size="sm" onClick={() => removeTrack(index)}>
            <Icon name="Trash2" size={16} />
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1 block">Название *</label>
            <Input
              placeholder="Название трека"
              value={track.title}
              onChange={(e) => updateTrack(index, 'title', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block">Композитор *</label>
            <Input
              placeholder="Композитор"
              value={track.composer}
              onChange={(e) => updateTrack(index, 'composer', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block">Автор слов</label>
            <Input
              placeholder="Автор слов"
              value={track.author_lyrics || ''}
              onChange={(e) => updateTrack(index, 'author_lyrics', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block">Язык Аудио *</label>
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
            <label className="text-xs mb-1 block">Аудио файл * (MP3, WAV, до 50 МБ)</label>
            <Input
              type="file"
              accept=".mp3,.wav,.flac,.m4a"
              onChange={(e) => updateTrack(index, 'file', e.target.files?.[0])}
            />
            {track.file && (
              <div className="mt-2">
                <p className="text-xs text-green-600 mb-2 flex items-center gap-1">
                  <Icon name="CheckCircle" size={12} />
                  {track.file.name} ({(track.file.size / 1024 / 1024).toFixed(2)} МБ)
                </p>
                {track.preview_url && (
                  <audio controls className="w-full">
                    <source src={track.preview_url} />
                    Ваш браузер не поддерживает аудио плеер
                  </audio>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="text-xs mb-1 block">Текст песни</label>
            <Textarea
              placeholder="Текст песни..."
              value={track.lyrics_text || ''}
              onChange={(e) => updateTrack(index, 'lyrics_text', e.target.value)}
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block">TikTok превью (сек.)</label>
            <Input
              type="number"
              placeholder="0"
              value={track.tiktok_preview_start || ''}
              onChange={(e) => updateTrack(index, 'tiktok_preview_start', parseInt(e.target.value) || 0)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
