import Icon from '@/components/ui/icon';
import PitchingManagement from './PitchingManagement';

interface SubmissionsManagerProps {
  userId: number;
  userRole?: string;
}

export default function SubmissionsManager({ userId, userRole = 'manager' }: SubmissionsManagerProps) {
  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
        <Icon name="Music" size={24} className="text-primary md:hidden" />
        <Icon name="Music" size={32} className="text-primary hidden md:block" />
        <h1 className="text-xl md:text-3xl font-bold">Заявки</h1>
      </div>

      <PitchingManagement userId={userId} userRole={userRole} />
    </div>
  );
}
