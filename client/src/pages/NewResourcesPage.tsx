// ============================================================================
// FILE: NewResourcesPage.tsx
// LOCATION: client/src/pages/
// PURPOSE: Resources page showing all AWS infrastructure with analysis
// ============================================================================

import React, { useState } from 'react';
import { Search, Radar, Trash2, FileDown, Archive } from 'lucide-react';
import { ActionSidebar } from '../components/Layout/ActionSidebar';
import { downloadReport } from '../utils/exportReport';

interface ResourcesPageProps {
  loading?: boolean;
  data?: any;
  onPageChange?: (page: 'dashboard' | 'resources' | 'security' | 'settings', viewMode?: 'alerts' | 'logs') => void;
}

// ========== Metric card for displaying resource statistics ==========
const StatCard = ({ title, value, changePercent, changeType, showDivider }: any) => {
    const isPositive = changeType === "positive";
    const textColor = isPositive ? "#10B981" : "#EF4444";
    const borderColor = isPositive ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)";
    const bgColor = isPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"; 

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

const getTypeStyle = (type: string) => {
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
      case 'SNAPSHOT':
        return "bg-[#2B413F] text-[#14B8A6] border border-[#14B8A6]/30";
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
    case 'RDS':
      return "bg-[#3F312B] text-[#FF9F43] border border-[#FF9F43]/30";
    case 'S3':
      return "bg-[#2B3F3D] text-[#00D084] border border-[#00D084]/30";
    case 'ALL':
      return "bg-[#353C48] text-[#9AA3B0] border border-[#404854]";
    default:
      return "bg-[#242732] text-[#818CA2]";
  }
};

