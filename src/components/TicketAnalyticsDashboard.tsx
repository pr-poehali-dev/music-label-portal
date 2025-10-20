import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';

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

const API_URL = API_ENDPOINTS.TICKET_ANALYTICS;

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

  const isWeekday = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}`;
  };

  const workdayStats = dailyStats.filter(d => isWeekday(d.date));
  const maxDaily = Math.max(
    ...workdayStats.map(d => Math.max(d.created_count, d.resolved_count)),
    1
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="Loader2" className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex items-center gap-2 md:gap-3">
        <Icon name="TicketCheck" size={20} className="text-primary md:size-8" />
        <h1 className="text-lg md:text-3xl font-bold">Аналитика тикетов</h1>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 md:gap-4">
          <Card>
            <CardHeader className="pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Всего</CardTitle>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0">
              <div className="text-xl md:text-2xl font-bold">{summary.total_tickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Открытых</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-orange-500">{summary.open_tickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">В работе</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-yellow-500">{summary.in_progress_tickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Решено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-green-500">{summary.resolved_tickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Срочных</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-red-500">{summary.urgent_tickets}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">Ср. время</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold text-blue-500">
                {summary.avg_resolution_hours !== null 
                  ? `${summary.avg_resolution_hours.toFixed(1)}ч` 
                  : '—'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Icon name="TrendingUp" size={16} className="md:size-5" />
            <span className="truncate">Статистика по рабочим дням (последние 30 дней)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {workdayStats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Нет данных за последние 30 рабочих дней
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              <div className="flex gap-3 md:gap-6 text-xs md:text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-muted-foreground">Создано</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-muted-foreground">Решено</span>
                </div>
              </div>

              <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                <div className="relative h-48 md:h-64 flex items-end justify-between gap-1 md:gap-2 border-b border-border pb-2 min-w-[600px] md:min-w-0">
                <div className="absolute left-0 right-0 bottom-0 flex flex-col justify-between h-full pointer-events-none">
                  {[maxDaily, Math.floor(maxDaily * 0.75), Math.floor(maxDaily * 0.5), Math.floor(maxDaily * 0.25), 0].map((val, i) => (
                    <div key={i} className="flex items-center">
                      <span className="text-xs text-muted-foreground w-8">{val}</span>
                      <div className="flex-1 border-t border-border/30"></div>
                    </div>
                  ))}
                </div>

                {workdayStats.map((day, idx) => {
                  const createdHeight = (day.created_count / maxDaily) * 100;
                  const resolvedHeight = (day.resolved_count / maxDaily) * 100;
                  
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                      <div className="flex-1 w-full flex items-end justify-center gap-1">
                        <div className="relative group flex-1 max-w-[20px]">
                          <div 
                            className="bg-blue-500 rounded-t hover:bg-blue-400 transition-colors cursor-pointer"
                            style={{ height: `${createdHeight}%`, minHeight: day.created_count > 0 ? '4px' : '0' }}
                          />
                          {day.created_count > 0 && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              Создано: {day.created_count}
                            </div>
                          )}
                        </div>
                        
                        <div className="relative group flex-1 max-w-[20px]">
                          <div 
                            className="bg-green-500 rounded-t hover:bg-green-400 transition-colors cursor-pointer"
                            style={{ height: `${resolvedHeight}%`, minHeight: day.resolved_count > 0 ? '4px' : '0' }}
                          />
                          {day.resolved_count > 0 && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              Решено: {day.resolved_count}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] md:text-xs font-medium text-foreground">
                          {getDayName(day.date)}
                        </span>
                        <span className="text-[9px] md:text-xs text-muted-foreground hidden md:block">
                          {formatDate(day.date)}
                        </span>
                        {day.urgent_count > 0 && (
                          <span className="text-[9px] md:text-xs bg-red-500/20 text-red-400 px-1 rounded">
                            🔥{day.urgent_count}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
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