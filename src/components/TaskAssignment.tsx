import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import TaskForm from './tasks/TaskForm';
import TaskList from './tasks/TaskList';
import TaskEditDialog from './tasks/TaskEditDialog';
import {
  API_URL,
  UPLOAD_URL,
  getPriorityColor,
  getPriorityText,
  getStatusColor,
  getStatusText,
  uploadFile
} from './tasks/taskUtils';

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
        
        const uploaded = await uploadFile(selectedFile, UPLOAD_URL);
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Icon name="UserPlus" size={32} className="text-primary" />
        <h1 className="text-3xl font-bold">Назначить задачу менеджеру</h1>
      </div>
      
      <TaskForm
        newTask={newTask}
        managers={managers}
        selectedFile={selectedFile}
        uploading={uploading}
        onTaskChange={setNewTask}
        onFileChange={setSelectedFile}
        onSubmit={createTask}
        onToggleManager={(managerId) => toggleManager(managerId, false)}
      />

      <div className="flex items-center gap-3">
        <Icon name="ListChecks" size={32} className="text-primary" />
        <h2 className="text-2xl font-bold">Активные задачи ({tasks.length})</h2>
      </div>
      
      <TaskList
        tasks={tasks}
        onUpdateStatus={updateTaskStatus}
        onEdit={openEditDialog}
        onDelete={deleteTask}
        getPriorityColor={getPriorityColor}
        getPriorityText={getPriorityText}
        getStatusColor={getStatusColor}
        getStatusText={getStatusText}
      />

      <TaskEditDialog
        isOpen={isEditDialogOpen}
        editForm={editForm}
        managers={managers}
        onOpenChange={setIsEditDialogOpen}
        onFormChange={setEditForm}
        onSubmit={updateTask}
        onToggleManager={(managerId) => toggleManager(managerId, true)}
      />
    </div>
  );
}
