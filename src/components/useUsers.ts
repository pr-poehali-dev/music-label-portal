import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, NewUser, API_URLS } from '@/types';
import { createNotification } from '@/hooks/useNotifications';

export const useUsers = (user: User | null) => {
  const [managers, setManagers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { toast } = useToast();

  const loadManagers = useCallback(async () => {
    try {
      const response = await fetch(`${API_URLS.users}?role=manager`);
      const data = await response.json();
      setManagers(data.users || []);
    } catch (error) {
      console.error('Failed to load managers:', error);
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    try {
      const response = await fetch(API_URLS.users);
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }, []);

  const createUser = useCallback(async (newUser: NewUser) => {
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
        const data = await response.json();
        toast({ title: '✅ Пользователь создан', description: 'Пароль по умолчанию: 12345' });
        
        // Notify directors about new user registration
        try {
          await createNotification({
            title: '🎉 Новый пользователь',
            message: `Зарегистрирован новый ${newUser.role === 'artist' ? 'артист' : newUser.role === 'manager' ? 'менеджер' : 'пользователь'}: ${newUser.full_name} (@${newUser.username})`,
            type: 'user_registration',
            related_entity_type: 'user',
            related_entity_id: data.user_id
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
        }
        
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
  }, [toast, loadAllUsers]);

  const updateUser = useCallback(async (userId: number, userData: Partial<User>) => {
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
  }, [toast, loadAllUsers]);

  useEffect(() => {
    if (user?.role === 'director') {
      loadManagers();
      loadAllUsers();
    }
  }, [user?.role, loadManagers, loadAllUsers]);

  return {
    managers,
    allUsers,
    loadManagers,
    loadAllUsers,
    createUser,
    updateUser
  };
};