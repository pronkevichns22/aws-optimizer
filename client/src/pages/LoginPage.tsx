// ============================================================================
// FILE: LoginPage.tsx
// LOCATION: client/src/pages/
// PURPOSE: User authentication page for email/password login
// ============================================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, Eye, EyeOff, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useAWS } from '../context/AWSContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
console.log('🌐 API_BASE_URL:', API_BASE_URL, 'from VITE_API_URL:', import.meta.env.VITE_API_URL);

// Setup axios interceptors for debugging
axios.interceptors.request.use(
  config => {
    console.log('📤 Axios Request:', config.method?.toUpperCase(), config.url, config.data);
    return config;
  },
  error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => {
    console.log('📥 Axios Response:', response.status, response.data);
    return response;
  },
  error => {
    console.error('❌ Response Error:', error.message, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

export const LoginPage = ({ onConnect }: { onConnect?: (credentials: any) => void }) => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAWS();
  const [isRegister, setIsRegister] = useState(false);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async () => {
    if (isRegister) {
      // Register mode
      if (!credentials.email || !credentials.password || !credentials.confirmPassword) {
        setError('Please fill in all fields');
        return;
      }
      if (credentials.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (credentials.password !== credentials.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        console.log('📝 Register attempt with:', { email: credentials.email });
        console.log('🌐 Using API URL:', API_BASE_URL);
        
        const response = await axios.post(`${API_BASE_URL}/auth/register`, {
          username: credentials.email.split('@')[0],
          email: credentials.email,
          password: credentials.password,
          confirmPassword: credentials.confirmPassword,
        });

        const { data } = response.data;
        setToken(data.token);
        setUser(data);
        
        // For registration, skip AWS connection (user will set up credentials in Settings)
        // For login, connect to AWS if onConnect is provided
        if (!isRegister && onConnect) {
          await onConnect({ region: 'us-east-1' });
          console.log('✅ Register callback completed');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Registration failed';
        setError(errorMessage);
        console.error('Register error:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Login mode
      if (!credentials.email || !credentials.password) {
        setError('Please enter both email and password');
        return;
      }

      setLoading(true);
      setError('');
      
      try {
        console.log('🔐 Login attempt with:', { email: credentials.email });
        console.log('🌐 Using API URL:', API_BASE_URL);
        
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: credentials.email,
          password: credentials.password,
        });

        const { data } = response.data;
        console.log('✅ Server response:', { data });
        setToken(data.token);
        setUser(data);
        
        // User successfully logged in - will proceed to dashboard
        console.log('✅ Login successful');
        
        // Redirect to dashboard
        setTimeout(() => {
          console.log('🔀 Redirecting to /dashboard');
          navigate('/dashboard');
        }, 500);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Login failed';
        setError(errorMessage);
        console.error('Login error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (isRegister) {
      if (e.key === 'Enter' && !loading && credentials.email && credentials.password && credentials.confirmPassword) {
        handleLogin();
      }
    } else {
      if (e.key === 'Enter' && !loading && credentials.email && credentials.password) {
        handleLogin();
      }
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
                  {isRegister ? 'Create Account' : 'Sign In to CloudOpti'}
                </h1>
                <p className="text-[13px] sm:text-[14px] text-[#818ca2] leading-[1.05]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 }}>
                  {isRegister ? 'Create a new account to get started' : 'Enter your credentials to access your AWS dashboard and start optimizing.'}
                </p>
              </div>

              {/* Form section - gap 26 */}
              <div className="w-full flex flex-col gap-[26px]">
                
                {/* Error Message */}
                {error && (
                  <div className="w-full px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-[12px] text-red-400 text-[12px]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 }}>
                    {error}
                  </div>
                )}

                {/* Credentials section - gap 8 */}
                <div className="w-full flex flex-col gap-2">
                  <label className="text-[11px] sm:text-[12px] text-[#818ca2]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}>
                    Account Credentials
                  </label>

                  {/* Form group - gap 8 */}
                  <div className="w-full flex flex-col gap-2">
                    {/* Email */}
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={credentials.email}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      disabled={loading}
                      className="w-full h-[44px] px-3 py-4 bg-[#1f2029] hover:bg-[#16171d] border border-[#242732] rounded-[16px] text-white text-[12px] placeholder-[#818ca2] focus:outline-none focus:border-[#1a85ff] focus:bg-[#16171d] transition disabled:opacity-50"
                      style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}
                    />

                    {/* Password */}
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Password"
                        value={credentials.password}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        disabled={loading}
                        className="w-full h-[44px] px-3 py-4 bg-[#1f2029] hover:bg-[#16171d] border border-[#242732] rounded-[16px] text-white text-[12px] placeholder-[#818ca2] focus:outline-none focus:border-[#1a85ff] focus:bg-[#16171d] transition pr-10 disabled:opacity-50"
                        style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#818ca2] hover:text-white transition disabled:opacity-50"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Confirm Password - only in register mode */}
                    {isRegister && (
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          placeholder="Confirm Password"
                          value={credentials.confirmPassword}
                          onChange={handleInputChange}
                          onKeyPress={handleKeyPress}
                          disabled={loading}
                          className="w-full h-[44px] px-3 py-4 bg-[#1f2029] hover:bg-[#16171d] border border-[#242732] rounded-[16px] text-white text-[12px] placeholder-[#818ca2] focus:outline-none focus:border-[#1a85ff] focus:bg-[#16171d] transition pr-10 disabled:opacity-50"
                          style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#818ca2] hover:text-white transition disabled:opacity-50"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sign In/Up Button */}
                <button
                  onClick={handleLogin}
                  disabled={loading || !credentials.email || !credentials.password || (isRegister && !credentials.confirmPassword)}
                  className="w-full h-[44px] px-3 py-4 bg-[#1a85ff] hover:bg-[#439AFF] disabled:bg-[#1a85ff]/50 border border-[#479DFF] text-white rounded-[16px] transition-colors duration-200 flex items-center justify-center gap-2 text-[11px] sm:text-[12px]"
                  style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}
                >
                  {loading ? (
                    <span>{isRegister ? 'Creating account...' : 'Signing in...'}</span>
                  ) : (
                    <>
                      {isRegister ? 'Sign Up' : 'Sign In'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}    
                </button>
              </div>
            </div>

            {/* Agreement Text / Mode Switch */}
            <div className="w-full flex flex-col text-center px-2 gap-1">
              <p className="text-[9px] sm:text-[10px] text-[#818ca2]/80 leading-[1.1]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 400 }}>
                {isRegister ? 'Already have an account?' : 'or'}
              </p>
              {isRegister ? (
                <button
                  onClick={() => {
                    setIsRegister(false);
                    setCredentials({ email: '', password: '', confirmPassword: '' });
                    setError('');
                  }}
                  className="text-[11px] sm:text-[12px] text-[#1a85ff] hover:text-[#439AFF] transition" 
                  style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}
                >
                  Sign In
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsRegister(true);
                    setCredentials({ email: '', password: '', confirmPassword: '' });
                    setError('');
                  }}
                  className="text-[11px] sm:text-[12px] text-[#1a85ff] hover:text-[#439AFF] transition" 
                  style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}
                >
                  Sign Up
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
