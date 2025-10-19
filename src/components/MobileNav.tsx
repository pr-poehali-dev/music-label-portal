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
    <div className="md:hidden w-full bg-gradient-to-b from-black/80 via-yellow-950/20 to-transparent backdrop-blur-sm border-t border-yellow-500/20">
      <div className="grid gap-1 px-2 py-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => onTabChange(item.value)}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-lg transition-all duration-300
                ${isActive 
                  ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 shadow-md shadow-yellow-500/10' 
                  : 'hover:bg-yellow-500/10 active:scale-95'
                }
              `}
            >
              <div className="relative">
                <Icon 
                  name={item.icon} 
                  size={20} 
                  className={`transition-colors duration-200 ${isActive ? 'text-yellow-400' : 'text-gray-400'}`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[9px] font-medium transition-colors duration-200 leading-tight ${isActive ? 'text-yellow-400' : 'text-gray-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-yellow-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}