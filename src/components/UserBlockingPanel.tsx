import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_blocked?: boolean;
  is_frozen?: boolean;
  frozen_until?: string;
  blocked_reason?: string;
  last_ip?: string;
  device_fingerprint?: string;
}

interface Props {
  users: User[];
  onBlockUser: (userId: number, reason: string, permanent: boolean) => void;
  onUnblockUser: (userId: number) => void;
  onFreezeUser: (userId: number, until: Date) => void;
  onUnfreezeUser: (userId: number) => void;
}

export default function UserBlockingPanel({ users, onBlockUser, onUnblockUser, onFreezeUser, onUnfreezeUser }: Props) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [freezeDate, setFreezeDate] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);

  const handleBlockUser = (permanent: boolean) => {
    if (selectedUser && blockReason) {
      onBlockUser(selectedUser.id, blockReason, permanent);
      setShowBlockModal(false);
      setBlockReason('');
      setSelectedUser(null);
    }
  };

  const handleFreezeUser = () => {
    if (selectedUser && freezeDate) {
      onFreezeUser(selectedUser.id, new Date(freezeDate));
      setShowFreezeModal(false);
      setFreezeDate('');
      setSelectedUser(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager': return 'bg-blue-500';
      case 'artist': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const filterableUsers = users.filter(u => u.role !== 'director');

  return (
    <div className="space-y-6">
      <Card className="bg-black/40 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Icon name="ShieldAlert" size={24} className="text-red-400" />
            Управление доступом
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Блокировка или заморозка пользователей по IP и устройству
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filterableUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  user.is_blocked
                    ? 'bg-red-500/10 border-red-500/30'
                    : user.is_frozen
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Icon name={user.role === 'manager' ? 'Target' : 'Music'} size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold">{user.full_name}</p>
                      <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                      {user.is_blocked && (
                        <Badge className="bg-red-500">
                          <Icon name="Ban" size={12} className="mr-1" />
                          Заблокирован
                        </Badge>
                      )}
                      {user.is_frozen && (
                        <Badge className="bg-yellow-500">
                          <Icon name="Snowflake" size={12} className="mr-1" />
                          Заморожен
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">@{user.username}</p>
                    {user.last_ip && (
                      <p className="text-xs text-gray-500 mt-1">IP: {user.last_ip}</p>
                    )}
                    {user.blocked_reason && (
                      <p className="text-xs text-red-400 mt-1">Причина: {user.blocked_reason}</p>
                    )}
                    {user.is_frozen && user.frozen_until && (
                      <p className="text-xs text-yellow-400 mt-1">
                        До: {new Date(user.frozen_until).toLocaleString('ru-RU')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {user.is_blocked ? (
                    <Button
                      onClick={() => onUnblockUser(user.id)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Icon name="Unlock" size={16} className="mr-2" />
                      Разблокировать
                    </Button>
                  ) : user.is_frozen ? (
                    <Button
                      onClick={() => onUnfreezeUser(user.id)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <Icon name="Play" size={16} className="mr-2" />
                      Разморозить
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowBlockModal(true);
                        }}
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <Icon name="Ban" size={16} className="mr-2" />
                        Заблокировать
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowFreezeModal(true);
                        }}
                        variant="outline"
                        className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20"
                      >
                        <Icon name="Snowflake" size={16} className="mr-2" />
                        Заморозить
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-black/90 border-red-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Icon name="Ban" size={24} className="text-red-400" />
                Блокировка пользователя
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-white font-semibold">{selectedUser.full_name}</p>
                <p className="text-sm text-gray-400">@{selectedUser.username}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Причина блокировки</Label>
                <Textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Нарушение правил, спам, и т.д."
                  className="bg-white/10 border-white/20 text-white"
                  rows={3}
                />
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-400">
                  <Icon name="AlertTriangle" size={16} className="inline mr-2" />
                  Блокировка по IP и устройству. Пользователь не сможет войти даже с другого аккаунта.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleBlockUser(true)}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  disabled={!blockReason}
                >
                  Заблокировать навсегда
                </Button>
                <Button
                  onClick={() => {
                    setShowBlockModal(false);
                    setBlockReason('');
                  }}
                  variant="outline"
                  className="flex-1 border-white/20 text-white"
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showFreezeModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-black/90 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Icon name="Snowflake" size={24} className="text-yellow-400" />
                Заморозка аккаунта
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-white font-semibold">{selectedUser.full_name}</p>
                <p className="text-sm text-gray-400">@{selectedUser.username}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Заморозить до</Label>
                <Input
                  type="datetime-local"
                  value={freezeDate}
                  onChange={(e) => setFreezeDate(e.target.value)}
                  className="bg-white/10 border-white/20 text-white"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm text-yellow-400">
                  <Icon name="Info" size={16} className="inline mr-2" />
                  Временная блокировка. Доступ восстановится автоматически.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleFreezeUser}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                  disabled={!freezeDate}
                >
                  Заморозить
                </Button>
                <Button
                  onClick={() => {
                    setShowFreezeModal(false);
                    setFreezeDate('');
                  }}
                  variant="outline"
                  className="flex-1 border-white/20 text-white"
                >
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
