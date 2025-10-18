import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ManagerStatsProps {
  userId: number;
}

interface ActivityData {
  date: string;
  count: number;
}

interface Stats {
  completed_tasks: number;
  answered_tickets: number;
  tasks_activity: ActivityData[];
  tickets_activity: ActivityData[];
}

const API_URL = 'https://functions.poehali.dev/cdcd7646-5a98-477f-8464-d1aa48319296';

export default function ManagerStats({ userId }: ManagerStatsProps) {
  const [stats, setStats] = useState<Stats>({ 
    completed_tasks: 0, 
    answered_tickets: 0,
    tasks_activity: [],
    tickets_activity: []
  });
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

  const mergeActivityData = () => {
    const dateMap = new Map<string, { tasks: number; tickets: number }>();
    
    stats.tasks_activity.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const existing = dateMap.get(date) || { tasks: 0, tickets: 0 };
      dateMap.set(date, { ...existing, tasks: item.count });
    });
    
    stats.tickets_activity.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const existing = dateMap.get(date) || { tasks: 0, tickets: 0 };
      dateMap.set(date, { ...existing, tickets: item.count });
    });
    
    return Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split('.');
        const [dayB, monthB] = b.date.split('.');
        return new Date(2024, parseInt(monthA) - 1, parseInt(dayA)).getTime() - 
               new Date(2024, parseInt(monthB) - 1, parseInt(dayB)).getTime();
      });
  };

  const chartData = mergeActivityData();

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Активность за последние 30 дней</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#16a34a" 
                  strokeWidth={2}
                  name="Задачи"
                  dot={{ fill: '#16a34a', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  name="Тикеты"
                  dot={{ fill: '#2563eb', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}