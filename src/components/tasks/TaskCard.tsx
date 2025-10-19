import { useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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
  // Memoize formatted date to avoid re-computation
  const formattedDeadline = useMemo(() => 
    new Date(task.deadline).toLocaleString('ru-RU'),
    [task.deadline]
  );

  // Memoize callbacks
  const handleUpdateStatus = useCallback(() => {
    onUpdateStatus(task.id, 'in_progress');
  }, [onUpdateStatus, task.id]);

  const handleComplete = useCallback(() => {
    onComplete(task.id);
  }, [onComplete, task.id]);

  const handleEdit = useCallback(() => {
    onEdit(task);
  }, [onEdit, task]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [onDelete, task.id]);

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-base sm:text-lg flex-1 min-w-0 break-words">{task.title}</h3>
          <Badge className={`${getPriorityColor(task.priority)} text-xs flex-shrink-0`}>
            {getPriorityText(task.priority)}
          </Badge>
        </div>

        {task.description && (
          <p className="text-xs sm:text-sm text-muted-foreground break-words">{task.description}</p>
        )}

        {task.completion_report && (
          <div className="border-l-4 border-green-500 bg-green-500/10 p-2 sm:p-3 rounded space-y-2">
            <p className="text-xs font-semibold text-green-600 mb-1">Итоги выполнения:</p>
            <p className="text-xs sm:text-sm text-muted-foreground break-words">{task.completion_report}</p>
            {task.completion_attachment_url && (
              <a 
                href={task.completion_attachment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs sm:text-sm text-green-600 md:hover:text-green-700 transition-colors active:text-green-700 min-h-[44px] sm:min-h-0"
              >
                <Icon name="FileText" size={14} className="flex-shrink-0" />
                <span className="font-medium truncate">{task.completion_attachment_name}</span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  ({(task.completion_attachment_size! / 1024 / 1024).toFixed(2)} МБ)
                </span>
              </a>
            )}
          </div>
        )}

        {task.attachment_url && (
          <a 
            href={task.attachment_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs sm:text-sm text-blue-500 md:hover:text-blue-600 transition-colors active:text-blue-600 min-h-[44px] sm:min-h-0 break-all"
          >
            <Icon name="Paperclip" size={14} className="flex-shrink-0" />
            <span className="truncate">{task.attachment_name}</span>
            <span className="flex-shrink-0">({(task.attachment_size! / 1024 / 1024).toFixed(2)} МБ)</span>
          </a>
        )}

        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          {task.assigned_name && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Icon name="User" size={14} className="text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">Менеджер:</span>
              <span className="text-muted-foreground truncate">{task.assigned_name}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
            <Icon name="Calendar" size={14} className="text-primary flex-shrink-0" />
            <span className="break-all">{formattedDeadline}</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(task.status)} text-xs`}>
              {getStatusText(task.status)}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 pt-2 mt-auto">
          <div className="flex gap-2">
            {task.status !== 'in_progress' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleUpdateStatus}
                className="flex-1 min-h-[44px] text-xs sm:text-sm"
              >
                В работу
              </Button>
            )}
            {task.status !== 'completed' && (
              <Button
                size="sm"
                onClick={handleComplete}
                className="flex-1 min-h-[44px] text-xs sm:text-sm"
              >
                Завершить
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleEdit}
              className="flex-1 min-h-[44px] text-xs sm:text-sm"
            >
              <Icon name="Edit" size={12} className="mr-1" />
              Изменить
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              className="flex-1 min-h-[44px] text-xs sm:text-sm"
            >
              <Icon name="Trash2" size={12} className="mr-1" />
              Удалить
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}