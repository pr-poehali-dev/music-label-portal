import { useEffect } from 'react';
import { getPriorityColor, getPriorityText, getStatusColor, getStatusText } from './tasks/taskUtils';
import TaskCreateSection from './task-assignment/TaskCreateSection';
import TaskListSection from './task-assignment/TaskListSection';
import TaskEditDialog from './tasks/TaskEditDialog';
import TaskCompletionDialog from './tasks/TaskCompletionDialog';
import { useTaskManagement } from './task-assignment/useTaskManagement';

interface User {
  id: number;
  full_name: string;
  role: string;
}

interface TaskAssignmentProps {
  managers: User[];
  tickets: any[];
  onAssignTicket: any;
  onLoadTickets: any;
}

export default function TaskAssignment({ managers }: TaskAssignmentProps) {
  const {
    tasks,
    newTask,
    editForm,
    isEditDialogOpen,
    isCompletionDialogOpen,
    completionReport,
    selectedFile,
    uploading,
    showDeleted,
    setShowDeleted,
    setNewTask,
    setEditForm,
    setIsEditDialogOpen,
    setIsCompletionDialogOpen,
    setCompletionReport,
    setSelectedFile,
    loadTasks,
    createTask,
    updateTaskStatus,
    deleteTask,
    restoreTask,
    permanentDeleteTask,
    openEditDialog,
    updateTask,
    openCompletionDialog,
    completeTask,
    toggleManager,
    getManagerTaskCount
  } = useTaskManagement(managers);

  useEffect(() => {
    loadTasks();
  }, [showDeleted]);

  const allTasks = [...tasks].sort((a, b) => {
    const statusOrder = { pending: 0, in_progress: 1, completed: 2, deleted: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowDeleted(!showDeleted)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <span>{showDeleted ? 'Скрыть архивированные' : 'Показать архивированные'}</span>
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
        <TaskCreateSection
          newTask={newTask}
          managers={managers}
          selectedFile={selectedFile}
          uploading={uploading}
          onTaskChange={setNewTask}
          onFileChange={setSelectedFile}
          onSubmit={createTask}
          onToggleManager={(managerId) => toggleManager(managerId, false)}
          getManagerTaskCount={getManagerTaskCount}
          onShowInfo={(message) => console.log(message)}
        />
      </div>

      <div className="lg:col-span-2">
        <TaskListSection
          tasks={allTasks}
          sectionTitle="Все задачи"
          iconName="ListChecks"
          iconColor="text-primary"
          badgeColor="bg-primary/20 text-primary"
          onUpdateStatus={updateTaskStatus}
          onComplete={openCompletionDialog}
          onEdit={openEditDialog}
          onDelete={deleteTask}
          onRestore={restoreTask}
          onPermanentDelete={permanentDeleteTask}
          getPriorityColor={getPriorityColor}
          getPriorityText={getPriorityText}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      </div>

      <TaskEditDialog
        isOpen={isEditDialogOpen}
        editForm={editForm}
        managers={managers}
        onOpenChange={setIsEditDialogOpen}
        onFormChange={setEditForm}
        onSubmit={updateTask}
        onToggleManager={(managerId) => toggleManager(managerId, true)}
      />

      <TaskCompletionDialog
        isOpen={isCompletionDialogOpen}
        completionReport={completionReport}
        onOpenChange={setIsCompletionDialogOpen}
        onReportChange={setCompletionReport}
        onSubmit={completeTask}
      />
      </div>
    </div>
  );
}