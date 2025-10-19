import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import ArtistView from '@/components/ArtistView';
import ManagerView from '@/components/ManagerView';
import DirectorView from '@/components/DirectorView';
import { useAuth } from '@/components/useAuth';
import { useTickets } from '@/components/useTickets';
import { useUsers } from '@/components/useUsers';
import { useTasks } from '@/components/useTasks';

export default function Index() {
  const { user, login, logout, updateUserProfile, refreshUserData } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium' });
  const [selectedTicketFile, setSelectedTicketFile] = useState<File | null>(null);
  const [uploadingTicket, setUploadingTicket] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', full_name: '', role: 'artist' });
  const [messagesOpen, setMessagesOpen] = useState(false);

  const { tickets, loadTickets, createTicket, updateTicketStatus, assignTicket, deleteTicket } = useTickets(user, statusFilter);
  const { managers, allUsers, loadAllUsers, createUser, updateUser } = useUsers(user);
  const { tasks, createTask, updateTaskStatus, deleteTask } = useTasks(user);

  const handleCreateTicket = async () => {
    const success = await createTicket(newTicket, selectedTicketFile, setUploadingTicket);
    if (success) {
      setNewTicket({ title: '', description: '', priority: 'medium' });
      setSelectedTicketFile(null);
    }
  };

  const handleCreateUser = async () => {
    const success = await createUser(newUser);
    if (success) {
      setNewUser({ username: '', full_name: '', role: 'artist' });
    }
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (user) {
      const success = await updateUser(user.id, updates);
      if (success) {
        updateUserProfile(updates);
      }
    }
  };

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  if (user.role === 'artist') {
    return (
      <ArtistView
        user={user}
        tickets={tickets}
        statusFilter={statusFilter}
        newTicket={newTicket}
        selectedTicketFile={selectedTicketFile}
        uploadingTicket={uploadingTicket}
        messagesOpen={messagesOpen}
        onStatusFilterChange={setStatusFilter}
        onTicketChange={setNewTicket}
        onCreateTicket={handleCreateTicket}
        onFileChange={setSelectedTicketFile}
        onLoadTickets={loadTickets}
        onMessagesOpenChange={setMessagesOpen}
        onUpdateUser={handleUpdateProfile}
        onLogout={logout}
      />
    );
  }

  if (user.role === 'manager') {
    return (
      <ManagerView
        user={user}
        tickets={tickets}
        managers={managers}
        tasks={tasks}
        statusFilter={statusFilter}
        messagesOpen={messagesOpen}
        onStatusFilterChange={setStatusFilter}
        onUpdateStatus={updateTicketStatus}
        onAssignTicket={assignTicket}
        onLoadTickets={loadTickets}
        onDeleteTicket={deleteTicket}
        onUpdateTaskStatus={updateTaskStatus}
        onMessagesOpenChange={setMessagesOpen}
        onUpdateUser={handleUpdateProfile}
        onLogout={logout}
        onRefreshData={refreshUserData}
      />
    );
  }

  return (
    <DirectorView
      user={user}
      tickets={tickets}
      managers={managers}
      allUsers={allUsers}
      tasks={tasks}
      statusFilter={statusFilter}
      newTicket={newTicket}
      newUser={newUser}
      messagesOpen={messagesOpen}
      onStatusFilterChange={setStatusFilter}
      onNewTicketChange={setNewTicket}
      onCreateTicket={handleCreateTicket}
      onUpdateStatus={updateTicketStatus}
      onAssignTicket={assignTicket}
      onLoadTickets={loadTickets}
      onNewUserChange={setNewUser}
      onCreateUser={handleCreateUser}
      onLoadAllUsers={loadAllUsers}
      onDeleteTicket={deleteTicket}
      onUpdateUser={updateUser}
      onCreateTask={createTask}
      onUpdateTaskStatus={updateTaskStatus}
      onDeleteTask={deleteTask}
      onMessagesOpenChange={setMessagesOpen}
      onLogout={logout}
      onRefreshData={refreshUserData}
    />
  );
}