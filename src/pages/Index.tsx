import { useState, lazy, Suspense } from 'react';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/components/useAuth';
import { useTickets } from '@/components/useTickets';
import { useUsers } from '@/components/useUsers';
import { useTasks } from '@/components/useTasks';
import Icon from '@/components/ui/icon';

const ArtistView = lazy(() => import('@/components/ArtistView'));
const ManagerView = lazy(() => import('@/components/ManagerView'));
const DirectorView = lazy(() => import('@/components/DirectorView'));

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

  const handleUpdateProfile = async (userIdOrUpdates: number | Partial<User>, maybeUpdates?: Partial<User>) => {
    // Если первый параметр — число (userId), то второй параметр — updates
    const updates = typeof userIdOrUpdates === 'number' ? maybeUpdates! : userIdOrUpdates;
    const userId = typeof userIdOrUpdates === 'number' ? userIdOrUpdates : user!.id;
    
    console.log('handleUpdateProfile called with userId:', userId, 'updates:', updates);
    
    const success = await updateUser(userId, updates);
    if (success) {
      updateUserProfile(updates);
    }
  };

  const LoadingFallback = () => (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );

  if (!user) {
    return <LoginForm onLogin={login} />;
  }

  if (user.role === 'artist') {
    return (
      <Suspense fallback={<LoadingFallback />}>
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
        onRefreshData={refreshUserData}
      />
      </Suspense>
    );
  }

  if (user.role === 'manager') {
    return (
      <Suspense fallback={<LoadingFallback />}>
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
        onDeleteTask={deleteTask}
        onMessagesOpenChange={setMessagesOpen}
        onUpdateUser={handleUpdateProfile}
        onLogout={logout}
        onRefreshData={refreshUserData}
      />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
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
      onUpdateUser={handleUpdateProfile}
      onCreateTask={createTask}
      onUpdateTaskStatus={updateTaskStatus}
      onDeleteTask={deleteTask}
      onMessagesOpenChange={setMessagesOpen}
      onLogout={logout}
      onRefreshData={refreshUserData}
    />
    </Suspense>
  );
}