import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import TaskForm from '../tasks/TaskForm';

interface User {
  id: number;
  full_name: string;
  role: string;
}

interface TaskCreateSectionProps {
  newTask: {
    title: string;
    description: string;
    assigned_to: number[];
    deadline: string;
    priority: string;
  };
  managers: User[];
  selectedFile: File | null;
  uploading: boolean;
  onTaskChange: (task: any) => void;
  onFileChange: (file: File | null) => void;
  onSubmit: () => void;
  onToggleManager: (managerId: number) => void;
  getManagerTaskCount: (managerId: number) => number;
  onShowInfo: (message: string) => void;
}

export default function TaskCreateSection({
  newTask,
  managers,
  selectedFile,
  uploading,
  onTaskChange,
  onFileChange,
  onSubmit,
  onToggleManager,
  getManagerTaskCount,
  onShowInfo
}: TaskCreateSectionProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Plus" size={24} className="text-primary" />
          Создать новую задачу
        </CardTitle>
      </CardHeader>
      <CardContent>
        <TaskForm
          newTask={newTask}
          managers={managers}
          selectedFile={selectedFile}
          uploading={uploading}
          onTaskChange={onTaskChange}
          onFileChange={onFileChange}
          onSubmit={onSubmit}
          onToggleManager={onToggleManager}
          getManagerTaskCount={getManagerTaskCount}
          onShowInfo={onShowInfo}
        />
      </CardContent>
    </Card>
  );
}
