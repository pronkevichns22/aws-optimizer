// ============================================================================
// FILE: App.tsx (Refactored with React Router)
// LOCATION: client/src/
// PURPOSE: Main routing and authentication handling
// ============================================================================

import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAWS } from './context/AWSContext';

// Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import NewDashboard from './pages/NewDashboard';
import NewResourcesPage from './pages/NewResourcesPage';
import { SecurityPage } from './pages/SecurityPage';
import { SettingsPage } from './pages/SettingsPage';
import { Header } from './components/Layout/Header';

// ========== Protected Route Component ==========
const ProtectedRoute = ({ children, isAuthenticated, isLoading }: any) => {
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="text-[#818CA2] mt-4">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// ========== Dashboard Layout Component ==========
const DashboardLayout = ({ children, currentPage, onPageChange, onLogout, isAIModalOpen }: any) => {
  return (
    <div className={`min-h-screen bg-[#0B0C10] flex flex-col relative`}>
      {/* Header */}
      <Header 
        currentPage={currentPage}
        onPageChange={onPageChange}
        onLogout={onLogout}
      />
      <div className="absolute top-0 left-0 w-full h-[300px] bg-[#181921] -z-10 pointer-events-none" />
      
      <div className="pt-[160px] flex-1">
        {children}
      </div>
    </div>
  );
};

// ========== Main App Component ==========
export default function App() {
  const navigate = useNavigate();
  const { isAuthenticated, setToken, setUser, logout, credentials, setCredentials } = useAWS();
  
  const [data, setData] = useState<any>({
    summary: {
      totalSpend: 0,
      totalWaste: 0,
      wasteCount: 0,
      resources: []
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'resources' | 'security' | 'settings'>('dashboard');
  const [securityViewMode, setSecurityViewMode] = useState<'alerts' | 'logs'>('alerts');
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    
    if (token && user) {
      setToken(token);
      setUser(JSON.parse(user));
    }
    
    setIsAppLoading(false);
  }, []);

  const handleConnect = async (creds: any) => {
    try {
      setLoading(true);
      console.log('💾 Storing credentials...');
      
      // Normalize endpoint for LocalStack
      let endpoint = creds.endpoint;
      if (creds.isLocalStack && endpoint) {
        // Replace any IP-based endpoint with localhost
        endpoint = 'http://localhost:4566';
        console.log('🔧 Normalized LocalStack endpoint to:', endpoint);
      }
      
      // Save credentials to context
      setCredentials({
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        region: creds.region || 'us-east-1',
        isLocalStack: creds.isLocalStack || false,
        endpoint: endpoint
      });
      
      // Perform scan
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const scanResponse = await axios.post(`${serverUrl}/api/scan`, {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        region: creds.region || 'us-east-1',
        isLocalStack: creds.isLocalStack || false,
        endpoint: creds.isLocalStack ? endpoint : undefined
      });

      if (scanResponse.status === 200) {
        console.log('✅ Scan successful');
        setData(scanResponse.data);
      }
    } catch (error: any) {
      console.error('Error connecting:', error);
      alert(`Connection error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = async () => {
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      alert('Credentials not set');
      return;
    }

    try {
      setLoading(true);
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const token = localStorage.getItem('auth_token');
      
      // Normalize endpoint for LocalStack
      let endpoint = credentials.endpoint;
      if (credentials.isLocalStack && endpoint) {
        endpoint = 'http://localhost:4566';
      }
      
      const response = await axios.post(
        `${serverUrl}/api/scan`,
        {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region: credentials.region || 'us-east-1',
          isLocalStack: credentials.isLocalStack || false,
          endpoint: credentials.isLocalStack ? endpoint : undefined
        },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );

      if (response.status === 200) {
        console.log('✅ Rescan completed');
        setData(response.data);
      }
    } catch (error: any) {
      console.error('Rescan error:', error);
      alert(`Rescan error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentPage('dashboard');
  };

  const handleNavigateWithSecurityView = (page: any, view?: 'alerts' | 'logs') => {
    setCurrentPage(page);
    if (view) {
      setSecurityViewMode(view);
    }
    // Navigate to the page using React Router
    if (page === 'security') {
      navigate('/security');
    } else if (page === 'resources') {
      navigate('/resources');
    } else if (page === 'dashboard') {
      navigate('/dashboard');
    } else if (page === 'settings') {
      navigate('/settings');
    }
  };

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage onConnect={handleConnect} />} />
      <Route path="/register" element={<RegisterPage onRegisterSuccess={() => {}} />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isAppLoading}>
            <DashboardLayout
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onLogout={handleLogout}
              isAIModalOpen={isAIModalOpen}
            >
              <NewDashboard loading={loading} data={data} onRescan={handleRescan} onPageChange={handleNavigateWithSecurityView} onAIModalStateChange={setIsAIModalOpen} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/resources"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isAppLoading}>
            <DashboardLayout
              currentPage="resources"
              onPageChange={setCurrentPage}
              onLogout={handleLogout}
              isAIModalOpen={isAIModalOpen}
            >
              <NewResourcesPage data={data} onPageChange={handleNavigateWithSecurityView} onAIModalStateChange={setIsAIModalOpen} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/security"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isAppLoading}>
            <DashboardLayout
              currentPage="security"
              onPageChange={setCurrentPage}
              onLogout={handleLogout}
              isAIModalOpen={isAIModalOpen}
            >
              <SecurityPage data={data} initialView={securityViewMode} onPageChange={handleNavigateWithSecurityView} onAIModalStateChange={setIsAIModalOpen} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isAppLoading}>
            <DashboardLayout
              currentPage="settings"
              onPageChange={setCurrentPage}
              onLogout={handleLogout}
              isAIModalOpen={isAIModalOpen}
            >
              <SettingsPage onAIModalStateChange={setIsAIModalOpen} />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Catch-all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
