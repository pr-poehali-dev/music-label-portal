import { useState } from 'react';
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
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-yellow-900/20 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Icon name="UserPlus" size={24} />
              Назначить задачу менеджеру
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Название задачи *</label>
              <Input
                placeholder="Проверить отчёты артистов"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="bg-black/60 border-yellow-500/30"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Описание</label>
              <Textarea
                placeholder="Детали задачи..."
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="bg-black/60 border-yellow-500/30 min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Прикрепить файл (необязательно, до 10 МБ)</label>
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
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-black/60 border border-yellow-500/30 rounded-md cursor-pointer hover:bg-yellow-500/10 transition-colors"
                >
                  <Icon name="Paperclip" size={18} className="text-yellow-400" />
                  <span className="text-sm text-gray-300">
                    {selectedFile ? selectedFile.name : 'Выбрать файл'}
                  </span>
                </label>
              </div>
              {selectedFile && (
                <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                  <Icon name="CheckCircle" size={12} />
                  Файл выбран: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Менеджер *</label>
                <Select value={newTask.assigned_to} onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value })}>
                  <SelectTrigger className="bg-black/60 border-yellow-500/30">
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
                <label className="text-sm text-gray-400 mb-1 block">Дедлайн *</label>
                <Input
                  type="datetime-local"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                  className="bg-black/60 border-yellow-500/30"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Приоритет</label>
                <Select value={newTask.priority} onValueChange={(value) => setNewTask({ ...newTask, priority: value })}>
                  <SelectTrigger className="bg-black/60 border-yellow-500/30">
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
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold hover:shadow-lg hover:shadow-yellow-500/50 disabled:opacity-50"
            >
              <Icon name={uploading ? "Loader2" : "Send"} size={18} className={`mr-2 ${uploading ? 'animate-spin' : ''}`} />
              {uploading ? 'Загрузка...' : 'Назначить задачу'}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-yellow-400 flex items-center gap-2">
              <Icon name="ListChecks" size={24} />
              Активные задачи ({tasks.length})
            </CardTitle>
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
                  <Card key={task.id} className="bg-black/60 border-yellow-500/20">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-white text-lg">{task.title}</h3>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
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
                          <span>{task.assigned_name}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400">
                          <Icon name="Calendar" size={14} className="text-yellow-400" />
                          <span>{new Date(task.deadline).toLocaleString('ru-RU')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Icon name="Activity" size={14} className="text-yellow-400" />
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(task.status)}`}>
                            {getStatusText(task.status)}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {task.status !== 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, 'in_progress')}
                            className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30"
                          >
                            В работу
                          </Button>
                        )}
                        {task.status !== 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => updateTaskStatus(task.id, 'completed')}
                            className="flex-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}