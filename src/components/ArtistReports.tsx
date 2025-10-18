import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Report {
  id: number;
  period_start: string;
  period_end: string;
  platform: string;
  territory: string;
  right_type: string;
  contract_type: string;
  usage_type: string;
  performer: string;
  track_name: string;
  album_name: string;
  plays: number;
  author_reward_license: number;
  author_reward_license_changed: number;
  total_reward: number;
  uploaded_at: string;
}

interface ArtistReportsProps {
  userId: number;
}

export default function ArtistReports({ userId }: ArtistReportsProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadReports();
  }, [userId]);

  const loadReports = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/be12d7b5-90f6-4a13-992e-204cd8f0a264?artist_id=${userId}`
      );
      const data = await response.json();
      setReports(data.reports || []);
    } catch (error) {
      toast({
        title: '❌ Ошибка загрузки',
        description: 'Не удалось загрузить отчёты',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const periods = Array.from(new Set(reports.map(r => r.period_start))).sort().reverse();
  const platforms = Array.from(new Set(reports.map(r => r.platform)));

  const filteredReports = reports.filter(r => {
    if (selectedPeriod !== 'all' && r.period_start !== selectedPeriod) return false;
    if (selectedPlatform !== 'all' && r.platform !== selectedPlatform) return false;
    return true;
  });

  const totalPlays = filteredReports.reduce((sum, r) => sum + r.plays, 0);
  const totalReward = filteredReports.reduce((sum, r) => sum + r.total_reward, 0);
  const uniqueTracks = new Set(filteredReports.map(r => r.track_name)).size;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={48} className="animate-spin text-yellow-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Всего прослушиваний</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalPlays.toLocaleString('ru-RU')}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Вознаграждение</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalReward.toFixed(2)} ₽</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Треков</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{uniqueTracks}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="BarChart3" size={20} />
            Детализация отчётов
          </CardTitle>
          <CardDescription className="text-gray-400">
            Данные по прослушиваниям и вознаграждениям
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все периоды</SelectItem>
                {periods.map(period => (
                  <SelectItem key={period} value={period}>
                    {new Date(period).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10">
                <SelectValue placeholder="Площадка" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все площадки</SelectItem>
                {platforms.map(platform => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="FileText" size={48} className="text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Отчёты пока не загружены</p>
              <p className="text-sm text-gray-500 mt-2">
                Обратитесь к руководителю для получения отчётов
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{report.track_name}</h4>
                      <p className="text-sm text-gray-400">{report.album_name}</p>
                    </div>
                    <Badge className="bg-blue-500">{report.platform}</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Прослушиваний:</span>
                      <p className="text-white font-medium">{report.plays.toLocaleString('ru-RU')}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Вознаграждение:</span>
                      <p className="text-green-400 font-medium">{report.total_reward.toFixed(2)} ₽</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Территория:</span>
                      <p className="text-white">{report.territory}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Период:</span>
                      <p className="text-white">
                        {new Date(report.period_start).toLocaleDateString('ru-RU', { 
                          year: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
