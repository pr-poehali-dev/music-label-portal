import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface PasswordChangeFormProps {
  isChangingPassword: boolean;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
  passwordError: string;
  passwordSuccess: boolean;
  onOldPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onChangePassword: () => void;
  onCancelPasswordChange: () => void;
  onStartPasswordChange: () => void;
}

export const PasswordChangeForm = React.memo(function PasswordChangeForm({
  isChangingPassword,
  oldPassword,
  newPassword,
  confirmPassword,
  passwordError,
  passwordSuccess,
  onOldPasswordChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onChangePassword,
  onCancelPasswordChange,
  onStartPasswordChange
}: PasswordChangeFormProps) {
  if (!isChangingPassword) {
    return (
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Lock" size={24} className="text-primary" />
            Безопасность
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={onStartPasswordChange}
            variant="outline"
            className="w-full h-11 gap-2"
            size="lg"
          >
            <Icon name="Key" size={18} />
            Изменить пароль
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Key" size={24} className="text-primary" />
          Изменение пароля
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword" className="text-base flex items-center gap-2">
              <Icon name="Lock" size={16} />
              Текущий пароль
            </Label>
            <Input 
              id="oldPassword"
              type="password"
              value={oldPassword}
              onChange={(e) => onOldPasswordChange(e.target.value)}
              placeholder="Введите текущий пароль"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-base flex items-center gap-2">
              <Icon name="Key" size={16} />
              Новый пароль
            </Label>
            <Input 
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              placeholder="Введите новый пароль"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-base flex items-center gap-2">
              <Icon name="Check" size={16} />
              Подтвердите пароль
            </Label>
            <Input 
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              placeholder="Повторите новый пароль"
              className="h-11"
            />
          </div>
        </div>

        {passwordError && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg">
            <Icon name="AlertCircle" size={18} />
            <span className="text-sm">{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <Icon name="CheckCircle" size={18} />
            <span className="text-sm">Пароль успешно изменен!</span>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button 
            onClick={onChangePassword}
            className="flex-1 h-11 gap-2"
            size="lg"
          >
            <Icon name="Check" size={18} />
            Изменить пароль
          </Button>
          <Button 
            onClick={onCancelPasswordChange}
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
  );
});
