import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useEffect, useState } from 'react';

interface ArtistStats {
  date: string;
  vk_subscribers: number;
  vk_subscribers_change: number;
  tiktok_followers: number;
  tiktok_followers_change: number;
  yandex_listeners: number;
  yandex_listeners_change: number;
}

interface Props {
  userId: number;
}

export default function ArtistDashboard({ userId }: Props) {
  const [stats, setStats] = useState<ArtistStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedStats = localStorage.getItem(`artist_stats_${userId}`);
    
    if (storedStats) {
      setStats(JSON.parse(storedStats));
    } else {
      setStats({
        date: new Date().toISOString().split('T')[0],
        vk_subscribers: 0,
        vk_subscribers_change: 0,
        tiktok_followers: 0,
        tiktok_followers_change: 0,
        yandex_listeners: 0,
        yandex_listeners_change: 0
      });
    }
    
    setLoading(false);
  }, [userId]);

  const formatChange = (value: number) => {
    if (value > 0) return `+${value}`;
    return value.toString();
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getChangeIcon = (value: number) => {
    if (value > 0) return 'TrendingUp';
    if (value < 0) return 'TrendingDown';
    return 'Minus';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
        <CardContent className="p-12 text-center">
          <Icon name="BarChart3" size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-gray-400">Статистика недоступна</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Твоя статистика</h2>
          <p className="text-xs md:text-sm text-gray-400">Обновляется каждый день в 00:00</p>
        </div>
        <Badge className="bg-white/10 text-white text-xs md:text-sm">
          {new Date(stats.date).toLocaleDateString('ru-RU')}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30 backdrop-blur-sm hover:border-blue-500/50 transition-all">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-white text-base md:text-lg">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Icon name="Users" size={16} className="text-blue-400 md:size-5" />
              </div>
              ВКонтакте
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            <div className="space-y-2">
              <div className="text-2xl md:text-4xl font-bold text-white">
                {stats.vk_subscribers.toLocaleString('ru-RU')}
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(stats.vk_subscribers_change)}`}>
                <Icon name={getChangeIcon(stats.vk_subscribers_change) as any} size={16} />
                <span className="font-semibold">
                  {formatChange(stats.vk_subscribers_change)} за сегодня
                </span>
              </div>
              <p className="text-sm text-gray-400">Подписчиков в группе</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 border-pink-500/30 backdrop-blur-sm hover:border-pink-500/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                <Icon name="Video" size={20} className="text-pink-400" />
              </div>
              TikTok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">
                {stats.tiktok_followers.toLocaleString('ru-RU')}
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(stats.tiktok_followers_change)}`}>
                <Icon name={getChangeIcon(stats.tiktok_followers_change) as any} size={16} />
                <span className="font-semibold">
                  {formatChange(stats.tiktok_followers_change)} за сегодня
                </span>
              </div>
              <p className="text-sm text-gray-400">Подписчиков</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30 backdrop-blur-sm hover:border-purple-500/50 transition-all">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Icon name="Music" size={20} className="text-purple-400" />
              </div>
              Яндекс.Музыка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-white">
                {stats.yandex_listeners.toLocaleString('ru-RU')}
              </div>
              <div className={`flex items-center gap-1 ${getChangeColor(stats.yandex_listeners_change)}`}>
                <Icon name={getChangeIcon(stats.yandex_listeners_change) as any} size={16} />
                <span className="font-semibold">
                  {formatChange(stats.yandex_listeners_change)} за сегодня
                </span>
              </div>
              <p className="text-sm text-gray-400">Слушателей в месяц</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="Info" size={20} />
            Как мы собираем статистику?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 space-y-2">
          <p>📊 Данные обновляются автоматически каждый день в полночь</p>
          <p>📈 Мы отслеживаем изменения и показываем тренды</p>
          <p>🔗 Убедись, что ты указал правильные ссылки на свои профили</p>
          <p className="text-sm text-gray-400 mt-4">
            * Статистика может обновляться с задержкой до 24 часов
          </p>
        </CardContent>
      </Card>
    </div>
  );
}