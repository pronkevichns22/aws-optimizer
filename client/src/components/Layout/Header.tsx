import { LogOut, LayoutDashboard, Boxes, ShieldHalf, Settings } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  currentPage: 'dashboard' | 'resources' | 'security' | 'settings';
  onPageChange: (page: 'dashboard' | 'resources' | 'security' | 'settings') => void;
  onLogout: () => void;
}

interface NavItem {
  id: 'dashboard' | 'resources' | 'security' | 'settings';
  label: string;
  icon: any;
}

// Dashboard Icon Component
const DashboardIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
   <LayoutDashboard className={`${className} text-[#FFFFFF]`} strokeWidth={2} />
);

// Resources Icon Component
const ResourcesIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <Boxes className={`${className} text-[#FFFFFF]`} strokeWidth={2} />
);

// Security Icon Component
const SecurityIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <ShieldHalf className={`${className} text-[#FFFFFF]`} strokeWidth={2} />
);

// Settings Icon Component
const SettingsIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <Settings className={`${className} text-[#FFFFFF]`} strokeWidth={2} />
);

export const Header = ({ currentPage, onPageChange, onLogout }: HeaderProps) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'resources', label: 'Resources', icon: ResourcesIcon },
    { id: 'security', label: 'Security', icon: SecurityIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const getIcon = (IconComponent: any) => {
    return <IconComponent />;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#181921] border-b border-[#242732]">
      {/* Top bar with logo */}
      <div className="px-8 py-4 flex items-center justify-between border-b border-[#242732]">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#1a85ff] rounded-lg flex items-center justify-center">
            <DashboardIcon className="w-6 h-6" />
          </div>
          <span className="text-white font-bold text-lg" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}>
            CloudOpti
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 text-[#818ca2] hover:text-white transition"
          style={{ fontFamily: "'Albert Sans', sans-serif", fontSize: '12px', transitionDuration: '150ms', transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Navigation */}
      <div className="px-8 py-0 flex items-center gap-6">
        {navItems.map(item => {
          const isActive = currentPage === item.id;
          const isHovered = hoveredItem === item.id;
          
          return (
            <div key={item.id} className="relative">
              <button
                onClick={() => onPageChange(item.id as any)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="py-4 flex items-center gap-1"
                style={{ fontFamily: "'Albert Sans', sans-serif" }}
              >
                {/* Icon - show when active or hovered, with animation */}
                <div 
                  className="w-4 h-4 flex-shrink-0 overflow-hidden"
                  style={{
                    width: (isActive || isHovered) ? 16 : 0,
                    opacity: (isActive || isHovered) ? 1 : 0,
                    transform: (isActive || isHovered) ? 'translateY(0)' : 'translateY(4px)',
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    marginRight: (isActive || isHovered) ? 4 : 0
                  }}
                >
                  {getIcon(item.icon)}
                </div>
                
                {/* Text with smooth color animation */}
                <span
                  className="text-[10px] font-bold"
                  style={{
                    fontFamily: "'Albert Sans', sans-serif",
                    fontWeight: 700,
                    color: isActive ? 'white' : isHovered ? 'white' : '#818ca2',
                    transition: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  {item.label}
                </span>
              </button>
              
              {/* Bottom indicator - only show when active with smooth animation */}
              <div 
                className="absolute bottom-0 left-0 h-[2px] bg-[#1a85ff]"
                style={{
                  right: 0,
                  opacity: 0,
                  transition: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </div>
          );
        })}
      </div>
    </header>
  );
};
