import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: number;
  assigned_to: number;
  assigned_name: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  completed_at?: string;
  deadline: string;
}

interface ManagerStats {
  manager_id: number;
  manager_name: string;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  pending_tasks: number;
  overdue_tasks: number;
  avg_completion_time: number;
  on_time_completion_rate: number;
}

interface DailyStats {
  date: string;
  created: number;
  completed: number;
  in_progress: number;
}

const API_URL = 'https://functions.poehali.dev/cdcd7646-5a98-477f-8464-d1aa48319296';

export default function TaskAnalyticsDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [managerStats, setManagerStats] = useState<ManagerStats[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${API_URL}?type=tasks&include_all=true`);
      const data = await response.json();
      const allTasks = data.tasks || [];
      setTasks(allTasks);
      
      calculateManagerStats(allTasks);
      calculateDailyStats(allTasks);
    } catch (error) {
      toast({ title: '❌ Ошибка загрузки аналитики', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const calculateManagerStats = (allTasks: Task[]) => {
    const managers = new Map<number, ManagerStats>();
    
    allTasks.forEach(task => {
      if (!task.assigned_to) return;
      
      if (!managers.has(task.assigned_to)) {
        managers.set(task.assigned_to, {
          manager_id: task.assigned_to,
          manager_name: task.assigned_name,
          total_tasks: 0,
          completed_tasks: 0,
          in_progress_tasks: 0,
          pending_tasks: 0,
          overdue_tasks: 0,
          avg_completion_time: 0,
          on_time_completion_rate: 0
        });
      }
      
      const stats = managers.get(task.assigned_to)!;
      stats.total_tasks++;
      
      if (task.status === 'completed') {
        stats.completed_tasks++;
        
        if (task.completed_at) {
          const completedDate = new Date(task.completed_at);
          const deadlineDate = new Date(task.deadline);
          if (completedDate <= deadlineDate) {
            stats.on_time_completion_rate++;
          }
        }
      } else if (task.status === 'in_progress') {
        stats.in_progress_tasks++;
      } else if (task.status === 'pending') {
        stats.pending_tasks++;
      }
      
      if (new Date(task.deadline) < new Date() && task.status !== 'completed') {
        stats.overdue_tasks++;
      }
    });
    
    managers.forEach(stats => {
      if (stats.completed_tasks > 0) {
        stats.on_time_completion_rate = Math.round((stats.on_time_completion_rate / stats.completed_tasks) * 100);
      }
    });
    
    setManagerStats(Array.from(managers.values()).sort((a, b) => b.completed_tasks - a.completed_tasks));
  };

  const calculateDailyStats = (allTasks: Task[]) => {
    const daily = new Map<string, DailyStats>();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    last7Days.forEach(date => {
      daily.set(date, { date, created: 0, completed: 0, in_progress: 0 });
    });
    
    allTasks.forEach(task => {
      const createdDate = task.created_at.split('T')[0];
      if (daily.has(createdDate)) {
        const stats = daily.get(createdDate)!;
        stats.created++;
      }
      
      if (task.completed_at) {
        const completedDate = task.completed_at.split('T')[0];
        if (daily.has(completedDate)) {
          daily.get(completedDate)!.completed++;
        }
      }
      
      if (task.status === 'in_progress') {
        const today = new Date().toISOString().split('T')[0];
        if (daily.has(today)) {
          daily.get(today)!.in_progress++;
        }
      }
    });
    
    setDailyStats(Array.from(daily.values()));
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'completed').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Icon name="Loader2" size={32} className="animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Всего задач</p>
                <p className="text-3xl font-bold text-white">{totalTasks}</p>
              </div>
              <Icon name="ListTodo" size={40} className="text-yellow-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-green-500/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Завершено</p>
                <p className="text-3xl font-bold text-green-400">{completedTasks}</p>
                <p className="text-xs text-gray-500">{completionRate}% от всех</p>
              </div>
              <Icon name="CheckCircle" size={40} className="text-green-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-blue-500/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">В работе</p>
                <p className="text-3xl font-bold text-blue-400">{inProgressTasks}</p>
              </div>
              <Icon name="Play" size={40} className="text-blue-400 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-red-500/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Просрочено</p>
                <p className="text-3xl font-bold text-red-400">{overdueTasks}</p>
              </div>
              <Icon name="AlertCircle" size={40} className="text-red-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <Icon name="TrendingUp" size={24} />
            Статистика за последние 7 дней
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailyStats.map(day => {
              const maxValue = Math.max(...dailyStats.map(d => Math.max(d.created, d.completed)));
              const createdWidth = maxValue > 0 ? (day.created / maxValue) * 100 : 0;
              const completedWidth = maxValue > 0 ? (day.completed / maxValue) * 100 : 0;
              
              return (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</span>
                    <div className="flex gap-4 text-xs">
                      <span className="text-blue-400">Создано: {day.created}</span>
                      <span className="text-green-400">Завершено: {day.completed}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <div 
                      className="h-6 bg-blue-500/30 border border-blue-500/50 rounded transition-all"
                      style={{ width: `${createdWidth}%` }}
                    />
                    <div 
                      className="h-6 bg-green-500/30 border border-green-500/50 rounded transition-all"
                      style={{ width: `${completedWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-yellow-400 flex items-center gap-2">
            <Icon name="Users" size={24} />
            Рейтинг менеджеров
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {managerStats.map((manager, index) => (
              <div key={manager.manager_id} className="bg-black/60 border border-yellow-500/20 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{manager.manager_name}</p>
                      <p className="text-xs text-gray-400">{manager.total_tasks} задач всего</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">{manager.on_time_completion_rate}%</p>
                    <p className="text-xs text-gray-400">в срок</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                    <p className="text-green-400 font-bold">{manager.completed_tasks}</p>
                    <p className="text-xs text-gray-400">Готово</p>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
                    <p className="text-blue-400 font-bold">{manager.in_progress_tasks}</p>
                    <p className="text-xs text-gray-400">В работе</p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                    <p className="text-yellow-400 font-bold">{manager.pending_tasks}</p>
                    <p className="text-xs text-gray-400">Ожидают</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                    <p className="text-red-400 font-bold">{manager.overdue_tasks}</p>
                    <p className="text-xs text-gray-400">Просрочено</p>
                  </div>
                </div>
                
                <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                    style={{ width: `${manager.total_tasks > 0 ? (manager.completed_tasks / manager.total_tasks) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            
            {managerStats.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <Icon name="Users" size={48} className="mx-auto mb-2 opacity-30" />
                <p>Нет данных по менеджерам</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
