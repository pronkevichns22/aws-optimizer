// ============================================================================
// FILE: ActionSidebar.tsx
// LOCATION: client/src/components/Layout/
// PURPOSE: Reusable action sidebar for all pages with consistent design
// ============================================================================

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AIAdvisor } from '../AIAdvisor';

interface ActionButton {
  label: string;
  icon: LucideIcon;
  action: string;
  disabled?: boolean;
}

interface ActionSidebarProps {
  title: string;
  buttons: ActionButton[];
  onAction: (action: string) => void;
  loading?: boolean;
  loadingAction?: string;
  alerts?: any[];
  data?: any;
}

export const ActionSidebar: React.FC<ActionSidebarProps> = ({
  title,
  buttons,
  onAction,
  loading = false,
  loadingAction,
  alerts = [],
  data
}) => {
  // Extract resource count and total cost from data
  const resourceCount = data?.allResources?.length || 
                        data?.resourceCounts?.total || 
                        (data?.resourceCounts?.ec2Instances || 0) +
                        (data?.resourceCounts?.ebsVolumes || 0) +
                        (data?.resourceCounts?.elasticIPs || 0) ||
                        0;
  
  const totalCost = data?.totalSpend || data?.costBreakdown?.total || 0;
  return (
    <aside className="w-[336px] sticky top-[100px] flex flex-col flex-shrink-0">
      <h1 className="text-[36px] font-black leading-none tracking-tight text-white mb-9">
        {title}
      </h1>

      <div className="bg-[#13141B] border border-[#242732] rounded-[16px] p-3 flex justify-between items-center h-[140px] shadow-lg mb-3">
        {buttons.map((button, i) => (
          <button
            key={i}
            onClick={() => onAction(button.action)}
            disabled={button.disabled || (loading && button.action === loadingAction)}
            className={`group flex flex-col items-center justify-center w-24 h-28 rounded-2xl transition-all hover:bg-[#1C1D25] ${(loading && button.action === loadingAction) || button.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} text-[#818CA2] hover:text-white`}
          >
            <div className="p-2.5 rounded-full bg-[#1C1D25] group-hover:bg-transparent transition-all mb-1">
              <button.icon size={22} className="group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-center">
              {loading && button.action === loadingAction ? 'Loading...' : button.label}
            </span>
          </button>
        ))}
      </div>

      <AIAdvisor alerts={alerts} data={data} resourceCount={resourceCount} totalCost={totalCost} />
    </aside>
  );
};
