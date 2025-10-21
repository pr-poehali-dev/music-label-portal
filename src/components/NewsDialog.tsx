import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface News {
  id: number;
  title: string;
  content: string;
  type: 'update' | 'faq' | 'job';
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
  created_by: number | null;
}

interface NewsDialogProps {
  open: boolean;
  editingNews: News | null;
  formData: {
    title: string;
    content: string;
    type: 'update' | 'faq' | 'job';
    priority: number;
    is_active: boolean;
  };
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function NewsDialog({
  open,
  editingNews,
  formData,
  onOpenChange,
  onFormDataChange,
  onSave,
  onCancel
}: NewsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-900/90 to-pink-900/90 border-white/20">
        <DialogHeader>
          <DialogTitle>{editingNews ? 'Редактировать новость' : 'Создать новость'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Заголовок"
            value={formData.title}
            onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
          />
          <Textarea
            placeholder="Содержание"
            value={formData.content}
            onChange={(e) => onFormDataChange({ ...formData, content: e.target.value })}
            rows={6}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select value={formData.type} onValueChange={(value: any) => onFormDataChange({ ...formData, type: value })}>
              <SelectTrigger className="bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">Обновление</SelectItem>
                <SelectItem value="faq">FAQ</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Приоритет (0-100)"
              value={formData.priority}
              onChange={(e) => onFormDataChange({ ...formData, priority: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => onFormDataChange({ ...formData, is_active: checked })}
            />
            <span className="text-sm">Активна</span>
          </div>
          <div className="flex gap-2 pt-4">
            <Button onClick={onSave} className="flex-1">
              <Icon name="Save" className="w-4 h-4 mr-2" />
              {editingNews ? 'Сохранить' : 'Создать'}
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
