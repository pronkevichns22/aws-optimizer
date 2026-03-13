import { useState, useEffect } from 'react';
import axios from 'axios';
import { Header } from './components/Layout/Header'; 
import NewResourcesPage from './pages/NewResourcesPage';
import { SecurityPage } from './pages/SecurityPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import NewDashboard from './pages/NewDashboard';

function App() {
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);  // Показываем страницу входа при запуске 
  const [credentials, setCredentials] = useState<any>({});

  // Мониторим изменения credentials
  useEffect(() => {
    console.log('🔍 Credentials updated:', {
      keys_count: Object.keys(credentials).length,
      hasAccessKey: !!credentials.accessKeyId,
      hasSecretKey: !!credentials.secretAccessKey,
      isLocalStack: credentials.isLocalStack,
      full: credentials
    });
  }, [credentials]);

  // Функция для подключения с использованием credentials
  const handleConnect = async (creds: any) => {
    try {
      setLoading(true);
      console.log('💾 Storing credentials:', {
        accessKeyId: creds.accessKeyId ? '✓ provided' : '✗ missing',
        secretAccessKey: creds.secretAccessKey ? '✓ provided' : '✗ missing',
        region: creds.region,
        isLocalStack: creds.isLocalStack,
        endpoint: creds.endpoint
      });
      
      setCredentials(creds);
      
      // Выполняем сканирование сразу после подключения
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const scanResponse = await axios.post(`${serverUrl}/api/scan`, {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        region: creds.region || 'us-east-1',
        isLocalStack: creds.isLocalStack || false,
        endpoint: creds.endpoint || 'http://localhost:4566'
      });

      if (scanResponse.status === 200) {
        setData(scanResponse.data);
        setIsAuthenticated(true);
        console.log('✅ Connection successful');
      }
    } catch (error: any) {
      console.error('Error connecting:', error);
      alert(`Ошибка подключения: ${error.response?.data?.message || error.message}`);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Функция для переповтора сканирования
  const handleRescan = async () => {
    console.log('🔍 Rescan triggered. Current credentials state:', {
      keys: Object.keys(credentials),
      has_accessKeyId: 'accessKeyId' in credentials,
      has_secretAccessKey: 'secretAccessKey' in credentials,
      accessKeyId_value: credentials.accessKeyId,
      secretAccessKey_value: credentials.secretAccessKey,
      full_credentials: credentials
    });

    if (!credentials || !credentials.accessKeyId || !credentials.secretAccessKey) {
      alert('Требуется подключиться к AWS. Credentials не найдены.');
      return;
    }
    
    try {
      setLoading(true);
      const scanData = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: credentials.region || 'us-east-1',
        isLocalStack: credentials.isLocalStack || false,
        endpoint: credentials.endpoint || import.meta.env.VITE_LOCALSTACK_ENDPOINT || 'http://localhost:4566'
      };
      
      console.log('📡 Rescan request data:', scanData);
      
      const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
      const scanResponse = await axios.post(`${serverUrl}/api/scan`, scanData);

      if (scanResponse.status === 200) {
        setData(scanResponse.data);
        alert('✅ Сканирование завершено успешно');
      }
    } catch (error: any) {
      console.error('Error rescanning:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      alert(`Ошибка при переповторе сканирования: ${error.response?.data?.message || error.message}`);
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
        <div className="min-h-screen bg-[#0B0C10] flex flex-col relative z-0">
          
          <Header 
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onLogout={handleLogout}
          />

          {/* Тот самый прямоугольник на заднем фоне (265px высотой, цвет #181921) */}
          <div className="absolute top-0 left-0 w-full h-[300px] bg-[#181921] -z-10 pointer-events-none" />

          {/* Увеличенный отступ, чтобы было больше места между Хедером и контентом */}
          <div className="pt-[160px] flex-1 z-10">
            {currentPage === 'dashboard' && <NewDashboard loading={loading} data={data} onRescan={handleRescan} />}
            {currentPage === 'resources' && <NewResourcesPage data={data} />}
            {currentPage === 'security' && <SecurityPage data={data} />}
            {currentPage === 'settings' && <SettingsPage data={data} />}
          </div>
          
        </div>
      )}
    </>
  );
}

export default App;