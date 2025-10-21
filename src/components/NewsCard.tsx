import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface NewsCardProps {
  item: News;
  userRole: 'artist' | 'manager' | 'director';
  onEdit: (item: News) => void;
  onDelete: (id: number) => void;
}

export default function NewsCard({ item, userRole, onEdit, onDelete }: NewsCardProps) {
  const canEdit = userRole === 'director' || userRole === 'manager';
  
  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <Badge variant={item.type === 'update' ? 'default' : 'secondary'}>
            {item.type === 'update' ? 'Обновление' : 'FAQ'}
          </Badge>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(item)}
            >
              <Icon name="Edit" className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(item.id)}
            >
              <Icon name="Trash2" className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      <p className="text-sm text-white/70 whitespace-pre-wrap">{item.content}</p>
      <div className="mt-4 flex items-center justify-between text-xs text-white/50">
        <span>{new Date(item.created_at).toLocaleDateString('ru-RU')}</span>
        <div className="flex items-center gap-2">
          <span>Приоритет: {item.priority}</span>
          {!item.is_active && <Badge variant="outline">Неактивна</Badge>}
        </div>
      </div>
    </Card>
  );
}
