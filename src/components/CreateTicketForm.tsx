import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface CreateTicketFormProps {
  newTicket: {
    title: string;
    description: string;
    priority: string;
  };
  onTicketChange: (ticket: { title: string; description: string; priority: string }) => void;
  onCreateTicket: () => void;
}

export default function CreateTicketForm({ newTicket, onTicketChange, onCreateTicket }: CreateTicketFormProps) {
  return (
    <Card className="border-primary/20 bg-card/95">
      <CardHeader>
        <CardTitle className="text-primary">Создать новый тикет</CardTitle>
        <CardDescription>Опишите вашу проблему или запрос</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Тема</Label>
          <Input
            id="title"
            placeholder="Краткое описание проблемы"
            value={newTicket.title}
            onChange={(e) => onTicketChange({ ...newTicket, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea
            id="description"
            placeholder="Подробное описание проблемы или запроса"
            rows={4}
            value={newTicket.description}
            onChange={(e) => onTicketChange({ ...newTicket, description: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Приоритет</Label>
          <Select value={newTicket.priority} onValueChange={(val) => onTicketChange({ ...newTicket, priority: val })}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">📋 Низкий</SelectItem>
              <SelectItem value="medium">📌 Средний</SelectItem>
              <SelectItem value="high">⚠️ Высокий</SelectItem>
              <SelectItem value="urgent">🔥 Срочный</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={onCreateTicket} className="w-full bg-secondary hover:bg-secondary/90">
          <Icon name="Send" size={16} className="mr-2" />
          Отправить тикет
        </Button>
      </CardContent>
    </Card>
  );
}
