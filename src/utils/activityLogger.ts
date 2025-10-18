const ACTIVITY_LOGS_KEY = 'user_activity_logs';

interface ActivityLog {
  userId: number;
  actionType: string;
  actionDescription: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent: string;
  timestamp: string;
}

export function logActivity(
  userId: number,
  actionType: string,
  actionDescription: string,
  metadata?: Record<string, any>
): void {
  const log: ActivityLog = {
    userId,
    actionType,
    actionDescription,
    metadata,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  const logs = getActivityLogs();
  logs.push(log);

  const maxLogs = 1000;
  if (logs.length > maxLogs) {
    logs.splice(0, logs.length - maxLogs);
  }

  localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(logs));
}

export function getActivityLogs(): ActivityLog[] {
  const stored = localStorage.getItem(ACTIVITY_LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getUserActivityLogs(userId: number): ActivityLog[] {
  return getActivityLogs().filter(log => log.userId === userId);
}

export function clearActivityLogs(): void {
  localStorage.removeItem(ACTIVITY_LOGS_KEY);
}

export function getActivityStats() {
  const logs = getActivityLogs();
  const stats = {
    totalActions: logs.length,
    uniqueUsers: new Set(logs.map(l => l.userId)).size,
    actionTypes: {} as Record<string, number>,
    last24Hours: 0
  };

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;

  logs.forEach(log => {
    stats.actionTypes[log.actionType] = (stats.actionTypes[log.actionType] || 0) + 1;
    
    if (new Date(log.timestamp).getTime() > dayAgo) {
      stats.last24Hours++;
    }
  });

  return stats;
}
