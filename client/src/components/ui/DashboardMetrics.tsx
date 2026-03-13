import React from 'react';

// 1. Типизируем данные для карточки
interface MetricItem {
  id: string;
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
}

// 2. Выносим данные в массив (обычно это приходит с бэкенда)
const metricsData: MetricItem[] = [
  {
    id: 'spend',
    title: 'Total Monthly Spend',
    value: '$4,520.00',
    change: '+2.5%',
    isPositive: true,
  },
  {
    id: 'savings',
    title: 'Potential Savings',
    value: '$340.50',
    change: '+2.5%',
    isPositive: true,
  },
  {
    id: 'wasted',
    title: 'Wasted Resources',
    value: '124',
    change: '+15%',
    isPositive: false, // Красный бейдж
  },
  {
    id: 'security',
    title: 'Security Level',
    value: '12',
    change: '-3.25',
    isPositive: false, // Красный бейдж
  },
];

export const DashboardMetrics: React.FC = () => {
  return (
    // Главный контейнер (фон, рамка, скругления)
    <div className="w-full bg-[#13141B] border border-[#242732] rounded-2xl p-6">
      
      // Сетка: 1 колонка на мобилках, 4 на больших экранах. divide-x делает линии между ними!
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x divide-[#242732]">
        
        {metricsData.map((metric, index) => (
          <div 
            key={metric.id} 
            // Добавляем отступы по краям для внутренних колонок
            className={`flex flex-col gap-1.5 ${
              index !== 0 ? 'lg:pl-8' : ''
            } ${index !== metricsData.length - 1 ? 'lg:pr-8' : ''}`}
          >
            {/* Заголовок */}
            <span className="text-[#818CA2] text-xs font-bold tracking-wide">
              {metric.title}
            </span>
            
            {/* Значение */}
            <span className="text-white text-3xl font-black">
              {metric.value}
            </span>
            
            {/* Блок с процентами (vs last month) */}
            <div className="flex items-center gap-2 mt-1">
              {/* Динамический бейдж: зеленый или красный в зависимости от isPositive */}
              <div
                className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center justify-center ${
                  metric.isPositive
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-[#B91012]/10 text-[#B91012]'
                }`}
              >
                {metric.change}
              </div>
              
              <span className="text-[#818CA2] text-xs font-medium">
                vs last month
              </span>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
};