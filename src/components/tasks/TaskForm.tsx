import { useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  onShowInfo?: (message: string) => void;
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
  getManagerTaskCount,
  onShowInfo
}: TaskFormProps) {
  // Memoize callbacks to prevent unnecessary re-renders
  const selectAllManagers = useCallback(() => {
    const allIds = managers.map(m => m.id);
    onTaskChange({ ...newTask, assigned_to: allIds });
  }, [managers, newTask, onTaskChange]);

  const clearAllManagers = useCallback(() => {
    onTaskChange({ ...newTask, assigned_to: [] });
  }, [newTask, onTaskChange]);

  const applyTemplate = useCallback((template: typeof TASK_TEMPLATES[0]) => {
    onTaskChange({
      ...newTask,
      title: template.title,
      description: template.description,
      priority: template.priority
    });
  }, [newTask, onTaskChange]);

  // Memoize sorted managers list to avoid re-sorting on every render
  const sortedManagers = useMemo(() => managers, [managers]);

  return (
    <Card>
      <CardContent className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 px-3 sm:px-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs sm:text-sm font-medium">Шаблоны задач</label>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {TASK_TEMPLATES.map(template => (
              <Button
                key={template.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(template)}
                className="text-xs h-8 px-2 sm:px-3"
              >
                <Icon name="FileText" size={12} className="mr-1" />
                <span className="hidden sm:inline">{template.title}</span>
                <span className="sm:hidden">{template.title.split(' ')[0]}</span>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium mb-1 block">Название задачи *</label>
          <Input
            placeholder="Проверить отчёты артистов"
            value={newTask.title}
            onChange={(e) => onTaskChange({ ...newTask, title: e.target.value })}
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium mb-1 block">Описание</label>
          <Textarea
            placeholder="Детали задачи..."
            value={newTask.description}
            onChange={(e) => onTaskChange({ ...newTask, description: e.target.value })}
            className="min-h-[80px] sm:min-h-[100px] text-sm"
          />
        </div>

        <div>
          <label className="text-xs sm:text-sm font-medium mb-1 block">Прикрепить файл (необязательно, до 10 МБ)</label>
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
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 border rounded-md cursor-pointer md:hover:bg-accent transition-colors min-h-[44px] active:bg-accent"
            >
              <Icon name="Paperclip" size={16} className="text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">
                {selectedFile ? selectedFile.name : 'Выбрать файл'}
              </span>
            </label>
          </div>
          {selectedFile && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <Icon name="CheckCircle" size={12} className="flex-shrink-0" />
              <span className="truncate">Файл выбран: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
              <label className="text-xs sm:text-sm font-medium">Менеджеры * (можно выбрать несколько)</label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllManagers}
                  className="text-xs h-8 px-2 min-h-[44px] sm:min-h-0 sm:h-6 flex-1 sm:flex-initial"
                >
                  Все
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllManagers}
                  className="text-xs h-8 px-2 min-h-[44px] sm:min-h-0 sm:h-6 flex-1 sm:flex-initial"
                >
                  Очистить
                </Button>
              </div>
            </div>
            <div className="border rounded-md p-2 sm:p-3 space-y-2 max-h-[200px] overflow-y-auto">
              {sortedManagers.map((manager) => {
                const taskCount = getManagerTaskCount ? getManagerTaskCount(manager.id) : null;
                return (
                  <div key={manager.id} className="flex items-center justify-between gap-2 group min-h-[44px] sm:min-h-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Checkbox
                        id={`manager-${manager.id}`}
                        checked={newTask.assigned_to.includes(manager.id)}
                        onCheckedChange={() => onToggleManager(manager.id)}
                        className="flex-shrink-0"
                      />
                      <label
                        htmlFor={`manager-${manager.id}`}
                        className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 truncate min-h-[44px] sm:min-h-0 flex items-center"
                      >
                        {manager.full_name}
                      </label>
                    </div>
                    {taskCount && (
                      <div className="flex gap-1 flex-shrink-0">
                        <Badge 
                          variant="secondary" 
                          className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 cursor-help h-5"
                          onClick={() => onShowInfo?.('Активных задач (не завершённые)')}
                        >
                          <Icon name="Clock" size={10} className="mr-0.5" />
                          {taskCount.active}
                        </Badge>

                        <Badge 
                          variant="outline" 
                          className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0 cursor-help h-5"
                          onClick={() => onShowInfo?.('Всего задач за всё время')}
                        >
                          {taskCount.total}
                        </Badge>
                      </div>
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

          <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium mb-1 block">Дедлайн *</label>
              <Input
                type="datetime-local"
                value={newTask.deadline}
                onChange={(e) => onTaskChange({ ...newTask, deadline: e.target.value })}
                className="text-sm"
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium mb-1 block">Приоритет</label>
              <Select value={newTask.priority} onValueChange={(value) => onTaskChange({ ...newTask, priority: value })}>
                <SelectTrigger className="text-sm">
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
        </div>

        <Button
          onClick={onSubmit}
          disabled={uploading}
          className="w-full min-h-[44px] text-sm sm:text-base"
        >
          <Icon name={uploading ? "Loader2" : "Send"} size={16} className={`mr-2 ${uploading ? 'animate-spin' : ''}`} />
          {uploading ? 'Загрузка...' : 'Назначить задачу'}
        </Button>
      </CardContent>
    </Card>
  );
}