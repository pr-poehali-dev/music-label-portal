import Icon from '@/components/ui/icon';

interface MobileNavItem {
  value: string;
  icon: string;
  label: string;
  badge?: number;
}

interface MobileNavProps {
  items: MobileNavItem[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export default function MobileNav({ items, activeTab, onTabChange }: MobileNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-yellow-950/40 to-black/95 backdrop-blur-lg border-t border-yellow-500/20 safe-area-inset-bottom">
      <div className="grid gap-1 px-2 py-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={`
                relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 scale-105 shadow-lg shadow-yellow-500/20' 
                  : 'hover:bg-yellow-500/10 active:scale-95'
                }
              `}
            >
              <div className="relative">
                <Icon 
                  name={item.icon} 
                  size={22} 
                  className={`transition-colors duration-200 ${isActive ? 'text-yellow-400' : 'text-gray-400'}`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-yellow-400' : 'text-gray-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-yellow-400 rounded-full animate-slideIn" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
