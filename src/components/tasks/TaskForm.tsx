import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  full_name: string;
  role: string;
}

interface TaskFormProps {
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
  getManagerTaskCount?: (managerId: number) => { active: number; total: number };
}

const TASK_TEMPLATES = [
  { id: 1, title: 'Проверить отчёты артистов', description: 'Проверить загруженные отчёты за неделю', priority: 'high' },
  { id: 2, title: 'Связаться с артистами', description: 'Обзвонить артистов по списку', priority: 'medium' },
  { id: 3, title: 'Обработать заявки', description: 'Разобрать новые заявки от артистов', priority: 'medium' },
  { id: 4, title: 'Подготовить отчёт', description: 'Сформировать еженедельный отчёт', priority: 'high' },
];

export default function TaskForm({
  newTask,
  managers,
  selectedFile,
  uploading,
  onTaskChange,
  onFileChange,
  onSubmit,
  onToggleManager,
  getManagerTaskCount
}: TaskFormProps) {
  const selectAllManagers = () => {
    const allIds = managers.map(m => m.id);
    onTaskChange({ ...newTask, assigned_to: allIds });
  };

  const clearAllManagers = () => {
    onTaskChange({ ...newTask, assigned_to: [] });
  };

  const applyTemplate = (template: typeof TASK_TEMPLATES[0]) => {
    onTaskChange({
      ...newTask,
      title: template.title,
      description: template.description,
      priority: template.priority
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Шаблоны задач</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {TASK_TEMPLATES.map(template => (
              <Button
                key={template.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(template)}
                className="text-xs"
              >
                <Icon name="FileText" size={14} className="mr-1" />
                {template.title}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Название задачи *</label>
          <Input
            placeholder="Проверить отчёты артистов"
            value={newTask.title}
            onChange={(e) => onTaskChange({ ...newTask, title: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Описание</label>
          <Textarea
            placeholder="Детали задачи..."
            value={newTask.description}
            onChange={(e) => onTaskChange({ ...newTask, description: e.target.value })}
            className="min-h-[100px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Прикрепить файл (необязательно, до 10 МБ)</label>
          <div className="relative">
            <Input
              type="file"
              id="file-upload"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              className="hidden"
              accept="*/*"
            />
            <label 
              htmlFor="file-upload"
              className="flex items-center justify-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent transition-colors"
            >
              <Icon name="Paperclip" size={18} className="text-primary" />
              <span className="text-sm">
                {selectedFile ? selectedFile.name : 'Выбрать файл'}
              </span>
            </label>
          </div>
          {selectedFile && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Icon name="CheckCircle" size={12} />
              Файл выбран: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium">Менеджеры * (можно выбрать несколько)</label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllManagers}
                  className="text-xs h-6 px-2"
                >
                  Все
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllManagers}
                  className="text-xs h-6 px-2"
                >
                  Очистить
                </Button>
              </div>
            </div>
            <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
              {managers.map((manager) => {
                const taskCount = getManagerTaskCount ? getManagerTaskCount(manager.id) : null;
                return (
                  <div key={manager.id} className="flex items-center justify-between space-x-2 group">
                    <div className="flex items-center space-x-2 flex-1">
                      <Checkbox
                        id={`manager-${manager.id}`}
                        checked={newTask.assigned_to.includes(manager.id)}
                        onCheckedChange={() => onToggleManager(manager.id)}
                      />
                      <label
                        htmlFor={`manager-${manager.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {manager.full_name}
                      </label>
                    </div>
                    {taskCount && (
                      <TooltipProvider>
                        <div className="flex gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="text-xs px-1.5 py-0 cursor-help">
                                <Icon name="Clock" size={10} className="mr-0.5" />
                                {taskCount.active}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p>Активных задач (не завершённые)</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="text-xs px-1.5 py-0 cursor-help">
                                {taskCount.total}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-xs">
                              <p>Всего задач за всё время</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    )}
                  </div>
                );
              })}
            </div>
            {newTask.assigned_to.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Выбрано: {newTask.assigned_to.length}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Дедлайн *</label>
            <Input
              type="datetime-local"
              value={newTask.deadline}
              onChange={(e) => onTaskChange({ ...newTask, deadline: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Приоритет</label>
            <Select value={newTask.priority} onValueChange={(value) => onTaskChange({ ...newTask, priority: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Низкий</SelectItem>
                <SelectItem value="medium">Средний</SelectItem>
                <SelectItem value="high">Высокий</SelectItem>
                <SelectItem value="urgent">Срочно</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={onSubmit}
          disabled={uploading}
          className="w-full"
        >
          <Icon name={uploading ? "Loader2" : "Send"} size={18} className={`mr-2 ${uploading ? 'animate-spin' : ''}`} />
          {uploading ? 'Загрузка...' : 'Назначить задачу'}
        </Button>
      </CardContent>
    </Card>
  );
}