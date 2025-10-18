import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useState } from 'react';

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
}

export default function UserManagement({ 
  allUsers, 
  newUser, 
  onNewUserChange, 
  onCreateUser,
  onBlockUser,
  onUnblockUser,
  onFreezeUser,
  onUnfreezeUser,
  onUpdateUser
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
      revenue_share_percent: user.revenue_share_percent || 50
    });
    setShowEditModal(true);
  };
  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-card/95">
        <CardHeader>
          <CardTitle className="text-primary">Создать нового пользователя</CardTitle>
          <CardDescription>Добавьте артиста или менеджера в систему</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new_username">Логин</Label>
              <Input
                id="new_username"
                placeholder="username"
                value={newUser.username}
                onChange={(e) => onNewUserChange({ ...newUser, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_full_name">Полное имя</Label>
              <Input
                id="new_full_name"
                placeholder="Иван Иванов"
                value={newUser.full_name}
                onChange={(e) => onNewUserChange({ ...newUser, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new_role">Роль</Label>
              <Select value={newUser.role} onValueChange={(val) => onNewUserChange({ ...newUser, role: val })}>
                <SelectTrigger id="new_role">
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
                <Label htmlFor="revenue_share">% артиста</Label>
                <Input
                  id="revenue_share"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="50"
                  value={newUser.revenue_share_percent || 50}
                  onChange={(e) => onNewUserChange({ ...newUser, revenue_share_percent: parseInt(e.target.value) || 50 })}
                />
              </div>
            )}
          </div>
          <Button onClick={onCreateUser} className="w-full bg-secondary hover:bg-secondary/90">
            <Icon name="UserPlus" size={16} className="mr-2" />
            Создать пользователя (пароль: 12345)
          </Button>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-card/95">
        <CardHeader>
          <CardTitle className="text-primary">Все пользователи</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allUsers.map((u) => (
              <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg ${u.is_blocked ? 'bg-red-500/10 border border-red-500/30' : u.is_frozen ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-muted/50'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{u.full_name}</p>
                    <Badge variant="outline" className="border-primary/50">
                      {u.role === 'director' ? '👑 Руководитель' : u.role === 'manager' ? '🎯 Менеджер' : '🎤 Артист'}
                    </Badge>
                    {u.is_blocked && <Badge variant="destructive"><Icon name="Ban" size={12} className="mr-1" />Заблокирован</Badge>}
                    {u.is_frozen && <Badge className="bg-yellow-500"><Icon name="Snowflake" size={12} className="mr-1" />Заморожен</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">@{u.username}</p>
                  {u.blocked_reason && <p className="text-xs text-red-400 mt-1">Причина: {u.blocked_reason}</p>}
                  {u.is_frozen && u.frozen_until && <p className="text-xs text-yellow-400 mt-1">До: {new Date(u.frozen_until).toLocaleString('ru-RU')}</p>}
                </div>
                {u.role !== 'director' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditModal(u)} className="border-blue-500/50 text-blue-400">
                      <Icon name="Edit" size={14} className="mr-1" />
                      Изменить
                    </Button>
                    {u.is_blocked ? (
                      <Button size="sm" onClick={() => onUnblockUser && onUnblockUser(u.id)} className="bg-green-500 hover:bg-green-600">
                        <Icon name="Unlock" size={14} className="mr-1" />
                        Разблокировать
                      </Button>
                    ) : u.is_frozen ? (
                      <Button size="sm" onClick={() => onUnfreezeUser && onUnfreezeUser(u.id)} className="bg-blue-500 hover:bg-blue-600">
                        <Icon name="Play" size={14} className="mr-1" />
                        Разморозить
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setShowBlockModal(true); }} className="border-red-500/50 text-red-400">
                          <Icon name="Ban" size={14} className="mr-1" />
                          Блок
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setShowFreezeModal(true); }} className="border-yellow-500/50 text-yellow-400">
                          <Icon name="Snowflake" size={14} className="mr-1" />
                          Заморозка
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-red-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Ban" size={24} className="text-red-400" />
                Блокировка пользователя
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">{selectedUser.full_name}</p>
                <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
              </div>
              <div className="space-y-2">
                <Label>Причина блокировки</Label>
                <Textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Нарушение правил, спам, и т.д." rows={3} />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleBlockUser(true)} className="flex-1 bg-red-500 hover:bg-red-600">
                  <Icon name="Ban" size={16} className="mr-2" />
                  Заблокировать
                </Button>
                <Button onClick={() => { setShowBlockModal(false); setSelectedUser(null); setBlockReason(''); }} variant="outline">
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-blue-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Edit" size={24} className="text-blue-400" />
                Редактирование пользователя
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Полное имя</Label>
                <Input
                  value={editData.full_name || ''}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>
              <div>
                <Label>Логин</Label>
                <Input
                  value={editData.username || ''}
                  onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                  placeholder="username"
                />
              </div>
              {selectedUser.role === 'artist' && (
                <div>
                  <Label>% артиста от дохода</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editData.revenue_share_percent || 50}
                    onChange={(e) => setEditData({ ...editData, revenue_share_percent: parseInt(e.target.value) || 50 })}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleEditUser} className="flex-1 bg-blue-500 hover:bg-blue-600">
                  <Icon name="Check" size={16} className="mr-2" />
                  Сохранить
                </Button>
                <Button variant="outline" onClick={() => { setShowEditModal(false); setEditData({}); setSelectedUser(null); }} className="flex-1">
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showFreezeModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-yellow-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Snowflake" size={24} className="text-yellow-400" />
                Заморозка пользователя
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">{selectedUser.full_name}</p>
                <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
              </div>
              <div className="space-y-2">
                <Label>Заморозить до</Label>
                <Input type="datetime-local" value={freezeDate} onChange={(e) => setFreezeDate(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleFreezeUser} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black">
                  <Icon name="Snowflake" size={16} className="mr-2" />
                  Заморозить
                </Button>
                <Button onClick={() => { setShowFreezeModal(false); setSelectedUser(null); setFreezeDate(''); }} variant="outline">
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