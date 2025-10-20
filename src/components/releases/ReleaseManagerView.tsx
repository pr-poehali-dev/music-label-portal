import { useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import ReleaseForm from './ReleaseForm';
import ReleasesList from './ReleasesList';
import ReleaseStatusTabs from './ReleaseStatusTabs';
import { Release, Pitching } from './types';

interface ReleaseManagerViewProps {
  userId: number;
  releases: Release[];
  showForm: boolean;
  activeTab: 'all' | 'approved' | 'pending' | 'rejected';
  newRelease: any;
  coverPreview: string | null;
  tracks: any[];
  uploading: boolean;
  uploadProgress: number;
  currentUploadFile: string;
  onCreateClick: () => void;
  onTabChange: (tab: 'all' | 'approved' | 'pending' | 'rejected') => void;
  onCancelForm: () => void;
  onEdit: (release: Release) => void;
  onPitching?: (data: Pitching) => Promise<void>;
  setNewRelease: (release: any) => void;
  handleCoverChange: (file: File | null) => void;
  addTrack: () => void;
  removeTrack: (index: number) => void;
  updateTrack: (index: number, field: string, value: any) => void;
  moveTrack: (index: number, direction: 'up' | 'down') => void;
  handleBatchUpload: (files: FileList) => void;
  handleSubmit: () => void;
}

const getStatusBadge = (status: string) => {
  const variants: Record<string, { variant: any; text: string; icon: string }> = {
    pending: { variant: 'secondary', text: 'На модерации', icon: 'Clock' },
    approved: { variant: 'default', text: 'Одобрен', icon: 'CheckCircle' },
    rejected: { variant: 'destructive', text: 'Отклонён', icon: 'XCircle' }
  };
  const config = variants[status] || variants.pending;
  return (
    <Badge variant={config.variant} className="gap-0.5 text-[9px] md:text-xs h-4 md:h-auto px-1 md:px-2">
      <Icon name={config.icon} size={10} className="flex-shrink-0 md:w-3 md:h-3" />
      <span className="truncate hidden md:inline">{config.text}</span>
      <span className="md:hidden">{status === 'approved' ? '✓' : status === 'rejected' ? '✗' : '⏳'}</span>
    </Badge>
  );
};

export default function ReleaseManagerView({
  userId,
  releases,
  showForm,
  activeTab,
  newRelease,
  coverPreview,
  tracks,
  uploading,
  uploadProgress,
  currentUploadFile,
  onCreateClick,
  onTabChange,
  onCancelForm,
  onEdit,
  onPitching,
  setNewRelease,
  handleCoverChange,
  addTrack,
  removeTrack,
  updateTrack,
  moveTrack,
  handleBatchUpload,
  handleSubmit
}: ReleaseManagerViewProps) {
  // Memoize filtered releases to avoid re-filtering on every render
  const filteredReleases = useMemo(() => 
    activeTab === 'all' ? releases : releases.filter(r => r.status === activeTab),
    [activeTab, releases]
  );

  // Memoize callbacks
  const handleCreateClick = useCallback(() => {
    onCreateClick();
  }, [onCreateClick]);

  const handleCancelForm = useCallback(() => {
    onCancelForm();
  }, [onCancelForm]);

  return (
    <div className="space-y-2 md:space-y-4 px-2 md:px-0">
      {!showForm && (
        <>
          <div className="flex justify-between items-center gap-2">
            <h2 className="text-sm md:text-xl font-bold">Мои релизы</h2>
            <Button onClick={handleCreateClick} size="sm" className="gap-1 h-8 md:h-9 text-[11px] md:text-sm px-2 md:px-4">
              <Icon name="Plus" size={14} className="md:size-4" />
              <span className="hidden md:inline">Создать релиз</span>
              <span className="md:hidden">Создать</span>
            </Button>
          </div>

          <ReleaseStatusTabs 
            releases={releases}
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
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
          uploadProgress={uploadProgress}
          currentUploadFile={currentUploadFile}
          onCancel={onCancelForm}
        />
      )}

      {!showForm && (
        <ReleasesList
          userId={userId}
          releases={filteredReleases} 
          getStatusBadge={getStatusBadge}
          onEdit={onEdit}
          onPitching={onPitching}
        />
      )}
    </div>
  );
}