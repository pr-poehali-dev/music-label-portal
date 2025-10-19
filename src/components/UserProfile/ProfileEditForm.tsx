import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface ProfileEditFormProps {
  fullName: string;
  email: string;
  isUploadingAvatar: boolean;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const ProfileEditForm = React.memo(function ProfileEditForm({
  fullName,
  email,
  isUploadingAvatar,
  onFullNameChange,
  onEmailChange,
  onSave,
  onCancel
}: ProfileEditFormProps) {
  return (
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
            <Label htmlFor="fullName" className="text-base flex items-center gap-2">
              <Icon name="User" size={16} />
              Полное имя
            </Label>
            <Input 
              id="fullName"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder="Иван Иванов"
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base flex items-center gap-2">
              <Icon name="Mail" size={16} />
              Email
            </Label>
            <Input 
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="your@email.com"
              className="h-11"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={onSave}
            className="flex-1 h-11 gap-2"
            size="lg"
            disabled={isUploadingAvatar}
          >
            {isUploadingAvatar ? (
              <>
                <Icon name="Loader" size={18} className="animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <Icon name="Check" size={18} />
                Сохранить изменения
              </>
            )}
          </Button>
          <Button 
            onClick={onCancel}
            variant="outline"
            className="flex-1 h-11 gap-2"
            size="lg"
            disabled={isUploadingAvatar}
          >
            <Icon name="X" size={18} />
            Отмена
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
