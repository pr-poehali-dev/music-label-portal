import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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
}

interface TaskCardProps {
  task: Task;
  onUpdateStatus: (taskId: number, status: string) => void;
  onComplete: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityText: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export default function TaskCard({
  task,
  onUpdateStatus,
  onComplete,
  onEdit,
  onDelete,
  getPriorityColor,
  getPriorityText,
  getStatusColor,
  getStatusText
}: TaskCardProps) {
  return (
    <Card>
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

        {task.completion_report && (
          <div className="border-l-4 border-green-500 bg-green-500/10 p-3 rounded">
            <p className="text-xs font-semibold text-green-600 mb-1">Итоги выполнения:</p>
            <p className="text-sm text-muted-foreground">{task.completion_report}</p>
          </div>
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
                onClick={() => onUpdateStatus(task.id, 'in_progress')}
                className="flex-1"
              >
                В работу
              </Button>
            )}
            {task.status !== 'completed' && (
              <Button
                size="sm"
                onClick={() => onComplete(task.id)}
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
              onClick={() => onEdit(task)}
              className="flex-1"
            >
              <Icon name="Edit" size={14} className="mr-1" />
              Изменить
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(task.id)}
              className="flex-1"
            >
              <Icon name="Trash2" size={14} className="mr-1" />
              Удалить
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}