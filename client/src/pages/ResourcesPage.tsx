import { Activity, AlertCircle } from 'lucide-react';

interface ResourcesPageProps {
  data?: any;
}

export const ResourcesPage = ({ data }: ResourcesPageProps) => {
  const allResources = data?.allResources || [];

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'EBS': 'bg-purple-50 text-purple-700',
      'EC2': 'bg-blue-50 text-blue-700',
      'IP': 'bg-orange-50 text-orange-700',
      'RDS': 'bg-green-50 text-green-700',
      'S3': 'bg-amber-50 text-amber-700',
    };
    return colors[type] || 'bg-gray-50 text-gray-700';
  };

  return (
    <main className="flex-1 ml-64 p-8">
      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-4xl font-black text-slate-900">All Resources</h1>
        <p className="text-slate-500 mt-1">View all your AWS infrastructure resources</p>
      </div>

      {/* Статистика */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active Resources</span>
              <Activity className="text-emerald-500" size={20} />
            </div>
            <p className="text-3xl font-black text-emerald-600">
              {(data.summary.serverCount || 0) + (data.summary.diskCount || 0)}
            </p>
            <p className="text-xs text-emerald-600 mt-2">Running instances & volumes</p>
          </div>

          <div className="bg-red-50 border border-red-200 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Unused Resources</span>
              <AlertCircle className="text-red-500" size={20} />
            </div>
            <p className="text-3xl font-black text-red-600">
              {data.summary.wasteCount || 0}
            </p>
            <p className="text-xs text-red-600 mt-2">Costing ${data.summary.totalWaste?.toFixed(2)}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Cost</span>
              <span className="text-lg font-black text-blue-600">$</span>
            </div>
            <p className="text-3xl font-black text-blue-600">
              ${data.summary.totalSpend?.toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 mt-2">Monthly spending</p>
          </div>
        </div>
      )}

      {/* Таблица ресурсов */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Resource Inventory</h2>

        {allResources.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider text-left">Resource ID</th>
                  <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider text-left">Type</th>
                  <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider text-left">Region</th>
                  <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider text-left">Status</th>
                  <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider text-right">Size</th>
                  <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {allResources.map((resource: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4">
                      <code className="bg-slate-900 text-blue-400 px-3 py-1 rounded-lg text-xs font-mono">
                        {resource.id?.substring(0, 16)}...
                      </code>
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(resource.type)}`}>
                        {resource.type}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600">{resource.region || 'us-east-1'}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(resource.status)}`}>
                        {resource.status === 'active' ? '✓ Active' : '⚠ Unused'}
                      </span>
                    </td>
                    <td className="py-4 text-right text-slate-600">
                      {resource.size ? `${resource.size} GB` : 'N/A'}
                    </td>
                    <td className="py-4 text-right">
                      <span className={`font-bold ${resource.isWasted ? 'text-red-500' : 'text-green-600'}`}>
                        ${resource.cost?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            <AlertCircle className="inline-block mr-2 text-slate-400" size={24} />
            <p>No resources found. Run an audit first!</p>
          </div>
        )}
      </div>
    </main>
  );
};
