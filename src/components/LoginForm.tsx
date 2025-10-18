import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface LoginFormProps {
  onLogin: (username: string, password: string) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-zinc-800 p-4">
      <Card className="w-full max-w-md border-primary/20 bg-card/95 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center">
            <span className="text-4xl font-bold text-black">420</span>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">420 SMM</CardTitle>
          <CardDescription className="text-muted-foreground">Музыкальный лейбл • Техподдержка</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              placeholder="Введите логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-primary to-yellow-600 hover:opacity-90 text-black font-semibold">
            <Icon name="LogIn" size={16} className="mr-2" />
            Войти
          </Button>
          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>Тестовые аккаунты:</p>
            <p>manager / 12345 • artist1 / 12345</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
