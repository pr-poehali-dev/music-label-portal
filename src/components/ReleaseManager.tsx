import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Track, Release, API_URL, UPLOAD_URL } from './releases/types';
import ReleaseForm from './releases/ReleaseForm';
import ReleasesList from './releases/ReleasesList';
import ModerationPanel from './releases/ModerationPanel';

interface ReleaseManagerProps {
  userId: number;
  userRole?: string;
}

export default function ReleaseManager({ userId, userRole = 'artist' }: ReleaseManagerProps) {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const [newRelease, setNewRelease] = useState({
    release_name: '',
    release_date: '',
    preorder_date: '',
    sales_start_date: '',
    genre: '',
    copyright: '',
    price_category: '0.99',
    title_language: 'Русский'
  });

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    loadReleases();
  }, [userId]);

  const loadReleases = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      setReleases(data);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить релизы',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; fileName: string; fileSize: number } | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: base64,
              fileName: file.name,
              fileSize: file.size
            })
          });

          if (!response.ok) {
            resolve(null);
            return;
          }

          const result = await response.json();
          resolve({
            url: result.url,
            fileName: result.fileName,
            fileSize: result.fileSize
          });
        } catch (error) {
          resolve(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCoverChange = (file: File | null) => {
    setCoverFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setCoverPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setCoverPreview(null);
    }
  };

  const addTrack = () => {
    setTracks([...tracks, {
      track_number: tracks.length + 1,
      title: '',
      composer: '',
      language_audio: 'Русский',
      explicit_content: false
    }]);
  };

  const removeTrack = (index: number) => {
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const updateTrack = (index: number, field: keyof Track, value: any) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'file' && value instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updated[index].preview_url = e.target?.result as string;
        setTracks([...updated]);
      };
      reader.readAsDataURL(value);
    }
    
    setTracks(updated);
  };

  const handleSubmit = async () => {
    if (!newRelease.release_name || !coverFile) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название и загрузите обложку',
        variant: 'destructive'
      });
      return;
    }

    if (tracks.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Добавьте хотя бы один трек',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const coverData = await uploadFile(coverFile);
      if (!coverData) throw new Error('Cover upload failed');

      const uploadedTracks = await Promise.all(
        tracks.map(async (track) => {
          if (!track.file) {
            throw new Error(`Track ${track.track_number} file missing`);
          }
          const trackData = await uploadFile(track.file);
          if (!trackData) throw new Error(`Track ${track.track_number} upload failed`);
          
          return {
            ...track,
            file_url: trackData.url,
            file_name: trackData.fileName,
            file_size: trackData.fileSize,
            file: undefined
          };
        })
      );

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          ...newRelease,
          cover_url: coverData.url,
          tracks: uploadedTracks
        })
      });

      if (!response.ok) throw new Error('Failed to create release');

      toast({
        title: 'Успешно',
        description: 'Релиз отправлен на модерацию'
      });

      setShowForm(false);
      setNewRelease({
        release_name: '',
        release_date: '',
        preorder_date: '',
        sales_start_date: '',
        genre: '',
        copyright: '',
        price_category: '0.99',
        title_language: 'Русский'
      });
      setCoverFile(null);
      setCoverPreview(null);
      setTracks([]);
      loadReleases();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать релиз',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const loadTracks = async (releaseId: number): Promise<Track[]> => {
    try {
      const response = await fetch(`${API_URL}?releaseId=${releaseId}`, {
        headers: { 'X-User-Id': userId.toString() }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить треки',
        variant: 'destructive'
      });
      return [];
    }
  };

  const handleReview = async (releaseId: number, status: string, comment?: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify({
          releaseId,
          status,
          reviewComment: comment
        })
      });

      if (!response.ok) throw new Error('Failed to review release');

      toast({
        title: 'Успешно',
        description: status === 'approved' ? 'Релиз одобрен' : 'Релиз отклонён'
      });

      loadReleases();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить статус релиза',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string; icon: string }> = {
      pending: { variant: 'secondary', text: 'На модерации', icon: 'Clock' },
      approved: { variant: 'default', text: 'Одобрен', icon: 'CheckCircle' },
      rejected: { variant: 'destructive', text: 'Отклонён', icon: 'XCircle' }
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon name={config.icon} size={12} />
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (userRole === 'manager' || userRole === 'director') {
    return (
      <ModerationPanel
        releases={releases}
        userId={userId}
        onReview={handleReview}
        loadTracks={loadTracks}
      />
    );
  }

  return (
    <div className="space-y-6">
      {!showForm && (
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Мои релизы</h2>
          <Button onClick={() => setShowForm(true)}>
            <Icon name="Plus" size={18} className="mr-2" />
            Создать релиз
          </Button>
        </div>
      )}

      {showForm && (
        <ReleaseForm
          newRelease={newRelease}
          setNewRelease={setNewRelease}
          coverPreview={coverPreview}
          handleCoverChange={handleCoverChange}
          tracks={tracks}
          addTrack={addTrack}
          removeTrack={removeTrack}
          updateTrack={updateTrack}
          handleSubmit={handleSubmit}
          uploading={uploading}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!showForm && (
        <ReleasesList releases={releases} getStatusBadge={getStatusBadge} />
      )}
    </div>
  );
}
