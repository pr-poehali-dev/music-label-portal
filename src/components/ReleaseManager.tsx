import Icon from '@/components/ui/icon';
import ModerationPanel from './releases/ModerationPanel';
import ReleaseManagerView from './releases/ReleaseManagerView';
import { useReleaseManager } from './releases/useReleaseManager';

interface ReleaseManagerProps {
  userId: number;
  userRole?: string;
}

export default function ReleaseManager({ userId, userRole = 'artist' }: ReleaseManagerProps) {
  const {
    releases,
    loading,
    uploading,
    showForm,
    setShowForm,
    activeTab,
    setActiveTab,
    newRelease,
    setNewRelease,
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
    handleEdit
  } = useReleaseManager(userId);

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
    <ReleaseManagerView
      releases={releases}
      showForm={showForm}
      activeTab={activeTab}
      newRelease={newRelease}
      coverPreview={coverPreview}
      tracks={tracks}
      uploading={uploading}
      onCreateClick={() => setShowForm(true)}
      onTabChange={setActiveTab}
      onCancelForm={() => setShowForm(false)}
      onEdit={handleEdit}
      setNewRelease={setNewRelease}
      handleCoverChange={handleCoverChange}
      addTrack={addTrack}
      removeTrack={removeTrack}
      updateTrack={updateTrack}
      moveTrack={moveTrack}
      handleBatchUpload={handleBatchUpload}
      handleSubmit={handleSubmit}
    />
  );
}
