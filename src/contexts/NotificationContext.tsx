import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_ENDPOINTS } from '@/config/api';

interface UnreadCounts {
  tickets: number;
  tasks: number;
  messages: number;
  submissions: number;
}

interface NotificationContextValue {
  unreadCounts: UnreadCounts;
  refreshCounts: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

let globalAudioContext: AudioContext | null = null;

function playNotificationSound() {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  
  const oscillator = globalAudioContext.createOscillator();
  const gainNode = globalAudioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(globalAudioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = 'sine';

  const currentTime = globalAudioContext.currentTime;
  gainNode.gain.setValueAtTime(0.3, currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);

  oscillator.start(currentTime);
  oscillator.stop(currentTime + 0.3);
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    tickets: 0,
    tasks: 0,
    messages: 0,
    submissions: 0
  });
  const [loading, setLoading] = useState(false);
  const prevCountsRef = useRef<UnreadCounts>(unreadCounts);
  const lastFetchRef = useRef<number>(0);
  const DEBOUNCE_TIME = 5000;

  const fetchUnreadCounts = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchRef.current < DEBOUNCE_TIME) {
      return;
    }
    
    lastFetchRef.current = now;
    setLoading(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const userId = localStorage.getItem('user_id');
      
      if (!token || !userId) {
        setLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.UNREAD_COUNTS, {
        headers: {
          'X-User-Id': userId,
          'X-Auth-Token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        const newCounts = data as UnreadCounts;
        
        const prevCounts = prevCountsRef.current;
        const hasNewNotifications = 
          newCounts.tickets > prevCounts.tickets ||
          newCounts.tasks > prevCounts.tasks ||
          newCounts.messages > prevCounts.messages ||
          newCounts.submissions > prevCounts.submissions;

        if (hasNewNotifications) {
          playNotificationSound();
          
          if ('Notification' in window && Notification.permission === 'granted') {
            let notificationText = '';
            if (newCounts.tickets > prevCounts.tickets) 
              notificationText += `Новых тикетов: ${newCounts.tickets - prevCounts.tickets}\n`;
            if (newCounts.tasks > prevCounts.tasks) 
              notificationText += `Новых задач: ${newCounts.tasks - prevCounts.tasks}\n`;
            if (newCounts.messages > prevCounts.messages) 
              notificationText += `Новых сообщений: ${newCounts.messages - prevCounts.messages}\n`;
            if (newCounts.submissions > prevCounts.submissions) 
              notificationText += `Новых заявок: ${newCounts.submissions - prevCounts.submissions}`;
            
            new Notification('Новые уведомления', {
              body: notificationText,
              icon: '/favicon.ico'
            });
          }
        }

        prevCountsRef.current = newCounts;
        setUnreadCounts(newCounts);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    requestNotificationPermission();
    fetchUnreadCounts();
    
    const interval = setInterval(fetchUnreadCounts, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);

  const value: NotificationContextValue = {
    unreadCounts,
    refreshCounts: fetchUnreadCounts,
    loading
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}