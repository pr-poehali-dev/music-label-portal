import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Task } from '@/components/useTasks';
import TaskDetailDialog from '@/components/TaskDetailDialog';

interface TasksTabProps {
  tasks: Task[];
  tickets: any[];
  managers: any[];
  onCreateTask: (task: any) => Promise<boolean>;
  onUpdateTaskStatus: (taskId: number, status: string) => Promise<boolean>;
  onDeleteTask: (taskId: number) => Promise<boolean>;
}

const TasksTab = React.memo(function TasksTab({
  tasks,
  tickets,
  managers,
  onCreateTask,
  onUpdateTaskStatus,
  onDeleteTask
}: TasksTabProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigned_to: null as number | null,
    deadline: '',
    ticket_id: null as number | null,
  });

  const handleCreateTask = async () => {
    const success = await onCreateTask(newTask);
    if (success) {
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: null,
        deadline: '',
        ticket_id: null,
      });
      setIsCreateDialogOpen(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'open': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Flame';
      case 'high': return 'AlertTriangle';
      case 'medium': return 'AlertCircle';
      case 'low': return 'Info';
      default: return 'AlertCircle';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'CheckCircle2';
      case 'in_progress': return 'Clock';
      case 'open': return 'Circle';
      default: return 'Circle';
    }
  };

  const openTickets = tickets.filter(t => t.status !== 'closed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Задачи менеджеров</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icon name="Plus" size={16} className="mr-2" />
              Создать задачу
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Новая задача</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Тикет</label>
                <Select
                  value={newTask.ticket_id?.toString() || ''}
                  onValueChange={(value) => setNewTask({ ...newTask, ticket_id: value ? parseInt(value) : null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тикет" />
                  </SelectTrigger>
                  <SelectContent>
                    {openTickets.map(ticket => (
                      <SelectItem key={ticket.id} value={ticket.id.toString()}>
                        #{ticket.id} {ticket.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Название задачи *</label>
                <Input
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Введите название"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Описание</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Введите описание задачи"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Приоритет</label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">🔥 Срочный</SelectItem>
                      <SelectItem value="high">⚠️ Высокий</SelectItem>
                      <SelectItem value="medium">📌 Средний</SelectItem>
                      <SelectItem value="low">📋 Низкий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Менеджер</label>
                  <Select
                    value={newTask.assigned_to?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, assigned_to: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите менеджера" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers.map(manager => (
                        <SelectItem key={manager.id} value={manager.id.toString()}>
                          {manager.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Дедлайн</label>
                <Input
                  type="datetime-local"
                  value={newTask.deadline}
                  onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={handleCreateTask} disabled={!newTask.title}>
                  Создать задачу
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {tasks.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Icon name="ListTodo" size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">Задач пока нет</p>
            <p className="text-sm mt-2">Создайте первую задачу для менеджеров</p>
          </Card>
        ) : (
          tasks.map(task => (
            <Card 
              key={task.id} 
              className="p-6 cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => {
                setSelectedTask(task);
                setIsDetailDialogOpen(true);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-semibold">#{task.id} {task.title}</h3>
                    <Badge variant={getPriorityColor(task.priority)}>
                      <Icon name={getPriorityIcon(task.priority)} size={12} className="mr-1" />
                      {task.priority}
                    </Badge>
                    <Badge variant={getStatusColor(task.status)}>
                      <Icon name={getStatusIcon(task.status)} size={12} className="mr-1" />
                      {task.status}
                    </Badge>
                  </div>

                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {task.ticket_id && task.ticket_title && (
                      <div className="flex items-center gap-1">
                        <Icon name="Ticket" size={14} />
                        <span>Тикет #{task.ticket_id}: {task.ticket_title}</span>
                      </div>
                    )}
                    {task.assignee_name && (
                      <div className="flex items-center gap-1">
                        <Icon name="User" size={14} />
                        <span>{task.assignee_name}</span>
                      </div>
                    )}
                    {task.deadline && (
                      <div className="flex items-center gap-1">
                        <Icon name="Calendar" size={14} />
                        <span>{new Date(task.deadline).toLocaleString('ru-RU')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {task.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTaskStatus(task.id, 'completed');
                      }}
                    >
                      <Icon name="Check" size={14} className="mr-1" />
                      Завершить
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                  >
                    <Icon name="Trash2" size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <TaskDetailDialog
        task={selectedTask}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        onUpdateStatus={onUpdateTaskStatus}
        onDeleteTask={onDeleteTask}
        userRole="director"
      />
    </div>
  );
});

export default TasksTab;