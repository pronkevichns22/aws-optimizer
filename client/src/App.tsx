import { useState } from 'react';
import axios from 'axios';
import { Sidebar } from './components/Layout/Sidebar';
import { StatCard } from './components/ui/StatCard';
import { Chart } from './components/ui/Chart';
import { ResourcesTable } from './components/ui/ResourcesTable';
import { ResourcesPage } from './pages/ResourcesPage';
import { RefreshCcw, Server, HardDrive, DollarSign, AlertTriangle, Zap } from 'lucide-react';

function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'resources'>('dashboard');

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

  // Подготовка данных для графиков
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

  const calculateSavingsPercentage = () => {
    if (!data?.summary) return 0;
    const total = data.summary.totalSpend || 1;
    return (data.summary.totalWaste / total) * 100;
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      {currentPage === 'dashboard' ? (
        <main className="flex-1 ml-64 p-8">
          {/* Заголовок и Кнопка */}
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-black text-slate-900">AWS Optimizer</h1>
              <p className="text-slate-500 mt-1">Monitor and optimize your cloud infrastructure</p>
            </div>
            <button 
              onClick={runAudit}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
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
          <div className="grid grid-cols-4 gap-6 mb-10 mt-8">
            
            {/* 1. СКОЛЬКО ПЛАТИМ ВСЕГО */}
            <StatCard 
              title="Total Spend" 
              value={`$${data?.summary?.totalSpend?.toFixed(2) || '0.00'}`} 
              icon={<DollarSign />} 
              trend="Monthly Bill"
              isMain={false}
            />

            {/* 2. СКОЛЬКО ТЕРЯЕМ (Красная!) */}
            <StatCard 
              title="Wasted Money" 
              value={`$${data?.summary?.totalWaste?.toFixed(2) || '0.00'}`} 
              icon={<AlertTriangle />} 
              trend="Potential Savings"
              isMain={true}
            />

            {/* 3. КОЛИЧЕСТВО СЕРВЕРОВ */}
            <StatCard 
              title="Active Servers" 
              value={data?.summary?.serverCount || 0} 
              icon={<Server />} 
              trend="EC2 Instances"
            />

            {/* 4. КОЛИЧЕСТВО ДИСКОВ */}
            <StatCard 
              title="Total Volumes" 
              value={data?.summary?.diskCount || 0} 
              icon={<HardDrive />} 
              trend="EBS Storage"
            />
          </div>

          {/* Графики */}
          {data?.resources && data.resources.length > 0 && (
            <div className="grid grid-cols-2 gap-6 mb-10">
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

          {/* ТАБЛИЦА РЕСУРСОВ */}
          <ResourcesTable 
            resources={data?.resources || []}
            onDelete={(id) => console.log('Delete:', id)}
          />
        </main>
      ) : (
        <ResourcesPage data={data} />
      )}
    </div>
  );
}

export default App;