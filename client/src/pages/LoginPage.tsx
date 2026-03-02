import { useState, useEffect, useRef } from 'react';
import { Cloud, Eye, EyeOff, ArrowRight, Settings } from 'lucide-react';

const AWS_REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'eu-north-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-south-1',
  'ca-central-1',
  'sa-east-1',
  'af-south-1',
  'me-south-1',
];

export const LoginPage = ({ onConnect }: { onConnect?: (credentials: any) => void }) => {
  const [credentials, setCredentials] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: 'us-east-1',
  });
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [regionSelected, setRegionSelected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false);
      }
    };

    if (showRegionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRegionDropdown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredRegions = AWS_REGIONS.filter(region =>
    region.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const handleRegionSelect = (region: string) => {
    setCredentials(prev => ({
      ...prev,
      region
    }));
    setRegionSelected(true);
    setShowRegionDropdown(false);
    setRegionSearch('');
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      if (onConnect) {
        await onConnect(credentials);
      } else {
        console.log('Connecting with:', credentials);
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalStackConnect = async () => {
    setLoading(true);
    try {
      if (onConnect) {
        await onConnect({
          ...credentials,
          isLocalStack: true,
          endpoint: 'http://localhost:4566'
        });
      }
    } catch (error) {
      console.error('LocalStack connection error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#13141b] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Main container - responsive width */}
      <div className="w-full max-w-[260px] sm:max-w-[280px] md:max-w-[300px] flex flex-col gap-4 items-center">
        
        {/* Logo - 52x52, rounded 12, blue background */}
        <div className="w-[52px] h-[52px] bg-[#1a85ff] rounded-[12px] flex items-center justify-center flex-shrink-0">
          <Cloud className="w-7 h-7 text-white" />
        </div>

        {/* Content wrapper - gap 12 */}
        <div className="w-full flex flex-col gap-3">
          
          {/* Header section - gap 12 */}
          <div className="w-full flex flex-col gap-3">
            
            {/* Title and description - gap 29 */}
            <div className="w-full flex flex-col gap-[29px]">
              
              {/* Title section - gap 16 */}
              <div className="w-full flex flex-col gap-4 text-center">
                <h1 className="text-[18px] sm:text-[20px] font-black text-white leading-tight" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 900 }}>
                  Connect AWS Environment
                </h1>
                <p className="text-[13px] sm:text-[14px] text-[#818ca2] leading-[1.05]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 }}>
                  Provide your IAM credentials with ReadOnlyAccess. We use a stateless architecture — your keys are never stored in our database.
                </p>
              </div>

              {/* Form section - gap 26 */}
              <div className="w-full flex flex-col gap-[26px]">
                
                {/* AWS Credentials section - gap 8 */}
                <div className="w-full flex flex-col gap-2">
                  <label className="text-[11px] sm:text-[12px] text-[#818ca2]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                    AWS Credentials
                  </label>

                  {/* Form group - gap 8 */}
                  <div className="w-full flex flex-col gap-2">
                    {/* Access Key ID */}
                    <input
                      type="text"
                      name="accessKeyId"
                      placeholder="Access Key ID"
                      value={credentials.accessKeyId}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full h-[44px] px-3 py-4 bg-[#1f2029] hover:bg-[#16171d] border border-[#242732] rounded-[16px] text-white text-[12px] placeholder-[#818ca2] focus:outline-none focus:border-[#1a85ff] focus:bg-[#16171d] transition disabled:opacity-50"
                      style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}
                    />

                    {/* Secret Access Key */}
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        name="secretAccessKey"
                        placeholder="Secret Access Key"
                        value={credentials.secretAccessKey}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="w-full h-[44px] px-3 py-4 bg-[#1f2029] hover:bg-[#16171d] border border-[#242732] rounded-[16px] text-white text-[12px] placeholder-[#818ca2] focus:outline-none focus:border-[#1a85ff] focus:bg-[#16171d] transition pr-10 disabled:opacity-50"
                        style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#818ca2] hover:text-white transition disabled:opacity-50"
                      >
                        {showSecret ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Region - Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                        disabled={loading}
                        className="w-full h-[44px] px-3 py-4 bg-[#1f2029] hover:bg-[#16171d] border border-[#242732] rounded-[16px] text-[12px] focus:outline-none focus:border-[#1a85ff] focus:bg-[#16171d] transition disabled:opacity-50 flex items-center text-left"
                        style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700, color: !regionSelected ? '#818CA2' : '#ffffff' }}
                      >
                        {!regionSelected ? 'Region' : credentials.region}
                      </button>

                      {showRegionDropdown && (
                        <div className="absolute top-full mt-2 w-full bg-[#1f2029] border border-[#242732] rounded-[16px] z-50 shadow-lg">
                          {/* Search input */}
                          <input
                            type="text"
                            placeholder="Search region..."
                            value={regionSearch}
                            onChange={(e) => setRegionSearch(e.target.value)}
                            className="w-full h-[40px] px-3 py-2 bg-[#16171d] border-b border-[#242732] rounded-t-[16px] text-white text-[12px] placeholder-[#818ca2]/60 focus:outline-none"
                            style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}
                            autoFocus
                          />

                          {/* Regions list */}
                          <div className="max-h-[200px] overflow-y-auto">
                            {filteredRegions.length > 0 ? (
                              filteredRegions.map((region) => (
                                <button
                                  key={region}
                                  type="button"
                                  onClick={() => handleRegionSelect(region)}
                                  className={`w-full px-3 py-2 text-left text-[12px] transition ${
                                    credentials.region === region
                                      ? 'bg-[#1a85ff] text-white'
                                      : 'bg-[#1f2029] text-[#818ca2] hover:bg-[#242732]'
                                  }`}
                                  style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 400 }}
                                >
                                  {region}
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-[12px] text-[#818ca2]">
                                No regions found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connect Button */}
                <button
                  onClick={handleConnect}
                  disabled={loading || !credentials.accessKeyId || !credentials.secretAccessKey}
                  className="w-full h-[44px] px-3 py-4 bg-[#1a85ff] hover:bg-[#439AFF] disabled:bg-[#1a85ff] border border-[#479DFF] text-white rounded-[16px] transition-colors duration-200 flex items-center justify-center gap-2 text-[11px] sm:text-[12px]"
                  style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}
                >
                  {loading ? (
                    <span>Connecting...</span>
                  ) : (
                    <>
                      Connect
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}    
                </button>
              </div>
            </div>

            {/* Agreement Text */}
            <div className="w-full flex flex-col text-center px-2">
              <p className="text-[9px] sm:text-[10px] text-[#818ca2]/80 leading-[1.1]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 400 }}>
                By connecting, you agree to our
                <br />
                <span className="text-[#98a5bd] hover:text-white transition cursor-pointer" style={{ fontWeight: 500 }}>
                  Terms of Service & Privacy Policy
                </span>
              </p>
            </div>
          </div>

          {/* Divider section - gap 5 */}
          <div className="w-full flex items-center justify-center gap-[5px]">
            <div className="flex-1 h-px bg-[#818ca2]/30"></div>
            <span className="text-[12px] sm:text-[14px] text-[#818ca2] px-2" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 }}>or</span>
            <div className="flex-1 h-px bg-[#818ca2]/30"></div>
          </div>

          {/* Dev Mode section - gap 8 */}
          <div className="w-full flex flex-col gap-2">
            <label className="text-[12px] sm:text-[13px] text-[#818ca2]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
              Dev Mode
            </label>
            <button
              onClick={handleLocalStackConnect}
              disabled={loading}
              className="w-full h-[44px] px-3 py-4 bg-[#1f2029] hover:bg-[#16171D] disabled:bg-[#1f2029]/60 border border-[#242732] rounded-[16px] text-white transition flex items-center justify-center gap-2 text-[11px] sm:text-[12px]"
              style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}
            >
                <>
                    <Settings className="w-5 h-5" />
                    Connect to LocalStack
                </>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
