import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  full_name: string;
  role: string;
}

interface TaskEditDialogProps {
  isOpen: boolean;
  editForm: {
    title: string;
    description: string;
    assigned_to: number[];
    deadline: string;
    priority: string;
  };
  managers: User[];
  onOpenChange: (open: boolean) => void;
  onFormChange: (form: any) => void;
  onSubmit: () => void;
  onToggleManager: (managerId: number) => void;
}

export default function TaskEditDialog({
  isOpen,
  editForm,
  managers,
  onOpenChange,
  onFormChange,
  onSubmit,
  onToggleManager
}: TaskEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать задачу</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Название задачи *</label>
            <Input
              placeholder="Проверить отчёты артистов"
              value={editForm.title}
              onChange={(e) => onFormChange({ ...editForm, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Описание</label>
            <Textarea
              placeholder="Детали задачи..."
              value={editForm.description}
              onChange={(e) => onFormChange({ ...editForm, description: e.target.value })}
              className="min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Менеджеры * (можно выбрать несколько)</label>
            <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
              {managers.map((manager) => (
                <div key={manager.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`edit-manager-${manager.id}`}
                    checked={editForm.assigned_to.includes(manager.id)}
                    onCheckedChange={() => onToggleManager(manager.id)}
                  />
                  <label
                    htmlFor={`edit-manager-${manager.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {manager.full_name}
                  </label>
                </div>
              ))}
            </div>
            {editForm.assigned_to.length > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Выбрано: {editForm.assigned_to.length}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Дедлайн *</label>
              <Input
                type="datetime-local"
                value={editForm.deadline}
                onChange={(e) => onFormChange({ ...editForm, deadline: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Приоритет</label>
              <Select value={editForm.priority} onValueChange={(value) => onFormChange({ ...editForm, priority: value })}>
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

          <div className="flex gap-2 pt-4">
            <Button onClick={onSubmit} className="flex-1">
              <Icon name="Save" size={18} className="mr-2" />
              Сохранить изменения
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
