// ============================================================================
// FILE: NewResourcesPage.tsx
// LOCATION: client/src/pages/
// PURPOSE: Resources page showing all AWS infrastructure with analysis
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Search, Radar, Trash2, FileDown, AlertCircle } from 'lucide-react';
import { ActionSidebar } from '../components/Layout/ActionSidebar';
import { downloadReport } from '../utils/exportReport';
import { useAWS } from '../context/AWSContext';

interface ResourcesPageProps {
  loading?: boolean;
  data?: any;
  onPageChange?: (page: 'dashboard' | 'resources' | 'security' | 'settings', viewMode?: 'alerts' | 'logs') => void;
  onAIModalStateChange?: (isOpen: boolean) => void;
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

const NewResourcesPage: React.FC<ResourcesPageProps> = ({ loading, data, onPageChange, onAIModalStateChange }) => {
  const { credentials } = useAWS();
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);
  const [resourcesData, setResourcesData] = useState(data);
  const [localLoading, setLocalLoading] = useState(false);
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  
  // ========== Drag-select state ==========
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartId, setDragStartId] = useState<string | null>(null);
  
  // ========== Advanced filters state ==========
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [minCostFilter, setMinCostFilter] = useState<number>(0);
  const [maxCostFilter, setMaxCostFilter] = useState<number>(10000);
  
  // ========== Auto-fetch resources data on mount ==========
  useEffect(() => {
    const fetchResourcesData = async () => {
      try {
        // Only fetch if we don't have data and have credentials
        if (!credentials?.accessKeyId) {
          console.log('⚠️ No credentials available for resources auto-fetch');
          return;
        }

        // Don't fetch if we already have data
        if (resourcesData?.allResources && resourcesData.allResources.length > 0) {
          console.log('✅ Resources data already available, skipping fetch');
          return;
        }

        setLocalLoading(true);
        console.log('📊 Auto-fetching resources data...');

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
        console.log('✅ Resources data fetched:', data);
        setResourcesData(data);
      } catch (err) {
        console.error('❌ Resources data fetch error:', err);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchResourcesData();
  }, [credentials?.accessKeyId]);

  // ========== Global mouse event handlers for drag-select ==========
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // Получаем реальные ресурсы из данных или используем пустой массив
  const resources = resourcesData?.allResources || [];

  console.log('📊 NewResourcesPage Debug:', {
    dataExists: !!resourcesData,
    allResourcesPath: !!resourcesData?.allResources,
    resourcesCount: resources.length,
    fullData: resourcesData
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
    
    // ========== Advanced Filters ==========
    const resourceCost = typeof r.cost === 'string' ? parseFloat(r.cost.replace(/[^0-9.]/g, '')) : (r.cost || 0);
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchCost = resourceCost >= minCostFilter && resourceCost <= maxCostFilter;
    
    return matchFilter && matchSearch && matchStatus && matchCost;
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
    { title: "Total Resources", value: resourceStats.total.toString(), changePercent: resourcesData?.isFirstScan ? "N/A" : "+0", changeType: "positive" as const },
    { title: "Active Resources", value: resourceStats.active.toString(), changePercent: resourcesData?.isFirstScan ? "N/A" : `+${resourceStats.active}`, changeType: "positive" as const },
    { title: "Idle Resources", value: resourceStats.idle.toString(), changePercent: resourcesData?.isFirstScan ? "N/A" : `+${resourceStats.idle}`, changeType: resourcesData?.isFirstScan || resourceStats.idle === 0 ? "positive" as const : "negative" as const },
    { title: "Total Cost/Month", value: `$${resourceStats.totalCost.toFixed(2)}`, changePercent: resourcesData?.isFirstScan ? "N/A" : "-0%", changeType: "positive" as const },
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

  // ========== Resource Selection Functions ==========
  const toggleResourceSelection = (resourceId: string) => {
    const newSelected = new Set(selectedResources);
    if (newSelected.has(resourceId)) {
      newSelected.delete(resourceId);
    } else {
      newSelected.add(resourceId);
    }
    setSelectedResources(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedResources.size === visibleResources.length) {
      setSelectedResources(new Set());
    } else {
      const newSelected = new Set(visibleResources.map((r: any) => r.id));
      setSelectedResources(newSelected);
    }
  };

  // ========== Drag-select functions ==========
  const handleMouseDown = (resourceId: string) => {
    setIsDragging(true);
    setDragStartId(resourceId);
    toggleResourceSelection(resourceId);
  };

  const handleMouseEnter = (resourceId: string) => {
    if (!isDragging || !dragStartId) return;
    
    const startIndex = visibleResources.findIndex((r: any) => r.id === dragStartId);
    const currentIndex = visibleResources.findIndex((r: any) => r.id === resourceId);
    
    if (startIndex === -1 || currentIndex === -1) return;
    
    const [minIdx, maxIdx] = startIndex < currentIndex ? [startIndex, currentIndex] : [currentIndex, startIndex];
    const newSelected = new Set(selectedResources);
    
    for (let i = minIdx; i <= maxIdx; i++) {
      newSelected.add(visibleResources[i].id);
    }
    
    setSelectedResources(newSelected);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStartId(null);
  };

  const handleDeleteSelected = async () => {
    if (selectedResources.size === 0) {
      alert('Please select resources to delete');
      return;
    }

    const resourceList = Array.from(selectedResources).join(', ');
    const confirmed = window.confirm(
      `Delete ${selectedResources.size} resource(s)?\n\nResources: ${resourceList}\n\nThis action cannot be undone!`
    );

    if (!confirmed) return;

    setDeleteInProgress(true);
    try {
      const response = await fetch('http://localhost:5000/api/delete-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceIds: Array.from(selectedResources),
          credentials: {
            accessKeyId: credentials?.accessKeyId,
            secretAccessKey: credentials?.secretAccessKey,
            region: credentials?.region || 'us-east-1'
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Successfully deleted ${selectedResources.size} resource(s)!`);
        setSelectedResources(new Set());
        // Refresh data
        window.location.reload();
      } else {
        alert('❌ Error deleting resources. Check console for details.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Error deleting resources: ' + (error as Error).message);
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleRescan = () => {
    alert('Scanning for new resources...');
  };

  const handleActionSidebar = (action: string) => {
    switch (action) {
      case 'rescan':
        handleRescan();
        break;
      case 'alerts':
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
            { label: 'Alerts', icon: AlertCircle, action: 'alerts' },
            { label: 'Export', icon: FileDown, action: 'export' }
          ]}
          onAction={handleActionSidebar}
          loading={loading || localLoading}
          alerts={resourcesData?.alerts || []}
          data={resourcesData}
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
                <div className="flex gap-3 mb-6 flex-wrap items-center">
                  {filterCategories.map((category: string) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSelectedFilter(category);
                        setVisibleCount(5);
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${getFilterPillStyle(category, selectedFilter === category)}`}
                      title={`Filter by ${category}`}
                    >
                      {category}
                    </button>
                  ))}
                  
                  {/* Advanced Filters Toggle */}
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${
                      showAdvancedFilters 
                        ? getFilterPillStyle('ALL', true)
                        : getFilterPillStyle('ALL', false)
                    }`}
                    title="Toggle advanced filters"
                  >
                    Filters
                  </button>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                  <div className="bg-[#1f2029] border border-[#242732] rounded-[16px] p-6 mb-6">
                    <div className="grid grid-cols-3 gap-4">
                      {/* Status Filter */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[#818CA2] uppercase mb-1 tracking-wider">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full bg-[#1f2029] border-2 border-[#404854] rounded-lg px-4 py-2.5 text-sm text-white font-medium text-xs focus:border-[#479DFF] focus:outline-none focus:ring-1 focus:ring-[#479DFF]/30 transition-all"
                        >
                          <option value="">All Statuses</option>
                          <option value="Active">Active</option>
                          <option value="running">Running</option>
                          <option value="stopped">Stopped</option>
                          <option value="available">Available</option>
                          <option value="in-use">In Use</option>
                        </select>
                      </div>
                      
                      {/* Min Cost Filter */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[#818CA2] uppercase mb-1 tracking-wider">Min Cost ($)</label>
                        <input
                          type="number"
                          min="0"
                          max="10000"
                          value={minCostFilter}
                          onChange={(e) => setMinCostFilter(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#1f2029] border-2 border-[#404854] rounded-lg px-4 py-2.5 text-sm text-white font-medium text-xs focus:border-[#479DFF] focus:outline-none focus:ring-1 focus:ring-[#479DFF]/30 transition-all"
                          placeholder="0"
                        />
                      </div>
                      
                      {/* Max Cost Filter */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[#818CA2] uppercase mb-1 tracking-wider">Max Cost ($)</label>
                        <input
                          type="number"
                          min="0"
                          max="10000"
                          value={maxCostFilter}
                          onChange={(e) => setMaxCostFilter(parseFloat(e.target.value) || 10000)}
                          className="w-full bg-[#1f2029] border-2 border-[#404854] rounded-lg px-4 py-2.5 text-sm text-white font-medium text-xs focus:border-[#479DFF] focus:outline-none focus:ring-1 focus:ring-[#479DFF]/30 transition-all"
                          placeholder="10000"
                        />
                      </div>
                    </div>
                    
                    {/* Filter Summary */}
                    {(statusFilter || minCostFilter > 0 || maxCostFilter < 10000) && (
                      <div className="mt-4 pt-4 border-t border-[#404854] flex items-center justify-between">
                        <div className="text-xs text-[#818CA2]">
                          <span className="font-semibold text-[#479DFF]">{filteredResources.length}</span> resources match your filters
                        </div>
                        <button
                          onClick={() => {
                            setStatusFilter('');
                            setMinCostFilter(0);
                            setMaxCostFilter(10000);
                          }}
                          className="text-xs font-bold text-[#818CA2] hover:text-white px-3 py-1 rounded-full hover:bg-[#2F334B]"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Selection Bar */}
                {selectedResources.size > 0 && (
                  <div className="flex items-center justify-between bg-[#1f2029] border border-[#479DFF]/40 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#479DFF] rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-[#479DFF]">
                          {selectedResources.size} selected
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedResources(new Set())}
                        className="text-xs text-[#818CA2] hover:text-white px-3 py-1 rounded-full hover:bg-[#2F334B] font-medium"
                      >
                        Clear
                      </button>
                    </div>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={deleteInProgress}
                      className="flex items-center gap-2 px-5 py-2 bg-[#FF6B6B]/10 text-[#FF6B6B] hover:bg-[#FF6B6B]/20 border border-[#FF6B6B]/30 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {deleteInProgress ? 'Deleting...' : `Delete ${selectedResources.size}`}
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto w-full" onMouseLeave={handleMouseUp}>
                    <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#242732]">
                            <th className="text-center py-4 px-3 text-gray-400 font-semibold text-xs uppercase tracking-wider w-[60px]">
                              <div className="flex justify-center">
                                <label className="flex items-center cursor-pointer relative group">
                                  <input
                                    type="checkbox"
                                    checked={selectedResources.size > 0 && selectedResources.size === visibleResources.length}
                                    onChange={toggleSelectAll}
                                    className="sr-only peer"
                                    title="Select all visible resources"
                                  />
                                  <div className="w-5 h-5 bg-[#1f2029] border-2 border-[#404854] rounded-md peer-checked:bg-gradient-to-br peer-checked:from-[#479DFF] peer-checked:to-[#2563eb] peer-checked:border-[#479DFF] transition-all group-hover:border-[#479DFF]/70 flex items-center justify-center">
                                    {selectedResources.size > 0 && selectedResources.size === visibleResources.length && (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </label>
                              </div>
                            </th>
                            <th className="text-left py-4 px-2 text-gray-400 font-semibold text-xs uppercase tracking-wider">Resource ID</th>
                            <th className="text-center py-4 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Type</th>
                            <th className="text-center py-4 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Size</th>
                            <th className="text-center py-4 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Status</th>
                            <th className="text-center py-4 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Cost</th>
                            <th className="text-center py-4 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleResources.length > 0 ? (
                            visibleResources.map((resource: any, i: number) => (
                              <tr 
                                key={i} 
                                className={`border-b border-[#242732] transition-all duration-200 cursor-pointer group ${
                                  selectedResources.has(resource.id) 
                                    ? 'bg-gradient-to-r from-[#479DFF]/10 to-[#2563eb]/10 hover:from-[#479DFF]/15 hover:to-[#2563eb]/15 border-[#479DFF]/30' 
                                    : 'hover:bg-[#1f2029]/50'
                                }`}
                                onMouseDown={() => handleMouseDown(resource.id)}
                                onMouseEnter={() => handleMouseEnter(resource.id)}
                              >
                                <td className="py-4 px-3 text-center w-[60px]">
                                  <div className="flex justify-center">
                                    <label className="flex items-center cursor-pointer relative group">
                                      <input
                                        type="checkbox"
                                        checked={selectedResources.has(resource.id)}
                                        onChange={() => toggleResourceSelection(resource.id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="sr-only peer"
                                        title={`Select ${resource.id}`}
                                      />
                                      <div className="w-5 h-5 bg-[#1f2029] border-2 border-[#404854] rounded-md peer-checked:bg-gradient-to-br peer-checked:from-[#479DFF] peer-checked:to-[#2563eb] peer-checked:border-[#479DFF] transition-all group-hover:border-[#479DFF]/70 flex items-center justify-center">
                                        {selectedResources.has(resource.id) && (
                                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </div>
                                    </label>
                                  </div>
                                </td>
                                <td className="py-4 px-2 text-left">
                                  <span className="px-3 py-1 rounded-full text-sm font-mono border border-[#479DFF]/40 bg-[#2F334B] text-[#479DFF]">{resource.id}</span>
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase ${getTypeStyle(resource.type)}`}>{resource.type}</span>
                                </td>
                                <td className="py-4 px-4 text-center text-gray-300 font-medium">{resource.size || 'N/A'}</td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${(['Active', 'running'].includes(resource.status)) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'}`}>
                                    {resource.status}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-center font-bold text-[#FF6B6B]">${typeof resource.cost === 'string' ? resource.cost.replace(/[^0-9.]/g, '') : resource.cost?.toFixed(2) || '0.00'}</td>
                                <td className="py-4 px-4 text-center">
                                  <button 
                                    onClick={() => {
                                      const confirmed = window.confirm(`Delete ${resource.id}?`);
                                      if (confirmed) toggleResourceSelection(resource.id);
                                    }}
                                    className="text-gray-400 hover:text-[#FF6B6B] transition-colors p-1"
                                    title={`Delete ${resource.id}`}
                                  >
                                    <Trash2 size={16}/>
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-gray-400">
                                {loading ? 'Loading resources...' : `No resources found${selectedFilter !== 'ALL' ? ` for ${selectedFilter}` : ''}.`}
                              </td>
                            </tr>
                          )}
                        </tbody>
                    </table>
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-6 pt-4">
                    <button 
                      onClick={handleLoadMore}
                      className="text-xs font-bold text-[#818CA2] hover:text-white hover:bg-[#2F334B] hover:border-[#479DFF]/50 transition-all"
                    >
                      Load More ({filteredResources.length - visibleCount} remaining)
                    </button>
                  </div>
                )}

                {/* All Loaded Message */}
                {!hasMore && filteredResources.length > 5 && (
                  <div className="text-center mt-6 pt-4 text-[10px] uppercase tracking-widest text-[#404854] font-bold">
                    All resources loaded
                  </div>
                )}
            </section>

        </main>
      </div>
    </div>
  );
};

export default NewResourcesPage;