import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Radar, Trash2, FileDown, Search } from 'lucide-react';
import { AIAdvisor } from '../components/AIAdvisor';

interface DashboardProps {
  loading?: boolean;
  data?: any;
  onRescan?: () => void;
}

const MetricCard = ({ title, value, changePercent, changeType, showDivider }: any) => {
    const isPositive = changeType === "positive";
    const textColor = isPositive ? "#10B981" : "#EF4444"; 
    const bgColor = isPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"; 

    return (
      <>
        <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
          <h2 className="text-[#818ca2] text-[10px] font-black uppercase tracking-wider text-center">{title}</h2>
          <p className="text-white text-3xl font-black text-center leading-none">{value}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="px-2 py- rounded-2xl" style={{ backgroundColor: bgColor }}>
              <span className="text-[10px] font-bold" style={{ color: textColor }}>{changePercent}</span>
            </div>
            <span className="text-[#818ca2] text-[10px] whitespace-nowrap">vs last month</span>
          </div>
        </div>
        {showDivider && <div className="w-px h-20 bg-[#242732] mx-2" />}
      </>
    );
};

const NewDashboard: React.FC<DashboardProps> = ({ loading, data, onRescan }) => {
  // Подготавливаем данные для диаграммы из ресурсов
  const serviceBreakdownData = (() => {
    const breakdown: { [key: string]: number } = {};
    const resources = data?.summary?.resources || [];
    
    resources.forEach((r: any) => {
      const type = r.type || 'Other';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });

    const colors = ["#B648FF", "#1A85FF", "#EF4444", "#14B8A6", "#FF9F43", "#00D084", "#479DFF", "#818CA2"];
    let colorIndex = 0;

    return Object.entries(breakdown)
      .map(([name, value]) => ({
        name,
        value,
        color: colors[colorIndex++ % colors.length]
      }))
      .slice(0, 4);
  })();
  return (
    <div className="flex justify-center px-[60px] pb-10 relative">

      <div className="w-full max-w-[1600px] flex gap-12 items-start z-10">
        
        {/*Сайдбар==================================================== */}

        <aside className=" w-[336px] sticky top-[100px] flex flex-col flex-shrink-0">
          
          <h1 className="text-[36px] font-black leading-none tracking-tight text-white mb-9">
            Dashboard
          </h1>

          <div className="bg-[#13141B] border border-[#242732] rounded-[16px] p-3 flex justify-between items-center h-[140px] shadow-lg mb-3">
            {[
              { label: 'Rescan', icon: Radar, action: 'rescan' },
              { label: 'Cleanup', icon: Trash2, action: 'cleanup' },
              { label: 'Export', icon: FileDown, action: 'export' }
            ].map((actionBtn, i) => (
              <button 
                key={i}
                onClick={() => {
                  if (actionBtn.action === 'rescan' && onRescan) {
                    onRescan();
                  }
                }}
                disabled={loading && actionBtn.action === 'rescan'}
                className={`group flex flex-col items-center justify-center w-24 h-28 rounded-2xl transition-all hover:bg-[#1C1D25] ${loading && actionBtn.action === 'rescan' ? 'opacity-50 cursor-not-allowed' : ''} text-[#818CA2] hover:text-white`}
              >
                <div className="p-2.5 rounded-full bg-[#1C1D25] group-hover:bg-transparent transition-all mb-1 border border-[#242732]">
                  <actionBtn.icon size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-center">
                  {loading && actionBtn.action === 'rescan' ? 'Loading...' : actionBtn.label}
                </span>
              </button>
            ))}
          </div>

          <AIAdvisor />
        </aside>

        {/* правая часть============================================================*/}

        <main className="flex-1 flex flex-col">
          
          <div className="h-[36px] flex items-center mb-9"> 
              <div className="group bg-[#181921] border border-[#242732] rounded-[16px] px-5 py-3 flex items-center gap-4 w-full max-w-[500px] focus-within:border-[#47B2FF] hover:border-[#47B2FF]/70 transition-all shadow-lg">
                <Search size={24} className="text-[#818CA2]" />
                <input 
                    type="text" 
                    placeholder="Search resources by ID or tag..." 
                    className="bg-transparent border-none outline-none text-sm w-full placeholder-[#818CA2] font-medium" 
                />
              </div>
          </div>

          <section className="flex h-[140px] items-center bg-[#13141b] rounded-[16px] border border-[#242732] px-6 shadow-lg mb-3">
            {(() => {
              const totalSpend = data?.summary?.totalSpend || 0;
              const totalWaste = data?.summary?.totalWaste || 0;
              const wasteCount = data?.summary?.wasteCount || 0;
              const totalResources = data?.summary?.resources?.length || 0;
              
              const wastePercentNum = totalSpend > 0 ? (totalWaste / totalSpend) * 100 : 0;
              const wastePercent = wastePercentNum.toFixed(1);
              const resourcesPercentNum = totalResources > 0 ? (wasteCount / totalResources) * 100 : 0;
              const resourcesPercent = resourcesPercentNum.toFixed(1);

              return [
                { 
                  title: "Total Spend", 
                  value: totalSpend ? `$${totalSpend.toFixed(2)}` : "$0.00",
                  changePercent: `${wastePercent}%`,
                  changeType: wastePercentNum > 0 ? "negative" : "positive"
                },
                { 
                  title: "Total Waste", 
                  value: totalWaste ? `$${totalWaste.toFixed(2)}` : "$0.00",
                  changePercent: `${wastePercent}%`,
                  changeType: "negative"
                },
                { 
                  title: "Resources Count", 
                  value: totalResources.toString(),
                  changePercent: totalResources > 0 ? totalResources.toString() : "0",
                  changeType: "positive"
                },
                { 
                  title: "Wasted Resources", 
                  value: wasteCount.toString(),
                  changePercent: `${resourcesPercent}%`,
                  changeType: wasteCount > 0 ? "negative" : "positive"
                }
              ].map((metric, index) => (
                  <MetricCard
                    key={metric.title}
                    title={metric.title}
                    value={metric.value}
                    changePercent={metric.changePercent}
                    changeType={metric.changeType}
                    showDivider={index < 3}
                  />
                ));
            })()}
          </section>

          {/* Графики */}
          <div className="grid grid-cols-1 xl:grid-cols-[2.2fr_1fr] gap-3 mb-3">
            <div className="bg-[#181921] border border-[#242732] rounded-[16px] p-8 h-[400px] flex flex-col shadow-lg">
              <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-2xl font-black mb-1 text-white">Cost Trend</h3>
                    <p className="text-[#818CA2] text-sm font-medium">Last 7 days spending analysis</p>
                  </div>
                  {(() => {
                    const totalSpend = data?.summary?.totalSpend || 0;
                    const totalWaste = data?.summary?.totalWaste || 0;
                    const wastePercent = totalSpend > 0 ? ((totalWaste / totalSpend) * 100).toFixed(1) : 0;
                    const isPositive = parseFloat(String(wastePercent)) < 5;
                    
                    return (
                      <div className="flex items-center gap-2 font-bold text-sm px-3 py-1 rounded-lg border" style={{ 
                        color: isPositive ? "#10B981" : "#EF4444", 
                        backgroundColor: isPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
                        borderColor: isPositive ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)" 
                      }}>
                        <Radar size={14} /> {wastePercent}%
                      </div>
                    );
                  })()}
               </div>
              <div className="flex-1 border-2 border-dashed border-[#242732] rounded-2xl flex items-center justify-center opacity-20 font-bold uppercase tracking-widest text-xs text-white">
                {loading ? 'Loading...' : 'Chart Area'}
              </div>
            </div>
            
            <div className="bg-[#181921] border border-[#242732] rounded-[16px] p-8 h-[400px] flex flex-col shadow-lg">
              <h3 className="text-xl font-black mb-6 tracking-tight text-white">Spend by Service</h3>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                      <Pie data={serviceBreakdownData} innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {serviceBreakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1C1D25', border: 'none', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-y-3 mt-4 pt-4 border-t border-[#242732]">
                {serviceBreakdownData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-[11px] font-bold text-white">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div> {item.name} - {item.value}%
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="bg-[#181921] rounded-[20px] border border-[#242732] p-8 mb-10 shadow-lg">
                <h2 className="text-xl font-extrabold text-white mb-8 leading-7">Unused Resources</h2>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#242732]">
                            <th className="text-left py-3 px-2 text-gray-400 font-semibold text-xs uppercase tracking-wider">Resource ID</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Type</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Size</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Cost</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data?.resources && data.resources.length > 0 ? (
                            data.resources.slice(0, 6).map((resource: any, i: number) => (
                              <tr key={i} className="border-b border-[#242732] hover:bg-[#1f2029] transition-colors">
                                <td className="py-4 px-2 text-left">
                                  <span className="px-3 py-1 rounded-full text-sm font-mono border border-[#479DFF]/40 bg-[#2F334B] text-[#479DFF]">
                                    {resource.id?.substring(0, 15)}...
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className="px-3 py-1 rounded-full text-xs font-medium border border-purple-500/40 bg-purple-500/10 text-purple-500 uppercase">
                                    {resource.type}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-center text-gray-300">{resource.size} GB</td>
                                <td className="py-4 px-4 text-center font-semibold text-[#EF4444]">${resource.cost.toFixed(2)}</td>
                                <td className="py-4 px-4 text-center">
                                  <button className="text-gray-400 hover:text-white transition-colors p-1"><Trash2 size={16}/></button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-[#818CA2]">
                                {loading ? 'Loading resources...' : 'No unused resources found'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                    </table>
                </div>
            </section>

        </main>
      </div>
    </div>
  );
};

export default NewDashboard;