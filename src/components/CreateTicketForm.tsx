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
      <CardHeader className="p-3 md:p-6 pb-2 md:pb-6">
        <CardTitle className="text-primary text-base md:text-2xl">Создать тикет</CardTitle>
        <CardDescription className="text-[11px] md:text-sm">Опишите вашу проблему или запрос</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 p-3 md:p-6 pt-2 md:pt-6">
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="title" className="text-xs md:text-sm">Тема</Label>
          <Input
            id="title"
            placeholder="Краткое описание"
            value={newTicket.title}
            onChange={(e) => onTicketChange({ ...newTicket, title: e.target.value })}
            className="text-sm h-9 md:h-10"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="description" className="text-xs md:text-sm">Описание</Label>
          <Textarea
            id="description"
            placeholder="Подробное описание проблемы"
            rows={3}
            value={newTicket.description}
            onChange={(e) => onTicketChange({ ...newTicket, description: e.target.value })}
            className="text-sm min-h-[80px] md:min-h-[100px] resize-none"
          />
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="priority" className="text-xs md:text-sm">Приоритет</Label>
          <Select value={newTicket.priority} onValueChange={(val) => onTicketChange({ ...newTicket, priority: val })}>
            <SelectTrigger id="priority" className="h-9 md:h-10 text-sm">
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
        <div className="space-y-1.5 md:space-y-2">
          <Label htmlFor="file" className="text-xs md:text-sm">Прикрепить файл (до 10 МБ)</Label>
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
              className="flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 bg-card border border-primary/20 rounded-md cursor-pointer hover:bg-primary/10 transition-colors"
            >
              <Icon name="Paperclip" size={16} className="md:size-[18px] text-primary shrink-0" />
              <span className="text-xs md:text-sm truncate">
                {selectedFile ? selectedFile.name : 'Выбрать файл'}
              </span>
            </label>
          </div>
          {selectedFile && (
            <p className="text-[10px] md:text-xs text-green-500 flex items-center gap-1">
              <Icon name="CheckCircle" size={10} className="md:size-3 shrink-0" />
              <span className="truncate">Файл: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} МБ)</span>
            </p>
          )}
        </div>
        <Button onClick={onCreateTicket} disabled={uploading} className="w-full bg-secondary hover:bg-secondary/90 h-10 md:h-11 text-sm md:text-base">
          <Icon name={uploading ? "Loader2" : "Send"} size={16} className={`mr-1.5 md:mr-2 ${uploading ? 'animate-spin' : ''}`} />
          {uploading ? 'Загрузка...' : 'Отправить'}
        </Button>
      </CardContent>
    </Card>
  );
}