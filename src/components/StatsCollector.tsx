import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { getNextCollectionTime } from '@/utils/statsScheduler';

const USERS_API = 'https://functions.poehali.dev/cf5d45c1-d64b-4400-af77-a51c7588d942';

export default function StatsCollector() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [nextCollection, setNextCollection] = useState<Date | null>(null);

  useEffect(() => {
    setNextCollection(getNextCollectionTime());
  }, [message]);

  const collectStats = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${USERS_API}?action=collect_stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(data.message || 'Статистика обновлена!');
        localStorage.setItem('last_stats_collection', Date.now().toString());
        setNextCollection(getNextCollectionTime());
      } else {
        setError(data.error || 'Ошибка при сборе статистики');
      }
    } catch (err) {
      setError('Не удалось собрать статистику');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="RefreshCw" size={20} />
            Обновление статистики
          </CardTitle>
          {nextCollection && (
            <Badge className="bg-white/10 text-white">
              Следующий сбор: {nextCollection.toLocaleString('ru-RU', { 
                day: '2-digit', 
                month: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-300">
          Автоматический сбор данных из ВКонтакте и Яндекс.Музыки для всех артистов
        </p>

        <Button
          onClick={collectStats}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Icon name="Loader2" size={16} className="animate-spin mr-2" />
              Собираем статистику...
            </>
          ) : (
            <>
              <Icon name="Download" size={16} className="mr-2" />
              Обновить сейчас
            </>
          )}
        </Button>

        {message && (
          <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Icon name="CheckCircle" size={16} className="text-green-400 mt-0.5" />
            <p className="text-green-400 text-sm">{message}</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <Icon name="AlertCircle" size={16} className="text-red-400 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="pt-4 border-t border-white/10">
          <h4 className="text-white font-semibold mb-2">Требования:</h4>
          <ul className="text-sm text-gray-400 space-y-1 list-disc list-inside">
            <li>Добавлены токены VK_SERVICE_TOKEN и YANDEX_MUSIC_TOKEN</li>
            <li>Артисты заполнили ссылки на соцсети</li>
            <li>Статистика обновляется раз в день автоматически</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}