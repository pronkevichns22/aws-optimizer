// ============================================================================
// FILE: DashboardSidebar.tsx
// LOCATION: client/src/components/Layout/
// PURPOSE: Dashboard sidebar with action buttons (rescan, export, logs)
// ============================================================================

import React, { useState } from 'react';
import { Radar, Archive, FileDown } from 'lucide-react';
import { AIAdvisor } from '../AIAdvisor';
import { AIAdvisorModal } from '../AIAdvisorModal';

// ========== Type definition for action buttons ==========
interface ActionButton {
  label: string;
  icon: React.ElementType;
  action: 'rescan' | 'cleanup' | 'export';
}

interface DashboardSidebarProps {
  loading?: boolean;
  onRescan?: () => void;
  onExport: () => void;
  onPageChange?: (page: 'dashboard' | 'resources' | 'security' | 'settings', viewMode?: 'alerts' | 'logs') => void;
  currentPage?: 'dashboard' | 'resources' | 'security' | 'settings';
  onToggleView?: () => void;
  alerts?: any[];
  data?: any;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  loading = false,
  onRescan,
  onExport,
  onPageChange,
  currentPage,
  onToggleView,
  alerts = [],
  data
}) => {
  // State for premium AI Advisor modal
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  
  // Extract resource count and total cost from data
  const resourceCount = data?.allResources?.length || 
                        data?.resourceCounts?.total || 
                        (data?.resourceCounts?.ec2Instances || 0) +
                        (data?.resourceCounts?.ebsVolumes || 0) +
                        (data?.resourceCounts?.elasticIPs || 0) ||
                        0;
  
  const totalCost = data?.totalSpend || data?.costBreakdown?.total || 0;
  const actions: ActionButton[] = [
    { label: 'Rescan', icon: Radar, action: 'rescan' },
    { label: 'Logs', icon: Archive, action: 'cleanup' },
    { label: 'Export', icon: FileDown, action: 'export' }
  ];

  const pageTitle = {
    'security': 'Security',
    'resources': 'Resources',
    'settings': 'Settings',
    'dashboard': 'Dashboard'
  }[currentPage || 'dashboard'];

  const handleAction = (action: string) => {
    switch (action) {
      case 'rescan':
        onRescan?.();
        break;
      case 'cleanup':
        // If already on security page, toggle the view
        if (currentPage === 'security') {
          onToggleView?.();
        } else {
          // Otherwise navigate to security with logs view
          onPageChange?.('security', 'logs');
        }
        break;
      case 'export':
        onExport();
        break;
    }
  };

  return (
    <aside className="w-[336px] sticky top-[100px] flex flex-col flex-shrink-0">
      <h1 className="text-[36px] font-black leading-none tracking-tight text-white mb-9">
        {pageTitle}
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

      <AIAdvisor 
        alerts={alerts} 
        data={data} 
        resourceCount={resourceCount} 
        totalCost={totalCost}
        onOpenModal={() => setIsAIModalOpen(true)}
      />

      {/* Premium AI Advisor Modal */}
      <AIAdvisorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        alerts={alerts}
        resourceCount={resourceCount}
        totalCost={totalCost}
      />
    </aside>
  );
};
