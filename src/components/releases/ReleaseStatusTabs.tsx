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
    <div className="flex gap-0.5 md:gap-2 border-b overflow-x-auto pb-px -mx-4 px-4 md:mx-0 md:px-0">
      <button
        onClick={() => onTabChange('all')}
        className={`px-2 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 h-9 md:h-auto flex items-center gap-1 ${
          activeTab === 'all'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground md:hover:text-foreground'
        }`}
      >
        Все <Badge variant="outline" className="ml-0.5 md:ml-2 text-[9px] md:text-xs h-4 md:h-auto px-1 md:px-2">{releases.length}</Badge>
      </button>
      <button
        onClick={() => onTabChange('approved')}
        className={`px-2 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-medium transition-colors border-b-2 flex items-center gap-0.5 md:gap-2 whitespace-nowrap flex-shrink-0 h-9 md:h-auto ${
          activeTab === 'approved'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground md:hover:text-foreground'
        }`}
      >
        <span className="text-sm md:hidden">✓</span>
        <Icon name="CheckCircle" size={14} className="hidden md:inline" />
        <span className="hidden md:inline">Принятые</span>
        <Badge variant="outline" className="text-[9px] md:text-xs h-4 md:h-auto px-1 md:px-2">{releases.filter(r => r.status === 'approved').length}</Badge>
      </button>
      <button
        onClick={() => onTabChange('pending')}
        className={`px-2 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-medium transition-colors border-b-2 flex items-center gap-0.5 md:gap-2 whitespace-nowrap flex-shrink-0 h-9 md:h-auto ${
          activeTab === 'pending'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground md:hover:text-foreground'
        }`}
      >
        <span className="text-sm md:hidden">⏳</span>
        <Icon name="Clock" size={14} className="hidden md:inline" />
        <span className="hidden md:inline">На модерации</span>
        <Badge variant="outline" className="text-[9px] md:text-xs h-4 md:h-auto px-1 md:px-2">{releases.filter(r => r.status === 'pending').length}</Badge>
      </button>
      <button
        onClick={() => onTabChange('rejected')}
        className={`px-2 md:px-4 py-1.5 md:py-2 text-[11px] md:text-sm font-medium transition-colors border-b-2 flex items-center gap-0.5 md:gap-2 whitespace-nowrap flex-shrink-0 h-9 md:h-auto ${
          activeTab === 'rejected'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground md:hover:text-foreground'
        }`}
      >
        <span className="text-sm md:hidden">✗</span>
        <Icon name="XCircle" size={14} className="hidden md:inline" />
        <span className="hidden md:inline">Отклонённые</span>
        <Badge variant="outline" className="text-[9px] md:text-xs h-4 md:h-auto px-1 md:px-2">{releases.filter(r => r.status === 'rejected').length}</Badge>
      </button>
    </div>
  );
}