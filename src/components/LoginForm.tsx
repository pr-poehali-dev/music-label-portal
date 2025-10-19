import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onLogin: (username: string, password: string, vkData?: any, telegramData?: any) => void;
}

declare global {
  interface Window {
    TelegramLoginWidget?: any;
  }
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const telegramRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Глобальная функция для обработки авторизации
    (window as any).onTelegramAuth = async (user: any) => {
      try {
        console.log('Telegram auth data:', user);
        
        const response = await fetch('https://functions.poehali.dev/e15fe44b-1976-42f1-aa0d-ff37aca2fd10', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка авторизации');
        }
        
        if (data.user) {
          console.log('Calling onLogin with user:', data.user);
          onLogin('', '', undefined, data.user);
        } else {
          throw new Error('Не удалось получить данные пользователя');
        }
      } catch (error: any) {
        console.error('Telegram auth error:', error);
      }
    };

    // Загружаем скрипт Telegram Widget
    const loadTelegramWidget = () => {
      if (!telegramRef.current) return;
      
      // Очищаем контейнер
      telegramRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.setAttribute('data-telegram-login', 'fosmmtrtrdev_bot');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      
      telegramRef.current.appendChild(script);
      console.log('Telegram widget script loaded');
    };

    // Небольшая задержка чтобы DOM был готов
    setTimeout(loadTelegramWidget, 100);

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [onLogin]);

  const handleSubmit = async () => {
    if (!username || !password) return;
    
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsLoading(false);
    setIsSuccess(true);
    
    setTimeout(() => {
      onLogin(username, password);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-yellow-950/20 to-black bg-grid-pattern p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>
      
      {isSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="text-center">
            <div className="relative w-32 h-32 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="CheckCircle2" size={48} className="text-primary animate-scaleIn" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-primary mb-2 animate-slideIn">Вход выполнен!</h3>
            <p className="text-gray-400 animate-slideIn" style={{ animationDelay: '0.1s' }}>Загружаем личный кабинет...</p>
          </div>
        </div>
      )}
      
      <Card className={`w-full max-w-md border-yellow-500/20 bg-black/60 backdrop-blur-xl transition-all duration-700 ${isSuccess ? 'scale-95 opacity-0' : 'animate-fadeIn scale-100 opacity-100'}`}>
        <CardHeader className="text-center">
          <div className="relative mx-auto mb-4 w-32 h-32 group">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse" />
            <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl shadow-yellow-500/50 border-2 border-primary/30 group-hover:border-primary/60 transition-all duration-500 group-hover:scale-110">
              <img 
                src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
                alt="420 Logo" 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent animate-shimmer">Авторизация</CardTitle>
          <CardDescription className="text-gray-400 animate-fadeIn" style={{ animationDelay: '0.2s' }}>Музыкальный лейбл • Техподдержка</CardDescription>
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
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !username || !password}
            className="group relative w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-yellow-500/50 text-black font-semibold transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ animationDuration: '1.5s' }} />
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Проверка данных...
              </>
            ) : (
              <>
                <Icon name="LogIn" size={16} className="mr-2 group-hover:translate-x-1 transition-transform" />
                Войти
              </>
            )}
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
        </CardContent>
      </Card>
    </div>
  );
}