import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Release } from './types';

interface ReleaseStatusTabsProps {
  releases: Release[];
  activeTab: 'all' | 'approved' | 'pending' | 'rejected';
  onTabChange: (tab: 'all' | 'approved' | 'pending' | 'rejected') => void;
}

export default function ReleaseStatusTabs({ releases, activeTab, onTabChange }: ReleaseStatusTabsProps) {
  return (
    <div className="flex gap-2 border-b overflow-x-auto pb-px">
      <button
        onClick={() => onTabChange('all')}
        className={`px-3 sm:px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
          activeTab === 'all'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        Все <Badge variant="outline" className="ml-2">{releases.length}</Badge>
      </button>
      <button
        onClick={() => onTabChange('approved')}
        className={`px-3 sm:px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
          activeTab === 'approved'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon name="CheckCircle" size={16} />
        Принятые <Badge variant="outline" className="ml-1">{releases.filter(r => r.status === 'approved').length}</Badge>
      </button>
      <button
        onClick={() => onTabChange('pending')}
        className={`px-3 sm:px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
          activeTab === 'pending'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon name="Clock" size={16} />
        На модерации <Badge variant="outline" className="ml-1">{releases.filter(r => r.status === 'pending').length}</Badge>
      </button>
      <button
        onClick={() => onTabChange('rejected')}
        className={`px-3 sm:px-4 py-2 font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
          activeTab === 'rejected'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        }`}
      >
        <Icon name="XCircle" size={16} />
        Отклонённые <Badge variant="outline" className="ml-1">{releases.filter(r => r.status === 'rejected').length}</Badge>
      </button>
    </div>
  );
}