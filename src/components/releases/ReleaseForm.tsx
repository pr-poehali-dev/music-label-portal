import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Track, GENRES, LANGUAGES } from './types';
import TrackItem from './TrackItem';

interface ReleaseFormProps {
  newRelease: {
    release_name: string;
    release_date: string;
    preorder_date: string;
    sales_start_date: string;
    genre: string;
    copyright: string;
    price_category: string;
    title_language: string;
  };
  setNewRelease: (release: any) => void;
  coverPreview: string | null;
  handleCoverChange: (file: File | null) => void;
  tracks: Track[];
  addTrack: () => void;
  removeTrack: (index: number) => void;
  updateTrack: (index: number, field: keyof Track, value: any) => void;
  handleSubmit: () => void;
  uploading: boolean;
  onCancel: () => void;
}

export default function ReleaseForm({
  newRelease,
  setNewRelease,
  coverPreview,
  handleCoverChange,
  tracks,
  addTrack,
  removeTrack,
  updateTrack,
  handleSubmit,
  uploading,
  onCancel
}: ReleaseFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Создать релиз</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <Icon name="X" size={18} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Обложка альбома *</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
          />
          {coverPreview && (
            <div className="mt-3">
              <img src={coverPreview} alt="Preview" className="w-32 h-32 object-cover rounded-md border" />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Название релиза *</label>
            <Input
              placeholder="Название альбома"
              value={newRelease.release_name}
              onChange={(e) => setNewRelease({ ...newRelease, release_name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Дата релиза</label>
            <Input
              type="date"
              value={newRelease.release_date}
              onChange={(e) => setNewRelease({ ...newRelease, release_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Дата предзаказа</label>
            <Input
              type="date"
              value={newRelease.preorder_date}
              onChange={(e) => setNewRelease({ ...newRelease, preorder_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Начало продаж</label>
            <Input
              type="date"
              value={newRelease.sales_start_date}
              onChange={(e) => setNewRelease({ ...newRelease, sales_start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Жанр</label>
            <Select value={newRelease.genre} onValueChange={(value) => setNewRelease({ ...newRelease, genre: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите жанр" />
              </SelectTrigger>
              <SelectContent>
                {GENRES.map((genre) => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Копирайт</label>
            <Input
              placeholder="© 2024 Artist Name"
              value={newRelease.copyright}
              onChange={(e) => setNewRelease({ ...newRelease, copyright: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Ценовая категория</label>
            <Select value={newRelease.price_category} onValueChange={(value) => setNewRelease({ ...newRelease, price_category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.99">0.99 $</SelectItem>
                <SelectItem value="1.29">1.29 $</SelectItem>
                <SelectItem value="1.49">1.49 $</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Язык названия</label>
            <Select value={newRelease.title_language} onValueChange={(value) => setNewRelease({ ...newRelease, title_language: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Треки</h3>
            <Button onClick={addTrack} size="sm" variant="outline">
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить трек
            </Button>
          </div>

          <div className="space-y-3">
            {tracks.map((track, index) => (
              <TrackItem
                key={index}
                track={track}
                index={index}
                updateTrack={updateTrack}
                removeTrack={removeTrack}
              />
            ))}

            {tracks.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Добавьте треки для релиза
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={uploading} className="w-full mt-6" size="lg">
            <Icon name={uploading ? 'Loader2' : 'Send'} size={18} className={`mr-2 ${uploading ? 'animate-spin' : ''}`} />
            {uploading ? 'Загрузка...' : 'Отправить на модерацию'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
