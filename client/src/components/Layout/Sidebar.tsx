import { LayoutDashboard, Database, ShieldAlert, Settings, LogOut, Cloud } from 'lucide-react';

interface SidebarProps {
  currentPage?: 'dashboard' | 'resources' | 'security';
  onPageChange?: (page: 'dashboard' | 'resources' | 'security') => void;
}

export const Sidebar = ({ currentPage = 'dashboard', onPageChange }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20}/>, label: 'Dashboard' },
    { id: 'resources', icon: <Database size={20}/>, label: 'Resources' },
    { id: 'security', icon: <ShieldAlert size={20}/>, label: 'Security' },
    { id: 'settings', icon: <Settings size={20}/>, label: 'Settings' },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 p-6 flex flex-col fixed left-0 top-0 z-50">
      {/* Логотип */}
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <Cloud size={24} />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-slate-800">CloudOpti</span>
      </div>
      
      {/* Меню */}
      <nav className="flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 px-2">Main Menu</p>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li 
              key={item.id} 
              onClick={() => onPageChange?.(item.id as 'dashboard' | 'resources' | 'security')}
              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${currentPage === item.id ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-gray-50'}`}
            >
              {item.icon}
              <span className="font-semibold text-sm">{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>

      {/* Кнопка выхода */}
      <div className="pt-6 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 text-slate-400 hover:text-red-500 cursor-pointer transition-colors">
          <LogOut size={20}/>
          <span className="font-semibold text-sm">Logout</span>
        </div>
      </div>
    </div>
  );
};