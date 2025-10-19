import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return { user, login, logout };
};