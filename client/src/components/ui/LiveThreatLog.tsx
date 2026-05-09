// ============================================================================
// FILE: LiveThreatLog.tsx
// LOCATION: client/src/components/ui/
// PURPOSE: Component for displaying real-time security events and threats
// ============================================================================

import { AlertOctagon, AlertTriangle, AlertCircle, Eye, Trash2 } from 'lucide-react';

// ========== Type definition for security event logs ==========
interface EventLog {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO' | 'LOW';
  event: string;
  source: string;
 }

interface LiveThreatLogProps {
  events: EventLog[];
  maxHeight?: string;
  isLoading?: boolean;
  onLoadMore?: () => void;
  onDelete?: (id: string) => void;
}

const SeverityBadge = ({ severity }: { severity: string }) => {
  const styles: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
    CRITICAL: {
      bg: 'bg-red-500/10',
      text: 'text-red-300',
      border: 'border-red-500/20',
      icon: <AlertOctagon className="w-4 h-4" />
    },
    HIGH: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-300',
      border: 'border-orange-500/20',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    MEDIUM: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-300',
      border: 'border-yellow-500/20',
      icon: <AlertCircle className="w-4 h-4" />
    },
    WARNING: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-300',
      border: 'border-yellow-500/20',
      icon: <AlertTriangle className="w-4 h-4" />
    },
    INFO: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      border: 'border-blue-500/20',
      icon: <AlertCircle className="w-4 h-4" />
    },
    LOW: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-300',
      border: 'border-blue-500/20',
      icon: <AlertCircle className="w-4 h-4" />
    }
  };

  const style = styles[severity] || styles.LOW;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${style.bg} ${style.text} ${style.border}`}>
      {style.icon}
      <span>{severity}</span>
    </div>
  );
};

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return timestamp;
  }
};

export const LiveThreatLog = ({
  events,
  onDelete
}: LiveThreatLogProps) => {
  if (events.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center">
        <Eye className="w-16 h-16 text-green-400 mb-4 opacity-50" />
        <h3 className="text-white font-bold text-lg mb-1">No Event Logs</h3>
        <p className="text-[#818ca2] text-sm">No security events detected. Your infrastructure is operating normally.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#242732]">
            <th className="text-left py-3 px-2 text-gray-400 font-semibold text-xs uppercase tracking-wider">Date & Time</th>
            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Severity</th>
            <th className="text-left py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Event</th>
            <th className="text-left py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Source</th>
            <th className="text-center py-3 px-4 text-gray-400 font-semibold text-xs uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event, idx) => (
            <tr
              key={event.id || idx}
              className="border-b border-[#242732] hover:bg-[#1f2029] transition-colors"
            >
              {/* Timestamp */}
              <td className="py-4 px-2 text-left">
                <span className="px-3 py-1 rounded-full text-xs font-mono border border-[#479DFF]/40 bg-[#2F334B] text-[#479DFF]">
                  {formatTimestamp(event.timestamp).substring(0, 19)}
                </span>
              </td>

              {/* Severity */}
              <td className="py-4 px-4 text-center">
                <SeverityBadge severity={event.severity} />
              </td>

              {/* Event Description */}
              <td className="py-4 px-4 text-left">
                <p className="text-white text-[13px] leading-relaxed max-w-sm">
                  {event.event}
                </p>
              </td>

              {/* Source IP/Resource */}
              <td className="py-4 px-4 text-left">
                <span className="px-3 py-1 rounded-full text-xs font-mono border border-[#479DFF]/40 bg-[#2F334B] text-[#479DFF] inline-block">
                  {event.source?.substring(0, 15)}...
                </span>
              </td>

              {/* Actions */}
              <td className="py-4 px-4 text-center">
                <button 
                  onClick={() => onDelete?.(event.id)}
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
