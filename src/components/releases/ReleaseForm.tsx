import { useState } from 'react';
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
  moveTrack: (index: number, direction: 'up' | 'down') => void;
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
  moveTrack,
  handleSubmit,
  uploading,
  onCancel
}: ReleaseFormProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const direction = draggedIndex < dropIndex ? 'down' : 'up';
    const steps = Math.abs(draggedIndex - dropIndex);
    
    let currentIndex = draggedIndex;
    for (let i = 0; i < steps; i++) {
      moveTrack(currentIndex, direction);
      currentIndex = direction === 'down' ? currentIndex + 1 : currentIndex - 1;
    }
    
    setDraggedIndex(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card className="border-2">
        <CardHeader className="bg-muted/30">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Создать релиз</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Заполните информацию о вашем альбоме</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <Icon name="X" size={20} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-8">
          {/* Cover Upload Section */}
          <div className="grid md:grid-cols-[300px_1fr] gap-6 items-start">
            <div className="space-y-3">
              <label className="text-sm font-semibold block">Обложка альбома *</label>
              <div className="relative group">
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Icon name="ImagePlus" size={48} className="mb-2" />
                      <p className="text-sm">Загрузите обложку</p>
                      <p className="text-xs mt-1">Минимум 3000×3000 px</p>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Формат: JPG или PNG<br />
                Размер: не более 10 МБ
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold mb-2 block">Название релиза *</label>
                <Input
                  placeholder="Введите название альбома"
                  value={newRelease.release_name}
                  onChange={(e) => setNewRelease({ ...newRelease, release_name: e.target.value })}
                  className="text-lg h-12"
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold mb-2 block">Дата релиза *</label>
                <Input
                  type="date"
                  value={newRelease.release_date}
                  onChange={(e) => setNewRelease({ ...newRelease, release_date: e.target.value })}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Additional Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon name="Info" size={20} />
              Дополнительная информация
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Tracks Section */}
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Icon name="Music" size={20} />
                Треки ({tracks.length})
              </h3>
              <Button onClick={addTrack} size="sm" className="gap-2">
                <Icon name="Plus" size={16} />
                Добавить трек
              </Button>
            </div>

            <div className="space-y-4">
              {tracks.map((track, index) => (
                <TrackItem
                  key={index}
                  track={track}
                  index={index}
                  totalTracks={tracks.length}
                  updateTrack={updateTrack}
                  removeTrack={removeTrack}
                  moveTrack={moveTrack}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragging={draggedIndex === index}
                />
              ))}

              {tracks.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                  <Icon name="Music" size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">Треков пока нет</p>
                  <Button onClick={addTrack} variant="outline" size="sm" className="gap-2">
                    <Icon name="Plus" size={16} />
                    Добавить первый трек
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="border-t pt-6">
            <Button 
              onClick={handleSubmit} 
              disabled={uploading} 
              className="w-full h-14 text-lg gap-3" 
              size="lg"
            >
              <Icon name={uploading ? 'Loader2' : 'Send'} size={20} className={uploading ? 'animate-spin' : ''} />
              {uploading ? 'Загрузка релиза...' : 'Отправить на модерацию'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}