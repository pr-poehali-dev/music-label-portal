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
  const [activeTab, setActiveTab] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
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
    const updated = tracks.filter((_, i) => i !== index);
    const renumbered = updated.map((track, i) => ({ ...track, track_number: i + 1 }));
    setTracks(renumbered);
  };

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tracks.length) return;
    
    const updated = [...tracks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    const renumbered = updated.map((track, i) => ({ ...track, track_number: i + 1 }));
    setTracks(renumbered);
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

  const handleBatchUpload = (files: FileList) => {
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || 
      /\.(mp3|wav|flac|m4a)$/i.test(file.name)
    );

    if (audioFiles.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Не найдено аудио файлов',
        variant: 'destructive'
      });
      return;
    }

    const newTracks = audioFiles.map((file, i) => {
      const trackNumber = tracks.length + i + 1;
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      
      const track: Track = {
        track_number: trackNumber,
        title: fileName,
        composer: '',
        language_audio: 'Русский',
        explicit_content: false,
        file: file
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        track.preview_url = e.target?.result as string;
        setTracks(prev => [...prev]);
      };
      reader.readAsDataURL(file);

      return track;
    });

    setTracks([...tracks, ...newTracks]);
    toast({
      title: 'Успешно',
      description: `Добавлено ${audioFiles.length} треков`
    });
  };

  const handleSubmit = async () => {
    if (!newRelease.release_name || !coverFile || !newRelease.release_date) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название, дату релиза и загрузите обложку',
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
        description: editingRelease ? 'Релиз обновлён' : 'Релиз отправлен на модерацию'
      });

      setShowForm(false);
      setEditingRelease(null);
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
          release_id: releaseId,
          action: status,
          comment: comment
        })
      });

      if (!response.ok) throw new Error('Failed to review release');

      const artistRelease = releases.find(r => r.id === releaseId);
      
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

  const handleEdit = async (release: Release) => {
    setEditingRelease(release);
    setNewRelease({
      release_name: release.release_name,
      release_date: release.release_date || '',
      preorder_date: release.preorder_date || '',
      sales_start_date: release.sales_start_date || '',
      genre: release.genre || '',
      copyright: release.copyright || '',
      price_category: release.price_category || '0.99',
      title_language: release.title_language || 'Русский'
    });
    
    if (release.cover_url) {
      setCoverPreview(release.cover_url);
    }
    
    const releaseTracks = await loadTracks(release.id);
    setTracks(releaseTracks);
    setShowForm(true);
  };

  const filteredReleases = activeTab === 'all' 
    ? releases 
    : releases.filter(r => r.status === activeTab);

  return (
    <div className="space-y-6">
      {!showForm && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Мои релизы</h2>
            <Button onClick={() => setShowForm(true)}>
              <Icon name="Plus" size={18} className="mr-2" />
              Создать релиз
            </Button>
          </div>

          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Все <Badge variant="outline" className="ml-2">{releases.length}</Badge>
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'approved'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="CheckCircle" size={16} />
              Принятые <Badge variant="outline" className="ml-1">{releases.filter(r => r.status === 'approved').length}</Badge>
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Clock" size={16} />
              На модерации <Badge variant="outline" className="ml-1">{releases.filter(r => r.status === 'pending').length}</Badge>
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
                activeTab === 'rejected'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="XCircle" size={16} />
              Отклонённые <Badge variant="outline" className="ml-1">{releases.filter(r => r.status === 'rejected').length}</Badge>
            </button>
          </div>
        </>
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
          moveTrack={moveTrack}
          handleBatchUpload={handleBatchUpload}
          handleSubmit={handleSubmit}
          uploading={uploading}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!showForm && (
        <ReleasesList 
          releases={filteredReleases} 
          getStatusBadge={getStatusBadge}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
}