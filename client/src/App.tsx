import { useState } from 'react';
import axios from 'axios';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard';
import { ResourcesPage } from './pages/ResourcesPage';
import { SecurityPage } from './pages/SecurityPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'resources' | 'security' | 'settings'>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Set to true to skip login
  const [credentials, setCredentials] = useState<any>(null);

  const handleConnect = async (creds: any) => {
    try {
      setLoading(true);
      setCredentials(creds);
      
      // Send credentials to backend
      const response = await axios.post('http://localhost:5000/api/auth', {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        region: creds.region,
        isLocalStack: creds.isLocalStack,
        endpoint: creds.endpoint
      });
      
      if (response.status === 200) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Failed to connect. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCredentials(null);
    setData(null);
    setCurrentPage('dashboard');
  };

  return (
    <>
      {!isAuthenticated ? (
        <LoginPage onConnect={handleConnect} />
      ) : (
        <div className="flex flex-col min-h-screen bg-[#13141b]">
          <Header 
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onLogout={handleLogout}
          />
          
          <div className="pt-32">
            {currentPage === 'dashboard' && <Dashboard data={data} loading={loading} />}
            {currentPage === 'resources' && <ResourcesPage data={data} />}
            {currentPage === 'security' && <SecurityPage data={data} />}
            {currentPage === 'settings' && <SettingsPage data={data} />}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
