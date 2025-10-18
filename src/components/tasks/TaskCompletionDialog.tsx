import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface TaskCompletionDialogProps {
  isOpen: boolean;
  completionReport: string;
  onOpenChange: (open: boolean) => void;
  onReportChange: (report: string) => void;
  onSubmit: () => void;
}

export default function TaskCompletionDialog({
  isOpen,
  completionReport,
  onOpenChange,
  onReportChange,
  onSubmit
}: TaskCompletionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Итоги выполнения задачи</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Опишите результаты выполнения задачи *
            </label>
            <Textarea
              placeholder="Подробно опишите, что было сделано, какие результаты достигнуты..."
              value={completionReport}
              onChange={(e) => onReportChange(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Опишите выполненную работу и результаты
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={onSubmit} 
              className="flex-1"
              disabled={!completionReport.trim()}
            >
              <Icon name="CheckCircle" size={18} className="mr-2" />
              Завершить задачу
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
