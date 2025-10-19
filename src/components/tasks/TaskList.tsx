import { useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import TaskCard from './TaskCard';

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

interface TaskListProps {
  tasks: Task[];
  onUpdateStatus: (taskId: number, status: string) => void;
  onComplete: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityText: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export default function TaskList({
  tasks,
  onUpdateStatus,
  onComplete,
  onEdit,
  onDelete,
  getPriorityColor,
  getPriorityText,
  getStatusColor,
  getStatusText
}: TaskListProps) {
  // Memoize callbacks to prevent unnecessary re-renders
  const handleUpdateStatus = useCallback((taskId: number, status: string) => {
    onUpdateStatus(taskId, status);
  }, [onUpdateStatus]);

  const handleComplete = useCallback((taskId: number) => {
    onComplete(taskId);
  }, [onComplete]);

  const handleEdit = useCallback((task: Task) => {
    onEdit(task);
  }, [onEdit]);

  const handleDelete = useCallback((taskId: number) => {
    onDelete(taskId);
  }, [onDelete]);

  // Memoize empty state to avoid re-creation
  const emptyState = useMemo(() => (
    <Card>
      <CardContent className="text-center py-8 sm:py-12 px-4">
        <Icon name="Inbox" size={40} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50 text-muted-foreground" />
        <p className="text-sm sm:text-base text-muted-foreground">Нет назначенных задач</p>
      </CardContent>
    </Card>
  ), []);

  if (tasks.length === 0) {
    return emptyState;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onUpdateStatus={handleUpdateStatus}
          onComplete={handleComplete}
          onEdit={handleEdit}
          onDelete={handleDelete}
          getPriorityColor={getPriorityColor}
          getPriorityText={getPriorityText}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      ))}
    </div>
  );
}