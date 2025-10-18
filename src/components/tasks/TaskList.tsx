import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import TaskCard from './TaskCard';

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
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Icon name="Inbox" size={48} className="mx-auto mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">Нет назначенных задач</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onUpdateStatus={onUpdateStatus}
          onComplete={onComplete}
          onEdit={onEdit}
          onDelete={onDelete}
          getPriorityColor={getPriorityColor}
          getPriorityText={getPriorityText}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      ))}
    </div>
  );
}