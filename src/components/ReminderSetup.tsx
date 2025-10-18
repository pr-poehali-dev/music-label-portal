import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const REMINDER_URL = 'https://functions.poehali.dev/7b917e9b-349b-4e00-91f6-933aaff43d85';

export default function ReminderSetup() {
  const { toast } = useToast();

  const testReminders = async () => {
    try {
      const response = await fetch(REMINDER_URL);
      const data = await response.json();
      
      toast({
        title: '✅ Напоминания отправлены',
        description: `Уведомлений: ${data.sent} | Скоро: ${data.tickets_soon} | Просрочено: ${data.tickets_overdue}`
      });
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось отправить напоминания',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card className="border-primary/20 bg-card/95">
      <CardHeader>
        <CardTitle className="text-primary">⏰ Напоминания о дедлайнах</CardTitle>
        <CardDescription>
          Автоматические уведомления в Telegram о приближающихся и просроченных дедлайнах
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
          <p className="font-medium">📨 Система уведомлений:</p>
          <ul className="space-y-1 ml-4">
            <li>⏰ Дедлайн через 24 часа → уведомление менеджеру и руководителю</li>
            <li>🚨 Просроченный дедлайн → срочное уведомление</li>
            <li>🔔 Автоматическая проверка каждый час</li>
          </ul>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-sm">
          <p className="font-medium text-yellow-600 mb-2">💡 Для автоматизации:</p>
          <p className="text-foreground/80">
            Настройте cron-задачу или используйте сервис мониторинга для вызова функции каждый час:
          </p>
          <code className="block mt-2 p-2 bg-black/20 rounded text-xs break-all">
            {REMINDER_URL}
          </code>
        </div>

        <Button onClick={testReminders} className="w-full bg-secondary hover:bg-secondary/90">
          <Icon name="Bell" size={16} className="mr-2" />
          Проверить напоминания сейчас
        </Button>

        <div className="text-xs text-muted-foreground space-y-1">
          <p><b>Пример сервисов для автоматизации:</b></p>
          <p>• cron-job.org — бесплатный планировщик</p>
          <p>• UptimeRobot — мониторинг с уведомлениями</p>
          <p>• GitHub Actions — настройка через workflow</p>
        </div>
      </CardContent>
    </Card>
  );
}