const NewResourcesPage: React.FC<ResourcesPageProps> = ({ loading, data, onPageChange }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(5); // Пагинация: показываем по 5
  
  // Получаем реальные ресурсы из данных или используем пустой массив
  const resources = data?.allResources || [];

  console.log('📊 NewResourcesPage Debug:', {
    dataExists: !!data,
    allResourcesPath: !!data?.allResources,
    resourcesCount: resources.length,
    fullData: data
  });
  
  // Получаем уникальные типы ресурсов для фильтра
  const resourceTypes: string[] = Array.from(new Set(resources.map((r: any) => r.type))) as string[];
  const filterCategories: string[] = ['ALL', ...resourceTypes];
  
  console.log('🎯 Filter Info:', {
    uniqueTypes: resourceTypes,
    filterCategories,
    selectedFilter
  });

  // Фильтруем ресурсы
  const filteredResources = resources.filter((r: any) => {
    const matchFilter = selectedFilter === 'ALL' || r.type === selectedFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = 
      r.id.toLowerCase().includes(searchLower) || 
      r.type.toLowerCase().includes(searchLower);
    return matchFilter && matchSearch;
  });

  console.log('📋 Resources after filter:', {
    selectedFilter,
    totalResources: resources.length,
    filteredCount: filteredResources.length,
    ec2Count: resources.filter((r: any) => r.type === 'EC2').length,
    ipCount: resources.filter((r: any) => r.type === 'IP').length,
    ebsCount: resources.filter((r: any) => r.type === 'EBS').length
  });

  // Вычисляем статистику на основе реальных данных
  const resourceStats = {
    total: resources.length,
    active: resources.filter((r: any) => r.status === 'Active' || r.status === 'running' || r.status === 'attached').length,
    idle: resources.filter((r: any) => r.status === 'Idle' || r.status === 'stopped' || r.status === 'available' || r.status === 'unattached').length,
    totalCost: resources.reduce((sum: number, r: any) => {
      const cost = typeof r.cost === 'string' ? parseFloat(r.cost.replace(/[^0-9.]/g, '')) : (r.cost || 0);
      return sum + cost;
    }, 0)
  };

  const resourceStatsData = [
    { title: "Total Resources", value: resourceStats.total.toString(), changePercent: "+0", changeType: "positive" as const },
    { title: "Active Resources", value: resourceStats.active.toString(), changePercent: `+${resourceStats.active}`, changeType: "positive" as const },
    { title: "Idle Resources", value: resourceStats.idle.toString(), changePercent: `+${resourceStats.idle}`, changeType: resourceStats.idle > 0 ? "negative" as const : "positive" as const },
    { title: "Total Cost/Month", value: `$${resourceStats.totalCost.toFixed(2)}`, changePercent: "-0%", changeType: "positive" as const },
  ];

  // Ограничиваем видимые ресурсы до 30 максимум
  const visibleResources = filteredResources.slice(0, Math.min(visibleCount, 30));
  const hasMore = visibleCount < filteredResources.length && visibleCount < 30;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 5, 30));
  };

  // Handler для экспорта ресурсов
  const handleExportSimple = () => {
    const dataToExport = filteredResources.length > 0 ? filteredResources : resources;
    const totalCost = dataToExport.reduce((sum: number, r: any) => {
      const cost = typeof r.cost === 'string' ? parseFloat(r.cost.replace(/[^0-9.]/g, '')) : (r.cost || 0);
      return sum + cost;
    }, 0);

    downloadReport({
      title: 'AWS Resources Report',
      resources: dataToExport,
      filename: `aws-resources-report-${new Date().toISOString().split('T')[0]}.html`,
      summary: {
        totalSpend: totalCost,
        totalWaste: totalCost,
        wasteCount: dataToExport.length,
        totalResources: resources.length
      }
    });
  };


  const handleRescan = () => {
    alert('Scanning for new resources...');
  };

  const handleActionSidebar = (action: string) => {
    switch (action) {
      case 'rescan':
        handleRescan();
        break;
      case 'logs':
        onPageChange?.('security', 'logs');
        break;
      case 'export':
        handleExportSimple();
        break;
    }
  };
  return (
    <div className="flex justify-center px-[60px] pb-10 relative">
      <div className="w-full max-w-[1600px] flex gap-12 items-start z-10">
        
        <ActionSidebar
          title="Resources"
          buttons={[
            { label: 'Rescan', icon: Radar, action: 'rescan' },
            { label: 'Logs', icon: Archive, action: 'logs' },
            { label: 'Export', icon: FileDown, action: 'export' }
          ]}
          onAction={handleActionSidebar}
          loading={loading}
          alerts={data?.alerts || []}
          data={data}
        />

        {/* Main content: Search, stats, and resources table */}
        <main className="flex-1 flex flex-col">
          
          <div className="h-[36px] flex items-center mb-9"> 
              <div className="group bg-[#1f2029] hover:bg-[#16171d] border border-[#242732] rounded-[16px] text-white text-[12px] placeholder-[#818ca2] focus:outline-none focus:border-[#1a85ff] focus:bg-[#16171d] px-5 py-3 flex items-center gap-4 w-full max-w-[500px] focus-within:border-[#47B2FF] hover:border-[#47B2FF]/70 transition-all shadow-lg">
                <Search size={24} className="text-[#818CA2]" />
                <input 
                    type="text" 
                    placeholder="Search resources by ID, type, or tag..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm w-full placeholder-[#818CA2] font-medium" 
                />
              </div>
          </div>

          <section className="flex h-[140px] items-center bg-[#13141b] rounded-[20px] border border-[#242732] px-6 shadow-lg mb-3">
            {resourceStatsData.map((stat, index) => (
                <StatCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  changePercent={stat.changePercent}
                  changeType={stat.changeType}
                  showDivider={index < resourceStatsData.length - 1}
                />
              ))}
          </section>

          {/* Таблица ресурсов */}
          <section className="bg-[#181921] rounded-[20px] border border-[#242732] p-8 shadow-lg">
                <h2 className="text-xl font-extrabold text-white mb-4 leading-7">
                  {selectedFilter === 'ALL' ? 'All Resources' : `${selectedFilter} Resources`}
                </h2>

                {/* Filter Pills */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {filterCategories.map((category: string) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedFilter(category);
                        setVisibleCount(5); // Сбрасываем пагинацию
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${getFilterPillStyle(category, selectedFilter === category)}`}
                    >
                      {category === 'ALL' ? 'All' : category}
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
                            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleResources.length > 0 ? (
                            visibleResources.map((resource: any, i: number) => (
                              <tr key={i} className="border-b border-[#242732] hover:bg-[#1f2029] transition-colors">
                                <td className="py-4 px-2 text-left">
                                  <span className="px-3 py-1 rounded-full text-sm font-mono border border-[#479DFF]/40 bg-[#2F334B] text-[#479DFF]">{resource.id}</span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeStyle(resource.type)} uppercase`}>{resource.type}</span>
                                </td>
                                <td className="py-4 px-4 text-center text-gray-300 font-medium">{resource.size || 'N/A'}</td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${(['Active', 'running'].includes(resource.status)) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-400'}`}>
                                    {resource.status}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-center font-semibold text-[#EF4444]">${typeof resource.cost === 'string' ? resource.cost.replace(/[^0-9.]/g, '') : resource.cost?.toFixed(2) || '0.00'}</td>
                                <td className="py-4 px-4 text-center">
                                  <button className="text-gray-400 hover:text-white transition-colors p-1"><Trash2 size={16}/></button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-gray-400">
                                {loading ? 'Loading resources...' : `No resources found${selectedFilter !== 'ALL' ? ` for ${selectedFilter}` : ''}.`}
                              </td>
                            </tr>
                          )}
                        </tbody>
                    </table>
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-3 pt-4">
                    <button 
                      onClick={handleLoadMore}
                      className="text-xs font-bold text-[#818CA2] hover:text-white hover:bg-[#2F334B] hover:border-[#479DFF]/50 transition-all shadow-sm"
                    >
                      Load More Resources ({filteredResources.length - visibleCount} left)
                    </button>
                  </div>
                )}

                {/* All Loaded Message */}
                {!hasMore && filteredResources.length > 5 && (
                  <div className="text-center mt-3 pt-4 text-[10px] uppercase tracking-widest text-[#404854] font-bold">
                    All resources loaded (Max 30)
                  </div>
                )}
            </section>

        </main>
      </div>
    </div>
  );
};

export default NewResourcesPage;