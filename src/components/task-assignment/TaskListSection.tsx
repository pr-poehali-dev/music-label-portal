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
  return (
    <div className="border-primary/20 bg-card/95 rounded-lg border">
      <div className="p-3 md:p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Icon name={iconName as any} size={18} className={iconColor} />
          <span className="text-primary text-base font-semibold">{sectionTitle}</span>
          <span className={`ml-auto px-2 py-0.5 rounded-full ${badgeColor} text-xs font-medium`}>
            {tasks.length}
          </span>
        </div>
      </div>
      <div className="p-3 md:p-6">
        <div className="space-y-2 max-h-[400px] md:max-h-[600px] overflow-y-auto pr-2">
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Icon name="Inbox" size={40} className="mx-auto mb-2 opacity-50" />
              Нет задач
            </div>
          ) : (
            tasks.map((task) => (
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