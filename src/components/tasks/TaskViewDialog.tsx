import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  status: 'pending' | 'in_progress' | 'completed' | 'deleted';
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
  archived_at?: string | null;
}

interface TaskViewDialogProps {
  task: Task | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityText: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export default function TaskViewDialog({
  task,
  isOpen,
  onOpenChange,
  getPriorityColor,
  getPriorityText,
  getStatusColor,
  getStatusText
}: TaskViewDialogProps) {
  if (!task) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Eye" size={20} />
            Просмотр задачи
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Заголовок */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Название</label>
            <p className="text-lg font-semibold mt-1">{task.title}</p>
          </div>

          {/* Статус и приоритет */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">Статус</label>
              <Badge className={`mt-1 ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </Badge>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">Приоритет</label>
              <Badge className={`mt-1 ${getPriorityColor(task.priority)}`}>
                {getPriorityText(task.priority)}
              </Badge>
            </div>
          </div>

          {/* Описание */}
          {task.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Описание</label>
              <p className="mt-1 text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Исполнитель */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Исполнитель</label>
            <p className="mt-1">{task.assignee_name || task.assigned_name || 'Не назначен'}</p>
          </div>

          {/* Создатель */}
          {task.creator_name && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Создатель</label>
              <p className="mt-1">{task.creator_name}</p>
            </div>
          )}

          {/* Дедлайн */}
          {task.deadline && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Дедлайн</label>
              <p className="mt-1">{formatDate(task.deadline)}</p>
            </div>
          )}

          {/* Дата создания */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Создана</label>
            <p className="mt-1 text-sm">{formatDate(task.created_at)}</p>
          </div>

          {/* Дата завершения */}
          {task.completion_report && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Отчёт о выполнении</label>
              <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{task.completion_report}</p>
            </div>
          )}

          {/* Вложение */}
          {task.attachment_url && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Вложение</label>
              <a
                href={task.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <Icon name="Paperclip" size={16} />
                <span className="text-sm">{task.attachment_name}</span>
                {task.attachment_size && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatFileSize(task.attachment_size)}
                  </span>
                )}
              </a>
            </div>
          )}

          {/* Вложение к отчёту */}
          {task.completion_attachment_url && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Вложение к отчёту</label>
              <a
                href={task.completion_attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <Icon name="Paperclip" size={16} />
                <span className="text-sm">{task.completion_attachment_name}</span>
                {task.completion_attachment_size && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatFileSize(task.completion_attachment_size)}
                  </span>
                )}
              </a>
            </div>
          )}

          {/* Архивирована */}
          {task.archived_at && (
            <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Icon name="Archive" size={16} />
                <span className="text-sm font-medium">Задача архивирована</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDate(task.archived_at)}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
