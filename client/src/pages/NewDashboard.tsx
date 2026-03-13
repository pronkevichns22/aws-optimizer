import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Search, Filter, Trash2 } from 'lucide-react';
import { DashboardSidebar } from '../components/Layout/DashboardSidebar';
import { CostTrend } from '../components/ui/CostTrend';
import { downloadReport } from '../utils/exportReport';

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

const getResourceTypeStyle = (type: string) => {
  switch (type?.toUpperCase()) {
    case 'EC2':
      return "bg-[#36273F] text-[#B548FF] border border-[#B548FF]/30";
    case 'EBS':
      return "bg-[#2B413F] text-[#14B8A6] border border-[#14B8A6]/30";
    case 'IP':
      return "bg-[#3F312B] text-[#FF9F43] border border-[#FF9F43]/30";
    case 'RDS':
      return "bg-[#3F312B] text-[#FF9F43] border border-[#FF9F43]/30";
    case 'S3':
      return "bg-[#2B3F3D] text-[#00D084] border border-[#00D084]/30";
    default:
      return "bg-[#242638] text-[#479DFF] border border-[#479DFF]/30";
  }
};

const getFilterPillStyle = (category: string, isSelected: boolean) => {
  if (!isSelected) {
    return 'bg-[#242732] text-[#818CA2] hover:bg-[#2F334B]';
  }
  
  switch (category.toUpperCase()) {
    case 'EC2':
      return "bg-[#36273F] text-[#B548FF] border border-[#B548FF]/30";
    case 'EBS':
      return "bg-[#2B413F] text-[#14B8A6] border border-[#14B8A6]/30";
    case 'IP':
      return "bg-[#3F312B] text-[#FF9F43] border border-[#FF9F43]/30";
    case 'ALL':
      return "bg-[#353C48] text-[#9AA3B0] border border-[#404854]";
    default:
      return "bg-[#242732] text-[#818CA2]";
  }
};

const EmptyState = () => (
  <div className="py-12 flex flex-col items-center justify-center">
    <Filter size={48} className="text-[#818CA2] mb-4 opacity-50" />
    <h3 className="text-white font-bold text-lg mb-1">No resources found</h3>
    <p className="text-[#818CA2] text-sm">Try adjusting your filters or search criteria</p>
  </div>
);

