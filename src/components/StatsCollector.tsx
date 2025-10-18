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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon name="RefreshCw" size={32} className="text-primary" />
          <h1 className="text-3xl font-bold">Обновление статистики</h1>
        </div>
        {nextCollection && (
          <Badge>
            Следующий сбор: {nextCollection.toLocaleString('ru-RU', { 
              day: '2-digit', 
              month: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Badge>
        )}
      </div>
      
      <Card>
        <CardContent className="space-y-4 pt-6">
          <p className="text-muted-foreground">
            Автоматический сбор данных из ВКонтакте и Яндекс.Музыки для всех артистов
          </p>

          <Button
            onClick={collectStats}
            disabled={loading}
            className="w-full"
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
              <Icon name="CheckCircle" size={16} className="text-green-600 mt-0.5" />
              <p className="text-green-600 text-sm">{message}</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <Icon name="AlertCircle" size={16} className="text-red-600 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Требования:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Добавлены токены VK_SERVICE_TOKEN и YANDEX_MUSIC_TOKEN</li>
              <li>Артисты заполнили ссылки на соцсети</li>
              <li>Статистика обновляется раз в день автоматически</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}