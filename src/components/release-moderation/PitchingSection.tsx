import Icon from '@/components/ui/icon';
import type { Pitching } from './types';

interface PitchingSectionProps {
  pitching: Pitching;
}

export default function PitchingSection({ pitching }: PitchingSectionProps) {
  return (
    <div className="border-t pt-4">
      <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
        <Icon name="Target" size={18} className="text-blue-500" />
        Питчинг
      </h4>
      <div className="space-y-3 bg-blue-500/10 p-3 md:p-4 rounded-lg border border-blue-500/20">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Icon name="User" size={12} />
            Описание артиста
          </p>
          <p className="text-xs md:text-sm whitespace-pre-wrap">{pitching.artist_description}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Icon name="Disc" size={12} />
            Описание релиза
          </p>
          <p className="text-xs md:text-sm whitespace-pre-wrap">{pitching.release_description}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Icon name="ListMusic" size={12} />
            Подходящие плейлисты
          </p>
          <p className="text-xs md:text-sm whitespace-pre-wrap">{pitching.playlist_fit}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <Icon name="TrendingUp" size={12} />
            Текущий охват
          </p>
          <p className="text-xs md:text-sm">{pitching.current_reach}</p>
        </div>
        {pitching.preview_link && (
          <a 
            href={pitching.preview_link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Icon name="ExternalLink" size={14} />
            Превью релиза
          </a>
        )}
      </div>
    </div>
  );
}