const NewDashboard: React.FC<DashboardProps> = ({ loading, data, onRescan }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [resources, setResources] = useState(data?.resources || []);
  
  // Добавляем состояние для пагинации (показываем по умолчанию 5 записей)
  const [visibleCount, setVisibleCount] = useState(5);

  // Фильтруем ресурсы по категории и поисковому запросу
  const filterCategories = ['All', 'EC2', 'EBS', 'IP'];
  const filteredResources = resources.filter((resource: any) => {
    const matchCategory = selectedCategory === 'All' || resource.type === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      resource.id.toLowerCase().includes(searchLower) || 
      resource.type.toLowerCase().includes(searchLower);
    return matchCategory && matchSearch;
  });

  // Отрезаем только видимую часть для отображения
  const visibleResources = filteredResources.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResources.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 5); // Подгружаем еще по 5 штук
  };

  // Подготавливаем данные для диаграммы из ресурсов
  const serviceBreakdownData = (() => {
    const breakdown: { [key: string]: number } = {};
    const allResources = data?.allResources || [];
    
    allResources.forEach((r: any) => {
      const type = r.type || 'Other';
      breakdown[type] = (breakdown[type] || 0) + (r.cost || 0);
    });

    const colors = ["#B648FF", "#1A85FF", "#EF4444", "#14B8A6", "#FF9F43", "#00D084", "#479DFF", "#818CA2"];
    let colorIndex = 0;

    const totalCost = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return Object.entries(breakdown)
      .map(([name, value]) => ({
        name,
        value: totalCost > 0 ? parseFloat(((value / totalCost) * 100).toFixed(1)) : 0,
        color: colors[colorIndex++ % colors.length]
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  })();

  // Handler для экспорта
  const handleExport = () => {
    if (!data?.resources) {
      alert("No data available to export. Please run a scan first.");
      return;
    }

    const dataToExport = filteredResources.length > 0 ? filteredResources : resources;

    downloadReport({
      title: 'CloudOpti Security & Cost Report',
      filename: `aws-audit-${new Date().toISOString().split('T')[0]}.html`,
      resources: dataToExport,
      summary: {
        totalSpend: data.summary?.totalSpend || 0,
        totalWaste: data.summary?.totalWaste || 0,
        wasteCount: data.summary?.wasteCount || 0,
        totalResources: data.summary?.resources?.length || data.resources.length || 0
      }
    });
  };

  // Handler для очистки
  const handleCleanup = () => {
    if (filteredResources.length === 0) {
      alert('No resources to cleanup. Try adjusting your filters.');
      return;
    }

    const confirmDelete = confirm(
      `Are you sure you want to delete ${filteredResources.length} unused resource(s)?\n\nIDs: ${filteredResources.slice(0, 3).map((r: any) => r.id).join(', ')}${filteredResources.length > 3 ? '...' : ''}`
    );

    if (confirmDelete) {
      setResources(resources.filter((r: any) => !filteredResources.includes(r)));
      alert(`Successfully deleted ${filteredResources.length} resource(s)`);
    }
  };

  // Handler для удаления одного ресурса
  const handleDeleteResource = (resourceToDelete: any) => {
    if (confirm(`Delete resource ${resourceToDelete.id}?`)) {
      setResources(resources.filter((r: any) => r.id !== resourceToDelete.id));
    }
  };

  return (
    <div className="flex justify-center px-[60px] pb-10 relative">
      <div className="w-full max-w-[1600px] flex gap-12 items-start z-10">
        
        <DashboardSidebar
          loading={loading}
          onRescan={onRescan}
          onCleanup={handleCleanup}
          onExport={handleExport}
        />

        <main className="flex-1 flex flex-col">
          
          <div className="h-[36px] flex items-center mb-9"> 
              <div className="group bg-[#1f2029] hover:bg-[#16171d] border border-[#242732] rounded-[16px] text-white text-[12px] placeholder-[#818ca2] focus:outline-none focus:border-[#1a85ff] focus:bg-[#16171d] px-5 py-3 flex items-center gap-4 w-full max-w-[500px] focus-within:border-[#47B2FF] hover:border-[#47B2FF]/70 transition-all shadow-lg">
                <Search size={24} className="text-[#818CA2]" />
                <input 
                    type="text" 
                    placeholder="Search resources by ID, type, or tag..." 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setVisibleCount(5); // Сбрасываем пагинацию при поиске
                    }}
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
              <CostTrend data={data} />
            </div>
            
            <div className="bg-[#181921] border border-[#242732] rounded-[16px] p-8 h-[400px] flex flex-col shadow-lg">
              <h3 className="text-xl font-black mb-6 tracking-tight text-white">Spend by Service</h3>
              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                      <Pie data={serviceBreakdownData} innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {serviceBreakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1C1D25', border: 'none', borderRadius: '12px', color: '#FFFFFF' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-y-3 mt-4 pt-4 border-t border-[#242732]">
                {serviceBreakdownData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-[11px] font-bold text-white">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div> 
                    <span>{item.name} - {item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section className="bg-[#181921] rounded-[20px] border border-[#242732] p-8 mb-10 shadow-lg">
                <h2 className="text-xl font-extrabold text-white mb-4 leading-7">Unused Resources</h2>
                
                {/* Filter Pills */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {filterCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setVisibleCount(5); // Сбрасываем пагинацию при смене фильтра
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold uppercase transition-all border ${getFilterPillStyle(category, selectedCategory === category)}`}
                    >
                      {category}
                    </button>
                  ))}
                </div>

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
                          {visibleResources.length > 0 ? (
                            visibleResources.map((resource: any, i: number) => (
                              <tr key={i} className="border-b border-[#242732] hover:bg-[#1f2029] transition-colors">
                                <td className="py-4 px-2 text-left">
                                  <span className="px-3 py-1 rounded-full text-sm font-mono border border-[#479DFF]/40 bg-[#2F334B] text-[#479DFF]">
                                    {resource.id?.substring(0, 15)}...
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${getResourceTypeStyle(resource.type)}`}>
                                    {resource.type}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-center text-gray-300">{resource.size} GB</td>
                                <td className="py-4 px-4 text-center font-semibold text-[#EF4444]">${resource.cost.toFixed(2)}</td>
                                <td className="py-4 px-4 text-center">
                                  <button 
                                    onClick={() => handleDeleteResource(resource)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                  >
                                    <Trash2 size={16}/>
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5}>
                                <EmptyState />
                              </td>
                            </tr>
                          )}
                        </tbody>
                    </table>
                </div>
                
                {/* КНОПКА LOAD MORE */}
                {hasMore && (
                  <div className="flex justify-center mt-3 pt-4">
                    <button 
                      onClick={handleLoadMore}
                      className="text-xs font-bold text-[#818CA2] hover:text-white hover:bg-[#2F334B] hover:border-[#479DFF]/50 transition-all shadow-sm flex items-center gap-2"
                    >
                      Load More Resources ({filteredResources.length - visibleCount} left)
                    </button>
                  </div>
                )}

                {/* Надпись когда всё загружено (если больше 5 элементов) */}
                {!hasMore && filteredResources.length > 5 && (
                  <div className="text-center mt-3 pt-4 text-[10px] uppercase tracking-widest text-[#404854] font-bold">
                      All resources loaded
                  </div>
                )}
            </section>

        </main>
      </div>
    </div>
  );
};

export default NewDashboard;