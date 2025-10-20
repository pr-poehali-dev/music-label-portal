import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Task } from '@/components/useTasks';
import { useEffect, useState } from 'react';

interface TaskDetailDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: (taskId: number, status: string) => Promise<boolean>;
  onDeleteTask?: (taskId: number) => Promise<boolean>;
  userRole: 'manager' | 'director';
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'destructive';
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'outline';
    default: return 'secondary';
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

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case 'urgent': return 'Срочный';
    case 'high': return 'Высокий';
    case 'medium': return 'Средний';
    case 'low': return 'Низкий';
    default: return priority;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed': return 'Выполнена';
    case 'in_progress': return 'В работе';
    case 'open': return 'Открыта';
    default: return status;
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

const getTimeRemaining = (deadline: string | null) => {
  if (!deadline) return null;
  
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - now.getTime();
  
  if (diff < 0) {
    const absDiff = Math.abs(diff);
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return { text: `Просрочено на ${days} дн.`, isOverdue: true };
    return { text: `Просрочено на ${hours} ч.`, isOverdue: true };
  }
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return { text: `Осталось ${days} дн. ${hours % 24} ч.`, isOverdue: false };
  if (hours > 0) return { text: `Осталось ${hours} ч. ${minutes} мин.`, isOverdue: false };
  return { text: `Осталось ${minutes} мин.`, isOverdue: false };
};

export default function TaskDetailDialog({ task, open, onOpenChange, onUpdateStatus, onDeleteTask, userRole }: TaskDetailDialogProps) {
  const handleUpdateStatus = async (taskId: number, status: string) => {
    if (onUpdateStatus) {
      return await onUpdateStatus(taskId, status);
    }
    return false;
  };
  const [timeRemaining, setTimeRemaining] = useState<{ text: string; isOverdue: boolean } | null>(null);

  useEffect(() => {
    if (!task?.deadline) return;
    
    const updateTimer = () => {
      setTimeRemaining(getTimeRemaining(task.deadline));
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    
    return () => clearInterval(interval);
  }, [task?.deadline]);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span>{task.title}</span>
            <Badge variant={getPriorityColor(task.priority)}>
              <Icon name={getPriorityIcon(task.priority)} size={12} className="mr-1" />
              {getPriorityLabel(task.priority)}
            </Badge>
            <Badge variant={getStatusColor(task.status)}>
              {getStatusLabel(task.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {task.description && (
            <div>
              <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {timeRemaining && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${timeRemaining.isOverdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              <Icon name={timeRemaining.isOverdue ? 'AlertTriangle' : 'Timer'} size={20} />
              <span className="font-semibold">{timeRemaining.text}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {task.creator_name && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Создал</div>
                <div className="flex items-center gap-2">
                  <Icon name="UserCircle" size={16} />
                  <span>{task.creator_name}</span>
                </div>
              </div>
            )}

            {task.assignee_name && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Исполнитель</div>
                <div className="flex items-center gap-2">
                  <Icon name="User" size={16} />
                  <span>{task.assignee_name}</span>
                </div>
              </div>
            )}

            {task.deadline && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Дедлайн</div>
                <div className="flex items-center gap-2">
                  <Icon name="Calendar" size={16} />
                  <span>{new Date(task.deadline).toLocaleString('ru-RU')}</span>
                </div>
              </div>
            )}

            {task.created_at && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Создана</div>
                <div className="flex items-center gap-2">
                  <Icon name="Clock" size={16} />
                  <span>{new Date(task.created_at).toLocaleString('ru-RU')}</span>
                </div>
              </div>
            )}

            {task.completed_at && (
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Завершена</div>
                <div className="flex items-center gap-2">
                  <Icon name="CheckCircle2" size={16} />
                  <span>{new Date(task.completed_at).toLocaleString('ru-RU')}</span>
                </div>
              </div>
            )}

            {task.ticket_id && task.ticket_title && (
              <div className="space-y-1 col-span-2">
                <div className="text-sm text-muted-foreground">Связанный тикет</div>
                <div className="flex items-center gap-2">
                  <Icon name="Ticket" size={16} />
                  <span>#{task.ticket_id}: {task.ticket_title}</span>
                </div>
              </div>
            )}
          </div>

          {task.attachment_url && (
            <div className="space-y-2">
              <div className="text-sm font-semibold">Вложение</div>
              <a
                href={task.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <Icon name="Paperclip" size={20} />
                <div className="flex-1">
                  <div className="font-medium">{task.attachment_name || 'Файл'}</div>
                  {task.attachment_size && (
                    <div className="text-sm text-muted-foreground">
                      {(task.attachment_size / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
                <Icon name="ExternalLink" size={16} className="text-muted-foreground" />
              </a>
            </div>
          )}

          {task.completion_report && (
            <div className="space-y-2">
              <div className="text-sm font-semibold">Отчёт о выполнении</div>
              <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-muted rounded-lg">
                {task.completion_report}
              </p>
            </div>
          )}

          {task.completion_attachment_url && (
            <div className="space-y-2">
              <div className="text-sm font-semibold">Вложение к отчёту</div>
              <a
                href={task.completion_attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <Icon name="Paperclip" size={20} />
                <div className="flex-1">
                  <div className="font-medium">{task.completion_attachment_name || 'Файл'}</div>
                  {task.completion_attachment_size && (
                    <div className="text-sm text-muted-foreground">
                      {(task.completion_attachment_size / 1024).toFixed(1)} KB
                    </div>
                  )}
                </div>
                <Icon name="ExternalLink" size={16} className="text-muted-foreground" />
              </a>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {onUpdateStatus && task.status !== 'completed' && (
              <>
                {task.status === 'open' && (
                  <Button
                    onClick={() => {
                      handleUpdateStatus(task.id, 'in_progress');
                      onOpenChange(false);
                    }}
                    className="flex-1"
                  >
                    <Icon name="Play" size={16} className="mr-2" />
                    Начать работу
                  </Button>
                )}
              </>
            )}
            
            {userRole === 'director' && onDeleteTask && (
              <Button
                variant="destructive"
                onClick={async () => {
                  console.log('Delete button clicked for task:', task.id);
                  await onDeleteTask(task.id);
                  onOpenChange(false);
                }}
              >
                <Icon name="Trash2" size={16} className="mr-2" />
                Удалить
              </Button>
            )}
            
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}