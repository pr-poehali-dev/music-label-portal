import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import ReleaseForm from './ReleaseForm';
import ReleasesList from './ReleasesList';
import ReleaseStatusTabs from './ReleaseStatusTabs';
import { Release, Pitching } from './types';

interface ReleaseManagerViewProps {
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
    <Badge variant={config.variant} className="gap-1">
      <Icon name={config.icon} size={12} />
      {config.text}
    </Badge>
  );
};

export default function ReleaseManagerView({
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
  const filteredReleases = activeTab === 'all' 
    ? releases 
    : releases.filter(r => r.status === activeTab);

  return (
    <div className="space-y-4">
      {!showForm && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-xl font-bold">Мои релизы</h2>
            <Button onClick={onCreateClick} size="sm" className="gap-1.5 w-full sm:w-auto">
              <Icon name="Plus" size={16} />
              Создать релиз
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
          releases={filteredReleases} 
          getStatusBadge={getStatusBadge}
          onEdit={onEdit}
          onPitching={onPitching}
        />
      )}
    </div>
  );
}