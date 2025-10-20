import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { Task } from '@/components/useTasks';
import TaskDetailDialog from '@/components/TaskDetailDialog';

interface ManagerTasksViewProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: number, status: string) => Promise<boolean>;
}

const ManagerTasksView = React.memo(function ManagerTasksView({ tasks, onUpdateTaskStatus }: ManagerTasksViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'open': return 'outline';
      default: return 'outline';
    }
  }, []);

  const getPriorityIcon = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return 'Flame';
      case 'high': return 'AlertTriangle';
      case 'medium': return 'AlertCircle';
      case 'low': return 'Info';
      default: return 'AlertCircle';
    }
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'completed': return 'CheckCircle2';
      case 'in_progress': return 'Clock';
      case 'open': return 'Circle';
      default: return 'Circle';
    }
  }, []);

  const { activeTasks, completedTasks } = useMemo(() => {
    console.log('ManagerTasksView tasks:', tasks);
    return {
      activeTasks: tasks.filter(t => t.status !== 'completed'),
      completedTasks: tasks.filter(t => t.status === 'completed')
    };
  }, [tasks]);

  const getTimeRemaining = useCallback((deadline: string | null) => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff < 0) {
      return { text: 'Просрочено', isOverdue: true };
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return { text: `${days} дн.`, isOverdue: false };
    if (hours > 0) return { text: `${hours} ч.`, isOverdue: false };
    return { text: '<1 ч.', isOverdue: false };
  }, []);

  const TimeRemainingBadge = ({ deadline }: { deadline: string | null }) => {
    const [timeRemaining, setTimeRemaining] = useState(getTimeRemaining(deadline));

    useEffect(() => {
      if (!deadline) return;
      
      const interval = setInterval(() => {
        setTimeRemaining(getTimeRemaining(deadline));
      }, 60000);
      
      return () => clearInterval(interval);
    }, [deadline]);

    if (!timeRemaining) return null;

    return (
      <Badge variant={timeRemaining.isOverdue ? 'destructive' : 'secondary'} className="whitespace-nowrap">
        <Icon name={timeRemaining.isOverdue ? 'AlertTriangle' : 'Timer'} size={12} className="mr-1" />
        {timeRemaining.text}
      </Badge>
    );
  };

  return (
    <>
      <TaskDetailDialog
        task={selectedTask}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdateStatus={onUpdateTaskStatus}
        userRole="manager"
      />
    <div className="space-y-4 md:space-y-6 p-3 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold">Мои задачи ({tasks.length} всего)</h2>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">{activeTasks.length} активных</Badge>
          <Badge variant="outline">{completedTasks.length} выполнено</Badge>
        </div>
      </div>

      {activeTasks.length === 0 && completedTasks.length === 0 ? (
        <Card className="p-6 md:p-8 text-center text-muted-foreground">
          <Icon name="ListTodo" size={36} className="mx-auto mb-4 opacity-50 md:size-12" />
          <p className="text-base md:text-lg">У вас пока нет задач</p>
        </Card>
      ) : (
        <>
          {activeTasks.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-semibold">Активные задачи</h3>
              <div className="grid gap-3 md:gap-4">
                {activeTasks.map(task => (
                  <Card 
                    key={task.id} 
                    className="p-4 md:p-6 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setSelectedTask(task);
                      setDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <div className="flex-1 space-y-2 md:space-y-3 min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                          <h3 className="text-sm md:text-lg font-semibold truncate">#{task.id} {task.title}</h3>
                          <Badge variant={getPriorityColor(task.priority)}>
                            <Icon name={getPriorityIcon(task.priority)} size={12} className="mr-1" />
                            {task.priority}
                          </Badge>
                          <Badge variant={getStatusColor(task.status)}>
                            <Icon name={getStatusIcon(task.status)} size={12} className="mr-1" />
                            {task.status}
                          </Badge>
                          <TimeRemainingBadge deadline={task.deadline} />
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          {task.ticket_id && task.ticket_title && (
                            <div className="flex items-center gap-1">
                              <Icon name="Ticket" size={14} />
                              <span>Тикет #{task.ticket_id}: {task.ticket_title}</span>
                            </div>
                          )}
                          {task.assignee_name && (
                            <div className="flex items-center gap-1">
                              <Icon name="User" size={14} />
                              <span>Менеджер: {task.assignee_name}</span>
                            </div>
                          )}
                          {task.creator_name && (
                            <div className="flex items-center gap-1">
                              <Icon name="UserCircle" size={14} />
                              <span>Создал: {task.creator_name}</span>
                            </div>
                          )}
                          {task.deadline && (
                            <div className="flex items-center gap-1">
                              <Icon name="Calendar" size={14} />
                              <span>{new Date(task.deadline).toLocaleString('ru-RU')}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 flex-col sm:flex-row" onClick={(e) => e.stopPropagation()}>
                        {task.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateTaskStatus(task.id, 'in_progress');
                            }}
                          >
                            <Icon name="Play" size={14} className="mr-1" />
                            Начать
                          </Button>
                        )}
                        {task.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateTaskStatus(task.id, 'completed');
                            }}
                          >
                            <Icon name="Check" size={14} className="mr-1" />
                            Завершить
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-muted-foreground">Выполненные задачи</h3>
              <div className="grid gap-4">
                {completedTasks.map(task => (
                  <Card 
                    key={task.id} 
                    className="p-6 opacity-60 cursor-pointer hover:opacity-100 hover:bg-accent/50 transition-all"
                    onClick={() => {
                      setSelectedTask(task);
                      setIsDetailDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold line-through">#{task.id} {task.title}</h3>
                          <Badge variant="default">
                            <Icon name="CheckCircle2" size={12} className="mr-1" />
                            Выполнено
                          </Badge>
                        </div>

                        <div className="space-y-1">
                          {task.ticket_id && task.ticket_title && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Icon name="Ticket" size={14} />
                              <span>Тикет #{task.ticket_id}: {task.ticket_title}</span>
                            </div>
                          )}
                          {task.assignee_name && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Icon name="User" size={14} />
                              <span>Менеджер: {task.assignee_name}</span>
                            </div>
                          )}
                        </div>

                        {task.completed_at && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Icon name="CheckCircle2" size={14} />
                            <span>Завершено: {new Date(task.completed_at).toLocaleString('ru-RU')}</span>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedTask(task);
                          setDialogOpen(true);
                        }}
                      >
                        <Icon name="Eye" size={14} className="mr-1" />
                        Подробнее
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
});

export default ManagerTasksView;