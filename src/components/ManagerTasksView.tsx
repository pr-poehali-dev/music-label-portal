import React, { useMemo, useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Task } from '@/components/useTasks';
import TaskDetailDialog from '@/components/TaskDetailDialog';
import CompleteTaskDialog from '@/components/CompleteTaskDialog';

interface ManagerTasksViewProps {
  tasks: Task[];
  onUpdateTaskStatus: (taskId: number, status: string, completionReport?: string, completionFile?: File) => Promise<boolean>;
}

const ManagerTasksView = React.memo(function ManagerTasksView({ tasks, onUpdateTaskStatus }: ManagerTasksViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
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

  const getPriorityLabel = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent': return 'Срочный';
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  }, []);

  const { activeTasks, completedTasks } = useMemo(() => {
    return {
      activeTasks: tasks.filter(t => t.status !== 'completed').sort((a, b) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }),
      completedTasks: tasks.filter(t => t.status === 'completed').sort((a, b) => 
        new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime()
      )
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

  const TaskCardCompact = ({ task }: { task: Task }) => {
    const timeRemaining = getTimeRemaining(task.deadline);
    
    return (
      <Card 
        className="p-3 cursor-pointer hover:bg-accent/50 transition-all hover:scale-[1.02] border-border/50"
        onClick={() => {
          setSelectedTask(task);
          setDialogOpen(true);
        }}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
              )}
            </div>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${getPriorityColor(task.priority)}`} />
          </div>

          <div className="flex flex-wrap gap-1.5 items-center text-xs">
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              <Icon name={getPriorityIcon(task.priority)} size={10} className="mr-1" />
              {getPriorityLabel(task.priority)}
            </Badge>
            
            {timeRemaining && (
              <Badge variant={timeRemaining.isOverdue ? 'destructive' : 'secondary'} className="text-xs px-1.5 py-0">
                <Icon name={timeRemaining.isOverdue ? 'AlertTriangle' : 'Timer'} size={10} className="mr-1" />
                {timeRemaining.text}
              </Badge>
            )}

            {task.ticket_id && (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                <Icon name="Ticket" size={10} className="mr-1" />
                #{task.ticket_id}
              </Badge>
            )}
          </div>

          {task.status !== 'completed' && (
            <div className="flex gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              {(task.status === 'open' || task.status === 'pending') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTaskStatus(task.id, 'in_progress');
                  }}
                >
                  <Icon name="Play" size={12} className="mr-1" />
                  Начать
                </Button>
              )}
              <Button
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setTaskToComplete(task);
                  setCompleteDialogOpen(true);
                }}
              >
                <Icon name="Check" size={12} className="mr-1" />
                Завершить
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const handleCompleteTask = async (taskId: number, report: string, file?: File) => {
    return await onUpdateTaskStatus(taskId, 'completed', report, file);
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

      <CompleteTaskDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        taskId={taskToComplete?.id || 0}
        taskTitle={taskToComplete?.title || ''}
        onComplete={handleCompleteTask}
      />
      
      <div className="space-y-4 md:space-y-6 p-3 md:p-6">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-1">
            <TabsTrigger value="active" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Icon name="Clock" className="w-3 h-3 md:w-4 md:h-4 text-yellow-500" />
              <span>Активные</span>
              <span className="ml-1 text-xs">({activeTasks.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
              <Icon name="CheckCircle" className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
              <span>Выполненные</span>
              <span className="ml-1 text-xs">({completedTasks.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {activeTasks.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground/50">
                  <Icon name="ListTodo" size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Нет активных задач</p>
                </div>
              ) : (
                activeTasks.map(task => (
                  <TaskCardCompact key={task.id} task={task} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {completedTasks.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground/50">
                  <Icon name="CheckCircle" size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Нет выполненных задач</p>
                </div>
              ) : (
                completedTasks.map(task => (
                  <TaskCardCompact key={task.id} task={task} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
});

export default ManagerTasksView;