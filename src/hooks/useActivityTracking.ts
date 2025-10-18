import { useState, useEffect, useCallback } from 'react';

interface ActivitySession {
  userId: number;
  startTime: string;
  endTime?: string;
  duration: number;
}

interface DailyStats {
  date: string;
  totalTime: number;
  sessions: number;
}

interface UserActivityStats {
  userId: number;
  todayTime: number;
  weekTime: number;
  dailyStats: DailyStats[];
  currentSession?: ActivitySession;
}

const TRACKING_INTERVAL = 60000; // 1 минута

export const useActivityTracking = (userId?: number) => {
  const [stats, setStats] = useState<Map<number, UserActivityStats>>(new Map());

  const saveSession = useCallback((session: ActivitySession) => {
    const sessions = JSON.parse(localStorage.getItem('activity_sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('activity_sessions', JSON.stringify(sessions));
  }, []);

  const startSession = useCallback((uid: number) => {
    const now = new Date().toISOString();
    const session: ActivitySession = {
      userId: uid,
      startTime: now,
      duration: 0
    };
    
    localStorage.setItem(`current_session_${uid}`, JSON.stringify(session));
  }, []);

  const updateSession = useCallback((uid: number) => {
    const sessionData = localStorage.getItem(`current_session_${uid}`);
    if (!sessionData) return;

    const session: ActivitySession = JSON.parse(sessionData);
    const now = new Date();
    const startTime = new Date(session.startTime);
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60); // в минутах

    session.duration = duration;
    localStorage.setItem(`current_session_${uid}`, JSON.stringify(session));
  }, []);

  const endSession = useCallback((uid: number) => {
    const sessionData = localStorage.getItem(`current_session_${uid}`);
    if (!sessionData) return;

    const session: ActivitySession = JSON.parse(sessionData);
    const now = new Date().toISOString();
    const startTime = new Date(session.startTime);
    const duration = Math.floor((new Date(now).getTime() - startTime.getTime()) / 1000 / 60);

    session.endTime = now;
    session.duration = duration;

    saveSession(session);
    localStorage.removeItem(`current_session_${uid}`);
  }, [saveSession]);

  const calculateStats = useCallback(() => {
    try {
      const allSessions: ActivitySession[] = JSON.parse(localStorage.getItem('activity_sessions') || '[]');
      const userStats = new Map<number, UserActivityStats>();

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);

      const uniqueUserIds = new Set<number>();
      allSessions.forEach(s => uniqueUserIds.add(s.userId));

      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('current_session_')) {
          const uid = parseInt(key.replace('current_session_', ''));
          uniqueUserIds.add(uid);
        }
      });

      uniqueUserIds.forEach(uid => {
        const userSessions = allSessions.filter(s => s.userId === uid);
        
        let currentSession: ActivitySession | undefined;
        const currentData = localStorage.getItem(`current_session_${uid}`);
        if (currentData) {
          currentSession = JSON.parse(currentData);
          const startTime = new Date(currentSession.startTime);
          const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
          currentSession.duration = duration;
        }

        const todaySessions = userSessions.filter(s => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= todayStart;
        });

        const weekSessions = userSessions.filter(s => {
          const sessionDate = new Date(s.startTime);
          return sessionDate >= weekStart;
        });

        const todayTime = todaySessions.reduce((sum, s) => sum + s.duration, 0) + (currentSession?.duration || 0);
        const weekTime = weekSessions.reduce((sum, s) => sum + s.duration, 0) + (currentSession?.duration || 0);

        const dailyStatsMap = new Map<string, DailyStats>();
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(todayStart);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          dailyStatsMap.set(dateStr, {
            date: dateStr,
            totalTime: 0,
            sessions: 0
          });
        }

        weekSessions.forEach(s => {
          const dateStr = new Date(s.startTime).toISOString().split('T')[0];
          const stats = dailyStatsMap.get(dateStr);
          if (stats) {
            stats.totalTime += s.duration;
            stats.sessions += 1;
          }
        });

        if (currentSession) {
          const dateStr = new Date(currentSession.startTime).toISOString().split('T')[0];
          const stats = dailyStatsMap.get(dateStr);
          if (stats) {
            stats.totalTime += currentSession.duration;
          }
        }

        userStats.set(uid, {
          userId: uid,
          todayTime,
          weekTime,
          dailyStats: Array.from(dailyStatsMap.values()).reverse(),
          currentSession
        });
      });

      setStats(userStats);
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const currentSessionData = localStorage.getItem(`current_session_${userId}`);
    if (!currentSessionData) {
      startSession(userId);
    }

    calculateStats();

    const trackingTimer = setInterval(() => {
      updateSession(userId);
      calculateStats();
    }, TRACKING_INTERVAL);

    const handleBeforeUnload = () => {
      endSession(userId);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(trackingTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId]);

  const getUserStats = useCallback((uid: number): UserActivityStats | null => {
    return stats.get(uid) || null;
  }, [stats]);

  const formatTime = useCallback((minutes: number): string => {
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours} ч ${mins} мин`;
  }, []);

  return {
    stats,
    getUserStats,
    formatTime,
    calculateStats
  };
};