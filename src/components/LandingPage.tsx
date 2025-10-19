import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';
import VKPosts from '@/components/VKPosts';
import { useEffect, useState, useMemo } from 'react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMobile) {
        setMousePosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const advantages = useMemo(() => [
    {
      icon: '🚀',
      title: 'Индивидуальная логистика',
      desc: 'Доставка релизов на площадки',
      gradient: 'from-primary/20 to-transparent'
    },
    {
      icon: '📊',
      title: 'Прозрачные отчёты',
      desc: 'Полная прозрачность финансов',
      gradient: 'from-secondary/20 to-transparent'
    },
    {
      icon: '💬',
      title: 'Поддержка 24/7',
      desc: 'Всегда на связи с вами',
      gradient: 'from-primary/20 to-transparent'
    },
    {
      icon: '🎛️',
      title: 'Личный кабинет',
      desc: 'Самостоятельная отгрузка',
      gradient: 'from-secondary/20 to-transparent'
    },
    {
      icon: '⚖️',
      title: 'Гибкие условия',
      desc: 'Под ваши требования',
      gradient: 'from-primary/20 to-transparent'
    },
    {
      icon: '🎵',
      title: 'Бесплатный питчинг',
      desc: 'Продвижение в плейлисты',
      gradient: 'from-secondary/20 to-transparent'
    }
  ], []);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div 
        className="hidden md:block fixed inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(234, 179, 8, 0.15), transparent 40%)`
        }}
      />
      
      <div className="fixed inset-0 bg-grid-pattern opacity-10 md:opacity-20 pointer-events-none" />

      <div className="absolute top-10 md:top-20 left-5 md:left-10 w-64 md:w-96 h-64 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 md:bottom-20 right-5 md:right-10 w-64 md:w-96 h-64 md:h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative z-10">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
          <header 
            className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-12 md:mb-20 animate-fadeIn backdrop-blur-sm bg-black/30 rounded-xl md:rounded-2xl p-4 md:p-6 border border-primary/10"
            style={{
              transform: `translateY(${Math.min(scrollY * 0.3, 50)}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          >
            <div className="flex items-center gap-3 md:gap-4 group cursor-pointer">
              <div className="relative">
                <img 
                  src="https://cdn.poehali.dev/files/89837016-5bd9-4196-8bef-fad51c37ba4e.jpg" 
                  alt="420 Logo" 
                  className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl shadow-2xl shadow-primary/50 group-hover:scale-110 transition-transform duration-300 border-2 border-primary/30"
                />
                <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300 -z-10" />
              </div>
              <div>
                <h1 className="text-3xl md:text-5xl font-black animate-shimmer">420</h1>
                <p className="text-xs md:text-sm text-primary/60 tracking-wider">Музыкальный лейбл</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/app')}
              className="w-full sm:w-auto bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] hover:bg-right transition-all duration-500 text-black font-bold px-6 md:px-8 py-4 md:py-6 text-base md:text-lg rounded-xl shadow-lg shadow-primary/50 hover:shadow-primary hover:scale-105 border-0"
            >
              <Icon name="LogIn" size={18} className="mr-2" />
              Войти
            </Button>
          </header>

          <section className="mb-20 md:mb-32 text-center relative">
            <div className="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 w-full h-full items-center justify-center opacity-5 pointer-events-none">
              <div className="text-[12rem] lg:text-[20rem] font-black">420</div>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary via-white to-primary mb-6 md:mb-8 animate-slideIn leading-tight px-4">
              Твой звук.<br/>Твоя свобода.
            </h2>
            <p className="text-base sm:text-lg md:text-2xl text-gray-400 max-w-3xl mx-auto mb-8 md:mb-12 animate-slideIn leading-relaxed px-4" style={{ animationDelay: '0.2s' }}>
              Независимый лейбл для тех, кто создаёт музыку <span className="text-primary font-bold">без компромиссов</span>
            </p>

            <div className="flex flex-wrap justify-center gap-4 md:gap-8 animate-slideIn px-4" style={{ animationDelay: '0.4s' }}>
              <div className="text-center">
                <div className="text-3xl md:text-5xl font-black text-primary mb-1 md:mb-2">10 лет</div>
                <div className="text-gray-500 uppercase text-xs md:text-sm tracking-wider">В индустрии</div>
              </div>
              <div className="w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
              <div className="text-center">
                <div className="text-3xl md:text-5xl font-black text-primary mb-1 md:mb-2">500+</div>
                <div className="text-gray-500 uppercase text-xs md:text-sm tracking-wider">Релизов</div>
              </div>
              <div className="w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
              <div className="text-center">
                <div className="text-3xl md:text-5xl font-black text-primary mb-1 md:mb-2">24/7</div>
                <div className="text-gray-500 uppercase text-xs md:text-sm tracking-wider">Поддержка</div>
              </div>
            </div>
          </section>

          <section className="mb-20 md:mb-32">
            <h3 className="text-3xl md:text-5xl font-black text-center mb-8 md:mb-12 text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary px-4">
              Наши преимущества
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
              {advantages.map((item, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-br from-card/40 to-black/40 border border-primary/10 backdrop-blur-xl hover:border-primary/40 transition-all duration-300 md:hover:scale-105 overflow-visible rounded-xl md:rounded-2xl p-5 md:p-6"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl md:rounded-2xl`} />
                  <div className="relative z-10 overflow-visible">
                    <div className="text-4xl md:text-5xl mb-3 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 relative z-20">
                      {item.icon}
                    </div>
                    <h4 className="text-base md:text-lg font-bold text-primary mb-2 group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-gray-500 text-xs md:text-sm group-hover:text-gray-300 transition-colors">
                      {item.desc}
                    </p>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-20 md:w-24 h-20 md:h-24 bg-primary/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </section>

          <section className="mb-20 md:mb-32 relative">
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 md:w-96 h-64 md:h-96 bg-primary/5 rounded-full blur-3xl" />
            
            <div className="text-center mb-8 md:mb-12 relative z-10 px-4">
              <h3 className="text-3xl md:text-5xl font-black mb-3 text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary animate-slideIn">
                Крайние релизы
              </h3>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="h-px w-12 md:w-16 bg-gradient-to-r from-transparent to-primary" />
                <Icon name="Disc3" size={16} className="md:hidden text-primary animate-spin" style={{ animationDuration: '3s' }} />
                <Icon name="Disc3" size={20} className="hidden md:block text-primary animate-spin" style={{ animationDuration: '3s' }} />
                <div className="h-px w-12 md:w-16 bg-gradient-to-l from-transparent to-primary" />
              </div>
              <p className="text-gray-500 text-xs md:text-sm">Последние работы наших артистов</p>
            </div>
            
            <div className="relative max-w-6xl mx-auto">
              <VKPosts />
            </div>
          </section>

          <footer className="text-center py-12 md:py-16 relative px-4">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent rounded-3xl" />
            <div className="relative">
              <div className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-4 md:mb-6">
                420.рф
              </div>
              <p className="text-gray-500 mb-6 md:mb-8 text-sm md:text-lg">© 2024 Все права защищены</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-8">
                <a 
                  href="https://vk.com/smm420" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 hover:border-primary/50 hover:bg-primary/20 transition-all duration-300 md:hover:scale-105"
                >
                  <Icon name="MessageCircle" size={20} className="text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-gray-400 group-hover:text-primary transition-colors font-medium">ВКонтакте</span>
                </a>
                <a 
                  href="https://t.me/labl420" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-secondary/10 to-transparent border border-secondary/20 hover:border-secondary/50 hover:bg-secondary/20 transition-all duration-300 md:hover:scale-105"
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