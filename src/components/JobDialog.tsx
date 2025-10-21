import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface Job {
  id: number;
  position: string;
  schedule: string;
  workplace: string;
  duties: string;
  salary: string;
  contact: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: number | null;
}

interface JobDialogProps {
  open: boolean;
  editingJob: Job | null;
  jobFormData: {
    position: string;
    schedule: string;
    workplace: string;
    duties: string;
    salary: string;
    contact: string;
    is_active: boolean;
  };
  onOpenChange: (open: boolean) => void;
  onJobFormDataChange: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function JobDialog({
  open,
  editingJob,
  jobFormData,
  onOpenChange,
  onJobFormDataChange,
  onSave,
  onCancel
}: JobDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900/90 to-pink-900/90 border-white/20">
        <DialogHeader>
          <DialogTitle>{editingJob ? 'Редактировать вакансию' : 'Создать вакансию'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Должность"
            value={jobFormData.position}
            onChange={(e) => onJobFormDataChange({ ...jobFormData, position: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="График (например, 5/2)"
              value={jobFormData.schedule}
              onChange={(e) => onJobFormDataChange({ ...jobFormData, schedule: e.target.value })}
            />
            <Input
              placeholder="Место работы"
              value={jobFormData.workplace}
              onChange={(e) => onJobFormDataChange({ ...jobFormData, workplace: e.target.value })}
            />
          </div>
          <Textarea
            placeholder="Обязанности"
            value={jobFormData.duties}
            onChange={(e) => onJobFormDataChange({ ...jobFormData, duties: e.target.value })}
            rows={4}
          />
          <Input
            placeholder="Зарплата (например, 15000₽ в месяц)"
            value={jobFormData.salary}
            onChange={(e) => onJobFormDataChange({ ...jobFormData, salary: e.target.value })}
          />
          <Input
            placeholder="Контакт для отклика (например, https://t.me/username)"
            value={jobFormData.contact}
            onChange={(e) => onJobFormDataChange({ ...jobFormData, contact: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={jobFormData.is_active}
              onCheckedChange={(checked) => onJobFormDataChange({ ...jobFormData, is_active: checked })}
            />
            <span className="text-sm">Активна</span>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={onSave} variant="secondary" className="flex-1">
              <Icon name="Save" className="w-4 h-4 mr-2" />
              {editingJob ? 'Сохранить' : 'Создать'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Отмена
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
