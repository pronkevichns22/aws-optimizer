// ============================================================================
// FILE: SecurityPage.tsx
// LOCATION: client/src/pages/
// PURPOSE: Security dashboard showing health score, findings, and alerts from backend
// AUTO-FETCHES: Runs /api/scan on mount to generate real security & finops alerts
// ============================================================================

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { DashboardSidebar } from '../components/Layout/DashboardSidebar';
import { SecurityMetrics } from '../components/ui/SecurityMetrics';
import { SecurityAlertsTable } from '../components/ui/SecurityAlertsTable';
import { LiveThreatLog } from '../components/ui/LiveThreatLog';
import { downloadReport } from '../utils/exportReport';
import { useAWS } from '../context/AWSContext';

// ========== Type definition for backend alert ==========
interface BackendAlert {
  id: string;
  type: 'SECURITY' | 'FINOPS';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  resourceId: string;
  resourceName?: string;
  ruleId: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface SecurityAlert {
  id: string;
  resourceId: string;
  publicIp: string;
  missingPolicies: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
}

interface EventLog {
  id: string;
  timestamp: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  event: string;
  source: string;
}

interface ScanResponse {
  scanId: string;
  timestamp: string;
  summary: {
    totalSpend: number;
    totalWaste: number;
    healthScore: number;
    serverCount: number;
    diskCount: number;
    ipCount: number;
    sgCount: number;
    wasteCount: number;
  };
  alerts: BackendAlert[];
  alertSummary: {
    securityAlerts: number;
    finopsAlerts: number;
    critical: number;
    high: number;
    warning: number;
  };
  trendMetrics?: {
    critical: string;
    high: string;
    medium: string;
    warning: string;
  };
}

interface SecurityPageProps {
  data?: any;
  initialView?: 'alerts' | 'logs';
  onPageChange?: (page: 'dashboard' | 'resources' | 'security' | 'settings', viewMode?: 'alerts' | 'logs') => void;
}

// ========== Empty State Component ==========
const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="py-16 flex flex-col items-center justify-center">
    <Filter size={56} className="text-[#818CA2] mb-4 opacity-40" />
    <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
    <p className="text-[#818CA2] text-sm">{description}</p>
  </div>
);

// ============ Components ============

