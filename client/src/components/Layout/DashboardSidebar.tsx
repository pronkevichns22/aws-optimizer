import React from 'react';
import { Radar, Trash2, FileDown } from 'lucide-react';
import { AIAdvisor } from '../AIAdvisor';

interface ActionButton {
  label: string;
  icon: React.ElementType;
  action: 'rescan' | 'cleanup' | 'export';
}

interface DashboardSidebarProps {
  loading?: boolean;
  onRescan?: () => void;
  onCleanup: () => void;
  onExport: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  loading = false,
  onRescan,
  onCleanup,
  onExport
}) => {
  const actions: ActionButton[] = [
    { label: 'Rescan', icon: Radar, action: 'rescan' },
    { label: 'Cleanup', icon: Trash2, action: 'cleanup' },
    { label: 'Export', icon: FileDown, action: 'export' }
  ];

  const handleAction = (action: string) => {
    switch (action) {
      case 'rescan':
        onRescan?.();
        break;
      case 'cleanup':
        onCleanup();
        break;
      case 'export':
        onExport();
        break;
    }
  };

  return (
    <aside className="w-[336px] sticky top-[100px] flex flex-col flex-shrink-0">
      <h1 className="text-[36px] font-black leading-none tracking-tight text-white mb-9">
        Dashboard
      </h1>

      <div className="bg-[#13141B] border border-[#242732] rounded-[16px] p-3 flex justify-between items-center h-[140px] shadow-lg mb-3">
        {actions.map((actionBtn, i) => (
          <button
            key={i}
            onClick={() => handleAction(actionBtn.action)}
            disabled={loading && actionBtn.action === 'rescan'}
            className={`group flex flex-col items-center justify-center w-24 h-28 rounded-2xl transition-all hover:bg-[#1C1D25] ${loading && actionBtn.action === 'rescan' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} text-[#818CA2] hover:text-white`}
          >
            <div className="p-2.5 rounded-full bg-[#1C1D25] group-hover:bg-transparent transition-all mb-1">
              <actionBtn.icon size={22} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-center">
              {loading && actionBtn.action === 'rescan' ? 'Loading...' : actionBtn.label}
            </span>
          </button>
        ))}
      </div>

      <AIAdvisor />
    </aside>
  );
};
