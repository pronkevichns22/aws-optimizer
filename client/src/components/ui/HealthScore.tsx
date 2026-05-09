// ============================================================================
// FILE: HealthScore.tsx
// LOCATION: client/src/components/ui/
// PURPOSE: Component for displaying AWS infrastructure health score
// ============================================================================

import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

// ========== Props for HealthScore component ==========
interface HealthScoreProps {
  totalSpend: number;
  totalWaste: number;
}

export const HealthScore = ({ totalSpend, totalWaste }: HealthScoreProps) => {
  const wastePercentage = totalSpend > 0 ? (totalWaste / totalSpend) * 100 : 0;
  const healthScore = Math.max(0, 100 - wastePercentage * 5); // Чем выше процент потерь, тем ниже оценка

  let color = 'text-emerald-600';
  let bgColor = 'bg-emerald-50';
  let borderColor = 'border-emerald-200';
  let statusLabel = 'Excellent';
  let statusIcon = <CheckCircle size={20} />;

  if (wastePercentage > 20) {
    color = 'text-red-600';
    bgColor = 'bg-red-50';
    borderColor = 'border-red-200';
    statusLabel = 'Critical';
    statusIcon = <AlertCircle size={20} />;
  } else if (wastePercentage > 10) {
    color = 'text-amber-600';
    bgColor = 'bg-amber-50';
    borderColor = 'border-amber-200';
    statusLabel = 'Warning';
    statusIcon = <TrendingUp size={20} />;
  }

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className={`${bgColor} border ${borderColor} p-8 rounded-3xl`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Cloud Health Score</h3>
          <p className="text-sm text-slate-600 mt-1">Infrastructure optimization rating</p>
        </div>
        <div className={`flex items-center gap-2 ${color}`}>
          {statusIcon}
          <span className="font-bold">{statusLabel}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {/* Круговой прогресс */}
        <div className="relative w-40 h-40">
          <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
            {/* Фоновый круг */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-gray-200"
            />
            {/* Прогресс круг */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={color}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-black ${color}`}>{healthScore.toFixed(0)}</span>
            <span className="text-xs text-slate-500">/ 100</span>
          </div>
        </div>

        {/* Метрики */}
        <div className="flex-1 ml-8 space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-slate-900">Waste Ratio</span>
              <span className={`font-bold ${color}`}>{wastePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-full rounded-full transition-all`}
                style={{
                  width: `${Math.min(wastePercentage, 100)}%`,
                  backgroundColor: wastePercentage > 20 ? '#dc2626' : wastePercentage > 10 ? '#f59e0b' : '#10b981'
                }}
              />
            </div>
          </div>

          <div className="text-sm text-slate-600">
            <p>💡 <span className="font-semibold">Recommendation:</span></p>
            <p className="mt-1">
              {wastePercentage > 20
                ? 'Delete unused resources immediately to reduce costs.'
                : wastePercentage > 10
                ? 'Consider removing low-utilization resources.'
                : 'Great job! Your infrastructure is well-optimized.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
