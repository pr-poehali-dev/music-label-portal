import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    artistName: '',
    trackLink: '',
    contactLink: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('https://functions.poehali.dev/40a44285-32b8-4e3e-8f8f-b77f16293727', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist_name: formData.artistName,
          track_link: formData.trackLink,
          contact_link: formData.contactLink,
          message: formData.message
        })
      });

      if (response.ok) {
        toast({
          title: '✅ Материал отправлен!',
          description: 'Мы рассмотрим ваш трек и свяжемся с вами в ближайшее время.'
        });

        setFormData({
          artistName: '',
          trackLink: '',
          contactLink: '',
          message: ''
        });
      } else {
        const data = await response.json();
        toast({
          title: '❌ Ошибка',
          description: data.error || 'Не удалось отправить материал',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: '❌ Ошибка',
        description: 'Не удалось отправить материал. Попробуйте позже.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black bg-grid-pattern">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <img 
              src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
              alt="420 Logo" 
              className="w-16 h-16 rounded-full shadow-lg shadow-yellow-500/50 animate-glow"
            />
            <div>
              <h1 className="text-4xl font-bold text-yellow-400">420.рф</h1>
              <p className="text-yellow-300/70">Музыкальный лейбл</p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/app')}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
          >
            <Icon name="LogIn" size={18} className="mr-2" />
            Войти в систему
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="animate-slideIn">
              <h2 className="text-5xl font-bold text-white mb-4">
                Отправь свой трек на прослушивание
              </h2>
              <p className="text-xl text-gray-300">
                Мы ищем талантливых артистов для сотрудничества. Заполни форму и отправь свой материал — наша команда обязательно его прослушает.
              </p>
            </div>

            <div className="space-y-6 animate-fadeIn">
              <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="Headphones" size={24} className="text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Профессиональное прослушивание</h3>
                      <p className="text-gray-300">Каждый трек оценивается нашей командой специалистов</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="Rocket" size={24} className="text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Развитие карьеры</h3>
                      <p className="text-gray-300">Поможем с продвижением, релизами и монетизацией</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon name="Users" size={24} className="text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Команда профессионалов</h3>
                      <p className="text-gray-300">Работа с опытными продюсерами и менеджерами</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-black/40 border-yellow-500/20 backdrop-blur-sm animate-slideIn sticky top-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Icon name="Music" size={32} className="text-yellow-400" />
                <h3 className="text-2xl font-bold text-white">Форма отправки</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-yellow-300 mb-2 block">
                    Имя артиста / Псевдоним *
                  </label>
                  <Input
                    required
                    placeholder="Например: DJ Космос"
                    value={formData.artistName}
                    onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                    className="bg-black/60 border-yellow-500/30 text-white placeholder:text-gray-500"
                  />
                </div>



                <div>
                  <label className="text-sm font-medium text-yellow-300 mb-2 block">
                    Ссылка на трек *
                  </label>
                  <Input
                    required
                    type="url"
                    placeholder="https://soundcloud.com/your-track"
                    value={formData.trackLink}
                    onChange={(e) => setFormData({ ...formData, trackLink: e.target.value })}
                    className="bg-black/60 border-yellow-500/30 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    SoundCloud, YouTube, Google Drive и др.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-yellow-300 mb-2 block">
                    Ссылка для связи
                  </label>
                  <Input
                    placeholder="Telegram, VK, Instagram или email"
                    value={formData.contactLink}
                    onChange={(e) => setFormData({ ...formData, contactLink: e.target.value })}
                    className="bg-black/60 border-yellow-500/30 text-white placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    @username, ссылка на профиль или email
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-yellow-300 mb-2 block">
                    Сообщение
                  </label>
                  <Textarea
                    placeholder="Расскажите о себе и своём творчестве..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="bg-black/60 border-yellow-500/30 text-white placeholder:text-gray-500 min-h-[100px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-semibold text-lg py-6 hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <Icon name="Send" size={20} className="mr-2" />
                      Отправить на прослушивание
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-400 text-center">
                  * — обязательные поля
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center space-y-4 animate-fadeIn">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Icon name="Phone" size={24} className="text-yellow-400" />
            <h3 className="text-2xl font-bold text-white">Контакты</h3>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="https://vk.com/420smm" target="_blank" rel="noopener noreferrer" 
               className="px-6 py-3 bg-black/40 border border-yellow-500/20 rounded-lg hover:border-yellow-500/50 transition-all text-white">
              <Icon name="MessageCircle" className="inline mr-2" size={18} />
              VK
            </a>
            <a href="https://t.me/420smm" target="_blank" rel="noopener noreferrer"
               className="px-6 py-3 bg-black/40 border border-yellow-500/20 rounded-lg hover:border-yellow-500/50 transition-all text-white">
              <Icon name="Send" className="inline mr-2" size={18} />
              Telegram
            </a>
            <a href="mailto:info@420.рф"
               className="px-6 py-3 bg-black/40 border border-yellow-500/20 rounded-lg hover:border-yellow-500/50 transition-all text-white">
              <Icon name="Mail" className="inline mr-2" size={18} />
              Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}