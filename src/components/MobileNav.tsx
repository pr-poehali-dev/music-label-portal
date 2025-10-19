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
    <div className="md:hidden w-full bg-gradient-to-b from-black/95 via-yellow-950/30 to-transparent backdrop-blur-md border-t border-yellow-500/30 shadow-lg shadow-black/50">
      <div className="grid gap-0.5 px-1.5 py-2.5" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <button
              key={item.value}
              onClick={() => {
                console.log('MobileNav clicked:', item.value);
                onTabChange(item.value);
              }}
              className={`
                relative flex flex-col items-center justify-center gap-1 py-2 px-0.5 rounded-xl transition-all duration-300 cursor-pointer
                ${isActive 
                  ? 'bg-gradient-to-br from-yellow-500/25 to-yellow-600/25 shadow-lg shadow-yellow-500/20 scale-105' 
                  : 'hover:bg-yellow-500/10 active:scale-95 hover:shadow-md'
                }
              `}
            >
              <div className="relative">
                <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-yellow-400/10' : ''}`}>
                  <Icon 
                    name={item.icon} 
                    size={22} 
                    className={`transition-all duration-200 ${isActive ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-gray-400'}`}
                  />
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center animate-pulse shadow-lg shadow-red-500/50">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold transition-all duration-200 leading-tight ${isActive ? 'text-yellow-400' : 'text-gray-400'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full animate-slideIn" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}