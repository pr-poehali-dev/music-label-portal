import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

interface CreateTicketFormProps {
  newTicket: {
    title: string;
    description: string;
    priority: string;
  };
  onTicketChange: (ticket: { title: string; description: string; priority: string }) => void;
  onCreateTicket: () => void;
  selectedFile?: File | null;
  onFileChange?: (file: File | null) => void;
  uploading?: boolean;
}

export default function CreateTicketForm({ newTicket, onTicketChange, onCreateTicket, selectedFile, onFileChange, uploading }: CreateTicketFormProps) {
  return (
    <Card className="border-primary/20 bg-card/95">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="text-primary text-lg md:text-2xl">Создать новый тикет</CardTitle>
        <CardDescription className="text-xs md:text-sm">Опишите вашу проблему или запрос</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 p-4 md:p-6">
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
        <div className="space-y-2">
          <Label htmlFor="file">Прикрепить файл (необязательно, до 10 МБ)</Label>
          <div className="relative">
            <Input
              type="file"
              id="file-upload-ticket"
              onChange={(e) => onFileChange?.(e.target.files?.[0] || null)}
              className="hidden"
              accept="*/*"
            />
            <label 
              htmlFor="file-upload-ticket"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-card border border-primary/20 rounded-md cursor-pointer hover:bg-primary/10 transition-colors"
            >
              <Icon name="Paperclip" size={18} className="text-primary" />
              <span className="text-sm">
                {selectedFile ? selectedFile.name : 'Выбрать файл'}
              </span>
            </label>
          </div>
          {selectedFile && (
            <p className="text-xs text-green-500 flex items-center gap-1">
              <Icon name="CheckCircle" size={12} />
              Файл выбран: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)
            </p>
          )}
        </div>
        <Button onClick={onCreateTicket} disabled={uploading} className="w-full bg-secondary hover:bg-secondary/90">
          <Icon name={uploading ? "Loader2" : "Send"} size={16} className={`mr-2 ${uploading ? 'animate-spin' : ''}`} />
          {uploading ? 'Загрузка...' : 'Отправить тикет'}
        </Button>
      </CardContent>
    </Card>
  );
}