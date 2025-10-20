import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";

const NotFoundCustom = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-yellow-950/10 to-black p-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 404 Number */}
        <div className="relative">
          <h1 className="text-[120px] md:text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 leading-none animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 -z-10 blur-3xl opacity-30">
            <div className="w-full h-full bg-gradient-to-br from-yellow-500 to-yellow-600"></div>
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full flex items-center justify-center border border-yellow-500/30">
            <Icon name="SearchX" size={40} className="text-yellow-500" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Страница не найдена
          </h2>
          <p className="text-muted-foreground">
            Похоже, эта страница отправилась в космос раньше нас. Проверьте адрес или вернитесь на главную.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link to="/app">
            <Button className="w-full sm:w-auto bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 shadow-lg shadow-yellow-500/30">
              <Icon name="Home" size={18} className="mr-2" />
              На главную
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto border-yellow-500/30 hover:bg-yellow-500/10"
            onClick={() => window.history.back()}
          >
            <Icon name="ArrowLeft" size={18} className="mr-2" />
            Назад
          </Button>
        </div>

        {/* Path Info */}
        <div className="pt-8 text-xs text-muted-foreground/50">
          <code className="bg-black/30 px-3 py-1 rounded border border-yellow-500/10">
            {location.pathname}
          </code>
        </div>
      </div>
    </div>
  );
};

export default NotFoundCustom;
