import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  full_name: string;
  role: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  assigned_to: number;
  assigned_name: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  created_by_name: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
}

interface TaskAssignmentProps {
  managers: User[];
  directorId: number;
}

const API_URL = 'https://functions.poehali.dev/cdcd7646-5a98-477f-8464-d1aa48319296';
const UPLOAD_URL = 'https://functions.poehali.dev/08bf9d4e-6ddc-4b6b-91a0-84187cbd89fa';

export default function TaskAssignment({ managers, directorId }: TaskAssignmentProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: '',
    deadline: '',
    priority: 'medium'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      const response = await fetch(`${API_URL}?type=tasks`);
      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const uploadFile = async (file: File) => {
    const reader = new FileReader();
    return new Promise<{url: string, name: string, size: number}>((resolve, reject) => {
      reader.onload = async () => {
        try {
          const response = await fetch(UPLOAD_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: reader.result,
              fileName: file.name,
              fileSize: file.size
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            resolve({ url: data.url, name: data.fileName, size: data.fileSize });
          } else {
            reject(new Error('Upload failed'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const createTask = async () => {
    if (!newTask.title || !newTask.assigned_to || !newTask.deadline) {
      toast({ title: '❌ Заполните все обязательные поля', variant: 'destructive' });
      return;
    }

    try {
      setUploading(true);
      let fileData = {};
      
      if (selectedFile) {
        if (selectedFile.size > 10 * 1024 * 1024) {
          toast({ title: '❌ Файл слишком большой', description: 'Максимум 10 МБ', variant: 'destructive' });
          setUploading(false);
          return;
        }
        
        const uploaded = await uploadFile(selectedFile);
        fileData = {
          attachment_url: uploaded.url,
          attachment_name: uploaded.name,
          attachment_size: uploaded.size
        };
      }
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          ...newTask,
          ...fileData,
          created_by: directorId
        })
      });

      if (response.ok) {
        toast({ title: '✅ Задача создана и назначена' });
        setNewTask({ title: '', description: '', assigned_to: '', deadline: '', priority: 'medium' });
        setSelectedFile(null);
        loadTasks();
      } else {
        const data = await response.json();
        toast({ title: '❌ Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка создания задачи', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
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
  }, []);

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
    const texts = {
      low: 'Низкий',
      medium: 'Средний',
      high: 'Высокий',
      urgent: 'Срочно'
    };
    return texts[priority as keyof typeof texts] || priority;
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Ожидает',
      in_progress: 'В работе',
      completed: 'Выполнено'
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Icon name="UserPlus" size={32} className="text-primary" />
        <h1 className="text-3xl font-bold">Назначить задачу менеджеру</h1>
      </div>
      
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <label className="text-sm font-medium mb-1 block">Название задачи *</label>
            <Input
              placeholder="Проверить отчёты артистов"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Описание</label>
            <Textarea
              placeholder="Детали задачи..."
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Прикрепить файл (необязательно, до 10 МБ)</label>
            <div className="relative">
              <Input
                type="file"
                id="file-upload"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="hidden"
                accept="*/*"
              />
              <label 
                htmlFor="file-upload"
                className="flex items-center justify-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent transition-colors"
              >
                <Icon name="Paperclip" size={18} className="text-primary" />
                <span className="text-sm">
                  {selectedFile ? selectedFile.name : 'Выбрать файл'}
                </span>
              </label>
            </div>
            {selectedFile && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Icon name="CheckCircle" size={12} />
                Файл выбран: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Менеджер *</label>
              <Select value={newTask.assigned_to} onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите менеджера" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={String(manager.id)}>
                      {manager.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Дедлайн *</label>
              <Input
                type="datetime-local"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Приоритет</label>
              <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Низкий</SelectItem>
                  <SelectItem value="medium">Средний</SelectItem>
                  <SelectItem value="high">Высокий</SelectItem>
                  <SelectItem value="urgent">Срочно</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={createTask}
            disabled={uploading}
            className="w-full"
          >
            <Icon name={uploading ? "Loader2" : "Send"} size={18} className={`mr-2 ${uploading ? 'animate-spin' : ''}`} />
            {uploading ? 'Загрузка...' : 'Назначить задачу'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Icon name="ListChecks" size={32} className="text-primary" />
        <h2 className="text-2xl font-bold">Активные задачи ({tasks.length})</h2>
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
              <Card key={task.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-lg">{task.title}</h3>
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
                      <span>{task.assigned_name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Icon name="Calendar" size={14} className="text-primary" />
                      <span>{new Date(task.deadline).toLocaleString('ru-RU')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {task.status !== 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        className="flex-1"
                      >
                        В работу
                      </Button>
                    )}
                    {task.status !== 'completed' && (
                      <Button
                        size="sm"
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                        className="flex-1"
                      >
                        Завершить
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