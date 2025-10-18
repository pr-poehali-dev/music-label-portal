import { useState } from 'react';
import LoginForm from '@/components/LoginForm';
import ArtistView from '@/components/ArtistView';
import ManagerView from '@/components/ManagerView';
import DirectorView from '@/components/DirectorView';
import { useAuth } from '@/components/useAuth';
import { useTickets } from '@/components/useTickets';
import { useUsers } from '@/components/useUsers';

export default function Index() {
  const { user, login, logout } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium' });
  const [selectedTicketFile, setSelectedTicketFile] = useState<File | null>(null);
  const [uploadingTicket, setUploadingTicket] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', full_name: '', role: 'artist' });
  const [messagesOpen, setMessagesOpen] = useState(false);

  const { tickets, loadTickets, createTicket, updateTicketStatus, assignTicket, deleteTicket } = useTickets(user, statusFilter);
  const { managers, allUsers, loadAllUsers, createUser, updateUser } = useUsers(user);

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
        statusFilter={statusFilter}
        messagesOpen={messagesOpen}
        onStatusFilterChange={setStatusFilter}
        onUpdateStatus={updateTicketStatus}
        onAssignTicket={assignTicket}
        onLoadTickets={loadTickets}
        onDeleteTicket={deleteTicket}
        onMessagesOpenChange={setMessagesOpen}
        onLogout={logout}
      />
    );
  }

  return (
    <DirectorView
      user={user}
      tickets={tickets}
      managers={managers}
      allUsers={allUsers}
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
      onMessagesOpenChange={setMessagesOpen}
      onLogout={logout}
    />
  );
}
