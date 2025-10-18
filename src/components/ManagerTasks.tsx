import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: number;
  title: string;
  description: string;
  assigned_to: number;
  assigned_name: string;
  created_by_name: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  completed_at?: string;
  is_read: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
}

interface ManagerTasksProps {
  userId: number;
}

const API_URL = 'https://functions.poehali.dev/cdcd7646-5a98-477f-8464-d1aa48319296';

export default function ManagerTasks({ userId }: ManagerTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      const response = await fetch(`${API_URL}?type=tasks&user_id=${userId}`);
      const data = await response.json();
      const loadedTasks = data.tasks || [];
      setTasks(loadedTasks);
      setUnreadCount(loadedTasks.filter((t: Task) => !t.is_read).length);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const markAsRead = async (taskId: number) => {
    try {
      await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'task', id: taskId, is_read: true })
      });
      loadTasks();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const updateStatus = async (taskId: number, status: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'task', id: taskId, status })
      });

      if (response.ok) {
        toast({ title: '✅ Статус обновлён' });
        loadTasks();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка обновления', variant: 'destructive' });
    }
  };

  useEffect(() => {
    loadTasks();
    const interval = setInterval(loadTasks, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      urgent: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-500/20';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-500/20 text-gray-400',
      in_progress: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-green-500/20 text-green-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/20';
  };

  const getPriorityText = (priority: string) => {
    const texts = { low: 'Низкий', medium: 'Средний', high: 'Высокий', urgent: 'Срочно' };
    return texts[priority as keyof typeof texts] || priority;
  };

  const getStatusText = (status: string) => {
    const texts = { pending: 'Ожидает', in_progress: 'В работе', completed: 'Выполнено' };
    return texts[status as keyof typeof texts] || status;
  };

  const isOverdue = (deadline: string) => new Date(deadline) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-yellow-900/20 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-yellow-400 flex items-center gap-2">
                <Icon name="ClipboardList" size={24} />
                Мои задачи ({tasks.length})
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white ml-2">
                    {unreadCount} новых
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50" />
                <p>Нет назначенных задач</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <Card 
                    key={task.id} 
                    className={`bg-black/60 border-yellow-500/20 ${!task.is_read ? 'ring-2 ring-yellow-500/50' : ''}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {!task.is_read && (
                              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                            )}
                            <h3 className="font-semibold text-white text-lg">{task.title}</h3>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {getPriorityText(task.priority)}
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-300">{task.description}</p>
                      )}

                      {task.attachment_url && (
                        <a 
                          href={task.attachment_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Icon name="Paperclip" size={14} />
                          {task.attachment_name} ({(task.attachment_size! / 1024 / 1024).toFixed(2)} МБ)
                        </a>
                      )}

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Icon name="User" size={14} className="text-yellow-400" />
                          <span>От: {task.created_by_name}</span>
                        </div>

                        <div className={`flex items-center gap-2 ${isOverdue(task.deadline) && task.status !== 'completed' ? 'text-red-400' : 'text-gray-400'}`}>
                          <Icon name="Calendar" size={14} className="text-yellow-400" />
                          <span>
                            {new Date(task.deadline).toLocaleString('ru-RU')}
                            {isOverdue(task.deadline) && task.status !== 'completed' && ' ⚠️ Просрочено'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Icon name="Clock" size={12} />
                          Получено: {new Date(task.created_at).toLocaleString('ru-RU')}
                        </div>

                        {task.completed_at && (
                          <div className="flex items-center gap-2 text-xs text-green-400">
                            <Icon name="CheckCircle" size={12} />
                            Завершено: {new Date(task.completed_at).toLocaleString('ru-RU')}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Icon name="Activity" size={14} className="text-yellow-400" />
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 border-t border-yellow-500/10">
                        {!task.is_read && (
                          <Button
                            size="sm"
                            onClick={() => markAsRead(task.id)}
                            className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30"
                          >
                            <Icon name="Eye" size={14} className="mr-1" />
                            Отметить прочитанным
                          </Button>
                        )}
                        
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(task.id, 'in_progress')}
                            className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30"
                          >
                            <Icon name="Play" size={14} className="mr-1" />
                            Взять в работу
                          </Button>
                        )}
                        
                        {task.status !== 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(task.id, 'completed')}
                            className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/30"
                          >
                            <Icon name="CheckCircle" size={14} className="mr-1" />
                            Завершить задачу
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}