import { useState, useCallback } from 'react';
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
  handleBatchUpload: (files: FileList) => void;
  handleSubmit: () => void;
  uploading: boolean;
  uploadProgress: number;
  currentUploadFile: string;
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
  handleBatchUpload,
  handleSubmit,
  uploading,
  uploadProgress,
  currentUploadFile,
  onCancel
}: ReleaseFormProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDraggingCover, setIsDraggingCover] = useState(false);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((dropIndex: number) => {
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
  }, [draggedIndex, moveTrack]);

  const handleCoverDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCover(true);
  }, []);

  const handleCoverDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCover(false);
  }, []);

  const handleCoverDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleCoverDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCover(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleCoverChange(file);
      }
    }
  }, [handleCoverChange]);

  return (
    <div className="max-w-6xl mx-auto">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Создать релиз</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Заполните информацию о вашем альбоме</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
              <Icon name="X" size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-[200px_1fr] gap-4 items-start">
            <div className="space-y-2">
              <label className="text-sm font-medium block">Обложка *</label>
              <label 
                className="relative group block cursor-pointer"
                onDragEnter={handleCoverDragEnter}
                onDragLeave={handleCoverDragLeave}
                onDragOver={handleCoverDragOver}
                onDrop={handleCoverDrop}
              >
                <div className={`w-full aspect-square rounded-lg overflow-hidden bg-muted border-2 border-dashed transition-all ${
                  isDraggingCover 
                    ? 'border-primary bg-primary/10 scale-105' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}>
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Icon name={isDraggingCover ? "Download" : "ImagePlus"} size={32} className="mb-1" />
                      <p className="text-xs">{isDraggingCover ? "Отпустите файл" : "Загрузить"}</p>
                      <p className="text-[10px] mt-1 opacity-60">или перетащите сюда</p>
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCoverChange(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Название релиза *</label>
                <Input
                  placeholder="Введите название альбома"
                  value={newRelease.release_name}
                  onChange={(e) => setNewRelease({ ...newRelease, release_name: e.target.value })}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1.5 block">Дата релиза *</label>
                <Input
                  type="date"
                  value={newRelease.release_date}
                  onChange={(e) => setNewRelease({ ...newRelease, release_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="border-t" />

          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <Icon name="Info" size={16} />
              Дополнительная информация
            </h3>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Дата предзаказа</label>
                <Input
                  type="date"
                  value={newRelease.preorder_date}
                  onChange={(e) => setNewRelease({ ...newRelease, preorder_date: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Начало продаж</label>
                <Input
                  type="date"
                  value={newRelease.sales_start_date}
                  onChange={(e) => setNewRelease({ ...newRelease, sales_start_date: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Жанр</label>
                <Select value={newRelease.genre} onValueChange={(value) => setNewRelease({ ...newRelease, genre: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Выберите жанр" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {GENRES.map((genre) => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Копирайт</label>
                <Input
                  placeholder="© 2024 Artist Name"
                  value={newRelease.copyright}
                  onChange={(e) => setNewRelease({ ...newRelease, copyright: e.target.value })}
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Ценовая категория</label>
                <Select value={newRelease.price_category} onValueChange={(value) => setNewRelease({ ...newRelease, price_category: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="0.99">0.99 $</SelectItem>
                    <SelectItem value="1.29">1.29 $</SelectItem>
                    <SelectItem value="1.49">1.49 $</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Язык названия</label>
                <Select value={newRelease.title_language} onValueChange={(value) => setNewRelease({ ...newRelease, title_language: value })}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="border-t" />

          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Icon name="Music" size={16} />
                Треки ({tracks.length})
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Input
                    type="file"
                    multiple
                    accept=".mp3,.wav,.flac,.m4a"
                    onChange={(e) => e.target.files && handleBatchUpload(e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                    <Icon name="Upload" size={14} />
                    Загрузить файлы
                  </Button>
                </div>
                <Button onClick={addTrack} size="sm" className="gap-1.5 h-8 text-xs">
                  <Icon name="Plus" size={14} />
                  Добавить
                </Button>
              </div>
            </div>

            <div className="space-y-2">
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
                <div className="text-center py-8 border-2 border-dashed rounded-md bg-muted/20">
                  <Icon name="Music" size={32} className="text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">Треков пока нет</p>
                  <Button onClick={addTrack} variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                    <Icon name="Plus" size={14} />
                    Добавить первый трек
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            {uploading && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Icon name="Loader2" size={14} className="animate-spin text-primary flex-shrink-0" />
                  <span className="text-xs font-medium truncate">{currentUploadFile || 'Загрузка...'}</span>
                </div>
                {uploadProgress > 0 && (
                  <>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-right">{uploadProgress}%</p>
                  </>
                )}
              </div>
            )}
            
            <Button 
              onClick={handleSubmit} 
              disabled={uploading} 
              className="w-full h-10 gap-2" 
            >
              <Icon name={uploading ? 'Loader2' : 'Send'} size={16} className={uploading ? 'animate-spin' : ''} />
              {uploading ? 'Загрузка...' : 'Отправить на модерацию'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}