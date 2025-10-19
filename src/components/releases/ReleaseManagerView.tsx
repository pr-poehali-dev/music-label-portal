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
    <div className="space-y-6">
      {!showForm && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Мои релизы</h2>
            <Button onClick={onCreateClick}>
              <Icon name="Plus" size={18} className="mr-2" />
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