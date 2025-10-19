import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { User } from '@/types';

interface ProfileHeaderProps {
  user: User;
  fullName: string;
  avatarPreview: string | null;
  isEditing: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditClick: () => void;
  getRoleLabel: (role: string) => string;
  getRoleIcon: (role: string) => string;
  getRoleColor: (role: string) => string;
}

export const ProfileHeader = React.memo(function ProfileHeader({
  user,
  fullName,
  avatarPreview,
  isEditing,
  onAvatarChange,
  onEditClick,
  getRoleLabel,
  getRoleIcon,
  getRoleColor
}: ProfileHeaderProps) {
  const email = user.email;

  return (
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
                onChange={onAvatarChange}
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
              onClick={onEditClick}
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
  );
});
