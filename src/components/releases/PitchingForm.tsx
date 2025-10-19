import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { Release, Pitching, UPLOAD_URL } from './types';

interface PitchingFormProps {
  release: Release;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Pitching) => Promise<void>;
}

export default function PitchingForm({ release, isOpen, onClose, onSubmit }: PitchingFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [formData, setFormData] = useState<Partial<Pitching>>({
    artist_name: release.artist_name || '',
    release_name: release.release_name || '',
    release_date: release.release_date || '',
    genre: release.genre || '',
    artist_description: '',
    release_description: '',
    playlist_fit: '',
    current_reach: '',
    preview_link: '',
    artist_photos: []
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert('Максимум 5 фотографий');
      return;
    }

    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(UPLOAD_URL, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        }
      } catch (error) {
        console.error('Photo upload error:', error);
      }
    }

    setFormData(prev => ({ ...prev, artist_photos: uploadedUrls }));
    setUploadingPhotos(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        release_id: release.id,
        artist_name: formData.artist_name!,
        release_name: formData.release_name!,
        release_date: formData.release_date!,
        genre: formData.genre!,
        artist_description: formData.artist_description!,
        release_description: formData.release_description!,
        playlist_fit: formData.playlist_fit!,
        current_reach: formData.current_reach!,
        preview_link: formData.preview_link!,
        artist_photos: formData.artist_photos!
      });
      onClose();
    } catch (error) {
      console.error('Pitching submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Отправить релиз на питчинг</DialogTitle>
          <DialogDescription>
            Заполните информацию для отправки релиза на питчинг в плейлисты
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium text-sm text-muted-foreground">Данные из релиза</h4>
            
            <div>
              <Label>Исполнитель</Label>
              <Input value={formData.artist_name} disabled className="bg-background" />
            </div>

            <div>
              <Label>Название релиза</Label>
              <Input value={formData.release_name} disabled className="bg-background" />
            </div>

            <div>
              <Label>Дата релиза</Label>
              <Input value={formData.release_date} disabled className="bg-background" />
            </div>

            <div>
              <Label>Жанр</Label>
              <Input value={formData.genre} disabled className="bg-background" />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="artist_description">Несколько предложений об артисте/проекте *</Label>
              <Textarea
                id="artist_description"
                value={formData.artist_description}
                onChange={(e) => setFormData(prev => ({ ...prev, artist_description: e.target.value }))}
                placeholder="Расскажите о себе как об артисте, вашем стиле и опыте..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="release_description">Несколько предложений о релизе *</Label>
              <Textarea
                id="release_description"
                value={formData.release_description}
                onChange={(e) => setFormData(prev => ({ ...prev, release_description: e.target.value }))}
                placeholder="Расскажите о релизе, его концепции, что вдохновило..."
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="playlist_fit">В какие листы подойдет ваш релиз *</Label>
              <Textarea
                id="playlist_fit"
                value={formData.playlist_fit}
                onChange={(e) => setFormData(prev => ({ ...prev, playlist_fit: e.target.value }))}
                placeholder="Например: Indie Rock, Chill Vibes, Russian Music..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="current_reach">Какие охваты и где собирает ваша композиция до релиза *</Label>
              <Textarea
                id="current_reach"
                value={formData.current_reach}
                onChange={(e) => setFormData(prev => ({ ...prev, current_reach: e.target.value }))}
                placeholder="Например: 50к прослушиваний на YouTube, 10к на VK..."
                rows={3}
                required
              />
            </div>

            <div>
              <Label htmlFor="preview_link">Ссылка на прослушивание *</Label>
              <Input
                id="preview_link"
                type="url"
                value={formData.preview_link}
                onChange={(e) => setFormData(prev => ({ ...prev, preview_link: e.target.value }))}
                placeholder="https://soundcloud.com/..."
                required
              />
            </div>

            <div>
              <Label htmlFor="photos">5 фото артиста *</Label>
              <div className="space-y-2">
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhotos}
                />
                {uploadingPhotos && (
                  <p className="text-sm text-muted-foreground">Загрузка фотографий...</p>
                )}
                {formData.artist_photos && formData.artist_photos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {formData.artist_photos.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Загрузите до 5 качественных фотографий артиста</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Отмена
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploadingPhotos || !formData.artist_photos || formData.artist_photos.length === 0}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Icon name="Send" size={16} />
                  Отправить на питчинг
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
