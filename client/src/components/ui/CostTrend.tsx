import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface CostTrendProps {
  data?: any;
  auditHistory?: any[];
}

type TimePeriod = '12h' | '24h' | '7d' | '30d';

export const CostTrend = ({ data, auditHistory }: CostTrendProps) => {
  const [height, setHeight] = useState(250);
  const [isResizing, setIsResizing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7d');
  const [startY, setStartY] = useState(0);

  const generateMockTrendData = (period: TimePeriod) => {
    const today = new Date();
    const trendData = [];
    let dataPoints = 7;

    if (period === '12h') dataPoints = 12;
    else if (period === '24h') dataPoints = 24;
    else if (period === '7d') dataPoints = 7;
    else if (period === '30d') dataPoints = 30;

    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(today);
      if (period === '12h' || period === '24h') {
        date.setHours(date.getHours() - i);
      } else {
        date.setDate(date.getDate() - i);
      }
      
      const dayStr = period === '12h' || period === '24h'
        ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const baseSpend = data?.summary?.totalSpend || 36.88;
      const baseWaste = data?.summary?.totalWaste || 9.20;
      const randomFactor = 0.8 + Math.random() * 0.4;

      trendData.push({
        date: dayStr,
        spend: parseFloat((baseSpend * randomFactor).toFixed(2)),
        waste: parseFloat((baseWaste * randomFactor).toFixed(2))
      });
    }

    return trendData;
  };

  const trendData = auditHistory && auditHistory.length > 0 ? auditHistory : generateMockTrendData(timePeriod);

  const minWaste = Math.min(...trendData.map(d => d.waste));
  const maxWaste = Math.max(...trendData.map(d => d.waste));
  const wasteReduction = maxWaste - minWaste;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isResizing) return;
    const diff = e.clientY - startY;
    const newHeight = Math.max(200, height + diff);
    setHeight(newHeight);
    setStartY(e.clientY);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  return (
    <div className="bg-white rounded-3xl ring-1 ring-slate-900/5 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-slate-200">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Cost Trend</h3>
            <p className="text-sm text-slate-600 font-medium mt-2">Spending & waste analysis</p>
          </div>
          {wasteReduction > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-100/80 to-emerald-50/80 px-4 py-2 rounded-full ring-1 ring-emerald-200/50">
              <TrendingUp size={18} className="text-emerald-600" />
              <span className="text-xs font-extrabold text-emerald-700 tracking-tight">
                ${Math.abs(wasteReduction).toFixed(2)} reduction
              </span>
            </div>
          )}
        </div>

        {/* Time Period Buttons */}
        <div className="flex gap-3">
          {(['12h', '24h', '7d', '30d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 tracking-tight ${
                timePeriod === period
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-300/50'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 ring-1 ring-slate-200'
              }`}
            >
              {period === '12h' ? '12h' : period === '24h' ? '24h' : period === '7d' ? '7 days' : '30 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ height: `${height}px` }}
        className="relative bg-gradient-to-b from-slate-50 to-white"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '11px' }} />
            <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} width={35} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
              }}
              formatter={(value: any) => `$${value.toFixed(2)}`}
            />
            <Line
              type="monotone"
              dataKey="spend"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              name="Total Spend"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="waste"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={false}
              name="Wasted Cost"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`h-1.5 bg-gradient-to-r from-slate-200 to-slate-100 hover:from-indigo-400 hover:to-indigo-300 cursor-ns-resize transition-all ${
          isResizing ? 'from-indigo-500 to-indigo-400' : ''
        }`}
        title="Drag to resize"
      />
    </div>
  );
};
