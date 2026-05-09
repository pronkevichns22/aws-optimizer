// ============================================================================
// FILE: SecurityMetrics.tsx
// LOCATION: client/src/components/ui/
// PURPOSE: Component for displaying security metrics (Critical, High, Medium, etc.)
// ============================================================================

import React from 'react';

// ========== Type definition for metric items ==========
interface MetricItem {
  label: string;
  value: string | number;
  trend: string;
  trendType: 'positive' | 'negative';
}

interface BreakdownItem {
  label: string;
  count: number;
  color: string;
}

interface SecurityMetricsProps {
  metrics: MetricItem[];
  breakdown?: BreakdownItem[];
}

export const SecurityMetrics = ({ metrics, breakdown }: SecurityMetricsProps) => {
  return (
    <div className="w-full">
      <div className="flex items-center h-full">
        {metrics.map((metric, idx) => (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
              <h2 className="text-[#818ca2] text-[10px] font-black uppercase tracking-wider text-center">
                {metric.label}
              </h2>
              <p className="text-white text-3xl font-black text-center leading-none">
                {metric.value}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <div
                  className={`
                    px-2 py-1 rounded-full border
                    ${
                      metric.trendType === 'positive'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-red-700/10 border-red-700/30'
                    }
                  `}
                >
                  <div className={`text-[10px] font-bold ${
                    metric.trendType === 'positive'
                      ? 'text-emerald-500'
                      : 'text-red-700'
                  }`}>
                    {metric.trend}
                  </div>
                </div>
                <div className="text-[#818ca2] text-[10px] whitespace-nowrap">
                  vs last month
                </div>
              </div>
            </div>
            {idx < metrics.length - 1 && (
              <div className="w-px h-20 bg-[#242732] mx-2" />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Breakdown Legend */}
      {breakdown && breakdown.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mt-4">
          {breakdown.map((item, idx) => (
            <div 
              key={idx} 
              className="bg-gradient-to-br rounded-xl p-4 border-2 transition-all hover:scale-105 shadow-md"
              style={{
                borderColor: item.color,
                backgroundColor: `${item.color}15`,
              }}
            >
              <div className="flex flex-col items-center justify-center">
                <span className="text-[#818ca2] text-[11px] font-bold uppercase tracking-widest text-center mb-2">
                  {item.label}
                </span>
                <span 
                  className={`text-3xl font-black`} 
                  style={{ color: item.color }}
                >
                  {item.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
