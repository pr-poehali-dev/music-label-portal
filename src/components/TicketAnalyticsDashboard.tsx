import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface DailyStats {
  date: string;
  created_count: number;
  resolved_count: number;
  in_progress_count: number;
  urgent_count: number;
}

interface ManagerStats {
  id: number;
  full_name: string;
  total_tickets: number;
  resolved_tickets: number;
  avg_resolution_hours: number | null;
}

interface Summary {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  urgent_tickets: number;
  avg_resolution_hours: number | null;
}

const API_URL = 'https://functions.poehali.dev/831a484a-c7b9-4607-b683-19d813dc77e5';

export default function TicketAnalyticsDashboard() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [managerStats, setManagerStats] = useState<ManagerStats[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Failed to load analytics');
      
      const data = await response.json();
      setDailyStats(data.daily_stats || []);
      setManagerStats(data.manager_stats || []);
      setSummary(data.summary || null);
      setLoading(false);
    } catch (error) {
      toast({ 
        title: '❌ Ошибка загрузки аналитики', 
        variant: 'destructive' 
      });
      setLoading(false);
    }
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}`;
  };

  const maxDaily = Math.max(...dailyStats.map(d => d.created_count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="Loader2" className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Icon name="TicketCheck" size={32} className="text-primary" />
        <h1 className="text-3xl font-bold">Аналитика тикетов</h1>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Всего</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total_tickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Открытых</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{summary.open_tickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">В работе</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{summary.in_progress_tickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Решено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{summary.resolved_tickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Срочных</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{summary.urgent_tickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ср. время</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">
                {summary.avg_resolution_hours !== null 
                  ? `${summary.avg_resolution_hours.toFixed(1)}ч` 
                  : '—'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="TrendingUp" size={20} />
            Динамика тикетов (30 дней)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dailyStats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет данных за последние 30 дней
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Создано</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Решено</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Срочных</span>
                </div>
              </div>

              <div className="space-y-3">
                {dailyStats.map((day, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-16 text-muted-foreground">
                        {getDayName(day.date)} {formatDate(day.date)}
                      </span>
                      <div className="flex-1 flex gap-2 items-center">
                        <div 
                          className="bg-blue-500/20 h-8 rounded flex items-center justify-center text-blue-400 font-semibold"
                          style={{ width: `${(day.created_count / maxDaily) * 100}%`, minWidth: day.created_count > 0 ? '40px' : '0' }}
                        >
                          {day.created_count > 0 && day.created_count}
                        </div>
                        <div 
                          className="bg-green-500/20 h-8 rounded flex items-center justify-center text-green-400 font-semibold"
                          style={{ width: `${(day.resolved_count / maxDaily) * 100}%`, minWidth: day.resolved_count > 0 ? '40px' : '0' }}
                        >
                          {day.resolved_count > 0 && day.resolved_count}
                        </div>
                        {day.urgent_count > 0 && (
                          <div className="bg-red-500/20 h-8 px-3 rounded flex items-center justify-center text-red-400 font-semibold">
                            🔥 {day.urgent_count}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Users" size={20} />
            Статистика менеджеров
          </CardTitle>
        </CardHeader>
        <CardContent>
          {managerStats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет данных по менеджерам
            </div>
          ) : (
            <div className="space-y-3">
              {managerStats.map((manager) => (
                <div key={manager.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{manager.full_name}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Всего: <span className="font-semibold text-foreground">{manager.total_tickets}</span>
                      </span>
                      <span className="text-muted-foreground">
                        Решено: <span className="font-semibold text-green-500">{manager.resolved_tickets}</span>
                      </span>
                      {manager.avg_resolution_hours !== null && (
                        <span className="text-muted-foreground">
                          Ср. время: <span className="font-semibold text-foreground">
                            {manager.avg_resolution_hours.toFixed(1)}ч
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {manager.total_tickets > 0 && (
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${(manager.resolved_tickets / manager.total_tickets) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}