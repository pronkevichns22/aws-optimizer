import { BarChart, LineChart } from 'lucide-react';

interface ChartProps {
  title: string;
  data: { label: string; value: number }[];
  type?: 'bar' | 'line';
}

export const Chart = ({ title, data, type = 'bar' }: ChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <div className="text-indigo-600">
          {type === 'bar' ? <BarChart size={20} /> : <LineChart size={20} />}
        </div>
      </div>
      
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-900">{item.label}</span>
              <span className="text-indigo-600 font-bold">${item.value.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
