// ============================================================================
// FILE: StatCard.tsx
// LOCATION: client/src/components/ui/
// PURPOSE: Reusable KPI card component showing metric with title, value, and trend
// ============================================================================

import React from 'react';

// ========== Props for StatCard component ==========
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: 'positive' | 'negative' | 'neutral';
  maxWidth?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon, 
  trend,
  trendColor = 'neutral',
  maxWidth = 'w-full'
}: StatCardProps) => {
  const trendColorClass = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-[#818ca2]'
  }[trendColor];

  return (
    <div className={`${maxWidth} bg-[#181921] border border-[#242732] rounded-2xl p-6 transition-all duration-300 hover:border-[#3b4153] group`}>
      {/* Header: Title + Icon Container */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <p className="text-[#818ca2] text-[13px] font-semibold uppercase tracking-wider">
            {title}
          </p>
        </div>
        {/* Icon in top-right corner with subtle background */}
        <div className="ml-4 p-3 bg-[#1c1f28] rounded-xl text-[#818ca2] group-hover:text-blue-400 transition-colors">
          <div className="w-5 h-5">
            {icon}
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="mb-4">
        <h3 className="text-white text-4xl font-bold tracking-tight">
          {value}
        </h3>
      </div>

      {/* Trend/Subtitle */}
      {trend && (
        <div className="flex items-center gap-2">
          <p className={`text-[12px] font-semibold ${trendColorClass}`}>
            {trend}
          </p>
        </div>
      )}
    </div>
  );
};