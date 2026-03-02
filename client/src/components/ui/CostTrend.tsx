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
    <div className="bg-[#1f2029] rounded-[20px] border border-[#242732] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#242732]">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-[16px] font-bold text-white tracking-tight" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}>Cost Trend</h3>
            <p className="text-[12px] text-[#818ca2] font-medium mt-1" style={{ fontFamily: "'Albert Sans', sans-serif" }}>Spending & waste analysis</p>
          </div>
          {wasteReduction > 0 && (
            <div className="flex items-center gap-2 bg-[#00CC44]/10 px-3 py-1.5 rounded-full">
              <TrendingUp size={14} className="text-[#00CC44]" />
              <span className="text-[11px] font-bold text-[#00CC44]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                ${Math.abs(wasteReduction).toFixed(2)} reduction
              </span>
            </div>
          )}
        </div>

        {/* Time Period Buttons */}
        <div className="flex gap-2">
          {(['12h', '24h', '7d', '30d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                timePeriod === period
                  ? 'bg-[#1a85ff] text-white'
                  : 'bg-[#242732] text-[#818ca2] hover:bg-[#2a2e3f] hover:text-white'
              }`}
              style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}
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
        className="relative bg-[#1f2029]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#242732" />
            <XAxis dataKey="date" stroke="#818ca2" style={{ fontSize: '11px' }} />
            <YAxis stroke="#818ca2" style={{ fontSize: '11px' }} width={35} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#242732',
                border: '1px solid #242732',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
              }}
              formatter={(value: any) => `$${value.toFixed(2)}`}
            />
            <Line
              type="monotone"
              dataKey="spend"
              stroke="#FF4444"
              strokeWidth={2}
              dot={false}
              name="Total Spend"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="waste"
              stroke="#00CC44"
              strokeWidth={2}
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
        className={`h-1 bg-[#242732] hover:bg-[#1a85ff] cursor-ns-resize transition-all ${
          isResizing ? 'bg-[#1a85ff]' : ''
        }`}
        title="Drag to resize"
      />
    </div>
  );
};
