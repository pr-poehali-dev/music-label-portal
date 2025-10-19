import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import VKPosts from '@/components/VKPosts';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div 
        className="fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(234, 179, 8, 0.15), transparent 40%)`
        }}
      />
      
      <div className="fixed inset-0 bg-grid-pattern opacity-20 pointer-events-none" />

      <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          <header 
            className="flex justify-between items-center mb-20 animate-fadeIn backdrop-blur-sm bg-black/30 rounded-2xl p-6 border border-primary/10"
            style={{
              transform: `translateY(${scrollY * 0.5}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="relative">
                <img 
                  src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
                  alt="420 Logo" 
                  className="w-20 h-20 rounded-2xl shadow-2xl shadow-primary/50 group-hover:scale-110 transition-transform duration-300 border-2 border-primary/30"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300 -z-10" />
              </div>
              <div>
                <h1 className="text-5xl font-black animate-shimmer">420</h1>
                <p className="text-sm text-primary/60 tracking-wider">Музыкальный лейбл</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/app')}
              className="bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] hover:bg-right transition-all duration-500 text-black font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-primary/50 hover:shadow-primary hover:scale-105 border-0"
            >
              <Icon name="LogIn" size={20} className="mr-2" />
              Войти
            </Button>
          </header>

          <section className="mb-32 text-center relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full flex items-center justify-center opacity-5 pointer-events-none">
              <div className="text-[20rem] font-black">420</div>
            </div>
            
            <h2 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-white to-primary mb-8 animate-slideIn leading-tight">
              Твой звук.<br/>Твоя свобода.
            </h2>
            <p className="text-2xl text-gray-400 max-w-3xl mx-auto mb-12 animate-slideIn leading-relaxed" style={{ animationDelay: '0.2s' }}>
              Независимый лейбл для тех, кто создаёт музыку <span className="text-primary font-bold">без компромиссов</span>
            </p>

            <div className="flex justify-center gap-8 animate-slideIn" style={{ animationDelay: '0.4s' }}>
              <div className="text-center">
                <div className="text-5xl font-black text-primary mb-2">100+</div>
                <div className="text-gray-500 uppercase text-sm tracking-wider">Артистов</div>
              </div>
              <div className="w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
              <div className="text-center">
                <div className="text-5xl font-black text-primary mb-2">500+</div>
                <div className="text-gray-500 uppercase text-sm tracking-wider">Релизов</div>
              </div>
              <div className="w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
              <div className="text-center">
                <div className="text-5xl font-black text-primary mb-2">24/7</div>
                <div className="text-gray-500 uppercase text-sm tracking-wider">Поддержка</div>
              </div>
            </div>
          </section>

          <section className="mb-32">
            <h3 className="text-5xl font-black text-center mb-12 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Наши преимущества
            </h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  icon: '🚀',
                  title: 'Индивидуальная логистика',
                  desc: 'Доставка релизов на площадки',
                  gradient: 'from-primary/20 to-transparent',
                  delay: '0s'
                },
                {
                  icon: '📊',
                  title: 'Прозрачные отчёты',
                  desc: 'Полная прозрачность финансов',
                  gradient: 'from-secondary/20 to-transparent',
                  delay: '0.1s'
                },
                {
                  icon: '💬',
                  title: 'Поддержка 24/7',
                  desc: 'Всегда на связи с вами',
                  gradient: 'from-primary/20 to-transparent',
                  delay: '0.2s'
                },
                {
                  icon: '🎛️',
                  title: 'Личный кабинет',
                  desc: 'Самостоятельная отгрузка',
                  gradient: 'from-secondary/20 to-transparent',
                  delay: '0.3s'
                },
                {
                  icon: '⚖️',
                  title: 'Гибкие условия',
                  desc: 'Под ваши требования',
                  gradient: 'from-primary/20 to-transparent',
                  delay: '0.4s'
                },
                {
                  icon: '🎵',
                  title: 'Бесплатный питчинг',
                  desc: 'Продвижение в плейлисты',
                  gradient: 'from-secondary/20 to-transparent',
                  delay: '0.5s'
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-card/40 to-black/40 border border-primary/10 backdrop-blur-xl hover:border-primary/40 transition-all duration-300 hover:scale-105 overflow-visible rounded-2xl p-6"
                  style={{ animationDelay: item.delay }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                  <div className="relative z-10 overflow-visible">
                    <div className="text-5xl mb-3 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 relative z-20">
                      {item.icon}
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2 group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-gray-500 text-sm group-hover:text-gray-300 transition-colors">
                      {item.desc}
                    </p>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </section>

          <section className="mb-32 relative">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
            
            <div className="text-center mb-12 relative z-10">
              <h3 className="text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary animate-slideIn">
                Крайние релизы
              </h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary"></div>
                <Icon name="Disc3" size={20} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary"></div>
              </div>
              <p className="text-gray-500 text-sm">Последние работы наших артистов</p>
            </div>
            
            <div className="relative max-w-6xl mx-auto">
              <VKPosts />
            </div>
          </section>

          <footer className="text-center py-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-3xl" />
            <div className="relative">
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-6">
                420.рф
              </div>
              <p className="text-gray-500 mb-8 text-lg">© 2024 Все права защищены</p>
              <div className="flex justify-center gap-8">
                <a 
                  href="https://vk.com/smm420" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 hover:border-primary/50 hover:bg-primary/20 transition-all duration-300 hover:scale-105"
                >
                  <Icon name="MessageCircle" size={20} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-gray-400 group-hover:text-primary transition-colors font-medium">ВКонтакте</span>
                </a>
                <a 
                  href="https://t.me/labl420" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/20 hover:border-secondary/50 hover:bg-secondary/20 transition-all duration-300 hover:scale-105"
                >
                  <Icon name="Send" size={20} className="text-secondary group-hover:scale-110 transition-transform" />
                  <span className="text-gray-400 group-hover:text-secondary transition-colors font-medium">Telegram</span>
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}