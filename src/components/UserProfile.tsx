import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface UserProfileProps {
  user: User;
  onUpdateProfile: (updates: Partial<User>) => void;
}

const UserProfile = React.memo(function UserProfile({ user, onUpdateProfile }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName || user.full_name || '');
  const [email, setEmail] = useState(user.email || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar || null);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = useCallback(() => {
    onUpdateProfile({
      fullName,
      email,
      avatar: avatarPreview || undefined
    });
    setIsEditing(false);
  }, [fullName, email, avatarPreview, onUpdateProfile]);

  const handleCancel = useCallback(() => {
    setFullName(user.fullName || user.full_name || '');
    setEmail(user.email || '');
    setAvatarPreview(user.avatar || null);
    setIsEditing(false);
  }, [user]);

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      director: 'Директор',
      manager: 'Менеджер',
      artist: 'Артист'
    };
    return roles[role] || role;
  };

  const getRoleIcon = (role: string) => {
    const icons: Record<string, string> = {
      director: 'Crown',
      manager: 'Briefcase',
      artist: 'Mic'
    };
    return icons[role] || 'User';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-950/20 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Icon name="User" size={32} className="text-blue-400" />
          <h1 className="text-3xl font-bold">Мой профиль</h1>
        </div>

        <Card className="bg-card/50 backdrop-blur border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Icon name={getRoleIcon(user.role)} size={24} className="text-blue-400" />
                Личная информация
              </span>
              {!isEditing && (
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Icon name="Edit" size={16} />
                  Редактировать
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  {avatarPreview ? (
                    <img 
                      src={avatarPreview} 
                      alt="Avatar" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-500/30"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border-4 border-blue-500/30">
                      <Icon name="User" size={48} className="text-blue-400" />
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full cursor-pointer transition-colors">
                      <Icon name="Camera" size={16} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="text-center">
                  <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                    {getRoleLabel(user.role)}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div>
                  <Label>Логин</Label>
                  <Input 
                    value={user.login || user.username || ''} 
                    disabled
                    className="bg-muted/50"
                  />
                </div>

                <div>
                  <Label>Полное имя</Label>
                  <Input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-muted/50' : ''}
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-muted/50' : ''}
                  />
                </div>

                <div>
                  <Label>ID пользователя</Label>
                  <Input 
                    value={user.id} 
                    disabled
                    className="bg-muted/50 font-mono text-sm"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleSave}
                      className="flex-1 bg-blue-500 hover:bg-blue-600"
                    >
                      <Icon name="Save" size={16} className="mr-2" />
                      Сохранить
                    </Button>
                    <Button 
                      onClick={handleCancel}
                      variant="outline"
                      className="flex-1"
                    >
                      <Icon name="X" size={16} className="mr-2" />
                      Отмена
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Info" size={24} className="text-blue-400" />
              Статус аккаунта
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <Icon 
                  name={user.isBlocked ? 'Ban' : 'CheckCircle'} 
                  size={20} 
                  className={user.isBlocked ? 'text-red-400' : 'text-green-400'}
                />
                <div>
                  <div className="text-sm text-muted-foreground">Доступ</div>
                  <div className="font-medium">
                    {user.isBlocked ? 'Заблокирован' : 'Активен'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <Icon 
                  name={user.isFrozen ? 'Snowflake' : 'Flame'} 
                  size={20} 
                  className={user.isFrozen ? 'text-yellow-400' : 'text-green-400'}
                />
                <div>
                  <div className="text-sm text-muted-foreground">Статус</div>
                  <div className="font-medium">
                    {user.isFrozen ? `Заморожен до ${user.freezeUntil || ''}` : 'Работает'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

export default UserProfile;