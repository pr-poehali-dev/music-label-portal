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
}

interface TaskRowProps {
  task: Task;
  onUpdateStatus: (taskId: number, status: string) => void;
  onComplete: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onRestore?: (taskId: number) => void;
  onPermanentDelete?: (taskId: number) => void;
  onView?: (task: Task) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityText: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

export default function TaskRow({
  task,
  onUpdateStatus,
  onComplete,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  onView,
  getPriorityColor,
  getPriorityText,
  getStatusColor,
  getStatusText
}: TaskRowProps) {
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

  const isOverdue = task.deadline && task.status !== 'completed' && new Date(task.deadline) < new Date();

  return (
    <div className={`p-2 md:p-2.5 rounded-lg border transition-all ${
      task.status === 'deleted'
        ? 'bg-gray-500/10 border-gray-500/30 opacity-60'
        : isOverdue
        ? 'bg-red-500/10 border-red-500/30'
        : task.status === 'completed' 
        ? 'bg-green-500/10 border-green-500/30' 
        : task.status === 'in_progress'
        ? 'bg-primary/10 border-primary/30'
        : 'bg-muted/30 border-border/50 hover:bg-muted/50'
    }`}>
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <div 
          className="flex-1 min-w-0 cursor-pointer" 
          onClick={() => onView?.(task)}
        >
          <div className="flex items-center gap-1.5 md:gap-2 mb-1">
            <Badge className={`gap-1 border ${getStatusColor(task.status)} flex-shrink-0`}>
              <Icon name={getStatusIcon(task.status)} size={10} />
            </Badge>
            <p className="font-semibold text-xs md:text-sm truncate">{task.title}</p>
            <Badge className={`gap-1 border ${getPriorityColor(task.priority)} text-[9px] md:text-[10px] px-1 md:px-1.5 py-0 flex-shrink-0`}>
              <Icon name={getPriorityIcon(task.priority)} size={8} />
              {getPriorityText(task.priority)}
            </Badge>
          </div>
          
          {task.description && (
            <p className="text-[10px] md:text-xs text-muted-foreground mb-1 line-clamp-1">{task.description}</p>
          )}

          <div className="flex items-center gap-1 md:gap-1.5 flex-wrap">
            {task.assigned_name && (
              <p className="text-[10px] md:text-xs text-muted-foreground truncate max-w-[120px] md:max-w-none">
                <Icon name="User" size={10} className="inline mr-0.5" />
                {task.assigned_name}
              </p>
            )}
            {task.deadline && (
              <p className={`text-[10px] md:text-xs ${isOverdue ? 'text-red-400 font-semibold' : 'text-muted-foreground'}`}>
                <Icon name="Calendar" size={10} className="inline mr-0.5" />
                {new Date(task.deadline).toLocaleDateString('ru-RU')}
                {isOverdue && ' ⚠️'}
              </p>
            )}
            {task.completion_report && (
              <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-[10px] px-1.5 py-0">
                <Icon name="FileCheck" size={8} className="mr-0.5" />
                Отчёт
              </Badge>
            )}
            {isOverdue && (
              <Badge variant="outline" className="border-red-500/50 bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0">
                <Icon name="AlertTriangle" size={8} className="mr-0.5" />
                Просрочено
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-1.5 flex-shrink-0">
          {task.status === 'deleted' ? (
            <>
              {onRestore && (
                <Button 
                  size="sm" 
                  onClick={() => onRestore(task.id)} 
                  className="h-7 px-2 bg-blue-500 hover:bg-blue-600 text-xs"
                  title="Восстановить"
                >
                  <Icon name="RotateCcw" size={12} />
                </Button>
              )}
              {onPermanentDelete && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => onPermanentDelete(task.id)} 
                  className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400"
                  title="Удалить навсегда"
                >
                  <Icon name="Trash2" size={14} />
                </Button>
              )}
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onEdit(task)} 
                className="h-7 w-7 p-0 hover:bg-blue-500/20 hover:text-blue-400"
                title="Редактировать"
              >
                <Icon name="Edit" size={14} />
              </Button>
              
              {task.status !== 'completed' && (
                <>
                  {task.status !== 'in_progress' && (
                    <Button 
                      size="sm" 
                      onClick={() => onUpdateStatus(task.id, 'in_progress')} 
                      className="h-7 px-2 bg-primary hover:bg-primary/90 text-xs"
                      title="В работу"
                    >
                      <Icon name="Play" size={12} />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    onClick={() => onComplete(task.id)} 
                    className="h-7 px-2 bg-green-500 hover:bg-green-600 text-xs"
                    title="Завершить"
                  >
                    <Icon name="CheckCircle" size={12} />
                  </Button>
                </>
              )}
              
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => onDelete(task.id)} 
                className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400"
                title="Удалить"
              >
                <Icon name="Trash2" size={14} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}