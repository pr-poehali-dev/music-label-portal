import Icon from '@/components/ui/icon';
import TaskList from '../tasks/TaskList';

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
  if (tasks.length === 0) return null;

  return (
    <div>
      <div className="mb-3 md:mb-4 flex items-center gap-2">
        <Icon name={iconName as any} size={20} className={iconColor} />
        <span className="text-base md:text-lg font-semibold text-foreground">{sectionTitle}</span>
        <span className={`ml-1 px-2 py-0.5 rounded-full ${badgeColor} text-sm font-medium`}>
          {tasks.length}
        </span>
      </div>
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <TaskList
            key={task.id}
            tasks={[task]}
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
    </div>
  );
}
