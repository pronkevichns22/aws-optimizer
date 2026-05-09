// ============================================================================
// FILE: SecurityAlertsTable.tsx
// LOCATION: client/src/components/ui/
// PURPOSE: Component for displaying security alerts with missing policies
// ============================================================================

import { AlertOctagon, AlertTriangle, AlertCircle, Shield, Trash2 } from 'lucide-react';

// ========== Type definition for security alerts ==========
interface SecurityAlert {
  id: string;
  resourceId: string;
  publicIp: string;
  missingPolicies: string[];
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO' | 'LOW';
}

interface SecurityAlertsTableProps {
  alerts: SecurityAlert[];
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const SeverityIcon = ({ severity }: { severity?: string }) => {
  const iconProps = { className: 'w-4 h-4' };
  
  switch (severity) {
    case 'CRITICAL':
      return <AlertOctagon {...iconProps} className="w-4 h-4 text-red-400" />;
    case 'HIGH':
      return <AlertTriangle {...iconProps} className="w-4 h-4 text-orange-400" />;
    case 'MEDIUM':
      return <AlertCircle {...iconProps} className="w-4 h-4 text-yellow-400" />;
    case 'WARNING':
      return <AlertTriangle {...iconProps} className="w-4 h-4 text-yellow-400" />;
    case 'INFO':
      return <AlertCircle {...iconProps} className="w-4 h-4 text-blue-400" />;
    default:
      return <Shield {...iconProps} className="w-4 h-4 text-blue-400" />;
  }
};

const getPolicySeverity = (policy: string) => {
  if (policy.toLowerCase().includes('disabled') || policy.toLowerCase().includes('exposed')) {
    return 'CRITICAL';
  }
  if (policy.toLowerCase().includes('enabled')) {
    return 'HIGH';
  }
  return 'MEDIUM';
};

export const SecurityAlertsTable = ({ 
  alerts, 
  onDelete
}: SecurityAlertsTableProps) => {
  if (alerts.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Shield className="w-16 h-16 text-green-400 mb-4 opacity-50" />
        <h3 className="text-white font-bold text-lg mb-1">No Security Alerts</h3>
        <p className="text-[#818ca2] text-sm">All security checks passed. Your infrastructure is secure.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#242732]">
            <th className="text-left py-3 px-2 text-gray-400 font-semibold text-xs uppercase tracking-wider">Resource ID</th>
            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Severity</th>
            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Public IP</th>
            <th className="text-left py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Issue</th>
            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert, i) => (
            <tr
              key={alert.id || i}
              className="border-b border-[#242732] hover:bg-[#1f2029] transition-colors"
            >
              <td className="py-4 px-2 text-left">
                <span className="px-3 py-1 rounded-full text-sm font-mono border border-[#479DFF]/40 bg-[#2F334B] text-[#479DFF]">
                  {alert.resourceId?.substring(0, 15)}...
                </span>
              </td>
              <td className="py-4 px-4 text-center">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                  alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                  alert.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' :
                  alert.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                  alert.severity === 'WARNING' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                  alert.severity === 'INFO' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                  'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                }`}>
                  <SeverityIcon severity={alert.severity} />
                  {alert.severity || 'UNKNOWN'}
                </span>
              </td>
              <td className="py-4 px-4 text-center text-gray-300 font-medium">{alert.publicIp}</td>
              <td className="py-4 px-4 text-left">
                <div className="flex flex-wrap gap-1">
                  {alert.missingPolicies.slice(0, 1).map((policy, idx) => {
                    const severity = getPolicySeverity(policy);
                    const isRed = severity === 'CRITICAL';
                    const isOrange = severity === 'HIGH';
                    
                    return (
                      <span
                        key={idx}
                        className={`
                          inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold
                          border
                          ${isRed ? 'border-red-500/30 bg-red-500/10 text-red-300' : ''}
                          ${isOrange ? 'border-orange-500/30 bg-orange-500/10 text-orange-300' : ''}
                          ${!isRed && !isOrange ? 'border-rose-500/30 bg-rose-500/10 text-rose-300' : ''}
                        `}
                      >
                        <SeverityIcon severity={severity} />
                        {policy}
                      </span>
                    );
                  })}
                </div>
              </td>
              <td className="py-4 px-4 text-center">
                <button 
                  onClick={() => onDelete?.(alert.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                >
                  <Trash2 size={16}/>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
