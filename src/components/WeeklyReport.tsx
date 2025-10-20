import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';

const API_URL = API_ENDPOINTS.WEEKLY_REPORT;

interface WeeklyReportData {
  period: {
    start: string;
    end: string;
  };
  tasks: {
    total: number;
    completed: number;
    in_progress: number;
    pending: number;
    overdue: number;
  };
  tickets: {
    total: number;
    resolved: number;
    in_progress: number;
    open: number;
  };
  top_managers: Array<{
    name: string;
    completed: number;
  }>;
}

export default function WeeklyReport() {
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const loadReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';

      const response = await fetch(API_URL, {
        headers: {
          'X-User-Id': userId,
          'X-Auth-Token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data);
      }
    } catch (error) {
      console.error('Failed to load report:', error);
      toast({ title: '❌ Ошибка загрузки отчёта', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendToTelegram = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Auth-Token': token
        },
        body: JSON.stringify({ send_to_telegram: true })
      });

      if (response.ok) {
        toast({ title: '✅ Отчёт отправлен в Telegram' });
      } else {
        toast({ title: '❌ Ошибка отправки', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка отправки', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Icon name="FileText" size={48} className="mx-auto mb-4 opacity-30" />
        <p>Нет данных для отчёта</p>
      </div>
    );
  }

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 p-3 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-2 md:gap-3">
          <Icon name="Calendar" size={24} className="text-primary md:hidden" />
          <Icon name="Calendar" size={32} className="text-primary hidden md:block" />
          <div>
            <h1 className="text-xl md:text-3xl font-bold">Еженедельный отчёт</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {formatDate(report.period.start)} - {formatDate(report.period.end)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadReport} variant="outline" size="sm" className="md:size-default">
            <Icon name="RefreshCw" size={16} className="md:mr-2" />
            <span className="hidden md:inline">Обновить</span>
          </Button>
          <Button onClick={sendToTelegram} disabled={sending} size="sm" className="md:size-default">
            <Icon name={sending ? "Loader2" : "Send"} size={16} className={`md:mr-2 ${sending ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Отправить в Telegram</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Задачи */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="CheckSquare" size={24} className="text-green-600" />
              Задачи
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Всего создано</span>
              <span className="font-bold text-lg">{report.tasks.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-600">✓ Выполнено</span>
              <span className="font-bold text-green-600">{report.tasks.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600">⟳ В работе</span>
              <span className="font-bold text-blue-600">{report.tasks.in_progress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-600">⏸ Ожидают</span>
              <span className="font-bold text-yellow-600">{report.tasks.pending}</span>
            </div>
            {report.tasks.overdue > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-red-600">⚠ Просрочено</span>
                <span className="font-bold text-red-600">{report.tasks.overdue}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Тикеты */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Ticket" size={24} className="text-blue-600" />
              Тикеты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Всего создано</span>
              <span className="font-bold text-lg">{report.tickets.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-600">✓ Решено</span>
              <span className="font-bold text-green-600">{report.tickets.resolved}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-600">⟳ В работе</span>
              <span className="font-bold text-blue-600">{report.tickets.in_progress}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-600">○ Открыто</span>
              <span className="font-bold text-yellow-600">{report.tickets.open}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Топ менеджеров */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Trophy" size={24} className="text-amber-500" />
            Топ менеджеров по выполненным задачам
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.top_managers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Нет данных</p>
          ) : (
            <div className="space-y-3">
              {report.top_managers.map((manager, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-amber-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium">{manager.name}</span>
                  </div>
                  <span className="font-bold text-primary">{manager.completed} задач</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Информация об автоотправке */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Icon name="Info" size={20} />
            Автоматическая отправка отчётов
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <p>
            💡 Настройте автоматическую отправку еженедельных отчётов в Telegram каждый понедельник в 9:00.
            <br />
            Отчёт будет автоматически отправляться директору с полной статистикой за прошедшую неделю.
          </p>
          <p className="mt-2 text-xs text-blue-600">
            Для настройки автоотправки обратитесь к администратору системы.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}