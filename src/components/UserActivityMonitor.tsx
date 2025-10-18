import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useState, useEffect } from 'react';
import { getActivityLogs, getUserActivityLogs, getActivityStats } from '@/utils/activityLogger';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
}

interface Props {
  users?: User[];
}

export default function UserActivityMonitor({ users = [] }: Props) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setStats(getActivityStats());
    
    if (selectedUserId) {
      setLogs(getUserActivityLogs(selectedUserId));
    } else {
      setLogs(getActivityLogs().slice(-50));
    }
  }, [selectedUserId]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'login': return 'LogIn';
      case 'logout': return 'LogOut';
      case 'create_ticket': return 'Plus';
      case 'update_ticket_status': return 'Edit';
      case 'assign_ticket': return 'UserPlus';
      default: return 'Activity';
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'login': return 'text-green-600';
      case 'logout': return 'text-muted-foreground';
      case 'create_ticket': return 'text-blue-600';
      case 'update_ticket_status': return 'text-yellow-600';
      case 'assign_ticket': return 'text-purple-600';
      default: return 'text-foreground';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Icon name="Activity" size={32} className="text-primary" />
        <h1 className="text-3xl font-bold">Мониторинг активности</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Всего действий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalActions || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Активных пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.uniqueUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">За 24 часа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.last24Hours || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Типов действий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.actionTypes ? Object.keys(stats.actionTypes).length : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Icon name="Activity" size={20} />
              Журнал активности
            </CardTitle>
            <Select
              value={selectedUserId?.toString() || 'all'}
              onValueChange={(val) => setSelectedUserId(val === 'all' ? null : parseInt(val))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Все пользователи" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все пользователи</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.full_name} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Icon name="AlertCircle" size={48} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Нет записей активности</p>
              </div>
            ) : (
              logs.reverse().map((log, idx) => {
                const user = users.find(u => u.id === log.userId);
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className={`p-2 rounded-full bg-accent ${getActionColor(log.actionType)}`}>
                      <Icon name={getActionIcon(log.actionType) as any} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {user?.full_name || 'Неизвестный пользователь'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {user?.role || 'unknown'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">{log.actionDescription}</p>
                      {log.metadata && (
                        <div className="mt-2 text-xs text-muted-foreground font-mono">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Icon name="Clock" size={12} />
                          {new Date(log.timestamp).toLocaleString('ru-RU')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Icon name="Laptop" size={12} />
                          {log.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}