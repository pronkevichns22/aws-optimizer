// ============================================================================
// FILE: Header.tsx
// LOCATION: client/src/components/Layout/
// PURPOSE: Top navigation header with page navigation and logout button
// ============================================================================

import { LogOut, LayoutDashboard, Boxes, ShieldHalf, Settings, Cloud } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// ========== Props for Header component ==========
interface HeaderProps {
  currentPage: 'dashboard' | 'resources' | 'security' | 'settings';
  onPageChange: (page: 'dashboard' | 'resources' | 'security' | 'settings') => void;
  onLogout: () => void;
}

interface NavItem {
  id: 'dashboard' | 'resources' | 'security' | 'settings';
  label: string;
  icon: any;
  path: string;
}

const DashboardIcon = ({ className = 'w-4 h-4' }) => <LayoutDashboard className={`${className} text-[#FFFFFF]`} strokeWidth={2} />;
const ResourcesIcon = ({ className = 'w-4 h-4' }) => <Boxes className={`${className} text-[#FFFFFF]`} strokeWidth={2} />;
const SecurityIcon = ({ className = 'w-4 h-4' }) => <ShieldHalf className={`${className} text-[#FFFFFF]`} strokeWidth={2} />;
const SettingsIcon = ({ className = 'w-4 h-4' }) => <Settings className={`${className} text-[#FFFFFF]`} strokeWidth={2} />;

export const Header = ({ currentPage, onPageChange, onLogout }: HeaderProps) => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/dashboard' },
    { id: 'resources', label: 'Resources', icon: ResourcesIcon, path: '/resources' },
    { id: 'security', label: 'Security', icon: SecurityIcon, path: '/security' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/settings' }
  ];

  const handleNavigate = (item: NavItem) => {
    onPageChange(item.id);
    navigate(item.path);
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out"
      style={{ transform: scrolled ? 'translateY(-73px)' : 'translateY(0)' }}
    >
      <div className="flex justify-center px-[60px] bg-[#181921]">
        <div className="w-full max-w-[1600px]">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#1a85ff] rounded-lg flex items-center justify-center shadow-lg shadow-[#1a85ff]/20">
                <Cloud className="w-7 h-7 text-white"/>
              </div>
              <span className="text-white font-bold text-lg font-['Albert_Sans']">
                CloudOpti
              </span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-[#818ca2] hover:text-red-400 transition-colors font-['Albert_Sans'] text-[12px] font-bold"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <div className="border-t border-[#242732] py-2 flex items-center gap-6 pb-2">
            {navItems.map(item => {
              const isActive = currentPage === item.id;
              const isHovered = hoveredItem === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item)}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="py-2 flex items-center gap-1 font-['Albert_Sans'] transition-all"
                >
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
                    <item.icon />
                  </div>
                  <span
                    className="text-[12px] font-bold tracking-wide"
                    style={{ color: isActive || isHovered ? 'white' : '#818ca2' }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};