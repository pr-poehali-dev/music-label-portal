import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import TaskForm from './tasks/TaskForm';
import TaskList from './tasks/TaskList';
import TaskEditDialog from './tasks/TaskEditDialog';
import TaskCompletionDialog from './tasks/TaskCompletionDialog';
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
  assigned_name?: string;
  assignee_name?: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  created_by_name?: string;
  creator_name?: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_size?: number;
  completion_report?: string;
  completion_attachment_url?: string;
  completion_attachment_name?: string;
  completion_attachment_size?: number;
}

interface TaskAssignmentProps {
  managers: User[];
  tickets: any[];
  onAssignTicket: any;
  onLoadTickets: any;
}

export default function TaskAssignment({ managers }: TaskAssignmentProps) {
  const directorId = 1; // Hardcoded for now
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'in_progress' | 'completed'>('create');
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
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<number | null>(null);
  const [completionReport, setCompletionReport] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      const response = await fetch(API_URL, {
        headers: {
          'X-User-Id': userId,
          'X-Auth-Token': token
        }
      });
      const data = await response.json();
      console.log('Raw tasks from backend:', data.tasks);
      const normalizedTasks = (data.tasks || []).map((task: any) => ({
        ...task,
        assigned_name: task.assignee_name || task.assigned_name,
        created_by_name: task.creator_name || task.created_by_name
      }));
      console.log('Normalized tasks:', normalizedTasks);
      setTasks(normalizedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const createTask = async () => {
    if (!newTask.title) {
      toast({ title: '❌ Заполните название задачи', variant: 'destructive' });
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
      
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      // Создаём задачу для каждого выбранного менеджера
      const count = newTask.assigned_to.length || 0;
      let successCount = 0;
      
      if (count === 0) {
        // Создаём задачу без назначения
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
            'X-Auth-Token': token
          },
          body: JSON.stringify({
            title: newTask.title,
            description: newTask.description,
            priority: newTask.priority,
            deadline: newTask.deadline || null,
            assigned_to: null,
            ticket_id: null
          })
        });
        
        if (response.ok) {
          successCount = 1;
        } else {
          const errorData = await response.json();
          console.error('Error creating task:', errorData);
        }
      } else {
        // Создаём задачу для каждого менеджера
        for (const managerId of newTask.assigned_to) {
          try {
            const response = await fetch(API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId,
                'X-Auth-Token': token
              },
              body: JSON.stringify({
                title: newTask.title,
                description: newTask.description,
                priority: newTask.priority,
                deadline: newTask.deadline || null,
                assigned_to: managerId,
                ticket_id: null
              })
            });
            
            if (response.ok) {
              successCount++;
              
              // Отправка уведомления менеджеру
              if (newTask.deadline) {
                try {
                  await fetch('https://functions.poehali.dev/9e9a7f27-c25d-45a8-aa64-3dd7fef5ffb7', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      sender_id: parseInt(userId),
                      receiver_id: managerId,
                      message: `📋 Новая задача: "${newTask.title}"\n\n${newTask.description}${newTask.deadline ? `\n\nСрок: ${new Date(newTask.deadline).toLocaleDateString('ru-RU')}` : ''}\nПриоритет: ${newTask.priority === 'low' ? 'Низкий' : newTask.priority === 'medium' ? 'Средний' : newTask.priority === 'high' ? 'Высокий' : 'Срочный'}`,
                      is_from_boss: true
                    })
                  });
                } catch (error) {
                  console.error('Failed to send notification:', error);
                }
              }
            } else {
              const errorData = await response.json();
              console.error('Error creating task for manager:', managerId, errorData);
            }
          } catch (error) {
            console.error('Failed to create task for manager:', managerId, error);
          }
        }
      }
      
      if (successCount > 0) {
        toast({ title: `✅ Создано задач: ${successCount}${count > 0 ? ` для ${count} ${count === 1 ? 'менеджера' : 'менеджеров'}` : ''}` });
        setNewTask({ title: '', description: '', assigned_to: [], deadline: '', priority: 'medium' });
        setSelectedFile(null);
        loadTasks();
      } else {
        toast({ title: '❌ Не удалось создать задачу', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка создания задачи', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      const token = localStorage.getItem('auth_token') || 'director-token';
      const userId = localStorage.getItem('user_id') || '1';
      
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
          'X-Auth-Token': token
        },
        body: JSON.stringify({ task_id: taskId, status })
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

  const openCompletionDialog = (taskId: number) => {
    setCompletingTaskId(taskId);
    setCompletionReport('');
    setIsCompletionDialogOpen(true);
  };

  const completeTask = async (attachmentData?: { url: string; name: string; size: number }) => {
    if (!completionReport.trim()) {
      toast({ title: '❌ Опишите итоги выполнения', variant: 'destructive' });
      return;
    }

    try {
      const body: any = { 
        type: 'task', 
        id: completingTaskId, 
        status: 'completed',
        completion_report: completionReport
      };

      if (attachmentData) {
        body.completion_attachment_url = attachmentData.url;
        body.completion_attachment_name = attachmentData.name;
        body.completion_attachment_size = attachmentData.size;
      }

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast({ title: '✅ Задача завершена' });
        setIsCompletionDialogOpen(false);
        setCompletingTaskId(null);
        setCompletionReport('');
        loadTasks();
      }
    } catch (error) {
      toast({ title: '❌ Ошибка завершения', variant: 'destructive' });
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

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Icon name="ListChecks" size={32} className="text-primary" />
        <h1 className="text-3xl font-bold">Задачи</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'create'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Создать задачу
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'in_progress'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          В работе ({pendingTasks.length + inProgressTasks.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'completed'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Выполненные ({completedTasks.length})
        </button>
      </div>

      {/* Create Task Tab */}
      {activeTab === 'create' && (
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
      )}

      {/* In Progress Tab */}
      {activeTab === 'in_progress' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">В работе ({pendingTasks.length + inProgressTasks.length})</h2>
          <TaskList
            tasks={[...pendingTasks, ...inProgressTasks]}
            onUpdateStatus={updateTaskStatus}
            onComplete={openCompletionDialog}
            onEdit={openEditDialog}
            onDelete={deleteTask}
            getPriorityColor={getPriorityColor}
            getPriorityText={getPriorityText}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        </div>
      )}

      {/* Completed Tab */}
      {activeTab === 'completed' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Выполненные ({completedTasks.length})</h2>
          <TaskList
            tasks={completedTasks}
            onUpdateStatus={updateTaskStatus}
            onComplete={openCompletionDialog}
            onEdit={openEditDialog}
            onDelete={deleteTask}
            getPriorityColor={getPriorityColor}
            getPriorityText={getPriorityText}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        </div>
      )}

      <TaskEditDialog
        isOpen={isEditDialogOpen}
        editForm={editForm}
        managers={managers}
        onOpenChange={setIsEditDialogOpen}
        onFormChange={setEditForm}
        onSubmit={updateTask}
        onToggleManager={(managerId) => toggleManager(managerId, true)}
      />

      <TaskCompletionDialog
        isOpen={isCompletionDialogOpen}
        completionReport={completionReport}
        onOpenChange={setIsCompletionDialogOpen}
        onReportChange={setCompletionReport}
        onSubmit={completeTask}
      />
    </div>
  );
}