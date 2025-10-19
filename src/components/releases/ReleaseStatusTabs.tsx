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
    <div className="flex gap-1 sm:gap-2 border-b overflow-x-auto pb-px -mx-4 px-4 sm:mx-0 sm:px-0">
      <button
        onClick={() => onTabChange('all')}
        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 min-h-[44px] sm:min-h-0 ${
          activeTab === 'all'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground md:hover:text-foreground'
        }`}
      >
        Все <Badge variant="outline" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">{releases.length}</Badge>
      </button>
      <button
        onClick={() => onTabChange('approved')}
        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 min-h-[44px] sm:min-h-0 ${
          activeTab === 'approved'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground md:hover:text-foreground'
        }`}
      >
        <Icon name="CheckCircle" size={14} className="sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Принятые</span>
        <span className="sm:hidden">✓</span>
        <Badge variant="outline" className="ml-1 text-[10px] sm:text-xs">{releases.filter(r => r.status === 'approved').length}</Badge>
      </button>
      <button
        onClick={() => onTabChange('pending')}
        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 min-h-[44px] sm:min-h-0 ${
          activeTab === 'pending'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground md:hover:text-foreground'
        }`}
      >
        <Icon name="Clock" size={14} className="sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">На модерации</span>
        <span className="sm:hidden">⏳</span>
        <Badge variant="outline" className="ml-1 text-[10px] sm:text-xs">{releases.filter(r => r.status === 'pending').length}</Badge>
      </button>
      <button
        onClick={() => onTabChange('rejected')}
        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 min-h-[44px] sm:min-h-0 ${
          activeTab === 'rejected'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground md:hover:text-foreground'
        }`}
      >
        <Icon name="XCircle" size={14} className="sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">Отклонённые</span>
        <span className="sm:hidden">✗</span>
        <Badge variant="outline" className="ml-1 text-[10px] sm:text-xs">{releases.filter(r => r.status === 'rejected').length}</Badge>
      </button>
    </div>
  );
}