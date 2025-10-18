import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { API_URLS, User } from './useAuth';

export const useUsers = (user: User | null) => {
  const [managers, setManagers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const loadManagers = async () => {
    try {
      const response = await fetch(`${API_URLS.users}?role=manager`);
      const data = await response.json();
      setManagers(data.users || []);
    } catch (error) {
      console.error('Failed to load managers:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const response = await fetch(API_URLS.users);
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const createUser = async (newUser: { username: string; full_name: string; role: string }) => {
    if (!newUser.username || !newUser.full_name) {
      toast({ title: '❌ Заполните все поля', variant: 'destructive' });
      return false;
    }
    
    try {
      const response = await fetch(API_URLS.users, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      
      if (response.ok) {
        toast({ title: '✅ Пользователь создан', description: 'Пароль по умолчанию: 12345' });
        loadAllUsers();
        return true;
      } else {
        const data = await response.json();
        toast({ title: '❌ Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка создания', variant: 'destructive' });
    }
    return false;
  };

  const updateUser = async (userId: number, userData: Partial<User>) => {
    try {
      const response = await fetch(API_URLS.users, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, ...userData })
      });
      
      if (response.ok) {
        toast({ title: '✅ Данные обновлены' });
        loadAllUsers();
      } else {
        const data = await response.json();
        toast({ title: '❌ Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка обновления', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (user?.role === 'director') {
      loadManagers();
      loadAllUsers();
    }
  }, [user]);

  return {
    managers,
    allUsers,
    loadManagers,
    loadAllUsers,
    createUser,
    updateUser
  };
};
