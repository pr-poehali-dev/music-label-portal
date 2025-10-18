import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import OnlineStatusBadge from '@/components/OnlineStatusBadge';
import { useActivityTracking } from '@/hooks/useActivityTracking';

interface User {
  id: number;
  username: string;
  role: 'artist' | 'manager' | 'director';
  full_name: string;
}

interface UserActivityStatsProps {
  users: User[];
  isUserOnline: (userId: number) => boolean;
  getUserLastSeen: (userId: number) => string;
}

const UserActivityStats = React.memo(function UserActivityStats({ 
  users, 
  isUserOnline, 
  getUserLastSeen 
}: UserActivityStatsProps) {
  const { stats, getUserStats, formatTime, calculateStats } = useActivityTracking();

  useEffect(() => {
    const interval = setInterval(() => {
      calculateStats();
    }, 60000);

    calculateStats();

    return () => clearInterval(interval);
  }, [calculateStats]);

  const getRoleIcon = (role: string) => {
    if (role === 'director') return 'Crown';
    if (role === 'manager') return 'Briefcase';
    return 'Mic';
  };

  const getRoleLabel = (role: string) => {
    if (role === 'director') return 'Директор';
    if (role === 'manager') return 'Менеджер';
    return 'Артист';
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aStats = getUserStats(a.id);
    const bStats = getUserStats(b.id);
    const aTime = aStats?.todayTime || 0;
    const bTime = bStats?.todayTime || 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Activity" size={24} className="text-blue-400" />
            Статистика активности пользователей
          </CardTitle>
          <CardDescription>Время работы в системе за сегодня и неделю</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedUsers.map((user) => {
              const userStats = getUserStats(user.id);
              const isOnline = isUserOnline(user.id);
              const lastSeen = getUserLastSeen(user.id);

              return (
                <div 
                  key={user.id} 
                  className="p-4 rounded-lg bg-muted/50 border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <OnlineStatusBadge 
                          isOnline={isOnline}
                          lastSeen={lastSeen}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{user.full_name}</p>
                            <Badge variant="outline" className="border-primary/50">
                              <Icon name={getRoleIcon(user.role)} size={12} className="mr-1" />
                              {getRoleLabel(user.role)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                        <div className="flex items-center gap-2 p-2 rounded bg-background/50">
                          <Icon name="Clock" size={16} className="text-blue-400" />
                          <div>
                            <p className="text-xs text-muted-foreground">Сегодня</p>
                            <p className="text-sm font-medium text-foreground">
                              {userStats ? formatTime(userStats.todayTime) : '0 мин'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded bg-background/50">
                          <Icon name="Calendar" size={16} className="text-purple-400" />
                          <div>
                            <p className="text-xs text-muted-foreground">За неделю</p>
                            <p className="text-sm font-medium text-foreground">
                              {userStats ? formatTime(userStats.weekTime) : '0 мин'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-2 rounded bg-background/50">
                          <Icon name={isOnline ? 'Zap' : 'Moon'} size={16} className={isOnline ? 'text-green-400' : 'text-gray-400'} />
                          <div>
                            <p className="text-xs text-muted-foreground">Статус</p>
                            <p className="text-sm font-medium text-foreground">
                              {isOnline ? 'Онлайн' : lastSeen}
                            </p>
                          </div>
                        </div>
                      </div>

                      {userStats?.dailyStats && userStats.dailyStats.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-2">Активность за неделю:</p>
                          <div className="flex gap-1">
                            {userStats.dailyStats.map((day, idx) => {
                              const maxTime = Math.max(...userStats.dailyStats.map(d => d.totalTime), 1);
                              const heightPercent = (day.totalTime / maxTime) * 100;
                              const date = new Date(day.date);
                              const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });

                              return (
                                <div 
                                  key={idx} 
                                  className="flex-1 flex flex-col items-center gap-1"
                                  title={`${dayName}: ${formatTime(day.totalTime)}`}
                                >
                                  <div className="w-full bg-muted rounded-sm overflow-hidden" style={{ height: '60px' }}>
                                    <div 
                                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 transition-all duration-300"
                                      style={{ 
                                        height: `${heightPercent}%`,
                                        marginTop: `${100 - heightPercent}%`
                                      }}
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground">{dayName}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {sortedUsers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Users" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Нет данных об активности пользователей</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export default UserActivityStats;
