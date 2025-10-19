import { useState, useMemo } from 'react';
import Icon from '@/components/ui/icon';
import TaskRow from '../tasks/TaskRow';

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

interface TaskListSectionProps {
  tasks: Task[];
  sectionTitle: string;
  iconName: string;
  iconColor: string;
  badgeColor: string;
  onUpdateStatus: (taskId: number, status: string) => void;
  onComplete: (taskId: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityText: (priority: string) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
}

type FilterType = 'all' | 'in_progress' | 'completed' | 'overdue';

export default function TaskListSection({
  tasks,
  sectionTitle,
  iconName,
  iconColor,
  badgeColor,
  onUpdateStatus,
  onComplete,
  onEdit,
  onDelete,
  getPriorityColor,
  getPriorityText,
  getStatusColor,
  getStatusText
}: TaskListSectionProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  const isOverdue = (task: Task) => {
    if (!task.deadline || task.status === 'completed') return false;
    return new Date(task.deadline) < new Date();
  };

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'in_progress':
        return tasks.filter(t => t.status === 'in_progress');
      case 'completed':
        return tasks.filter(t => t.status === 'completed');
      case 'overdue':
        return tasks.filter(t => isOverdue(t));
      default:
        return tasks;
    }
  }, [tasks, filter]);

  const overdueTasks = tasks.filter(t => isOverdue(t));
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="border-primary/20 bg-card/95 rounded-lg border">
      <div className="p-3 md:p-4 border-b border-border/50">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon name={iconName as any} size={18} className={iconColor} />
            <span className="text-primary text-base font-semibold">{sectionTitle}</span>
            <span className={`ml-auto px-2 py-0.5 rounded-full ${badgeColor} text-xs font-medium`}>
              {filteredTasks.length}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              Все ({tasks.length})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'in_progress'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              В работе ({inProgressTasks.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border/50'
              }`}
            >
              Выполненные ({completedTasks.length})
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'overdue'
                  ? 'bg-red-500 text-white'
                  : overdueTasks.length > 0
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
                  : 'bg-card text-muted-foreground border border-border/50'
              }`}
            >
              Просроченные ({overdueTasks.length})
            </button>
          </div>
        </div>
      </div>
      <div className="p-3 md:p-6">
        <div className="space-y-2 max-h-[400px] md:max-h-[600px] overflow-y-auto pr-2">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Icon name="Inbox" size={40} className="mx-auto mb-2 opacity-50" />
              Нет задач
            </div>
          ) : (
            filteredTasks.map((task) => (
              <TaskRow
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}