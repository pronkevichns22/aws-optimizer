// ============================================================================
// FILE: ResourcesTable.tsx
// LOCATION: client/src/components/ui/
// PURPOSE: Component for displaying AWS resources in table format
// ============================================================================

import { Trash2, AlertCircle } from 'lucide-react';

// ========== Type definition for resource items ==========
interface Resource {
  id: string;
  type: string;
  cost: number;
  region?: string;
  status?: string;
}

interface ResourcesTableProps {
  resources: Resource[];
  onDelete?: (id: string) => void;
}

export const ResourcesTable = ({ resources, onDelete }: ResourcesTableProps) => {
  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'EC2': 'bg-blue-50 text-blue-700',
      'RDS': 'bg-green-50 text-green-700',
      'S3': 'bg-orange-50 text-orange-700',
      'EBS': 'bg-purple-50 text-purple-700',
      'Lambda': 'bg-amber-50 text-amber-700',
    };
    return colors[type] || 'bg-gray-50 text-gray-700';
  };

  const getTotalCost = () => resources.reduce((sum, r) => sum + r.cost, 0);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Unused Resources</h3>
          <p className="text-sm text-slate-500 mt-1">Resources recommended for deletion</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-red-500">${getTotalCost().toFixed(2)}</p>
          <p className="text-xs text-slate-500">Total Waste</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Resource ID</th>
              <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Type</th>
              <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider">Region</th>
              <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider text-right">Monthly Cost</th>
              <th className="pb-3 font-bold text-slate-600 uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources && resources.length > 0 ? (
              resources.map((resource, idx) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4">
                    <code className="bg-slate-900 text-blue-400 px-3 py-1 rounded-lg text-xs font-mono">
                      {resource.id.substring(0, 12)}...
                    </code>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getTypeColor(resource.type)}`}>
                      {resource.type}
                    </span>
                  </td>
                  <td className="py-4 text-slate-600">{resource.region || 'us-east-1'}</td>
                  <td className="py-4 text-right">
                    <span className="font-bold text-red-500">${resource.cost.toFixed(2)}</span>
                  </td>
                  <td className="py-4 text-right space-x-2">
                    <button 
                      onClick={() => onDelete && onDelete(resource.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete resource"
                    >
                      <Trash2 size={16} />
                      <span className="text-xs font-semibold">Delete</span>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  <AlertCircle className="inline-block mr-2 text-slate-400" size={20} />
                  No unused resources found. Great job!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
