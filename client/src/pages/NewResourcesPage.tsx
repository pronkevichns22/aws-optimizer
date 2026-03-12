import React from 'react';
import { Search, Radar, Trash2, FileDown } from 'lucide-react';
import { AIAdvisor } from '../components/AIAdvisor';

interface ResourcesPageProps {
  loading?: boolean;
  data?: any;
}

const resourceStatsData = [
  { title: "Total Resources", value: "248", changePercent: "+12", changeType: "positive" as const },
  { title: "Active Resources", value: "184", changePercent: "+8.5%", changeType: "positive" as const },
  { title: "Idle Resources", value: "45", changePercent: "+22%", changeType: "negative" as const },
  { title: "Total Cost/Month", value: "$2,847.50", changePercent: "-4.2%", changeType: "positive" as const },
];

const resourcesData = [
  { id: 'vol-0a1b2c3d4e5f6', type: 'EBS Volume', size: '100 GB', status: 'Active', cost: '$45.00' },
  { id: 'snap-3n4o5pq6r7s8', type: 'Snapshot', size: '26 GB', status: 'Archived', cost: '$12.40' },
  { id: 'eipalloc-7h8i9j0kl1m2n', type: 'Elastic IP', size: '1 IP', status: 'Active', cost: '$0.00' },
  { id: 'vol-9x8y7z6a5b4c3d', type: 'EBS Volume', size: '500 GB', status: 'Active', cost: '$120.00' },
  { id: 'rds-prod-db-01', type: 'RDS Instance', size: '1 TB', status: 'Active', cost: '$285.60' },
  { id: 's3-backup-bucket', type: 'S3 Bucket', size: '2.5 TB', status: 'Active', cost: '$58.20' },
];

const StatCard = ({ title, value, changePercent, changeType, showDivider }: any) => {
    const isPositive = changeType === "positive";
    const textColor = isPositive ? "#10B981" : "#EF4444"; 
    const bgColor = isPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"; 

    return (
      <>
        <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
          <h2 className="text-[#818ca2] text-[10px] font-black uppercase tracking-wider text-center">{title}</h2>
          <p className="text-white text-3xl font-black text-center leading-none">{value}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            <div className="px-2 py-1 rounded-2xl" style={{ backgroundColor: bgColor }}>
              <span className="text-[10px] font-bold" style={{ color: textColor }}>{changePercent}</span>
            </div>
            <span className="text-[#818ca2] text-[10px] whitespace-nowrap">vs last month</span>
          </div>
        </div>
        {showDivider && <div className="w-px h-20 bg-[#242732] mx-2" />}
      </>
    );
};

const getTypeStyle = (type: string) => {
    switch (type) {
      case 'EBS Volume': return "bg-[#36273F] text-[#B548FF] border border-[#B548FF]/30";
      case 'Snapshot': return "bg-[#2B413F] text-[#14B8A6] border border-[#14B8A6]/30";
      case 'RDS Instance': return "bg-[#3F312B] text-[#FF9F43] border border-[#FF9F43]/30";
      case 'S3 Bucket': return "bg-[#2B3F3D] text-[#00D084] border border-[#00D084]/30";
      default: return "bg-[#242638] text-[#479DFF] border border-[#479DFF]/30";
    }
  };

const NewResourcesPage: React.FC<ResourcesPageProps> = () => {
  return (
    <div className="flex justify-center px-[60px] pb-10 relative">
      <div className="w-full max-w-[1600px] flex gap-12 items-start z-10">
        
        {/*Сайдбар==================================================== */}
        <aside className="w-[336px] sticky top-[100px] flex flex-col flex-shrink-0">
          
          <h1 className="text-[36px] font-black leading-none tracking-tight text-white mb-9">
            Resources
          </h1>

          <div className="bg-[#13141B] border border-[#242732] rounded-[16px] p-3 flex justify-between items-center h-[140px] shadow-lg mb-3">
            {[
              { label: 'Rescan', icon: Radar },
              { label: 'Cleanup', icon: Trash2 },
              { label: 'Export', icon: FileDown }
            ].map((action, i) => (
              <button key={i} className="group flex flex-col items-center justify-center w-24 h-28 rounded-2xl transition-all hover:bg-[#1C1D25] text-[#818CA2] hover:text-white">
                <div className="p-2.5 rounded-full bg-[#1C1D25] group-hover:bg-transparent transition-all mb-1 border border-[#242732]">
                  <action.icon size={22} className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-center">{action.label}</span>
              </button>
            ))}
          </div>

          <AIAdvisor />
        </aside>


        {/* правая часть============================================================*/}

        <main className="flex-1 flex flex-col">
          
          <div className="h-[36px] flex items-center mb-9"> 
              <div className="group bg-[#181921] border border-[#242732] rounded-[16px] px-5 py-3 flex items-center gap-4 w-full max-w-[500px] focus-within:border-[#47B2FF] hover:border-[#47B2FF]/70 transition-all shadow-lg hover:shadow-[0_0_12px_rgba(71,178,255,0.15)]">
                <Search size={24} className="text-[#818CA2] group-hover:text-[#47B2FF] transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search resources by ID or type..." 
                    className="bg-transparent border-none outline-none text-sm w-full placeholder-[#818CA2] font-medium" 
                />
              </div>
          </div>

          <section className="flex h-[140px] items-center bg-[#13141b] rounded-[16px] border border-[#242732] px-6 shadow-lg mb-3">
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
                <h2 className="text-xl font-extrabold text-white mb-8 leading-7">All Resources</h2>
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
                          {resourcesData.map((resource, i) => (
                            <tr key={i} className="border-b border-[#242732] hover:bg-[#1f2029] transition-colors">
                              <td className="py-4 px-2 text-left">
                                <span className="px-3 py-1 rounded-full text-sm font-mono border border-[#479DFF]/40 bg-[#2F334B] text-[#479DFF]">{resource.id}</span>
                              </td>
                              <td className="py-4 px-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeStyle(resource.type)} uppercase`}>{resource.type}</span>
                              </td>
                              <td className="py-4 px-4 text-center text-gray-300 font-medium">{resource.size}</td>
                              <td className="py-4 px-4 text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${resource.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-400'}`}>
                                  {resource.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-center font-semibold text-[#EF4444]">{resource.cost}</td>
                              <td className="py-4 px-4 text-center">
                                <button className="text-gray-400 hover:text-white transition-colors p-1"><Trash2 size={16}/></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                    </table>
                </div>
            </section>

        </main>
      </div>
    </div>
  );
};

export default NewResourcesPage;