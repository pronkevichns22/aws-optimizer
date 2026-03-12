import { useState } from 'react';
import axios from 'axios';
import { ResourcesPage } from './pages/ResourcesPage';
import { SecurityPage } from './pages/SecurityPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import FullDashboardPage from './pages/NewDashboard';

function App() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'resources' | 'security' | 'settings'>('dashboard');
  
  // 1. УБЕДИСЬ, ЧТО ТУТ СТОИТ TRUE
  const [isAuthenticated, setIsAuthenticated] = useState(true); 
  const [_credentials, setCredentials] = useState<any>(null);

  const handleConnect = async (creds: any) => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/api/auth', creds);
      if (response.status === 200) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error(error);
      alert('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <>
      {/* Если false - покажет вход. Если true - сразу дашборд */}
      {!isAuthenticated ? (
        <LoginPage onConnect={handleConnect} />
      ) : (
        <div className="min-h-screen bg-[#0B0C10]">
          
          {/* Dashboard - это наш FullDashboardPage */}
          {currentPage === 'dashboard' && (
            <FullDashboardPage 
              onPageChange={(page: any) => setCurrentPage(page)}
              onLogout={handleLogout}
              loading={loading}
              data={data}
            />
          )}

          {/* Другие страницы */}
          {currentPage === 'resources' && <ResourcesPage data={data} />}
          {currentPage === 'security' && <SecurityPage data={data} />}
          {currentPage === 'settings' && <SettingsPage data={data} />}
          
        </div>
      )}
    </>
  );
}

export default App;