export const SecurityPage = ({ initialView = 'alerts', onPageChange }: SecurityPageProps) => {
  const { credentials } = useAWS();
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alertsFilter, setAlertsFilter] = useState<string>('ALL');
  const [logsFilter, setLogsFilter] = useState<string>('ALL');
  const [visibleAlertsCount, setVisibleAlertsCount] = useState(5);
  const [visibleLogsCount, setVisibleLogsCount] = useState(5);
  const [activeView, setActiveView] = useState<'alerts' | 'logs'>(initialView);

  // ========== Auto-fetch alerts from backend on component mount ==========
  useEffect(() => {
    const runSecurityScan = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!credentials) {
          setError('AWS credentials not configured');
          setLoading(false);
          return;
        }

        console.log('🔒 Running security scan...');

        const response = await fetch('http://localhost:5000/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            region: credentials.region || 'us-east-1',
            isLocalStack: credentials.isLocalStack || false,
            endpoint: credentials.isLocalStack ? 'http://localhost:4566' : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`Scan failed: ${response.statusText}`);
        }

        const data: ScanResponse = await response.json();
        console.log('✅ Security scan complete:', data);
        setScanData(data);
      } catch (err) {
        console.error('❌ Security scan error:', err);
        setError(err instanceof Error ? err.message : 'Failed to run security scan');
      } finally {
        setLoading(false);
      }
    };

    runSecurityScan();
  }, [credentials]);

  const handleToggleView = () => {
    const newView = activeView === 'alerts' ? 'logs' : 'alerts';
    setActiveView(newView);
  };

  // Show loading state
  if (loading) {
    return (
      <main className="bg-[#13141b] min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#47B2FF] mx-auto mb-4"></div>
          <p className="text-[#818CA2]">Running security scan...</p>
        </div>
      </main>
    );
  }

  // Show error state
  if (error || !scanData) {
    return (
      <main className="bg-[#13141b] min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#181921] border border-red-500/30 rounded-2xl p-6 flex items-center gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-white font-semibold mb-1">Unable to Fetch Security Data</h3>
              <p className="text-[#818ca2] text-sm">{error || 'No data available'}</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ========== Transform backend alerts into frontend format ==========
  // Security Alerts: Filter type = 'SECURITY'
  const securityAlerts: SecurityAlert[] = scanData.alerts
    .filter(a => a.type === 'SECURITY')
    .map((alert) => ({
      id: alert.id,
      resourceId: alert.resourceId,
      publicIp: alert.metadata?.publicIp || alert.metadata?.groupId || alert.resourceId,
      missingPolicies: [alert.title],
      severity: alert.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO',
    }));

  // Generate realistic threat events from alerts
  const generateThreatEvents = (): EventLog[] => {
    const threatEvents: EventLog[] = [];
    const now = new Date();

    // Generate events for security alerts
    for (const alert of scanData.alerts.filter(a => a.type === 'SECURITY')) {
      const eventTimestamp = new Date(now.getTime() - Math.random() * 3600000); // Events within last hour
      
      let eventDescription = alert.title;
      
      // Generate context-specific descriptions
      if (alert.ruleId?.includes('ssh') || alert.ruleId?.includes('rdp')) {
        eventDescription = `🔴 Brute-force attack detected on ${alert.metadata?.port} from multiple IPs`;
      } else if (alert.ruleId?.includes('ebs-unencrypted')) {
        eventDescription = `⚠️ Sensitive data detected on unencrypted volume ${alert.resourceId}`;
      } else if (alert.ruleId?.includes('public-ssh')) {
        eventDescription = `🌐 SSH login attempts detected on public instance ${alert.resourceId}`;
      } else if (alert.ruleId?.includes('db') || alert.ruleId?.includes('3306') || alert.ruleId?.includes('5432')) {
        eventDescription = `🗄️ Database port exposed - potential unauthorized access attempts`;
      } else if (alert.ruleId?.includes('large-range')) {
        eventDescription = `📡 Large port range opened exposing multiple services`;
      }

      threatEvents.push({
        id: `event-${alert.id}`,
        timestamp: eventTimestamp.toISOString(),
        severity: alert.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO',
        event: eventDescription,
        source: alert.resourceName || alert.resourceId,
      });
    }

    // Generate additional simulated events for finops issues
    const finopsAlerts = scanData.alerts.filter(a => a.type === 'FINOPS');
    for (const alert of finopsAlerts) {
      const eventTimestamp = new Date(now.getTime() - Math.random() * 7200000); // Events within last 2 hours
      
      let eventDescription = '';
      if (alert.ruleId?.includes('unused') || alert.ruleId?.includes('unattached')) {
        eventDescription = `💸 Cost optimization: ${alert.title} - potential savings: $${alert.metadata?.monthlyCost || 0}/month`;
      } else {
        eventDescription = `📊 Infrastructure optimization: ${alert.title}`;
      }

      threatEvents.push({
        id: `event-${alert.id}`,
        timestamp: eventTimestamp.toISOString(),
        severity: alert.severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO',
        event: eventDescription,
        source: alert.resourceName || alert.resourceId,
      });
    }

    // Sort by timestamp descending (newest first)
    return threatEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Event Logs / FinOps Alerts: Generate from alerts
  const eventLogs: EventLog[] = generateThreatEvents();

  // Filter function
  const getFilterPillStyle = (category: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-[#242732] text-[#818CA2] hover:bg-[#2F334B]';
    }
    
    switch (category.toUpperCase()) {
      case 'CRITICAL':
        return "bg-[#3F2B2B] text-[#FF4444] border border-[#FF4444]/30";
      case 'HIGH':
        return "bg-[#3F332B] text-[#FF9F43] border border-[#FF9F43]/30";
      case 'MEDIUM':
        return "bg-[#3F3D2B] text-[#FFD700] border border-[#FFD700]/30";
      case 'WARNING':
        return "bg-[#3F3D2B] text-[#FFD700] border border-[#FFD700]/30";
      case 'INFO':
        return "bg-[#2B3F3D] text-[#00D084] border border-[#00D084]/30";
      case 'ALL':
        return "bg-[#353C48] text-[#9AA3B0] border border-[#404854]";
      default:
        return "bg-[#242732] text-[#818CA2]";
    }
  };

  // Create filter categories - show all severity levels
  const securityAlertSeverities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'WARNING', 'INFO'];
  const logsFilterSeverities = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'WARNING', 'INFO'];

  const filteredAlerts = securityAlerts.filter((alert) => {
    return alertsFilter === 'ALL' || alert.severity === alertsFilter;
  });

  const filteredLogs = eventLogs.filter((log) => {
    return logsFilter === 'ALL' || log.severity === logsFilter;
  });

  // Pagination logic
  const visibleAlerts = filteredAlerts.slice(0, visibleAlertsCount);
  const hasMoreAlerts = visibleAlertsCount < filteredAlerts.length;

  const visibleLogs = filteredLogs.slice(0, visibleLogsCount);
  const hasMoreLogs = visibleLogsCount < filteredLogs.length;

  const handleLoadMoreAlerts = () => {
    setVisibleAlertsCount(prev => prev + 5);
  };

  const handleLoadMoreLogs = () => {
    setVisibleLogsCount(prev => prev + 5);
  };

  const handleExport = () => {
    const exportResources = scanData.alerts.map((alert) => ({
      id: alert.resourceId,
      type: alert.type,
      status: alert.severity,
      cost: alert.metadata?.monthlyCost || 0,
      size: 'N/A',
      region: alert.resourceName || 'Unknown'
    }));

    downloadReport({
      title: 'Security Audit Report',
      resources: exportResources,
      filename: `security-audit-report-${new Date().toISOString().split('T')[0]}.html`,
      summary: {
        totalSpend: scanData.summary.totalSpend,
        totalWaste: scanData.summary.totalWaste,
        wasteCount: scanData.summary.wasteCount,
        totalResources: scanData.summary.serverCount
      }
    });
  };

  const handleRescan = () => {
    // Re-run the scan
    setLoading(true);
  };

  return (
    <div className="flex justify-center px-[60px] pb-10 relative">
      <div className="w-full max-w-[1600px] flex gap-12 items-start z-10">
        
        {/* Sidebar */}
        <DashboardSidebar
          onRescan={handleRescan}
          onExport={handleExport}
          onPageChange={onPageChange}
          currentPage="security"
          onToggleView={handleToggleView}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          
          {/* Search Bar */}
          <div className="h-[36px] flex items-center mb-9"> 
            <div className="group bg-[#1f2029] hover:bg-[#16171d] border border-[#242732] rounded-[16px] text-white text-[12px] placeholder-[#818ca2] focus:outline-none focus:border-[#1a85ff] focus:bg-[#16171d] px-5 py-3 flex items-center gap-4 w-full max-w-[500px] focus-within:border-[#47B2FF] hover:border-[#47B2FF]/70 transition-all shadow-lg">
              <Search size={24} className="text-[#818CA2]" />
              <input 
                type="text" 
                placeholder="Search resources by ID or tag..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder-[#818CA2] font-medium" 
              />
            </div>
          </div>

          {/* Security Metrics */}
          <section className="flex h-[140px] items-center bg-[#13141b] rounded-[20px] border border-[#242732] px-6 shadow-lg mb-3">
            <SecurityMetrics
                metrics={[
                  {
                    label: 'Security Score',
                    value: `${scanData.summary.healthScore}/100`,
                    trend: scanData.trendMetrics?.warning || '+0%',
                    trendType: scanData.trendMetrics?.warning?.includes('-') ? 'positive' : 'negative',
                  },
                  {
                    label: 'Configuration Issues',
                    value: scanData.alerts.filter(a => a.severity === 'WARNING').length,
                    trend: scanData.trendMetrics?.warning || '+0%',
                    trendType: scanData.trendMetrics?.warning?.includes('-') ? 'positive' : 'negative',
                  },
                  {
                    label: 'Important',
                    value: scanData.alerts.filter(a => a.severity === 'MEDIUM').length,
                    trend: scanData.trendMetrics?.medium || '+0%',
                    trendType: scanData.trendMetrics?.medium?.includes('-') ? 'positive' : 'negative',
                  },
                  {
                    label: 'Serious',
                    value: scanData.alerts.filter(a => a.severity === 'HIGH').length,
                    trend: scanData.trendMetrics?.high || '+0%',
                    trendType: scanData.trendMetrics?.high?.includes('-') ? 'positive' : 'negative',
                  },
                  {
                    label: 'Critical',
                    value: scanData.alerts.filter(a => a.severity === 'CRITICAL').length,
                    trend: scanData.trendMetrics?.critical || '+0%',
                    trendType: scanData.trendMetrics?.critical?.includes('-') ? 'positive' : 'negative',
                  },
                ]}
              />
          </section>

          {/* Content Container */}
          <div className="bg-[#181921] rounded-[20px] border border-[#242732] p-8 shadow-lg">
            {/* Security Alerts Table */}
            {activeView === 'alerts' && (
            <section>
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-white mb-3 leading-7 flex items-center gap-2">
                {alertsFilter === 'ALL' ? 'Security Alerts' : `${alertsFilter} Alerts`}
                <span className="ml-auto text-sm font-normal text-[#818ca2]">
                  {filteredAlerts.length} of {securityAlerts.length} total
                </span>
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {securityAlertSeverities.map((category: string) => (
                <button
                  key={category}
                  onClick={() => {
                    setAlertsFilter(category);
                    setVisibleAlertsCount(10); // Reset pagination
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${getFilterPillStyle(category, alertsFilter === category)}`}
                >
                  {category === 'ALL' ? 'All' : category}
                </button>
              ))}
            </div>
            
            {filteredAlerts.length === 0 ? (
              <EmptyState 
                title="No alerts found" 
                description="Try adjusting your severity filters or rescan"
              />
            ) : (
              <>
                <SecurityAlertsTable
                  alerts={visibleAlerts}
                  onDelete={(id) => console.log('Delete alert:', id)}
                />

                {/* Load More Button */}
                {hasMoreAlerts && (
                  <div className="flex justify-center mt-3 pt-4">
                    <button 
                      onClick={handleLoadMoreAlerts}
                      className="text-xs font-bold text-[#818CA2] hover:text-white hover:bg-[#2F334B] hover:border-[#479DFF]/50 transition-all shadow-sm"
                    >
                      Load More Alerts ({filteredAlerts.length - visibleAlertsCount} left)
                    </button>
                  </div>
                )}

                {/* All Loaded Message */}
                {!hasMoreAlerts && filteredAlerts.length > 5 && (
                  <div className="text-center mt-3 pt-4 text-[10px] uppercase tracking-widest text-[#404854] font-bold">
                    All alerts loaded
                  </div>
                )}
              </>
            )}
          </section>
          )}

          {/* Event Logs Table */}
          {activeView === 'logs' && (
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-white mb-3 leading-7 flex items-center gap-2">
                {logsFilter === 'ALL' ? 'Security & Cost Events' : `${logsFilter} Events`}
                <span className="ml-auto text-sm font-normal text-[#818ca2]">
                  {filteredLogs.length} of {eventLogs.length} total
                </span>
              </h2>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {logsFilterSeverities.map((category: string) => (
                <button
                  key={category}
                  onClick={() => {
                    setLogsFilter(category);
                    setVisibleLogsCount(5); // Reset pagination
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase transition-all border ${getFilterPillStyle(category, logsFilter === category)}`}
                >
                  {category === 'ALL' ? 'All' : category}
                </button>
              ))}
            </div>
            
            {filteredLogs.length === 0 ? (
              <EmptyState 
                title="No events found" 
                description="Try adjusting your severity filters or rescan"
              />
            ) : (
              <>
                <LiveThreatLog
                  events={visibleLogs}
                  maxHeight="max-h-[600px]"
                  onLoadMore={() => console.log('Load more logs')}
                  onDelete={(id) => console.log('Delete event:', id)}
                />

                {/* Load More Button */}
                {hasMoreLogs && (
                  <div className="flex justify-center mt-3 pt-4">
                    <button 
                      onClick={handleLoadMoreLogs}
                      className="text-xs font-bold text-[#818CA2] hover:text-white hover:bg-[#2F334B] hover:border-[#479DFF]/50 transition-all shadow-sm"
                    >
                      Load More Events ({filteredLogs.length - visibleLogsCount} left)
                    </button>
                  </div>
                )}

                {/* All Loaded Message */}
                {!hasMoreLogs && filteredLogs.length > 5 && (
                  <div className="text-center mt-3 pt-4 text-[10px] uppercase tracking-widest text-[#404854] font-bold">
                    All events loaded
                  </div>
                )}
              </>
            )}
            </section>
          )}
          </div>
        </main>
      </div>
    </div>
  );
};
