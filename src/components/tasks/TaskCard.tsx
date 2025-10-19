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

  const getPriorityIcon = (priority: string) => {
    switch(priority) {
      case 'urgent': return 'AlertTriangle';
      case 'high': return 'AlertCircle';
      case 'medium': return 'Circle';
      case 'low': return 'CircleDot';
      default: return 'Circle';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return 'CheckCircle';
      case 'in_progress': return 'Clock';
      case 'pending': return 'CircleDashed';
      default: return 'Circle';
    }
  };

  return (
    <Card className="border-border/50 hover:border-primary/40 cursor-pointer hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 bg-gradient-to-br from-black via-primary/5 to-black flex flex-col">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h4 className="font-bold text-base text-primary line-clamp-2 flex-1">{task.title}</h4>
          <Badge className={`gap-1 border ${getPriorityColor(task.priority)} flex-shrink-0`}>
            <Icon name={getPriorityIcon(task.priority)} size={12} />
            {getPriorityText(task.priority)}
          </Badge>
        </div>

        {task.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{task.description}</p>
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

        <div className="space-y-2 text-sm flex-1">
          {task.assigned_name && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Icon name="User" size={14} className="text-secondary flex-shrink-0" />
              <span className="font-medium text-foreground truncate">{task.assigned_name}</span>
            </p>
          )}

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon name="Calendar" size={12} className="text-primary" />
            {formattedDeadline}
          </p>

          <div className="flex items-center gap-2">
            <Badge className={`gap-1 border ${getStatusColor(task.status)}`}>
              <Icon name={getStatusIcon(task.status)} size={12} />
              {getStatusText(task.status)}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
          {task.status !== 'completed' && (
            <>
              {task.status !== 'in_progress' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStatus();
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Icon name="Play" size={14} />
                  В работу
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete();
                }}
                className="flex-1 inline-flex items-center justify-center gap-1 text-xs font-medium text-green-400 hover:text-green-300 transition-colors"
              >
                <Icon name="CheckCircle" size={14} />
                Завершить
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="Edit" size={14} />
            Изменить
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 transition-colors ml-auto"
          >
            <Icon name="Trash2" size={14} />
            Удалить
          </button>
        </div>
      </CardContent>
    </Card>
  );
}