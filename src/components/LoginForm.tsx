import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onLogin: (username: string, password: string, vkData?: any) => void;
}

declare global {
  interface Window {
    TelegramLoginWidget?: any;
  }
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const telegramRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Загружаем скрипт Telegram Widget
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', 'your_bot_username'); // Замените на имя вашего бота
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    
    if (telegramRef.current) {
      telegramRef.current.appendChild(script);
    }

    // Глобальная функция для обработки авторизации
    (window as any).onTelegramAuth = async (user: any) => {
      try {
        const response = await fetch('https://functions.poehali.dev/e15fe44b-1976-42f1-aa0d-ff37aca2fd10', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });

        if (!response.ok) {
          throw new Error('Ошибка авторизации');
        }

        const data = await response.json();
        
        // Сохраняем токен
        localStorage.setItem('telegram_token', data.token);
        localStorage.setItem('telegram_user', JSON.stringify(data.user));
        
        toast({
          title: 'Успешно!',
          description: `Добро пожаловать, ${data.user.first_name}!`
        });
        
        // Вызываем onLogin с данными Telegram
        onLogin('', '', data.user);
      } catch (error: any) {
        toast({
          title: 'Ошибка',
          description: error.message || 'Не удалось авторизоваться через Telegram',
          variant: 'destructive'
        });
      }
    };

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [onLogin, toast]);

  const handleSubmit = () => {
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-yellow-950/20 to-black bg-grid-pattern p-4">
      <Card className="w-full max-w-md border-yellow-500/20 bg-black/60 backdrop-blur-xl animate-fadeIn">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-32 h-32 rounded-full overflow-hidden shadow-2xl shadow-yellow-500/50">
            <img 
              src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
              alt="420 Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">420 SMM</CardTitle>
          <CardDescription className="text-gray-400">Музыкальный лейбл • Техподдержка</CardDescription>
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
          <Button onClick={handleSubmit} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-yellow-500/50 text-black font-semibold transition-all">
            <Icon name="LogIn" size={16} className="mr-2" />
            Войти
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/60 px-2 text-gray-400">или</span>
            </div>
          </div>

          <div ref={telegramRef} className="flex justify-center" />
          
          <div className="text-xs text-center text-gray-500 space-y-1">
            <p>Тестовые аккаунты:</p>
            <p className="text-yellow-500/70">manager / 12345 • artist1 / 12345</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}