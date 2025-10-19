import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { Track } from './types';

interface TrackListProps {
  tracks: Track[];
}

export default function TrackList({ tracks }: TrackListProps) {
  return (
    <div>
      <h4 className="font-semibold mb-2 text-sm md:text-base flex items-center gap-2">
        <Icon name="Music" size={16} />
        Треки ({tracks.length})
      </h4>
      <div className="space-y-2">
        {tracks.map((track) => (
          <Card key={track.id} className="bg-black/30 border-yellow-500/20">
            <CardContent className="p-3 md:pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm md:text-base truncate">
                    #{track.track_number} - {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{track.composer}</p>
                </div>
              </div>
              <audio controls className="w-full mt-2 h-8 md:h-10">
                <source src={track.file_url} />
              </audio>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
