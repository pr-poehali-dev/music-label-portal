import { useState, useEffect, useCallback } from 'react';

interface UserOnlineStatus {
  userId: number;
  isOnline: boolean;
  lastSeen: string;
}

const HEARTBEAT_INTERVAL = 30000; // 30 секунд
const ONLINE_THRESHOLD = 60000; // 1 минута

export const useOnlineStatus = (currentUserId?: number) => {
  const [onlineUsers, setOnlineUsers] = useState<Map<number, UserOnlineStatus>>(new Map());

  const updateHeartbeat = useCallback(async (userId: number) => {
    try {
      const now = new Date().toISOString();
      localStorage.setItem(`heartbeat_${userId}`, now);
      
      const allHeartbeats = new Map<number, UserOnlineStatus>();
      const keys = Object.keys(localStorage);
      
      for (const key of keys) {
        if (key.startsWith('heartbeat_')) {
          const uid = parseInt(key.replace('heartbeat_', ''));
          const lastSeen = localStorage.getItem(key) || '';
          const lastSeenTime = new Date(lastSeen).getTime();
          const isOnline = Date.now() - lastSeenTime < ONLINE_THRESHOLD;
          
          allHeartbeats.set(uid, {
            userId: uid,
            isOnline,
            lastSeen
          });
        }
      }
      
      setOnlineUsers(allHeartbeats);
    } catch (error) {
      console.error('Failed to update heartbeat:', error);
    }
  }, []);

  const checkOnlineStatus = useCallback(() => {
    const allHeartbeats = new Map<number, UserOnlineStatus>();
    const keys = Object.keys(localStorage);
    
    for (const key of keys) {
      if (key.startsWith('heartbeat_')) {
        const uid = parseInt(key.replace('heartbeat_', ''));
        const lastSeen = localStorage.getItem(key) || '';
        const lastSeenTime = new Date(lastSeen).getTime();
        const isOnline = Date.now() - lastSeenTime < ONLINE_THRESHOLD;
        
        allHeartbeats.set(uid, {
          userId: uid,
          isOnline,
          lastSeen
        });
      }
    }
    
    setOnlineUsers(allHeartbeats);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    updateHeartbeat(currentUserId);

    const heartbeatTimer = setInterval(() => {
      updateHeartbeat(currentUserId);
    }, HEARTBEAT_INTERVAL);

    const checkTimer = setInterval(() => {
      checkOnlineStatus();
    }, 10000);

    const handleVisibilityChange = () => {
      if (!document.hidden && currentUserId) {
        updateHeartbeat(currentUserId);
      }
    };

    const handleBeforeUnload = () => {
      if (currentUserId) {
        localStorage.removeItem(`heartbeat_${currentUserId}`);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(checkTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentUserId, updateHeartbeat, checkOnlineStatus]);

  const isUserOnline = useCallback((userId: number): boolean => {
    return onlineUsers.get(userId)?.isOnline || false;
  }, [onlineUsers]);

  const getUserLastSeen = useCallback((userId: number): string => {
    const status = onlineUsers.get(userId);
    if (!status) return 'Никогда';
    if (status.isOnline) return 'Онлайн';
    
    const lastSeenTime = new Date(status.lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч назад`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} дн назад`;
  }, [onlineUsers]);

  return {
    onlineUsers,
    isUserOnline,
    getUserLastSeen,
    updateHeartbeat
  };
};
