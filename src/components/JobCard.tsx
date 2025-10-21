import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface JobCardProps {
  job: Job;
  userRole: 'artist' | 'manager' | 'director';
  onEdit: (job: Job) => void;
  onDelete: (id: number) => void;
}

export default function JobCard({ job, userRole, onEdit, onDelete }: JobCardProps) {
  const canEdit = userRole === 'director' || userRole === 'manager';
  
  return (
    <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-1">{job.position}</h3>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">
              <Icon name="Clock" className="w-3 h-3 mr-1" />
              {job.schedule}
            </Badge>
            <Badge variant="secondary">
              <Icon name="MapPin" className="w-3 h-3 mr-1" />
              {job.workplace}
            </Badge>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(job)}
            >
              <Icon name="Edit" className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(job.id)}
            >
              <Icon name="Trash2" className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="space-y-3 mb-4">
        <div>
          <h4 className="text-sm font-medium text-white/70 mb-1">Обязанности:</h4>
          <p className="text-sm text-white/90 whitespace-pre-wrap">{job.duties}</p>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="DollarSign" className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium">{job.salary}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <Button
          size="sm"
          variant="default"
          onClick={() => window.open(job.contact, '_blank')}
        >
          <Icon name="MessageCircle" className="w-4 h-4 mr-2" />
          Откликнуться
        </Button>
        <div className="text-xs text-white/50">
          {!job.is_active && <Badge variant="outline">Неактивна</Badge>}
        </div>
      </div>
    </Card>
  );
}
