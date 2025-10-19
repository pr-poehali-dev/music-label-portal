import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.vk_photo || user.avatar || null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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

  const handlePasswordChange = useCallback(async () => {
    setPasswordError('');
    setPasswordSuccess(false);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Заполните все поля');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Новые пароли не совпадают');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('Пароль должен быть не менее 4 символов');
      return;
    }

    try {
      const response = await fetch('https://functions.poehali.dev/fc19a64b-eb76-4cdf-bf49-f7ed121edba7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username || user.login,
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Не удалось изменить пароль');
        return;
      }

      setPasswordSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangingPassword(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error) {
      setPasswordError('Ошибка сети. Попробуйте еще раз');
    }
  }, [oldPassword, newPassword, confirmPassword, user]);

  const handleCancelPasswordChange = useCallback(() => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess(false);
    setIsChangingPassword(false);
  }, []);

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

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      director: 'bg-gradient-to-r from-amber-500 to-orange-500',
      manager: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      artist: 'bg-gradient-to-r from-purple-500 to-pink-500'
    };
    return colors[role] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative group">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar" 
                  className="w-32 h-32 rounded-2xl object-cover border-4 border-primary/20 shadow-xl"
                />
              ) : (
                <div className={`w-32 h-32 rounded-2xl ${getRoleColor(user.role)} flex items-center justify-center border-4 border-white/20 shadow-xl`}>
                  <Icon name={getRoleIcon(user.role)} size={56} className="text-white" />
                </div>
              )}
              {isEditing && (
                <label className="absolute bottom-2 right-2 bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl cursor-pointer transition-all shadow-lg hover:scale-105">
                  <Icon name="Camera" size={18} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="space-y-2">
                <h1 className="text-3xl md:text-4xl font-bold">{fullName || user.username || 'Пользователь'}</h1>
                <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                  <Badge className={`${getRoleColor(user.role)} text-white border-0 px-3 py-1`}>
                    <Icon name={getRoleIcon(user.role)} size={14} className="mr-1.5" />
                    {getRoleLabel(user.role)}
                  </Badge>
                  <Badge variant={user.isBlocked ? 'destructive' : 'default'} className="px-3 py-1">
                    <Icon name={user.isBlocked ? 'Ban' : 'CheckCircle'} size={14} className="mr-1.5" />
                    {user.isBlocked ? 'Заблокирован' : 'Активен'}
                  </Badge>
                  {user.isFrozen && (
                    <Badge variant="secondary" className="px-3 py-1">
                      <Icon name="Snowflake" size={14} className="mr-1.5" />
                      Заморожен
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground justify-center md:justify-start flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Icon name="AtSign" size={16} />
                  <span>{user.login || user.username}</span>
                </div>
                {email && (
                  <div className="flex items-center gap-1.5">
                    <Icon name="Mail" size={16} />
                    <span>{email}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Icon name="Hash" size={16} />
                  <span className="font-mono">ID: {user.id}</span>
                </div>
              </div>

              {!isEditing && (
                <Button 
                  onClick={() => setIsEditing(true)}
                  className="mt-4 gap-2"
                  size="lg"
                >
                  <Icon name="Edit" size={18} />
                  Редактировать профиль
                </Button>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Edit" size={24} className="text-primary" />
                Редактирование профиля
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-base">Полное имя</Label>
                  <Input 
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Введите ваше имя"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSave}
                  className="flex-1 h-11 gap-2"
                  size="lg"
                >
                  <Icon name="Check" size={18} />
                  Сохранить изменения
                </Button>
                <Button 
                  onClick={handleCancel}
                  variant="outline"
                  className="flex-1 h-11 gap-2"
                  size="lg"
                >
                  <Icon name="X" size={18} />
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon name="Shield" size={22} className="text-primary" />
                Безопасность
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon name="Key" size={20} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Пароль</div>
                      <div className="text-sm text-muted-foreground">••••••••</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                  >
                    {isChangingPassword ? 'Отмена' : 'Изменить'}
                    <Icon name={isChangingPassword ? 'X' : 'ChevronRight'} size={16} />
                  </Button>
                </div>

                {isChangingPassword && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="oldPassword">Текущий пароль</Label>
                      <Input 
                        id="oldPassword"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        placeholder="Введите текущий пароль"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Новый пароль</Label>
                      <Input 
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Минимум 6 символов"
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Повторите новый пароль</Label>
                      <Input 
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Повторите пароль"
                        className="h-10"
                      />
                    </div>

                    {passwordError && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                        <Icon name="AlertCircle" size={16} />
                        {passwordError}
                      </div>
                    )}

                    {passwordSuccess && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-600 text-sm">
                        <Icon name="CheckCircle2" size={16} />
                        Пароль успешно изменён!
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        onClick={handlePasswordChange}
                        className="flex-1 h-10"
                        size="sm"
                      >
                        <Icon name="Check" size={16} className="mr-1" />
                        Сохранить
                      </Button>
                      <Button 
                        onClick={handleCancelPasswordChange}
                        variant="outline"
                        className="flex-1 h-10"
                        size="sm"
                      >
                        <Icon name="X" size={16} className="mr-1" />
                        Отмена
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Icon name="CheckCircle2" size={20} className="text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium">Двухфакторная аутентификация</div>
                    <div className="text-sm text-muted-foreground">Не настроена</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icon name="Activity" size={22} className="text-primary" />
                Активность
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Icon name="Clock" size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium">Последний вход</div>
                    <div className="text-sm text-muted-foreground">Сегодня</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <Icon name="Laptop" size={20} className="text-purple-500" />
                  </div>
                  <div>
                    <div className="font-medium">Устройство</div>
                    <div className="text-sm text-muted-foreground">Браузер</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {(user.isBlocked || user.isFrozen) && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <Icon name="AlertTriangle" size={22} />
                Ограничения аккаунта
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.isBlocked && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10">
                  <Icon name="Ban" size={20} className="text-destructive mt-0.5" />
                  <div>
                    <div className="font-medium text-destructive">Аккаунт заблокирован</div>
                    {user.blockedReason && (
                      <div className="text-sm text-muted-foreground mt-1">Причина: {user.blockedReason}</div>
                    )}
                  </div>
                </div>
              )}
              {user.isFrozen && (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10">
                  <Icon name="Snowflake" size={20} className="text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-700">Аккаунт заморожен</div>
                    {user.freezeUntil && (
                      <div className="text-sm text-muted-foreground mt-1">До: {user.freezeUntil}</div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});

export default UserProfile;