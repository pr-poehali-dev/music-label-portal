import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import OnlineStatusBadge from '@/components/OnlineStatusBadge';

interface User {
  id: number;
  username: string;
  role: 'artist' | 'manager' | 'director';
  full_name: string;
  revenue_share_percent?: number;
  is_blocked?: boolean;
  is_frozen?: boolean;
  frozen_until?: string;
  blocked_reason?: string;
  last_ip?: string;
  device_fingerprint?: string;
  telegram_id?: string;
}

interface UserManagementProps {
  allUsers: User[];
  newUser: {
    username: string;
    full_name: string;
    role: string;
    revenue_share_percent?: number;
  };
  onNewUserChange: (user: { username: string; full_name: string; role: string; revenue_share_percent?: number }) => void;
  onCreateUser: () => void;
  onBlockUser?: (userId: number, reason: string, permanent: boolean) => void;
  onUnblockUser?: (userId: number) => void;
  onFreezeUser?: (userId: number, until: Date) => void;
  onUnfreezeUser?: (userId: number) => void;
  onUpdateUser?: (userId: number, userData: Partial<User>) => void;
  isUserOnline?: (userId: number) => boolean;
  getUserLastSeen?: (userId: number) => string;
}

const UserManagement = React.memo(function UserManagement({ 
  allUsers, 
  newUser, 
  onNewUserChange, 
  onCreateUser,
  onBlockUser,
  onUnblockUser,
  onFreezeUser,
  onUnfreezeUser,
  onUpdateUser,
  isUserOnline,
  getUserLastSeen
}: UserManagementProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [freezeDate, setFreezeDate] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<Partial<User>>({});

  const handleBlockUser = (permanent: boolean) => {
    if (selectedUser && blockReason && onBlockUser) {
      onBlockUser(selectedUser.id, blockReason, permanent);
      setShowBlockModal(false);
      setBlockReason('');
      setSelectedUser(null);
    }
  };

  const handleFreezeUser = () => {
    if (selectedUser && freezeDate && onFreezeUser) {
      onFreezeUser(selectedUser.id, new Date(freezeDate));
      setShowFreezeModal(false);
      setFreezeDate('');
      setSelectedUser(null);
    }
  };

  const handleEditUser = () => {
    if (selectedUser && onUpdateUser) {
      onUpdateUser(selectedUser.id, editData);
      setShowEditModal(false);
      setEditData({});
      setSelectedUser(null);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setEditData({
      full_name: user.full_name,
      username: user.username,
      role: user.role,
      revenue_share_percent: user.revenue_share_percent || 50
    });
    setShowEditModal(true);
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="border-primary/20 bg-card/95 lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-primary text-base flex items-center gap-2">
            <Icon name="UserPlus" size={18} />
            Создать пользователя
          </CardTitle>
          <CardDescription className="text-xs">Добавьте в систему</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="new_username" className="text-xs">Логин</Label>
            <Input
              id="new_username"
              placeholder="username"
              value={newUser.username}
              onChange={(e) => onNewUserChange({ ...newUser, username: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_full_name" className="text-xs">Полное имя</Label>
            <Input
              id="new_full_name"
              placeholder="Иван Иванов"
              value={newUser.full_name}
              onChange={(e) => onNewUserChange({ ...newUser, full_name: e.target.value })}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_role" className="text-xs">Роль</Label>
            <Select value={newUser.role} onValueChange={(val) => onNewUserChange({ ...newUser, role: val })}>
              <SelectTrigger id="new_role" className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="artist">🎤 Артист</SelectItem>
                <SelectItem value="manager">🎯 Менеджер</SelectItem>
                <SelectItem value="director">👑 Руководитель</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {newUser.role === 'artist' && (
            <div className="space-y-2">
              <Label htmlFor="revenue_share" className="text-xs">% артиста</Label>
              <Input
                id="revenue_share"
                type="number"
                min="0"
                max="100"
                placeholder="50"
                value={newUser.revenue_share_percent || 50}
                onChange={(e) => onNewUserChange({ ...newUser, revenue_share_percent: parseInt(e.target.value) || 50 })}
                className="h-9 text-sm"
              />
            </div>
          )}
          <Button onClick={onCreateUser} className="w-full bg-secondary hover:bg-secondary/90 h-9 text-sm">
            <Icon name="UserPlus" size={14} className="mr-2" />
            Создать (пароль: 12345)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/95 lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-primary text-base flex items-center gap-2">
            <Icon name="Users" size={18} />
            Все пользователи ({allUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {allUsers.map((u) => (
              <div key={u.id} className={`p-2.5 rounded-lg border transition-all ${u.is_blocked ? 'bg-red-500/10 border-red-500/30' : u.is_frozen ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-muted/30 border-border/50 hover:bg-muted/50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {isUserOnline && (
                        <OnlineStatusBadge 
                          isOnline={isUserOnline(u.id)} 
                          lastSeen={getUserLastSeen ? getUserLastSeen(u.id) : undefined}
                          size="sm"
                        />
                      )}
                      <p className="font-semibold text-sm truncate">{u.full_name}</p>
                      <Badge variant="outline" className="border-primary/50 text-[10px] px-1.5 py-0">
                        {u.role === 'director' ? '👑' : u.role === 'manager' ? '🎯' : '🎤'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                      {u.telegram_id && (
                        <Badge variant="outline" className="border-blue-500/50 bg-blue-500/10 text-[10px] px-1.5 py-0">
                          <Icon name="Send" size={8} className="mr-0.5" />
                          TG
                        </Badge>
                      )}
                      {u.is_blocked && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          <Icon name="Ban" size={8} className="mr-0.5" />
                          Блок
                        </Badge>
                      )}
                      {u.is_frozen && (
                        <Badge className="bg-yellow-500 text-[10px] px-1.5 py-0">
                          <Icon name="Snowflake" size={8} className="mr-0.5" />
                          Заморожен
                        </Badge>
                      )}
                    </div>
                    {u.blocked_reason && <p className="text-[10px] text-red-400 mt-1">Причина: {u.blocked_reason}</p>}
                    {u.is_frozen && u.frozen_until && <p className="text-[10px] text-yellow-400 mt-1">До: {new Date(u.frozen_until).toLocaleString('ru-RU')}</p>}
                  </div>
                  {u.role !== 'director' && (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => openEditModal(u)} 
                        className="h-7 w-7 p-0 hover:bg-blue-500/20 hover:text-blue-400"
                        title="Редактировать"
                      >
                        <Icon name="Edit" size={14} />
                      </Button>
                      {u.is_blocked ? (
                        <Button 
                          size="sm" 
                          onClick={() => onUnblockUser && onUnblockUser(u.id)} 
                          className="h-7 px-2 bg-green-500 hover:bg-green-600 text-xs"
                        >
                          <Icon name="Unlock" size={12} />
                        </Button>
                      ) : u.is_frozen ? (
                        <Button 
                          size="sm" 
                          onClick={() => onUnfreezeUser && onUnfreezeUser(u.id)} 
                          className="h-7 px-2 bg-blue-500 hover:bg-blue-600 text-xs"
                        >
                          <Icon name="Play" size={12} />
                        </Button>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => { setSelectedUser(u); setShowBlockModal(true); }} 
                            className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400"
                            title="Заблокировать"
                          >
                            <Icon name="Ban" size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => { setSelectedUser(u); setShowFreezeModal(true); }} 
                            className="h-7 w-7 p-0 hover:bg-yellow-500/20 hover:text-yellow-400"
                            title="Заморозить"
                          >
                            <Icon name="Snowflake" size={14} />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <Card className="w-full max-w-md bg-card border-red-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Icon name="Ban" size={20} className="text-red-400" />
                Блокировка пользователя
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm">{selectedUser.full_name}</p>
                <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Причина блокировки</Label>
                <Textarea 
                  value={blockReason} 
                  onChange={(e) => setBlockReason(e.target.value)} 
                  placeholder="Нарушение правил, спам, и т.д." 
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={() => handleBlockUser(true)} 
                  className="flex-1 bg-red-500 hover:bg-red-600 h-10"
                >
                  <Icon name="Ban" size={16} className="mr-2" />
                  <span className="text-sm">Заблокировать</span>
                </Button>
                <Button 
                  onClick={() => { setShowBlockModal(false); setSelectedUser(null); setBlockReason(''); }} 
                  variant="outline"
                  className="h-10"
                >
                  <span className="text-sm">Отмена</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 overflow-y-auto">
          <Card className="w-full max-w-md bg-card border-blue-500/30 my-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Icon name="Edit" size={20} className="text-blue-400" />
                Редактирование пользователя
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Полное имя</Label>
                <Input
                  value={editData.full_name || ''}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  placeholder="Иван Иванов"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Логин</Label>
                <Input
                  value={editData.username || ''}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  placeholder="username"
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Роль</Label>
                <Select 
                  value={editData.role || selectedUser.role} 
                  onValueChange={(val) => setEditData({ ...editData, role: val as 'artist' | 'manager' | 'director' })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="artist">🎤 Артист</SelectItem>
                    <SelectItem value="manager">🎯 Менеджер</SelectItem>
                    <SelectItem value="director">👑 Руководитель</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(editData.role === 'artist' || selectedUser.role === 'artist') && (
                <div className="space-y-2">
                  <Label className="text-sm">% артиста от дохода</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editData.revenue_share_percent || 50}
                    onChange={(e) => setEditData({ ...editData, revenue_share_percent: parseInt(e.target.value) || 50 })}
                    className="h-10"
                  />
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button 
                  onClick={handleEditUser} 
                  className="flex-1 bg-blue-500 hover:bg-blue-600 h-10"
                >
                  <Icon name="Check" size={16} className="mr-2" />
                  <span className="text-sm">Сохранить</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => { setShowEditModal(false); setEditData({}); setSelectedUser(null); }} 
                  className="h-10"
                >
                  <span className="text-sm">Отмена</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showFreezeModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3">
          <Card className="w-full max-w-md bg-card border-yellow-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Icon name="Snowflake" size={20} className="text-yellow-400" />
                Заморозка пользователя
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-sm">{selectedUser.full_name}</p>
                <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Заморозить до</Label>
                <Input 
                  type="datetime-local" 
                  value={freezeDate} 
                  onChange={(e) => setFreezeDate(e.target.value)}
                  className="h-10"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleFreezeUser} 
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black h-10"
                >
                  <Icon name="Snowflake" size={16} className="mr-2" />
                  <span className="text-sm">Заморозить</span>
                </Button>
                <Button 
                  onClick={() => { setShowFreezeModal(false); setSelectedUser(null); setFreezeDate(''); }} 
                  variant="outline"
                  className="h-10"
                >
                  <span className="text-sm">Отмена</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});

export default UserManagement;