import { useState } from 'react';
import axios from 'axios';
import { Sidebar } from './components/Layout/Sidebar';
import { StatCard } from './components/ui/StatCard';
import { Chart } from './components/ui/Chart';
import { ResourcesTable } from './components/ui/ResourcesTable';
import { ResourcesPage } from './pages/ResourcesPage';
import { SecurityPage } from './pages/SecurityPage';
import { CostTrend } from './components/ui/CostTrend';
import { RefreshCcw, Server, HardDrive, DollarSign, AlertTriangle, Zap, Shield } from 'lucide-react';

function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'resources' | 'security'>('dashboard');

  const runAudit = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/scan');
      setData(res.data);
    } catch (e) {
      alert("Backend error!");
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = () => {
    if (!data?.resources) return [];
    return data.resources
      .sort((a: any, b: any) => b.cost - a.cost)
      .slice(0, 5)
      .map((r: any) => ({
        label: `${r.type} - ${r.id.substring(0, 8)}`,
        value: r.cost
      }));
  };

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={(page) => setCurrentPage(page as 'dashboard' | 'resources' | 'security')} 
      />
      
      {currentPage === 'dashboard' ? (
        <main className="flex-1 ml-64 p-8">
          {/* Заголовок и Кнопка */}
          <div className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-5xl font-extrabold text-slate-900 tracking-tighter">AWS Optimizer</h1>
              <p className="text-slate-600 font-medium mt-2">Monitor and optimize your cloud infrastructure</p>
            </div>
            <button 
              onClick={runAudit}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-4 rounded-2xl font-extrabold flex items-center gap-3 hover:shadow-lg hover:shadow-indigo-300/50 transition-all active:scale-95 disabled:opacity-50 tracking-tight"
            >
              {loading ? (
                <>
                  <RefreshCcw className="animate-spin" size={20} />
                  <span>Running Audit...</span>
                </>
              ) : (
                <>
                  <Zap size={20} />
                  <span>Run Audit</span>
                </>
              )}
            </button>
          </div>

          {/* СЕТКА СТАТИСТИКИ (4 Карточки) */}
          <div className="grid grid-cols-4 gap-6 mb-12 mt-8">
            <StatCard 
              title="Total Spend" 
              value={`$${data?.summary?.totalSpend?.toFixed(2) || '0.00'}`} 
              icon={<DollarSign />} 
              trend="Monthly Bill"
              isMain={false}
            />

            <StatCard 
              title="Wasted Money" 
              value={`$${data?.summary?.totalWaste?.toFixed(2) || '0.00'}`} 
              icon={<AlertTriangle />} 
              trend="Potential Savings"
              isMain={true}
            />

            <StatCard 
              title="Active Servers" 
              value={data?.summary?.serverCount || 0} 
              icon={<Server />} 
              trend="EC2 Instances"
            />

            <StatCard 
              title="Total Volumes" 
              value={data?.summary?.diskCount || 0} 
              icon={<HardDrive />} 
              trend="EBS Storage"
            />
          </div>

          {/* Analytics & Security Section */}
          <div className="grid grid-cols-3 gap-6 mb-12">
            {/* Left: Charts (2 cols) */}
            <div className="col-span-2">
              {data?.resources && data.resources.length > 0 && (
                <div className="grid grid-cols-2 gap-6">
                  <Chart 
                    title="Top Wasted Resources" 
                    data={prepareChartData()}
                    type="bar"
                  />
                  <Chart
                    title="Cost Distribution"
                    data={[
                      { label: 'Active Resources', value: data.summary.totalSpend - data.summary.totalWaste },
                      { label: 'Wasted Resources', value: data.summary.totalWaste }
                    ]}
                    type="bar"
                  />
                </div>
              )}
            </div>

            {/* Right: Minimal Security Card */}
            <div 
              onClick={() => setCurrentPage('security')}
              className="bg-white rounded-3xl ring-1 ring-slate-900/5 shadow-sm p-8 hover:shadow-lg hover:ring-slate-900/10 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl ring-1 ring-blue-200/50 group-hover:ring-blue-300/50 transition-all">
                  <Shield size={24} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Security</h3>
                  <p className="text-xs text-slate-500 font-medium">View details →</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Health Score</p>
                  <p className="text-4xl font-extrabold text-slate-900 mt-2 font-tabular-nums">
                    {data?.summary?.totalSpend ? (100 - ((data.summary.totalWaste / data.summary.totalSpend) * 100)).toFixed(0) : '—'}%
                  </p>
                </div>
                <div className="h-2.5 bg-slate-200/50 rounded-full overflow-hidden ring-1 ring-slate-900/5">
                  <div 
                    className={`h-full transition-all ${
                      data?.summary?.totalSpend 
                        ? ((100 - ((data.summary.totalWaste / data.summary.totalSpend) * 100)) > 80) ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                          : ((100 - ((data.summary.totalWaste / data.summary.totalSpend) * 100)) > 50) ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                          : 'bg-gradient-to-r from-red-500 to-red-600'
                        : 'bg-slate-300'
                    }`}
                    style={{
                      width: data?.summary?.totalSpend 
                        ? `${Math.max(0, 100 - ((data.summary.totalWaste / data.summary.totalSpend) * 100))}%`
                        : '0%'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cost Trend */}
          <div className="mb-12">
            <CostTrend data={data} />
          </div>

          {/* ТАБЛИЦА РЕСУРСОВ */}
          <ResourcesTable 
            resources={data?.resources || []}
            onDelete={(id) => console.log('Delete:', id)}
          />
        </main>
      ) : currentPage === 'resources' ? (
        <ResourcesPage data={data} />
      ) : (
        <SecurityPage data={data} />
      )}
    </div>
  );
}

export default App;
