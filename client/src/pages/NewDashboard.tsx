// ============================================================================
// FILE: NewDashboard.tsx
// LOCATION: client/src/pages/
// PURPOSE: Main dashboard page that displays AWS resources, costs, and trends
// ============================================================================

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Search, Filter, Trash2, Database, HardDrive, Server, MoreHorizontal } from 'lucide-react';
import { DashboardSidebar } from '../components/Layout/DashboardSidebar';
import { CostTrend } from '../components/ui/CostTrend';
import { downloadReport } from '../utils/exportReport';
import { useAWS } from '../context/AWSContext';

interface DashboardProps {
  loading?: boolean;
  data?: any;
  onRescan?: () => void;
  onPageChange?: (page: 'dashboard' | 'resources' | 'security' | 'settings', viewMode?: 'alerts' | 'logs') => void;
  onAIModalStateChange?: (isOpen: boolean) => void;
}

// ========== Card component for displaying metric with title and trend ==========
const MetricCard = ({ title, value, changePercent, changeType, showDivider }: any) => {
    const isPositive = changeType === "positive";
    const isNeutral = changeType === "neutral";
    
    let textColor = "#EF4444"; // default negative red
    let borderColor = "rgba(239, 68, 68, 0.3)";
    let bgColor = "rgba(239, 68, 68, 0.1)";
    
    if (isPositive) {
      textColor = "#10B981"; // green
      borderColor = "rgba(16, 185, 129, 0.3)";
      bgColor = "rgba(16, 185, 129, 0.1)";
    } else if (isNeutral) {
      textColor = "#818ca2"; // gray
      borderColor = "rgba(129, 140, 162, 0.3)";
      bgColor = "rgba(129, 140, 162, 0.1)";
    }

    return (
      <>
        <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
          <h2 className="text-[#818ca2] text-[10px] font-black uppercase tracking-wider text-center">{title}</h2>
          <p className="text-white text-3xl font-black text-center leading-none">{value}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="px-2 py-1 rounded-full border" style={{ backgroundColor: bgColor, borderColor: borderColor }}>
              <div className="text-[10px] font-bold" style={{ color: textColor }}>{changePercent}</div>
            </div>
            <div className="text-[#818ca2] text-[10px] whitespace-nowrap">vs last month</div>
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

const NewDashboard: React.FC<DashboardProps> = ({ loading, data, onRescan, onPageChange, onAIModalStateChange }) => {
  const { credentials } = useAWS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [resources, setResources] = useState(data?.allResources || []);
  const [dashboardData, setDashboardData] = useState(data);
  const [localLoading, setLocalLoading] = useState(false);
  
  // Добавляем состояние для пагинации (показываем по умолчанию 5 записей)
  const [visibleCount, setVisibleCount] = useState(5);

  // ========== Auto-fetch dashboard data on mount if not already loaded ==========
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Only fetch if we don't have data and have credentials
        if (!credentials?.accessKeyId) {
          console.log('⚠️ No credentials available for dashboard auto-fetch');
          return;
        }

        // Don't fetch if we already have data
        if (dashboardData?.allResources && dashboardData.allResources.length > 0) {
          console.log('✅ Dashboard data already available, skipping fetch');
          return;
        }

        setLocalLoading(true);
        console.log('📊 Auto-fetching dashboard data...');

        // Normalize endpoint for LocalStack
        let endpoint = credentials.endpoint;
        if (credentials.isLocalStack && endpoint) {
          endpoint = 'http://localhost:4566';
        }

        const response = await fetch('http://localhost:5000/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            region: credentials.region || 'us-east-1',
            isLocalStack: credentials.isLocalStack || false,
            endpoint: credentials.isLocalStack ? endpoint : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`Scan failed: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Dashboard data fetched:', data);
        setDashboardData(data);
      } catch (err) {
        console.error('❌ Dashboard data fetch error:', err);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchDashboardData();
  }, [credentials?.accessKeyId]);

  // Обновляем resources когда приходят новые данные
  React.useEffect(() => {
    setResources(dashboardData?.allResources || []);
  }, [dashboardData?.allResources]);
  const filterCategories = ['All', 'EC2', 'EBS', 'IP'];
  const filteredResources = resources.filter((resource: any) => {
    const matchCategory = selectedCategory === 'All' || resource.type === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      resource.id.toLowerCase().includes(searchLower) || 
      resource.type.toLowerCase().includes(searchLower);
    return matchCategory && matchSearch;
  });

  console.log('📊 NewDashboard Resources:', {
    totalResources: resources.length,
    resourceTypes: resources.map((r: any) => r.type).slice(0, 20),
    selectedCategory,
    filteredCount: filteredResources.length
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
    const allResources = dashboardData?.allResources || [];
    
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

  // Get service icon based on type
  const getServiceIcon = (serviceName: string) => {
    switch (serviceName.toUpperCase()) {
      case 'EC2':
        return <Server size={18} className="text-[#B548FF]" />;
      case 'RDS':
        return <Database size={18} className="text-[#1A85FF]" />;
      case 'S3':
        return <HardDrive size={18} className="text-[#EF4444]" />;
      default:
        return <MoreHorizontal size={18} className="text-[#818CA2]" />;
    }
  };

  // Handler для экспорта
  const handleExport = () => {
    const dataToExport = filteredResources.length > 0 ? filteredResources : resources;

    downloadReport({
      title: 'AWS Dashboard Report',
      resources: dataToExport,
      filename: `aws-dashboard-report-${new Date().toISOString().split('T')[0]}.html`,
      summary: {
        totalSpend: dashboardData?.summary?.totalSpend || 0,
        totalWaste: dashboardData?.summary?.totalWaste || 0,
        wasteCount: dashboardData?.summary?.wasteCount || 0,
        totalResources: dashboardData?.summary?.resources?.length || dataToExport.length || 0
      }
    });
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
          loading={loading || localLoading}
          onRescan={onRescan}
          onExport={handleExport}
          onPageChange={onPageChange}
          alerts={dashboardData?.alerts || []}
          data={dashboardData}
          onAIModalStateChange={onAIModalStateChange}
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

          <section className="flex h-[140px] items-center bg-[#13141b] rounded-[20px] border border-[#242732] px-6 shadow-lg mb-3">
            {(() => {
              const totalSpend = dashboardData?.summary?.totalSpend || 0;
              const totalWaste = dashboardData?.summary?.totalWaste || 0;
              const wasteCount = dashboardData?.summary?.wasteCount || 0;
              const totalResources = dashboardData?.allResources?.length || 0;
              
              // Use server-provided trend metrics - filter out invalid values
              let spendTrend = dashboardData?.trendMetrics?.spendChange || 'N/A';
              let wasteTrend = dashboardData?.trendMetrics?.wasteChange || 'N/A';
              
              // BUGFIX: Filter out "+0%" and "-0%" - they're invalid
              if (spendTrend === '+0%' || spendTrend === '-0%' || spendTrend === '0%') {
                spendTrend = 'N/A';
              }
              if (wasteTrend === '+0%' || wasteTrend === '-0%' || wasteTrend === '0%') {
                wasteTrend = 'N/A';
              }
              
              // Determine colors based on trend data
              const getSpendChangeType = (): 'positive' | 'negative' => {
                if (spendTrend === 'N/A') return 'neutral';
                return spendTrend.includes('-') ? 'positive' : 'negative';
              };
              
              const getWasteChangeType = (): 'positive' | 'negative' => {
                if (wasteTrend === 'N/A') return 'neutral';
                return wasteTrend.includes('-') ? 'positive' : 'negative';
              };
              
              const wastePercentNum = totalResources > 0 ? (wasteCount / totalResources) * 100 : 0;
              const resourcesPercent = wastePercentNum > 0 ? wastePercentNum.toFixed(1) : '0.0';

              return [
                { 
                  title: "Total Spend", 
                  value: totalResources > 0 ? `$${dashboardData?.summary?.totalSpend?.toFixed(2) || '0.00'}` : "$0.00",
                  changePercent: spendTrend,
                  changeType: getSpendChangeType()
                },
                { 
                  title: "Total Waste", 
                  value: totalResources > 0 ? `$${dashboardData?.summary?.totalWaste?.toFixed(2) || '0.00'}` : "$0.00",
                  changePercent: wasteTrend,
                  changeType: getWasteChangeType()
                },
                { 
                  title: "Resources Count", 
                  value: totalResources.toString(),
                  changePercent: dashboardData?.isFirstScan ? 'N/A' : '+0',
                  changeType: "neutral"
                },
                { 
                  title: "Wasted Resources", 
                  value: wasteCount.toString(),
                  changePercent: dashboardData?.isFirstScan || wasteCount === 0 ? 'N/A' : `${resourcesPercent}%`,
                  changeType: dashboardData?.isFirstScan || wasteCount === 0 ? "neutral" : "negative"
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
              <CostTrend data={dashboardData} />
            </div>
            
            <div className="bg-[#181921] border border-[#242732] rounded-[16px] p-8 h-[400px] flex flex-col shadow-lg">
              <h3 className="text-xl font-black mb-3 tracking-tight text-white">Spend by Service</h3>
              <div className="flex-1 flex flex-col items-center justify-start">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                      <Pie data={serviceBreakdownData} innerRadius={70} outerRadius={115} paddingAngle={4} dataKey="value">
                      {serviceBreakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1C1D25', border: 'none', borderRadius: '12px', color: '#FFFFFF' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-2 pt-3 border-t border-[#242732] w-full">
                  {serviceBreakdownData.map(item => (
                    <div key={item.name} className="flex items-center gap-2 text-xs font-bold text-white min-w-0">
                      <div className="flex-shrink-0">
                        {getServiceIcon(item.name)}
                      </div>
                      <span className="text-[11px] truncate">{item.name} - {item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <section className="bg-[#181921] rounded-[20px] border border-[#242732] p-8 mb-10 shadow-lg">
                <h2 className="text-xl font-extrabold text-white mb-4 leading-7">All Resources</h2>
                
                {/* Filter Pills */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {filterCategories.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedCategory(category);
                        setVisibleCount(5); // Сбрасываем пагинацию при смене фильтра
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${getFilterPillStyle(category, selectedCategory === category)}`}
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
                            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Status</th>
                            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Cost</th>
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
                                <td className="py-4 px-4 text-center text-gray-300">{resource.size}</td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(['Active', 'running'].includes(resource.status)) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                                    {resource.status}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-center font-semibold text-[#FF6B6B]">${resource.cost.toFixed(2)}</td>
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