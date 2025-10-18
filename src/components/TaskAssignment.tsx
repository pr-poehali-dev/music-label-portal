import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
    assigned_to: [] as number[],
    deadline: '',
    priority: 'medium'
  });
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    assigned_to: [] as number[],
    deadline: '',
    priority: 'medium'
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
    if (!newTask.title || newTask.assigned_to.length === 0 || !newTask.deadline) {
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
        const count = newTask.assigned_to.length;
        toast({ title: `✅ Задача создана для ${count} ${count === 1 ? 'менеджера' : 'менеджеров'}` });
        setNewTask({ title: '', description: '', assigned_to: [], deadline: '', priority: 'medium' });
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

  const deleteTask = async (taskId: number) => {
    if (!confirm('Удалить эту задачу?')) return;
    
    try {
      const response = await fetch(API_URL, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'task', id: taskId })
      });

      if (response.ok) {
        toast({ title: '✅ Задача удалена' });
        loadTasks();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка удаления', variant: 'destructive' });
    }
  };

  const openEditDialog = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      assigned_to: [task.assigned_to],
      deadline: task.deadline.slice(0, 16),
      priority: task.priority
    });
    setIsEditDialogOpen(true);
  };

  const updateTask = async () => {
    if (!editForm.title || editForm.assigned_to.length === 0 || !editForm.deadline) {
      toast({ title: '❌ Заполните все обязательные поля', variant: 'destructive' });
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'task',
          id: editingTask?.id,
          ...editForm
        })
      });

      if (response.ok) {
        toast({ title: '✅ Задача обновлена' });
        setIsEditDialogOpen(false);
        setEditingTask(null);
        loadTasks();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка обновления', variant: 'destructive' });
    }
  };

  const toggleManager = (managerId: number, isEdit: boolean = false) => {
    if (isEdit) {
      setEditForm(prev => ({
        ...prev,
        assigned_to: prev.assigned_to.includes(managerId)
          ? prev.assigned_to.filter(id => id !== managerId)
          : [...prev.assigned_to, managerId]
      }));
    } else {
      setNewTask(prev => ({
        ...prev,
        assigned_to: prev.assigned_to.includes(managerId)
          ? prev.assigned_to.filter(id => id !== managerId)
          : [...prev.assigned_to, managerId]
      }));
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
              <label className="text-sm font-medium mb-1 block">Менеджеры * (можно выбрать несколько)</label>
              <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {managers.map((manager) => (
                  <div key={manager.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`manager-${manager.id}`}
                      checked={newTask.assigned_to.includes(manager.id)}
                      onCheckedChange={() => toggleManager(manager.id)}
                    />
                    <label
                      htmlFor={`manager-${manager.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {manager.full_name}
                    </label>
                  </div>
                ))}
              </div>
              {newTask.assigned_to.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Выбрано: {newTask.assigned_to.length}
                </p>
              )}
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

                  <div className="space-y-2 pt-2">
                    <div className="flex gap-2">
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(task)}
                        className="flex-1"
                      >
                        <Icon name="Edit" size={14} className="mr-1" />
                        Изменить
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteTask(task.id)}
                        className="flex-1"
                      >
                        <Icon name="Trash2" size={14} className="mr-1" />
                        Удалить
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать задачу</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Название задачи *</label>
              <Input
                placeholder="Проверить отчёты артистов"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Описание</label>
              <Textarea
                placeholder="Детали задачи..."
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Менеджеры * (можно выбрать несколько)</label>
              <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {managers.map((manager) => (
                  <div key={manager.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-manager-${manager.id}`}
                      checked={editForm.assigned_to.includes(manager.id)}
                      onCheckedChange={() => toggleManager(manager.id, true)}
                    />
                    <label
                      htmlFor={`edit-manager-${manager.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {manager.full_name}
                    </label>
                  </div>
                ))}
              </div>
              {editForm.assigned_to.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Выбрано: {editForm.assigned_to.length}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Дедлайн *</label>
                <Input
                  type="datetime-local"
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Приоритет</label>
                <Select value={editForm.priority} onValueChange={(value) => setEditForm({ ...editForm, priority: value })}>
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

            <div className="flex gap-2 pt-4">
              <Button onClick={updateTask} className="flex-1">
                <Icon name="Save" size={18} className="mr-2" />
                Сохранить изменения
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Отмена
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}