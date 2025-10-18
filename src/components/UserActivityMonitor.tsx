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
      case 'login': return 'text-green-400';
      case 'logout': return 'text-gray-400';
      case 'create_ticket': return 'text-blue-400';
      case 'update_ticket_status': return 'text-yellow-400';
      case 'assign_ticket': return 'text-purple-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Всего действий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats?.totalActions || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Активных пользователей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats?.uniqueUsers || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">За 24 часа</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats?.last24Hours || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500/20 to-pink-600/10 border-pink-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Типов действий</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats?.actionTypes ? Object.keys(stats.actionTypes).length : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Icon name="Activity" size={20} />
              Журнал активности
            </CardTitle>
            <Select
              value={selectedUserId?.toString() || 'all'}
              onValueChange={(val) => setSelectedUserId(val === 'all' ? null : parseInt(val))}
            >
              <SelectTrigger className="w-64 bg-white/5 border-white/10">
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
                <Icon name="AlertCircle" size={48} className="text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">Нет записей активности</p>
              </div>
            ) : (
              logs.reverse().map((log, idx) => {
                const user = users.find(u => u.id === log.userId);
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className={`p-2 rounded-full bg-white/10 ${getActionColor(log.actionType)}`}>
                      <Icon name={getActionIcon(log.actionType) as any} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium">
                          {user?.full_name || 'Неизвестный пользователь'}
                        </span>
                        <Badge className="bg-white/10 text-white text-xs">
                          {user?.role || 'unknown'}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm mt-1">{log.actionDescription}</p>
                      {log.metadata && (
                        <div className="mt-2 text-xs text-gray-500 font-mono">
                          {JSON.stringify(log.metadata)}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
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