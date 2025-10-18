import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface ManagerStatsProps {
  userId: number;
}

interface Stats {
  completed_tasks: number;
  answered_tickets: number;
}

const API_URL = 'https://functions.poehali.dev/cdcd7646-5a98-477f-8464-d1aa48319296';

export default function ManagerStats({ userId }: ManagerStatsProps) {
  const [stats, setStats] = useState<Stats>({ completed_tasks: 0, answered_tickets: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?type=stats&user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Выполнено задач</CardTitle>
          <Icon name="CheckCircle2" size={20} className="text-green-600" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Загрузка...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-green-600">{stats.completed_tasks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Завершённых задач за всё время
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Отвечено тикетов</CardTitle>
          <Icon name="MessageSquare" size={20} className="text-blue-600" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Загрузка...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-blue-600">{stats.answered_tickets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Закрытых тикетов за всё время
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
