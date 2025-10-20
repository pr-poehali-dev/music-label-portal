import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_ENDPOINTS } from '@/config/api';

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
  reviewed_releases: number;
  pitching_tracks: number;
  tasks_activity: ActivityData[];
  tickets_activity: ActivityData[];
  releases_activity: ActivityData[];
  pitching_activity: ActivityData[];
}

const API_URL = API_ENDPOINTS.TICKETS;

export default function ManagerStats({ userId }: ManagerStatsProps) {
  const [stats, setStats] = useState<Stats>({ 
    completed_tasks: 0, 
    answered_tickets: 0,
    reviewed_releases: 0,
    pitching_tracks: 0,
    tasks_activity: [],
    tickets_activity: [],
    releases_activity: [],
    pitching_activity: []
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
    const dateMap = new Map<string, { tasks: number; tickets: number; releases: number; pitching: number }>();
    
    stats.tasks_activity?.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const existing = dateMap.get(date) || { tasks: 0, tickets: 0, releases: 0, pitching: 0 };
      dateMap.set(date, { ...existing, tasks: item.count });
    });
    
    stats.tickets_activity?.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const existing = dateMap.get(date) || { tasks: 0, tickets: 0, releases: 0, pitching: 0 };
      dateMap.set(date, { ...existing, tickets: item.count });
    });
    
    stats.releases_activity?.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const existing = dateMap.get(date) || { tasks: 0, tickets: 0, releases: 0, pitching: 0 };
      dateMap.set(date, { ...existing, releases: item.count });
    });
    
    stats.pitching_activity?.forEach(item => {
      const date = new Date(item.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      const existing = dateMap.get(date) || { tasks: 0, tickets: 0, releases: 0, pitching: 0 };
      dateMap.set(date, { ...existing, pitching: item.count });
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Выполнено задач</CardTitle>
          <Icon name="CheckCircle2" size={20} className="text-green-500" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Загрузка...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-green-500">{stats.completed_tasks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Завершённых задач за всё время
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Закрыто тикетов</CardTitle>
          <Icon name="MessageSquare" size={20} className="text-yellow-500" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Загрузка...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-yellow-500">{stats.answered_tickets}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Закрытых тикетов за всё время
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Проверено релизов</CardTitle>
          <Icon name="Music" size={20} className="text-purple-500" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Загрузка...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-purple-500">{stats.reviewed_releases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Проверенных релизов за всё время
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Треков на питчинг</CardTitle>
          <Icon name="Send" size={20} className="text-blue-500" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2">
              <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Загрузка...</span>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-blue-500">{stats.pitching_tracks}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Отправлено треков за всё время
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
                  stroke="#22c55e" 
                  strokeWidth={2}
                  name="Задачи"
                  dot={{ fill: '#22c55e', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tickets" 
                  stroke="#eab308" 
                  strokeWidth={2}
                  name="Тикеты"
                  dot={{ fill: '#eab308', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="releases" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  name="Релизы"
                  dot={{ fill: '#a855f7', r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pitching" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Питчинг"
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}