import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/utils/activityLogger';
import { User, API_URLS } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  const login = async (username: string, password: string, vkData?: any, telegramData?: any) => {
    try {
      if (telegramData) {
        const userData: User = {
          id: telegramData.id,
          username: telegramData.username,
          full_name: telegramData.full_name,
          role: telegramData.role as 'artist' | 'manager' | 'director',
          telegram_chat_id: telegramData.telegram_chat_id,
          avatar: telegramData.avatar,
          is_blocked: telegramData.is_blocked,
          is_frozen: telegramData.is_frozen
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        logActivity(userData.id, 'login', `Пользователь ${userData.full_name} вошёл через Telegram`);
        toast({ title: '✅ Вход выполнен', description: `Добро пожаловать, ${userData.full_name}` });
        return;
      }

      if (!password && !vkData) {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
        return;
      }

      const requestBody: any = { username, password };
      if (vkData) {
        requestBody.vk_data = vkData;
      }

      const response = await fetch(API_URLS.auth, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        logActivity(data.user.id, 'login', `Пользователь ${data.user.full_name} вошёл в систему`);
        toast({ title: '✅ Вход выполнен', description: `Добро пожаловать, ${data.user.full_name}` });
      } else {
        toast({ title: '❌ Ошибка', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '❌ Ошибка подключения', variant: 'destructive' });
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({ title: 'Вы вышли из системы' });
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      
      // Синхронизируем camelCase и snake_case поля
      if (updates.fullName) {
        updatedUser.full_name = updates.fullName;
      }
      if (updates.avatar) {
        updatedUser.vk_photo = updates.avatar;
      }
      
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const refreshUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URLS.users}?role=all`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.users.find((u: User) => u.id === user.id);
        
        if (updatedUser) {
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          toast({ title: '✅ Данные обновлены', description: 'Ваши права доступа изменены' });
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  }, [user, toast]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      
      // Check if user's role has changed since last login
      fetch(`${API_URLS.users}?role=all`)
        .then(res => res.json())
        .then(data => {
          const currentUser = data.users.find((u: User) => u.id === userData.id);
          if (currentUser && currentUser.role !== userData.role) {
            setUser(currentUser);
            localStorage.setItem('user', JSON.stringify(currentUser));
            toast({ 
              title: '⚡ Ваша роль изменена', 
              description: 'Права доступа обновлены' 
            });
          }
        })
        .catch(err => console.error('Failed to verify user role:', err));
    }
  }, [toast]);

  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      refreshUserData();
    }, 30000);
    
    // Listen for role changes from other tabs or admin actions
    const handleRoleChange = (event: CustomEvent) => {
      if (event.detail.userId === user.id) {
        refreshUserData();
      }
    };
    
    window.addEventListener('user-role-changed', handleRoleChange as EventListener);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('user-role-changed', handleRoleChange as EventListener);
    };
  }, [user?.id, refreshUserData]);

  return { user, login, logout, updateUserProfile, refreshUserData };
};