import { Shield, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { HealthScore } from '../components/ui/HealthScore';

interface SecurityPageProps {
  data?: any;
}

export const SecurityPage = ({ data }: SecurityPageProps) => {
  const wastePercentage = data?.summary 
    ? (data.summary.totalWaste / data.summary.totalSpend) * 100 
    : 0;

  const getSecurityLevel = () => {
    if (wastePercentage < 10) return { level: 'Excellent', color: 'text-emerald-600 bg-emerald-50' };
    if (wastePercentage < 20) return { level: 'Warning', color: 'text-amber-600 bg-amber-50' };
    return { level: 'Critical', color: 'text-red-600 bg-red-50' };
  };

  const security = getSecurityLevel();

  const recommendations = [
    {
      icon: <AlertTriangle size={20} />,
      title: 'Remove Unused Resources',
      description: 'Delete EBS volumes and Elastic IPs not in use',
      priority: 'High'
    },
    {
      icon: <TrendingDown size={20} />,
      title: 'Optimize Instance Types',
      description: 'Right-size EC2 instances for better efficiency',
      priority: 'Medium'
    },
    {
      icon: <CheckCircle size={20} />,
      title: 'Enable Cost Monitoring',
      description: 'Set up CloudWatch alerts for billing',
      priority: 'Medium'
    }
  ];

  return (
    <main className="flex-1 ml-64 p-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <Shield size={24} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-slate-900">Security & Health</h1>
            <p className="text-slate-500 font-medium mt-2">Infrastructure optimization status</p>
          </div>
        </div>
      </div>

      {/* Main Health Score Section */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-sm shadow-slate-200/50 p-8 mb-12">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Cloud Health Score</h2>
            <p className="text-slate-500 font-medium mt-1">Real-time infrastructure optimization rating</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${security.color}`}>
            {security.level}
          </div>
        </div>

        <HealthScore 
          totalSpend={data?.summary?.totalSpend || 0} 
          totalWaste={data?.summary?.totalWaste || 0}
        />

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-3 gap-6 pt-8 border-t border-slate-200">
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Total Spend</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-2 font-tabular-nums">
              ${data?.summary?.totalSpend?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Wasted Cost</p>
            <p className="text-2xl font-extrabold text-red-600 mt-2 font-tabular-nums">
              ${data?.summary?.totalWaste?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Waste Ratio</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-2 font-tabular-nums">
              {wastePercentage.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-12">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-6">Recommendations</h2>
        <div className="grid grid-cols-3 gap-6">
          {recommendations.map((rec, idx) => (
            <div key={idx} className="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-sm shadow-slate-200/50 p-6 hover:shadow-md hover:shadow-slate-200/60 transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  rec.priority === 'High' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {rec.icon}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${
                  rec.priority === 'High' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{rec.title}</h3>
              <p className="text-sm text-slate-500">{rec.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security Checklist */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-900/5 shadow-sm shadow-slate-200/50 p-8">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-6">Security Checklist</h2>
        <div className="space-y-3">
          {[
            { label: 'Remove unused EBS volumes', done: true },
            { label: 'Clean up unattached Elastic IPs', done: true },
            { label: 'Right-size EC2 instances', done: false },
            { label: 'Enable CloudWatch monitoring', done: false },
            { label: 'Set billing alerts', done: false }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${
                item.done 
                  ? 'bg-emerald-500 border-emerald-500' 
                  : 'border-slate-300'
              }`}>
                {item.done && <CheckCircle size={16} className="text-white" />}
              </div>
              <span className={item.done ? 'text-slate-500 line-through' : 'text-slate-700 font-medium'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
};
