import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ReleaseStats {
  total_releases: number;
  pending_releases: number;
  approved_releases: number;
  rejected_releases: number;
  total_streams: number;
  avg_rating: number;
  top_artists: Array<{ artist_name: string; release_count: number }>;
  releases_by_month: Array<{ month: string; count: number }>;
  platform_distribution: Array<{ platform: string; count: number }>;
}

export default function ReleaseAnalyticsDashboard() {
  const [stats, setStats] = useState<ReleaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const [overallResponse, topArtistsResponse, monthlyResponse, platformsResponse] = await Promise.all([
        fetch('/api/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT 
              COUNT(*) as total_releases,
              SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_releases,
              SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_releases,
              SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_releases
            FROM t_p35759334_music_label_portal.releases`
          })
        }),
        fetch('/api/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT 
              u.full_name as artist_name,
              COUNT(r.id) as release_count
            FROM t_p35759334_music_label_portal.releases r
            JOIN t_p35759334_music_label_portal.users u ON r.artist_id = u.id
            WHERE u.role = 'artist'
            GROUP BY u.id, u.full_name
            ORDER BY release_count DESC
            LIMIT 5`
          })
        }),
        fetch('/api/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT 
              TO_CHAR(created_at, 'TMMonth') as month,
              COUNT(*) as count
            FROM t_p35759334_music_label_portal.releases
            WHERE created_at >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'TMMonth'), EXTRACT(MONTH FROM created_at)
            ORDER BY EXTRACT(MONTH FROM created_at)`
          })
        }),
        fetch('/api/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT 
              SUM(CASE WHEN yandex_music_url IS NOT NULL AND yandex_music_url != '' THEN 1 ELSE 0 END) as yandex_music,
              SUM(CASE WHEN vk_url IS NOT NULL AND vk_url != '' THEN 1 ELSE 0 END) as vk_music,
              SUM(CASE WHEN spotify_url IS NOT NULL AND spotify_url != '' THEN 1 ELSE 0 END) as spotify
            FROM t_p35759334_music_label_portal.releases`
          })
        })
      ]);

      const overall = await overallResponse.json();
      const topArtists = await topArtistsResponse.json();
      const monthly = await monthlyResponse.json();
      const platforms = await platformsResponse.json();

      const monthNames: Record<string, string> = {
        'January': 'Январь',
        'February': 'Февраль',
        'March': 'Март',
        'April': 'Апрель',
        'May': 'Май',
        'June': 'Июнь',
        'July': 'Июль',
        'August': 'Август',
        'September': 'Сентябрь',
        'October': 'Октябрь',
        'November': 'Ноябрь',
        'December': 'Декабрь'
      };

      const platformData = platforms[0] || {};
      const platformDist = [
        { platform: 'Яндекс.Музыка', count: Number(platformData.yandex_music) || 0 },
        { platform: 'VK Музыка', count: Number(platformData.vk_music) || 0 },
        { platform: 'Spotify', count: Number(platformData.spotify) || 0 }
      ].filter(p => p.count > 0);

      setStats({
        total_releases: Number(overall[0]?.total_releases) || 0,
        pending_releases: Number(overall[0]?.pending_releases) || 0,
        approved_releases: Number(overall[0]?.approved_releases) || 0,
        rejected_releases: Number(overall[0]?.rejected_releases) || 0,
        total_streams: 0,
        avg_rating: 0,
        top_artists: topArtists.map((a: any) => ({
          artist_name: a.artist_name,
          release_count: Number(a.release_count)
        })),
        releases_by_month: monthly.map((m: any) => ({
          month: monthNames[m.month] || m.month,
          count: Number(m.count)
        })),
        platform_distribution: platformDist
      });
    } catch (error) {
      console.error('Error loading release analytics:', error);
      setStats({
        total_releases: 0,
        pending_releases: 0,
        approved_releases: 0,
        rejected_releases: 0,
        total_streams: 0,
        avg_rating: 0,
        top_artists: [],
        releases_by_month: [],
        platform_distribution: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="Loader2" className="animate-spin" size={32} />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-yellow-500/20 bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего релизов</CardTitle>
            <Icon name="Music" className="text-yellow-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.total_releases}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">На модерации</CardTitle>
            <Icon name="Clock" className="text-blue-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.pending_releases}</div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Одобрено</CardTitle>
            <Icon name="CheckCircle" className="text-green-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.approved_releases}</div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-black/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Отклонено</CardTitle>
            <Icon name="XCircle" className="text-red-500" size={20} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.rejected_releases}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-yellow-500/20 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="TrendingUp" size={20} />
              Топ артисты по релизам
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.top_artists.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Нет данных</p>
            ) : (
              <div className="space-y-3">
                {stats.top_artists.map((artist, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-500">
                        {idx + 1}
                      </div>
                      <span className="font-medium">{artist.artist_name}</span>
                    </div>
                    <span className="text-yellow-500 font-bold">{artist.release_count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-black/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Calendar" size={20} />
              Релизы по месяцам
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.releases_by_month.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Нет данных</p>
            ) : (
              <div className="space-y-2">
                {stats.releases_by_month.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-yellow-500/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full" 
                          style={{ width: `${(item.count / Math.max(...stats.releases_by_month.map(m => m.count))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-yellow-500 w-8 text-right">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-yellow-500/20 bg-black/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="BarChart3" size={20} />
            Распределение по платформам
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.platform_distribution.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Нет данных</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.platform_distribution.map((platform, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <span className="text-sm text-muted-foreground">{platform.platform}</span>
                  <span className="text-2xl font-bold text-yellow-500">{platform.count}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}