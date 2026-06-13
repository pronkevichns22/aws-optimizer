// ============================================================================
// FILE: RegisterPage.tsx
// LOCATION: client/src/pages/
// PURPOSE: User registration page for creating new accounts
// ============================================================================

import { useState } from 'react';
import { Cloud, Eye, EyeOff, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const RegisterPage = ({ 
  onRegisterSuccess,
  onSwitchToLogin
}: { 
  onRegisterSuccess?: (data: { token: string; user: any }) => void;
  onSwitchToLogin?: () => void;
}) => {
  const [formData, setFormData] = useState({
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 Registration attempt with:', { email: formData.email });
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: formData.email.split('@')[0],
        email: formData.email,
        password: formData.password,
      });

      const { data } = response.data;
      
      if (onRegisterSuccess) {
        await onRegisterSuccess({ token: data.token, user: data });
        console.log('✅ Registration callback completed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && formData.email && formData.password && formData.confirmPassword) {
      handleRegister();
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
                  Create Your Account
                </h1>
                <p className="text-[13px] sm:text-[14px] text-[#818ca2] leading-[1.05]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 500 }}>
                  Join CloudOpti and start optimizing your AWS infrastructure today.
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
                      value={formData.email}
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
                        placeholder="Password (min 8 chars)"
                        value={formData.password}
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

                    {/* Confirm Password */}
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
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
                  </div>
                </div>

                {/* Sign Up Button */}
                <button
                  onClick={() => handleRegister()}
                  disabled={loading || !formData.email || !formData.password || !formData.confirmPassword}
                  className="w-full h-[44px] px-3 py-4 bg-[#1a85ff] hover:bg-[#439AFF] disabled:bg-[#1a85ff]/50 border border-[#479DFF] text-white rounded-[16px] transition-colors duration-200 flex items-center justify-center gap-2 text-[11px] sm:text-[12px]"
                  style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 700 }}
                >
                  {loading ? (
                    <span>Creating account...</span>
                  ) : (
                    <>
                      Sign Up
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}    
                </button>
              </div>
            </div>

            {/* Switch to Login */}
            <div className="w-full flex flex-col text-center px-2 gap-2">
              <p className="text-[9px] sm:text-[10px] text-[#818ca2]/80 leading-[1.1]" style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 400 }}>
                Already have an account?
              </p>
              <button
                onClick={onSwitchToLogin}
                className="text-[11px] sm:text-[12px] text-[#1a85ff] hover:text-[#439AFF] transition" 
                style={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: 600 }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
