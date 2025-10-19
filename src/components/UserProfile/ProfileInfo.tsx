import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface ProfileInfoProps {
  user: User;
}

export const ProfileInfo = React.memo(function ProfileInfo({ user }: ProfileInfoProps) {
  const registrationDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Неизвестно';

  const lastLoginDate = user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Никогда';

  const infoItems = [
    { icon: 'Calendar', label: 'Регистрация', value: registrationDate },
    { icon: 'LogIn', label: 'Последний вход', value: lastLoginDate },
    { icon: 'Globe', label: 'VK ID', value: user.vkUserId || 'Не привязан' },
    { icon: 'Shield', label: 'Двухфакторная аутентификация', value: user.twoFactorEnabled ? 'Включена' : 'Отключена' }
  ];

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Info" size={24} className="text-primary" />
          Информация о профиле
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {infoItems.map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
              <Icon name={item.icon} size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground">{item.label}</div>
                <div className="font-medium text-foreground break-words">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
