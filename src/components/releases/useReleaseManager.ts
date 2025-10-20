import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Track, Release, Pitching, API_URL, UPLOAD_URL } from './types';
import { createNotification } from '@/hooks/useNotifications';
import { uploadFile as uploadFileUtil } from '@/utils/uploadFile';
import { API_ENDPOINTS } from '@/config/api';

const PITCHING_URL = API_ENDPOINTS.PITCHING;

export const useReleaseManager = (userId: number) => {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadFile, setCurrentUploadFile] = useState<string>('');
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

  const loadReleases = useCallback(async () => {
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
  }, [userId, toast]);

  const uploadFile = async (file: File): Promise<{ url: string; fileName: string; fileSize: number } | null> => {
    if (!file) {
      toast({
        title: 'Ошибка',
        description: 'Файл не выбран',
        variant: 'destructive'
      });
      return null;
    }

    setCurrentUploadFile(file.name);
    setUploadProgress(10);
    
    try {
      setUploadProgress(50);
      const result = await uploadFileUtil(file);
      setUploadProgress(100);
      
      return {
        url: result.url,
        fileName: result.fileName,
        fileSize: result.fileSize
      };
    } catch (error) {
      toast({
        title: `❌ ${file.name}`,
        description: error instanceof Error ? error.message : 'Не удалось загрузить файл',
        variant: 'destructive'
      });
      return null;
    }
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

  const addTrack = useCallback(() => {
    setTracks([...tracks, {
      track_number: tracks.length + 1,
      title: '',
      composer: '',
      language_audio: 'Русский',
      explicit_content: false
    }]);
  }, [tracks]);

  const removeTrack = useCallback((index: number) => {
    const updated = tracks.filter((_, i) => i !== index);
    const renumbered = updated.map((track, i) => ({ ...track, track_number: i + 1 }));
    setTracks(renumbered);
  }, [tracks]);

  const moveTrack = useCallback((index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tracks.length) return;
    
    const updated = [...tracks];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    
    const renumbered = updated.map((track, i) => ({ ...track, track_number: i + 1 }));
    setTracks(renumbered);
  }, [tracks]);

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

  const handleSubmit = useCallback(async () => {
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
    
    const tracksWithoutFiles = tracks.filter(t => !t.file);
    if (tracksWithoutFiles.length > 0) {
      toast({
        title: 'Ошибка',
        description: `Не выбраны аудиофайлы для треков: ${tracksWithoutFiles.map(t => t.track_number).join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      setCurrentUploadFile('Обложка');
      const coverData = await uploadFile(coverFile);
      if (!coverData) throw new Error('Не удалось загрузить обложку');
      setUploadProgress(0);

      const uploadedTracks = [];
      
      for (let index = 0; index < tracks.length; index++) {
        const track = tracks[index];
        
        if (!track.file) {
          toast({
            title: `❌ Трек ${track.track_number}`,
            description: `"${track.title || 'Без названия'}" - файл не выбран`,
            variant: 'destructive'
          });
          throw new Error(`Трек ${track.track_number}: файл отсутствует`);
        }
        
        const fileSizeMB = track.file.size / 1024 / 1024;
        if (fileSizeMB > 100) {
          toast({
            title: `❌ Файл слишком большой`,
            description: `Трек "${track.title || track.file.name}" (${fileSizeMB.toFixed(2)}МБ) превышает лимит 100МБ`,
            variant: 'destructive'
          });
          throw new Error(`Трек ${track.track_number}: превышен лимит размера`);
        }
        
        setCurrentUploadFile(`Трек ${index + 1}/${tracks.length}: ${track.title || track.file.name}`);
        
        try {
          const trackData = await uploadFile(track.file);
          
          if (!trackData) {
            throw new Error(`Трек ${track.track_number}: не удалось загрузить`);
          }
          
          // Удаляем preview_url (base64) и file перед отправкой — они не нужны на бэкенде
          const { preview_url, file, ...trackWithoutBinary } = track;
          
          uploadedTracks.push({
            ...trackWithoutBinary,
            file_url: trackData.url,
            file_name: trackData.fileName,
            file_size: trackData.fileSize
          });
        } catch (uploadError: any) {
          const fileSize = (track.file.size / 1024 / 1024).toFixed(2);
          console.error(`Track upload failed: ${track.title}, size: ${fileSize}MB`, uploadError);
          throw new Error(`Трек "${track.title || track.file.name}" (${fileSize}МБ): ${uploadError.message || 'не удалось загрузить'}`);
        }
      }

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

      if (!editingRelease) {
        try {
          await createNotification({
            title: '🎵 Новый релиз на модерации',
            message: `Артист отправил релиз "${newRelease.release_name}" на модерацию. Дата релиза: ${newRelease.release_date}`,
            type: 'release_submitted',
            related_entity_type: 'release',
            related_entity_id: userId
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
      }

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
  }, [newRelease, coverFile, tracks, userId, editingRelease, toast, loadReleases]);

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

  const handlePitching = async (data: Pitching) => {
    try {
      const response = await fetch(PITCHING_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId.toString()
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to submit pitching');

      toast({
        title: 'Успешно',
        description: 'Релиз отправлен на питчинг'
      });

      try {
        await createNotification({
          title: '🎯 Новая заявка на питчинг',
          message: `Артист отправил релиз "${data.release_name}" на питчинг`,
          type: 'pitching_submitted',
          related_entity_type: 'pitching',
          related_entity_id: userId
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось отправить на питчинг',
        variant: 'destructive'
      });
      throw error;
    }
  };

  return {
    releases,
    loading,
    uploading,
    uploadProgress,
    currentUploadFile,
    showForm,
    setShowForm,
    activeTab,
    setActiveTab,
    editingRelease,
    newRelease,
    setNewRelease,
    coverFile,
    coverPreview,
    tracks,
    handleCoverChange,
    addTrack,
    removeTrack,
    updateTrack,
    moveTrack,
    handleBatchUpload,
    handleSubmit,
    loadTracks,
    handleReview,
    handleEdit,
    handlePitching
  };
};