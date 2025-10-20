import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';

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

const API_URL = API_ENDPOINTS.TICKETS;

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
      const savedUser = localStorage.getItem('user');
      let changed_by = userId;
      let changed_by_name = 'Менеджер';
      
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        changed_by = userData.id;
        changed_by_name = userData.full_name;
      }
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'task', 
          id: taskId, 
          status,
          changed_by,
          changed_by_name
        })
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
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Icon name="ClipboardList" size={32} className="text-primary" />
        <h1 className="text-3xl font-bold">Мои задачи ({tasks.length})</h1>
        {unreadCount > 0 && (
          <Badge className="bg-red-500 text-white">
            {unreadCount} новых
          </Badge>
        )}
      </div>

      <div>
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">Нет назначенных задач</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <Card 
                key={task.id} 
                className={!task.is_read ? 'ring-2 ring-primary/50' : ''}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {!task.is_read && (
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        )}
                        <h3 className="font-semibold text-lg">{task.title}</h3>
                      </div>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {getPriorityText(task.priority)}
                    </Badge>
                  </div>

                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}

                  {task.attachment_url && (
                    <a 
                      href={task.attachment_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Icon name="Paperclip" size={14} />
                      {task.attachment_name} ({(task.attachment_size! / 1024 / 1024).toFixed(2)} МБ)
                    </a>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon name="User" size={14} className="text-primary" />
                      <span>От: {task.created_by_name}</span>
                    </div>

                    <div className={`flex items-center gap-2 ${isOverdue(task.deadline) && task.status !== 'completed' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      <Icon name="Calendar" size={14} className="text-primary" />
                      <span>
                        {new Date(task.deadline).toLocaleString('ru-RU')}
                        {isOverdue(task.deadline) && task.status !== 'completed' && ' ⚠️ Просрочено'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon name="Clock" size={12} />
                      Получено: {new Date(task.created_at).toLocaleString('ru-RU')}
                    </div>

                    {task.completed_at && (
                      <div className="flex items-center gap-2 text-xs text-green-500">
                        <Icon name="CheckCircle" size={12} />
                        Завершено: {new Date(task.completed_at).toLocaleString('ru-RU')}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t">
                    {!task.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(task.id)}
                        className="w-full"
                      >
                        <Icon name="Eye" size={14} className="mr-1" />
                        Отметить прочитанным
                      </Button>
                    )}
                    
                    {task.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(task.id, 'in_progress')}
                        className="w-full"
                      >
                        <Icon name="Play" size={14} className="mr-1" />
                        Взять в работу
                      </Button>
                    )}
                    
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(task.id, 'completed')}
                        className="w-full"
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
      </div>
    </div>
  );
}