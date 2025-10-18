import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onLogin: (username: string, password: string, vkData?: any) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [vkLoading, setVkLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      handleVkCallback(code);
    }
  }, []);

  const handleSubmit = () => {
    onLogin(username, password);
  };

  const handleVkLogin = async () => {
    setVkLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/70e60d29-836e-455c-8052-691174ca7a7a?action=login');
      const data = await response.json();
      
      if (data.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к ВКонтакте',
        variant: 'destructive'
      });
      setVkLoading(false);
    }
  };

  const handleVkCallback = async (code: string) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/70e60d29-836e-455c-8052-691174ca7a7a?action=callback&code=${code}`);
      const data = await response.json();
      
      if (data.vk_id) {
        const vkUsername = `vk_${data.vk_id}`;
        onLogin(vkUsername, '', data);
        
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось войти через ВКонтакте',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось войти через ВКонтакте',
        variant: 'destructive'
      });
    }
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
              <span className="bg-black/60 px-2 text-gray-500">или</span>
            </div>
          </div>

          <Button 
            onClick={handleVkLogin} 
            disabled={vkLoading}
            variant="outline"
            className="w-full bg-[#0077FF] hover:bg-[#0066DD] text-white border-none font-semibold transition-all"
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.07 2H8.93C3.33 2 2 3.33 2 8.93v6.14C2 20.67 3.33 22 8.93 22h6.14c5.6 0 6.93-1.33 6.93-6.93V8.93C22 3.33 20.67 2 15.07 2zm3.15 14.31c-.33.45-.95.67-1.87.67h-1.3c-.58 0-.75-.27-1.59-1.16-.82-.84-1.18-.94-1.39-.94-.28 0-.36.08-.36.47v1.05c0 .28-.09.45-1.31.45-1.97 0-4.15-1.19-5.68-3.41-2.29-3.29-2.92-5.75-2.92-6.25 0-.21.08-.4.47-.4h1.3c.35 0 .48.16.62.53.69 2.06 1.86 3.87 2.34 3.87.18 0 .26-.08.26-.55V9.11c-.06-.97-.57-1.05-.57-1.39 0-.17.14-.33.36-.33h2.05c.29 0 .4.16.4.5v3.03c0 .29.13.4.21.4.18 0 .33-.11.65-.43 1.01-1.13 1.73-2.88 1.73-2.88.09-.2.26-.4.61-.4h1.3c.38 0 .46.19.38.5-.13.76-.93 2.17-1.92 3.45-.26.34-.36.49 0 .88.24.29.96.94 1.45 1.51.88.99 1.55 1.82 1.73 2.4.17.57-.09.86-.47.86z"/>
            </svg>
            {vkLoading ? 'Загрузка...' : 'Войти через ВКонтакте'}
          </Button>
          <div className="text-xs text-center text-gray-500 space-y-1">
            <p>Тестовые аккаунты:</p>
            <p className="text-yellow-500/70">manager / 12345 • artist1 / 12345</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}