import React, { useState, useCallback } from 'react';
import { User } from '@/types';
import { ProfileHeader } from './UserProfile/ProfileHeader';
import { ProfileEditForm } from './UserProfile/ProfileEditForm';
import { ProfileStats } from './UserProfile/ProfileStats';
import { ProfileInfo } from './UserProfile/ProfileInfo';
import { PasswordChangeForm } from './UserProfile/PasswordChangeForm';
import { useToast } from '@/hooks/use-toast';
import { uploadFile } from '@/utils/uploadFile';

interface UserProfileProps {
  user: User;
  onUpdateProfile: (updates: Partial<User>) => void;
}

const UserProfile = React.memo(function UserProfile({ user, onUpdateProfile }: UserProfileProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName || user.full_name || '');
  const [email, setEmail] = useState(user.email || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.vk_photo || user.avatar || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const processAvatarFile = useCallback((file: File) => {
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAvatarFile(file);
    }
  }, [processAvatarFile]);

  const handleAvatarDrop = useCallback((file: File) => {
    processAvatarFile(file);
  }, [processAvatarFile]);

  const handleSave = useCallback(async () => {
    let avatarUrl = avatarPreview;
    
    if (avatarFile) {
      setIsUploadingAvatar(true);
      try {
        const result = await uploadFile(avatarFile);
        avatarUrl = result.url;
        toast({
          title: 'Аватарка загружена',
          description: 'Изображение успешно сохранено в облачном хранилище'
        });
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        toast({
          title: 'Ошибка загрузки',
          description: 'Не удалось загрузить аватарку. Попробуйте позже.',
          variant: 'destructive'
        });
        avatarUrl = avatarPreview;
      } finally {
        setIsUploadingAvatar(false);
      }
    }
    
    console.log('Saving profile:', { fullName, email, avatarUrl, lengths: { fullName: fullName.length, email: email.length, avatar: avatarUrl?.length } });
    
    const updates: Partial<User> = {
      fullName,
      email
    };
    
    if (avatarUrl && !avatarUrl.startsWith('data:')) {
      updates.avatar = avatarUrl;
    }
    
    onUpdateProfile(updates);
    setIsEditing(false);
    setAvatarFile(null);
  }, [fullName, email, avatarPreview, avatarFile, onUpdateProfile]);

  const handleCancel = useCallback(() => {
    setFullName(user.fullName || user.full_name || '');
    setEmail(user.email || '');
    setAvatarPreview(user.vk_photo || user.avatar || null);
    setAvatarFile(null);
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
        <ProfileHeader
          user={user}
          fullName={fullName}
          avatarPreview={avatarPreview}
          isEditing={isEditing}
          onAvatarChange={handleAvatarChange}
          onAvatarDrop={handleAvatarDrop}
          onEditClick={() => setIsEditing(true)}
          getRoleLabel={getRoleLabel}
          getRoleIcon={getRoleIcon}
          getRoleColor={getRoleColor}
        />

        {isEditing && (
          <ProfileEditForm
            fullName={fullName}
            email={email}
            isUploadingAvatar={isUploadingAvatar}
            onFullNameChange={setFullName}
            onEmailChange={setEmail}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProfileStats user={user} />
          <ProfileInfo user={user} />
        </div>

        <PasswordChangeForm
          isChangingPassword={isChangingPassword}
          oldPassword={oldPassword}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          passwordError={passwordError}
          passwordSuccess={passwordSuccess}
          onOldPasswordChange={setOldPassword}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onChangePassword={handlePasswordChange}
          onCancelPasswordChange={handleCancelPasswordChange}
          onStartPasswordChange={() => setIsChangingPassword(true)}
        />
      </div>
    </div>
  );
});

export default UserProfile;