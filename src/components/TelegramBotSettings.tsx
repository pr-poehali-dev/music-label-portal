import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const BOT_API_URL = 'https://functions.poehali.dev/ae7c32d8-5b08-4870-9606-e750de3c31a9';

export default function TelegramBotSettings() {
  const [webhookUrl, setWebhookUrl] = useState(BOT_API_URL);
  const [webhookStatus, setWebhookStatus] = useState<'checking' | 'active' | 'inactive'>('checking');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkWebhookStatus();
  }, []);

  const checkWebhookStatus = async () => {
    try {
      const response = await fetch(`${BOT_API_URL}?action=get_webhook_info`);
      if (!response.ok) {
        setWebhookStatus('inactive');
        return;
      }
      
      const data = await response.json();
      
      if (data.url && data.url.includes('functions.poehali.dev')) {
        setWebhookStatus('active');
      } else {
        setWebhookStatus('inactive');
      }
    } catch (error) {
      setWebhookStatus('inactive');
    }
  };

  const setupWebhook = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BOT_API_URL}?action=set_webhook&url=${encodeURIComponent(BOT_API_URL)}`);
      const data = await response.json();
      
      if (data.ok || response.ok) {
        setWebhookStatus('active');
        toast({
          title: '✅ Webhook настроен успешно!',
          description: 'Бот теперь будет получать обновления от Telegram',
        });
      } else {
        throw new Error(data.description || 'Не удалось настроить webhook');
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка настройки webhook',
        description: error instanceof Error ? error.message : 'Проверьте, что токен бота установлен в секретах',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    try {
      const response = await fetch(BOT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          chat_id: '123456789',
          message: '🧪 Тестовое сообщение от 420.рф'
        })
      });
      
      if (response.ok) {
        toast({
          title: '✅ Тестовое сообщение отправлено',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка отправки',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 p-3 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Icon name="MessageCircle" size={24} className="text-blue-400 md:w-8 md:h-8" />
        <h1 className="text-xl md:text-3xl font-bold">Telegram Бот</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Settings" size={20} />
            Настройка бота
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg border" style={{
            backgroundColor: webhookStatus === 'active' ? 'rgb(34 197 94 / 0.1)' : webhookStatus === 'inactive' ? 'rgb(239 68 68 / 0.1)' : 'rgb(234 179 8 / 0.1)',
            borderColor: webhookStatus === 'active' ? 'rgb(34 197 94 / 0.3)' : webhookStatus === 'inactive' ? 'rgb(239 68 68 / 0.3)' : 'rgb(234 179 8 / 0.3)'
          }}>
            <div className="flex items-center gap-3">
              {webhookStatus === 'checking' && (
                <>
                  <Icon name="Loader2" className="animate-spin text-yellow-400" size={20} />
                  <div>
                    <p className="font-semibold text-yellow-400">Проверка статуса...</p>
                    <p className="text-xs text-muted-foreground">Подключение к Telegram API</p>
                  </div>
                </>
              )}
              {webhookStatus === 'active' && (
                <>
                  <Icon name="CheckCircle" className="text-green-500" size={20} />
                  <div>
                    <p className="font-semibold text-green-500">✅ Webhook активен</p>
                    <p className="text-xs text-muted-foreground">Бот получает обновления</p>
                  </div>
                </>
              )}
              {webhookStatus === 'inactive' && (
                <>
                  <Icon name="AlertCircle" className="text-red-500" size={20} />
                  <div>
                    <p className="font-semibold text-red-500">❌ Webhook не настроен</p>
                    <p className="text-xs text-muted-foreground">Нажмите кнопку ниже для настройки</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Webhook URL</label>
            <Input
              value={webhookUrl}
              readOnly
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL автоматически установлен на адрес облачной функции
            </p>
          </div>

          <Button 
            onClick={setupWebhook} 
            disabled={loading || webhookStatus === 'checking'} 
            className="w-full"
            variant={webhookStatus === 'active' ? 'outline' : 'default'}
          >
            {loading ? (
              <>
                <Icon name="Loader2" className="animate-spin mr-2" size={16} />
                Настройка...
              </>
            ) : webhookStatus === 'active' ? (
              <>
                <Icon name="RefreshCw" className="mr-2" size={16} />
                Переустановить webhook
              </>
            ) : (
              <>
                <Icon name="Zap" className="mr-2" size={16} />
                Настроить webhook
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Info" size={20} />
            Как подключить бот
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
            <p>Найдите бота в Telegram (имя бота в настройках)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
            <p>Отправьте команду <code className="bg-muted px-2 py-1 rounded">/start</code></p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
            <p>Привяжите аккаунт: <code className="bg-muted px-2 py-1 rounded">/link ваш_username</code></p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">4</span>
            <p>Получайте уведомления о новых задачах и тикетах!</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Terminal" size={20} />
            Доступные команды
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <code className="text-primary font-semibold">/start</code>
              <p className="text-xs text-muted-foreground mt-1">Начать работу с ботом</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <code className="text-primary font-semibold">/link username</code>
              <p className="text-xs text-muted-foreground mt-1">Привязать аккаунт</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <code className="text-primary font-semibold">/stats</code>
              <p className="text-xs text-muted-foreground mt-1">Статистика тикетов</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <code className="text-primary font-semibold">/tickets</code>
              <p className="text-xs text-muted-foreground mt-1">Список активных тикетов</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <code className="text-primary font-semibold">/report</code>
              <p className="text-xs text-muted-foreground mt-1">Отчёт о работе</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <code className="text-primary font-semibold">/help</code>
              <p className="text-xs text-muted-foreground mt-1">Справка по командам</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Bell" size={20} />
            Автоматические уведомления
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <Icon name="CheckCircle" size={20} className="text-green-500 flex-shrink-0" />
              <p>Новые тикеты отправляются руководителю автоматически</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <Icon name="Clock" size={20} className="text-blue-500 flex-shrink-0" />
              <p>Напоминания о дедлайнах приходят за день до срока</p>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <Icon name="AlertTriangle" size={20} className="text-yellow-500 flex-shrink-0" />
              <p>Срочные тикеты помечаются эмодзи 🔥</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}