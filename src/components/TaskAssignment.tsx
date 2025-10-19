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
    openEditDialog,
    updateTask,
    openCompletionDialog,
    completeTask,
    toggleManager,
    getManagerTaskCount
  } = useTaskManagement(managers);

  useEffect(() => {
    loadTasks();
  }, []);

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
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

      <div className="space-y-4 md:space-y-6">
        <TaskListSection
          tasks={pendingTasks}
          sectionTitle="Ожидают"
          iconName="Clock"
          iconColor="text-yellow-500"
          badgeColor="bg-yellow-500/20 text-yellow-500"
          onUpdateStatus={updateTaskStatus}
          onComplete={openCompletionDialog}
          onEdit={openEditDialog}
          onDelete={deleteTask}
          getPriorityColor={getPriorityColor}
          getPriorityText={getPriorityText}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />

        <TaskListSection
          tasks={inProgressTasks}
          sectionTitle="В процессе"
          iconName="Play"
          iconColor="text-primary"
          badgeColor="bg-primary/20 text-primary"
          onUpdateStatus={updateTaskStatus}
          onComplete={openCompletionDialog}
          onEdit={openEditDialog}
          onDelete={deleteTask}
          getPriorityColor={getPriorityColor}
          getPriorityText={getPriorityText}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />

        <TaskListSection
          tasks={completedTasks}
          sectionTitle="Выполненные"
          iconName="CheckCircle"
          iconColor="text-green-500"
          badgeColor="bg-green-500/20 text-green-400"
          onUpdateStatus={updateTaskStatus}
          onComplete={openCompletionDialog}
          onEdit={openEditDialog}
          onDelete={deleteTask}
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
  );
}
