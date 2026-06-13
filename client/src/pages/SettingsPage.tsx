// ============================================================================
// FILE: SettingsPage.tsx
// LOCATION: client/src/pages/
// PURPOSE: Premium settings page for AWS credentials, audit rules, and data management
// ============================================================================

import { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Save, 
  Trash2, 
  RotateCcw, 
  Cloud, 
  AlertTriangle,
  Check,
  X,
  Search
} from 'lucide-react';
import { useAWS, type AWSCredentials } from '../context/AWSContext';
import { DashboardSidebar } from '../components/Layout/DashboardSidebar';

interface SettingsPageProps {
  data?: any;
  onPageChange?: (page: 'dashboard' | 'resources' | 'security' | 'settings', viewMode?: 'alerts' | 'logs') => void;
  onAIModalStateChange?: (isOpen: boolean) => void;
}

// ========== Toggle Switch Component ==========
const ToggleSwitch = ({ 
  enabled, 
  onChange 
}: { 
  enabled: boolean; 
  onChange: (value: boolean) => void;
}) => {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ${
        enabled ? 'bg-[#47B2FF]' : 'bg-[#404854]'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
          enabled ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

// ========== Settings Page Component ==========
export const SettingsPage = ({ onPageChange, onAIModalStateChange }: SettingsPageProps) => {
  const { credentials, setCredentials } = useAWS();
  
  // Cloud Environment Configuration State
  const [accessKey, setAccessKey] = useState<string>(credentials?.accessKeyId || '');
  const [secretKey, setSecretKey] = useState<string>(credentials?.secretAccessKey || '');
  const [region, setRegion] = useState<string>(credentials?.region || 'us-east-1');
  const [useLocalStack, setUseLocalStack] = useState<boolean>(credentials?.isLocalStack || false);
  // For VirtualBox VM with port forwarding: Use localhost:4566 (127.0.0.1:4566 → VM:4566)
  const [localStackEndpoint, setLocalStackEndpoint] = useState<string>(
    localStorage.getItem('localstack_endpoint') || 'http://localhost:4566'
  );
  const [showAccessKey, setShowAccessKey] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);

  // Audit Rules & Pricing State
  const [ebsStorageCost, setEbsStorageCost] = useState<string>(
    localStorage.getItem('ebs_storage_cost') || '0.08'
  );
  const [elasticIpCost, setElasticIpCost] = useState<string>(
    localStorage.getItem('elastic_ip_cost') || '3.60'
  );
  const [severityThreshold, setSeverityThreshold] = useState<string>(
    localStorage.getItem('severity_threshold') || 'High'
  );

  // UI State
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Show notification
  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // ========== Save Cloud Environment Configuration ==========
  const handleSaveConnectionSettings = () => {
    // For AWS mode, credentials are required
    if (!useLocalStack && (!accessKey.trim() || !secretKey.trim())) {
      showNotification('error', 'Access Key and Secret Key are required for AWS mode');
      return;
    }

    const finalAccessKey = useLocalStack ? 'test' : accessKey;
    const finalSecretKey = useLocalStack ? 'test' : secretKey;

    const newCredentials: AWSCredentials = {
      accessKeyId: finalAccessKey,
      secretAccessKey: finalSecretKey,
      region,
      isLocalStack: useLocalStack,
      endpoint: useLocalStack ? localStackEndpoint : undefined,
    };

    setCredentials(newCredentials);

    if (useLocalStack) {
      localStorage.setItem('localstack_endpoint', localStackEndpoint);
    }

    showNotification('success', '✓ Connection settings saved successfully');
  };

  // ========== Save Audit Rules & Pricing ==========
  const handleSaveRules = () => {
    localStorage.setItem('ebs_storage_cost', ebsStorageCost);
    localStorage.setItem('elastic_ip_cost', elasticIpCost);
    localStorage.setItem('severity_threshold', severityThreshold);
    showNotification('success', '✓ Audit rules and pricing saved');
  };

  // ========== Clear Audit History ==========
  const handleClearAuditHistory = () => {
    localStorage.removeItem('audit_history');
    showNotification('success', '✓ Audit history cleared');
  };

  // ========== Reset App to Factory Defaults ==========
  const handleResetFactory = () => {
    localStorage.clear();
    setAccessKey('');
    setSecretKey('');
    setRegion('us-east-1');
    setUseLocalStack(false);
    setLocalStackEndpoint('http://localhost:4566');
    setEbsStorageCost('0.08');
    setElasticIpCost('3.60');
    setSeverityThreshold('High');
    setIsResetModalOpen(false);
    showNotification('success', '✓ App reset to factory defaults');
  };

  const AWS_REGIONS = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-central-1',
    'ap-southeast-1',
    'ap-northeast-1',
  ];

  return (
    <div className="flex justify-center px-[60px] pb-10 relative">
      <div className="w-full max-w-[1600px] flex gap-12 items-start z-10">
        
        {/* Sidebar */}
        <DashboardSidebar
          onPageChange={onPageChange}
          currentPage="settings"
          onExport={() => {}}
          alerts={[]}
          data={undefined}
          onAIModalStateChange={onAIModalStateChange}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col w-full">

{/* Search Bar */}
          <div className="h-[36px] flex items-center mb-9"> 
            <div className="group bg-[#1f2029] hover:bg-[#16171d] border border-[#242732] rounded-[16px] text-white text-[12px] placeholder-[#818ca2] focus:outline-none focus:border-[#1a85ff] focus:bg-[#16171d] px-5 py-3 flex items-center gap-4 w-full max-w-[500px] focus-within:border-[#47B2FF] hover:border-[#47B2FF]/70 transition-all shadow-lg">
              <Search size={24} className="text-[#818CA2]" />
              <input 
                type="text" 
                placeholder="Search settings..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder-[#818CA2] font-medium" 
              />
            </div>
          </div>

          {/* Status Bar with Stat Cards */}
          <div className="flex h-[140px] items-center justify-between bg-[#13141b] rounded-[20px] border border-[#242732] px-6 shadow-lg mb-3 gap-8">
            <div className="flex flex-col items-center justify-center flex-1 h-full gap-2">
              <span className="text-[#818ca2] text-[11px] font-bold uppercase tracking-wider">Connection Mode</span>
              <div className="flex items-center gap-2 mt-1">
                <Cloud size={22} className={useLocalStack ? 'text-[#EF4444]' : 'text-[#10B981]'} />
                <span className="text-white text-lg font-bold">{useLocalStack ? 'LocalStack' : 'AWS'}</span>
              </div>
            </div>
            <div className="w-px h-20 bg-[#242732]" />
            <div className="flex flex-col items-center justify-center flex-1 h-full gap-2">
              <span className="text-[#818ca2] text-[11px] font-bold uppercase tracking-wider">AWS Region</span>
              <div className="flex items-center gap-2 mt-1">
                <Cloud size={22} className="text-[#47B2FF]" />
                <span className="text-white text-lg font-bold">{region}</span>
              </div>
            </div>
            <div className="w-px h-20 bg-[#242732]" />
            <div className="flex flex-col items-center justify-center flex-1 h-full gap-2">
              <span className="text-[#818ca2] text-[11px] font-bold uppercase tracking-wider">Credentials</span>
              <div className="flex items-center gap-2 mt-1">
                <Cloud size={22} className={accessKey ? 'text-[#10B981]' : 'text-[#818ca2]'} />
                <span className="text-white text-lg font-bold">{accessKey ? '✓ Set' : '○ Empty'}</span>
              </div>
            </div>
          </div>

          {/* Status Notification */}
          {message && (
            <div className={`mb-6 p-4 rounded-[16px] border flex items-center gap-3 ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
              <span className="font-medium text-sm">{message.text}</span>
            </div>
          )}

          {/* ===== CARD 1: Cloud Environment Configuration ===== */}
          <div className="bg-[#181921] rounded-[20px] border border-[#242732] p-8 shadow-lg w-full mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-white mb-2 leading-7">Cloud Environment Configuration</h2>
              <p className="text-[#818CA2] text-sm">Connect your AWS account or use LocalStack for development</p>
            </div>

            <div className="space-y-5">
              {/* Access Key */}
              <div>
                <label className="block text-[#818CA2] text-sm font-semibold mb-2">AWS Access Key ID</label>
                <input
                  type={showAccessKey ? 'text' : 'password'}
                  value={useLocalStack ? 'test' : accessKey}
                  onChange={(e) => !useLocalStack && setAccessKey(e.target.value)}
                  placeholder="AKIA..."
                  disabled={useLocalStack}
                  className={`w-full bg-[#0F1117] border border-[#242732] rounded-[12px] px-4 py-3 text-white placeholder-[#818CA2] focus:outline-none focus:border-[#47B2FF] focus:ring-1 focus:ring-[#47B2FF]/30 transition ${
                    useLocalStack ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#404854]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowAccessKey(!showAccessKey)}
                  disabled={useLocalStack}
                  className="text-[#818CA2] hover:text-[#47B2FF] transition text-xs mt-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {showAccessKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Secret Key */}
              <div>
                <label className="block text-[#818CA2] text-sm font-semibold mb-2">AWS Secret Access Key</label>
                <div className="relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={useLocalStack ? 'test' : secretKey}
                    onChange={(e) => !useLocalStack && setSecretKey(e.target.value)}
                    placeholder="••••••••••••••••"
                    disabled={useLocalStack}
                    className={`w-full bg-[#0F1117] border border-[#242732] rounded-[12px] px-4 py-3 text-white placeholder-[#818CA2] focus:outline-none focus:border-[#47B2FF] focus:ring-1 focus:ring-[#47B2FF]/30 transition pr-10 ${
                      useLocalStack ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#404854]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    disabled={useLocalStack}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#818CA2] hover:text-[#47B2FF] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {showSecretKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-[#818CA2] text-xs mt-1">🔒 Credentials stored locally, never sent externally</p>
              </div>

              {/* Region Dropdown */}
              <div>
                <label className="block text-[#818CA2] text-sm font-semibold mb-2">AWS Region</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#242732] rounded-[12px] px-4 py-3 text-white focus:outline-none focus:border-[#47B2FF] focus:ring-1 focus:ring-[#47B2FF]/30 transition hover:border-[#404854] cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2347B2FF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '36px'
                  }}
                >
                  {AWS_REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* LocalStack Toggle */}
              <div className="bg-[#0F1117] border border-[#242732] rounded-[12px] p-4 flex items-center justify-between hover:border-[#404854] transition">
                <div>
                  <h3 className="text-white font-semibold text-sm mb-1">Use LocalStack (Dev Mode)</h3>
                  <p className="text-[#818CA2] text-xs">Test without real AWS resources</p>
                </div>
                <ToggleSwitch 
                  enabled={useLocalStack} 
                  onChange={setUseLocalStack}
                />
              </div>

              {/* LocalStack Endpoint - Conditional */}
              {useLocalStack && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-[#818CA2] text-sm font-semibold mb-2">LocalStack Endpoint</label>
                  <input
                    type="text"
                    value={localStackEndpoint}
                    onChange={(e) => setLocalStackEndpoint(e.target.value)}
                    placeholder="http://localhost:4566"
                    className="w-full bg-[#0F1117] border border-[#242732] rounded-[12px] px-4 py-3 text-white placeholder-[#818CA2] focus:outline-none focus:border-[#47B2FF] focus:ring-1 focus:ring-[#47B2FF]/30 transition hover:border-[#404854] font-mono text-sm"
                  />
                  <p className="text-[#818CA2] text-xs mt-2">💡 <span className="text-[#47B2FF]">VirtualBox port forwarding</span>: 127.0.0.1:4566 → VM:4566</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-[#242732]">
              <button
                onClick={handleSaveConnectionSettings}
                disabled={!useLocalStack && (!accessKey.trim() || !secretKey.trim())}
                className="flex-1 bg-[#47B2FF] hover:bg-[#3FA0E8] disabled:bg-[#818ca2]/50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-[12px] transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                <Save size={16} />
                Save Connection
              </button>
            </div>
          </div>

          {/* ===== CARD 2: Audit Rules & Pricing ===== */}
          <div className="bg-[#181921] rounded-[20px] border border-[#242732] p-8 shadow-lg w-full mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-white mb-2 leading-7">Audit Rules & Pricing</h2>
              <p className="text-[#818CA2] text-sm">Configure cost calculations and security thresholds</p>
            </div>

            <div className="space-y-5">
              {/* EBS Storage Cost */}
              <div>
                <label className="block text-[#818CA2] text-sm font-semibold mb-2">Default EBS Storage Cost</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#818CA2]">$</span>
                  <input
                    type="number"
                    value={ebsStorageCost}
                    onChange={(e) => setEbsStorageCost(e.target.value)}
                    placeholder="0.08"
                    step="0.01"
                    className="w-full bg-[#0F1117] border border-[#242732] rounded-[12px] px-4 py-3 pl-8 text-white placeholder-[#818CA2] focus:outline-none focus:border-[#47B2FF] focus:ring-1 focus:ring-[#47B2FF]/30 transition hover:border-[#404854]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#818CA2] text-xs font-semibold">per GB/mo</span>
                </div>
              </div>

              {/* Elastic IP Cost */}
              <div>
                <label className="block text-[#818CA2] text-sm font-semibold mb-2">Elastic IP Idle Cost</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#818CA2]">$</span>
                  <input
                    type="number"
                    value={elasticIpCost}
                    onChange={(e) => setElasticIpCost(e.target.value)}
                    placeholder="3.60"
                    step="0.01"
                    className="w-full bg-[#0F1117] border border-[#242732] rounded-[12px] px-4 py-3 pl-8 text-white placeholder-[#818CA2] focus:outline-none focus:border-[#47B2FF] focus:ring-1 focus:ring-[#47B2FF]/30 transition hover:border-[#404854]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#818CA2] text-xs font-semibold">/month</span>
                </div>
              </div>

              {/* Severity Threshold */}
              <div>
                <label className="block text-[#818CA2] text-sm font-semibold mb-2">Security Severity Threshold</label>
                <select
                  value={severityThreshold}
                  onChange={(e) => setSeverityThreshold(e.target.value)}
                  className="w-full bg-[#0F1117] border border-[#242732] rounded-[12px] px-4 py-3 text-white focus:outline-none focus:border-[#47B2FF] focus:ring-1 focus:ring-[#47B2FF]/30 transition hover:border-[#404854] cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2347B2FF' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '36px'
                  }}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-[#242732]">
              <button
                onClick={handleSaveRules}
                className="flex-1 bg-[#F59E0B] hover:bg-[#E68E0C] active:bg-[#D87F0C] text-white font-bold py-2.5 px-4 rounded-[12px] transition-all transform hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
              >
                <Save size={16} />
                Save Rules
              </button>
            </div>
          </div>

          {/* ===== CARD 3: Danger Zone ===== */}
          <div className="bg-[#181921] rounded-[20px] border border-rose-500/20 p-8 shadow-lg w-full hover:border-rose-500/40 transition">
            <div className="mb-6">
              <h2 className="text-xl font-extrabold text-white mb-2 leading-7">Data Management</h2>
              <p className="text-[#818CA2] text-sm">Manage audit history and application data</p>
            </div>

            <div className="space-y-3">
              {/* Clear Audit History Button */}
              <button
                onClick={handleClearAuditHistory}
                className="w-full px-4 py-2.5 rounded-[12px] border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 active:bg-rose-500/20 font-semibold text-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Clear Audit History
              </button>

              {/* Reset to Factory Button */}
              <button
                onClick={() => setIsResetModalOpen(true)}
                className="w-full px-4 py-2.5 rounded-[12px] border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 active:bg-rose-500/20 font-semibold text-sm transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                Reset App to Factory Defaults
              </button>
            </div>

            <p className="text-rose-500/60 text-xs mt-4 text-center">⚠️ These actions cannot be undone</p>
          </div>
        </main>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#181921] border border-rose-500/30 rounded-[20px] p-8 max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-rose-500" />
              <h3 className="text-lg font-bold text-white">Reset to Factory Defaults?</h3>
            </div>
            <p className="text-[#818CA2] text-sm mb-6">
              This will clear all settings, credentials, and data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="flex-1 bg-[#353C48] hover:bg-[#404854] text-white font-semibold py-2 px-4 rounded-[12px] transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleResetFactory}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 px-4 rounded-[12px] transition transform hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
