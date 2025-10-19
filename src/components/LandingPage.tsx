import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-yellow-950/30 to-black">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12 animate-fadeIn">
          <div className="flex items-center gap-4">
            <img 
              src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
              alt="420 Logo" 
              className="w-16 h-16 rounded-full shadow-lg shadow-primary/50"
            />
            <div>
              <h1 className="text-4xl font-bold text-primary">420.рф</h1>
              <p className="text-sm text-gray-400">Музыкальный лейбл</p>
            </div>
          </div>
          <Button 
            onClick={() => navigate('/app')}
            className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transition-all"
          >
            <Icon name="LogIn" size={18} className="mr-2" />
            Войти
          </Button>
        </header>

        <section className="mb-16 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-primary mb-6 animate-slideIn">
            Добро пожаловать в 420.рф
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 animate-slideIn" style={{ animationDelay: '0.2s' }}>
            Независимый музыкальный лейбл, создающий уникальный звук и поддерживающий талантливых артистов
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-slideIn" style={{ animationDelay: '0.4s' }}>
            <a 
              href="https://vk.com/fourtwentyru" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0077FF] hover:bg-[#0066DD] text-white rounded-lg transition-all"
            >
              <Icon name="MessageCircle" size={20} />
              ВКонтакте
            </a>
            <a 
              href="https://t.me/fourtwentyru" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#229ED9] hover:bg-[#1E8BC3] text-white rounded-lg transition-all"
            >
              <Icon name="Send" size={20} />
              Telegram
            </a>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="text-3xl font-bold text-primary mb-8 text-center">Наши ценности</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-card/80 border-primary/20 backdrop-blur-sm hover:border-primary/50 transition-all">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">🎵</div>
                <h4 className="text-xl font-bold text-primary mb-2">Качество звука</h4>
                <p className="text-gray-400">
                  Профессиональное сведение и мастеринг каждого трека
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-primary/20 backdrop-blur-sm hover:border-primary/50 transition-all">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">🚀</div>
                <h4 className="text-xl font-bold text-primary mb-2">Поддержка артистов</h4>
                <p className="text-gray-400">
                  Полная поддержка на всех этапах создания и продвижения музыки
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card/80 border-primary/20 backdrop-blur-sm hover:border-primary/50 transition-all">
              <CardContent className="pt-6">
                <div className="text-4xl mb-4">💎</div>
                <h4 className="text-xl font-bold text-primary mb-2">Уникальность</h4>
                <p className="text-gray-400">
                  Каждый проект - это особенное творческое высказывание
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="text-3xl font-bold text-primary mb-8 text-center">Последние новости</h3>
          <div className="max-w-4xl mx-auto">
            <Card className="bg-card/80 border-primary/20 backdrop-blur-sm">
              <CardContent className="p-6">
                <div id="vk_groups"></div>
              </CardContent>
            </Card>
          </div>
        </section>

        <footer className="text-center text-gray-500 py-8 border-t border-gray-800">
          <p>© 2024 420.рф - Все права защищены</p>
          <div className="flex justify-center gap-6 mt-4">
            <a href="https://vk.com/fourtwentyru" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              ВКонтакте
            </a>
            <a href="https://t.me/fourtwentyru" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              Telegram
            </a>
          </div>
        </footer>
      </div>

      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: `
            window.vkAsyncInit = function() {
              VK.Widgets.Group("vk_groups", {mode: 4, width: "auto", height: "600"}, 214160827);
            };
            setTimeout(function() {
              var el = document.createElement("script");
              el.type = "text/javascript";
              el.src = "https://vk.com/js/api/openapi.js?169";
              el.async = true;
              document.getElementsByTagName("head")[0].appendChild(el);
            }, 0);
          `
        }}
      />
    </div>
  );
}
