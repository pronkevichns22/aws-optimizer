import React from 'react';

interface Props {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: string;
  isMain?: boolean; // Если true — карточка будет темной и акцентной
}

export const StatCard = ({ title, value, icon, trend, isMain }: Props) => {
  return (
    <div className={`${isMain ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'bg-white text-slate-900 shadow-sm'} p-6 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${isMain ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
          <h3 className="text-3xl font-black mt-2 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-2xl ${isMain ? 'bg-white/10 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
          {icon}
        </div>
      </div>
      <div className="mt-6">
        <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isMain ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
          {trend}
        </span>
      </div>
    </div>
  );
};