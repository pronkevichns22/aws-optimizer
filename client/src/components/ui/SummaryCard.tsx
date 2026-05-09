// ============================================================================
// FILE: SummaryCard.tsx
// LOCATION: client/src/components/ui/
// PURPOSE: Summary card showing total spend, waste, and resource count
// ============================================================================

import { TrendingUp, TrendingDown, Percent } from 'lucide-react';

// ========== Props for SummaryCard component ==========
interface SummaryProps {
  totalSpend: number;
  totalWaste: number;
  savingsPercentage: number;
  resourceCount: number;
}

export const SummaryCard = ({ totalSpend, totalWaste, savingsPercentage, resourceCount }: SummaryProps) => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-8 rounded-3xl border border-slate-200 shadow-sm">
      <div className="grid grid-cols-4 gap-6">
        {/* Total Spend */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Spend</span>
            <TrendingUp className="text-blue-500" size={18} />
          </div>
          <p className="text-3xl font-black text-slate-900">${totalSpend.toFixed(2)}</p>
          <p className="text-xs text-slate-500 mt-2">Monthly bill</p>
        </div>

        {/* Potential Savings */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-2xl border border-red-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Potential Savings</span>
            <TrendingDown className="text-red-500" size={18} />
          </div>
          <p className="text-3xl font-black text-red-600">${totalWaste.toFixed(2)}</p>
          <p className="text-xs text-red-500 mt-2">Can be saved</p>
        </div>

        {/* Savings Percentage */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Optimization</span>
            <Percent className="text-emerald-500" size={18} />
          </div>
          <p className="text-3xl font-black text-emerald-600">{savingsPercentage.toFixed(1)}%</p>
          <p className="text-xs text-emerald-600 mt-2">Waste ratio</p>
        </div>

        {/* Resources Count */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Unused Resources</span>
            <span className="text-lg font-black text-indigo-600">#</span>
          </div>
          <p className="text-3xl font-black text-slate-900">{resourceCount}</p>
          <p className="text-xs text-slate-500 mt-2">Items to delete</p>
        </div>
      </div>
    </div>
  );
};
