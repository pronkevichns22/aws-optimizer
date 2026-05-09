# AWS Optimizer - Технологии и Техники Разработки

## 📋 Оглавление
1. [Общая архитектура](#общая-архитектура)
2. [Frontend стек](#frontend-стек)
3. [Backend стек](#backend-стек)
4. [Примеры реализации компонентов](#примеры-реализации-компонентов)
5. [State Management](#state-management)
6. [Стилизация](#стилизация)
7. [API интеграция](#api-интеграция)
8. [Дополнительные техники](#дополнительные-техники)

---

## 🏗️ Общая архитектура

Приложение состоит из двух основных частей:

```
AWS Optimizer
├── Client (React + Vite)
│   ├── Components UI
│   ├── Pages (Dashboard, Security, Resources, Settings)
│   ├── Context API (State Management)
│   └── Utils (Export, API calls)
│
└── Server (Express + TypeScript)
    ├── AWS SDK интеграция
    ├── MongoDB база данных
    ├── Rules Engine (CSPM/FinOps)
    ├── Alert Engine
    └── REST API endpoints
```

---

## 🎨 Frontend стек

### Основные технологии:

| Технология | Версия | Назначение |
|---|---|---|
| **React** | 19.2.0 | Библиотека для построения UI |
| **Vite** | 7.3.1 | Современный build tool и dev server |
| **TypeScript** | 5.9.3 | Статическая типизация |
| **Tailwind CSS** | 4.1.18 | Утилит-ориентированный CSS фреймворк |
| **Recharts** | 3.7.0 | Компоненты для графиков и диаграмм |
| **Axios** | 1.13.5 | HTTP клиент для API запросов |
| **html2canvas** | 1.4.1 | Конвертирование HTML в canvas |
| **jsPDF** | 4.2.0 | Генерация PDF документов |
| **lucide-react** | 0.574.0 | Иконки в виде React компонентов |

### Dev Dependencies:
- **ESLint** - Проверка кода на ошибки и стиль
- **PostCSS** + **Autoprefixer** - Обработка CSS
- **@vitejs/plugin-react** - Оптимизация React для Vite

---

## 💾 Backend стек

### Основные технологии:

| Технология | Версия | Назначение |
|---|---|---|
| **Express.js** | 5.2.1 | Веб-фреймворк для Node.js |
| **TypeScript** | 5.9.3 | Статическая типизация |
| **MongoDB + Mongoose** | 9.2.1 | База данных и ODM |
| **AWS SDK** | ^3.700.0 | Интеграция с AWS сервисами |
| **CORS** | 2.8.6 | Управление cross-origin запросами |
| **dotenv** | 17.3.1 | Управление переменными окружения |
| **uuid** | 9.0.1 | Генерация уникальных идентификаторов |

### Включенные AWS сервисы:
- **EC2Client** - Работа с EC2 инстансами, томами, адресами
- **IAMClient** - Управление пользователями и доступом

### Dev Dependencies:
- **nodemon** - Автоматический перезапуск при изменении файлов
- **ts-node** - Прямое выполнение TypeScript файлов

---

## 📝 Примеры реализации компонентов

### 1️⃣ React Context для управления AWS Credentials

**Файл:** `client/src/context/AWSContext.tsx`

```typescript
import React, { createContext, useContext, useState, type ReactNode } from 'react';

// Тип данных для AWS credentials
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  isLocalStack: boolean;
}

// Тип для контекста
interface AWSContextType {
  credentials: AWSCredentials | null;
  setCredentials: (creds: AWSCredentials) => void;
  clearCredentials: () => void;
  isAuthenticated: boolean;
}

const AWSContext = createContext<AWSContextType | undefined>(undefined);

export const AWSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [credentials, setCredentialsState] = useState<AWSCredentials | null>(() => {
    // Восстановление из sessionStorage при загрузке
    try {
      const stored = sessionStorage.getItem('aws_credentials');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setCredentials = (creds: AWSCredentials) => {
    setCredentialsState(creds);
    sessionStorage.setItem('aws_credentials', JSON.stringify(creds));
  };

  const clearCredentials = () => {
    setCredentialsState(null);
    sessionStorage.removeItem('aws_credentials');
  };

  return (
    <AWSContext.Provider 
      value={{
        credentials,
        setCredentials,
        clearCredentials,
        isAuthenticated: credentials !== null,
      }}
    >
      {children}
    </AWSContext.Provider>
  );
};

// Custom hook для использования контекста
export const useAWS = () => {
  const context = useContext(AWSContext);
  if (!context) {
    throw new Error('useAWS must be used within AWSProvider');
  }
  return context;
};
```

**Использование в компоненте:**

```typescript
import { useAWS } from '../context/AWSContext';

function MyComponent() {
  const { credentials, isAuthenticated } = useAWS();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Connected to region: {credentials?.region}</p>
      ) : (
        <p>Please login first</p>
      )}
    </div>
  );
}
```

### 2️⃣ Компонент Chart с Recharts

**Файл:** `client/src/components/ui/Chart.tsx`

```typescript
import { BarChart, LineChart } from 'lucide-react';

interface ChartProps {
  title: string;
  data: { label: string; value: number }[];
  type?: 'bar' | 'line';
}

export const Chart = ({ title, data, type = 'bar' }: ChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <div className="text-indigo-600">
          {type === 'bar' ? <BarChart size={20} /> : <LineChart size={20} />}
        </div>
      </div>
      
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold text-slate-900">{item.label}</span>
              <span className="text-indigo-600 font-bold">${item.value.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3️⃣ Stat Card компонент

```typescript
// client/src/components/ui/StatCard.tsx
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down';
  color?: 'blue' | 'red' | 'green';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        {icon && (
          <div className={`${colorClasses[color]} p-3 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 text-sm">
          <span className={trend === 'up' ? 'text-red-600' : 'text-green-600'}>
            {trend === 'up' ? '↑' : '↓'} {Math.abs(5)}%
          </span>
        </div>
      )}
    </div>
  );
};
```

### 4️⃣ API интеграция с Axios

**Файл:** `client/src/App.tsx`

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Создание Axios инстанса с базовой конфигурацией
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Получение данных с AWS
const fetchAWSData = async (credentials: AWSCredentials) => {
  try {
    const response = await api.post('/scan', {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region,
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching AWS data:', error);
    throw error;
  }
};

// Получение alerts
const getAlerts = async () => {
  try {
    const response = await api.get('/alerts');
    return response.data;
  } catch (error) {
    console.error('Error getting alerts:', error);
    throw error;
  }
};
```

### 5️⃣ Express Backend - Alert Engine

**Файл:** `server/src/index.ts`

```typescript
import express from 'express';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';

const app = express();
app.use(express.json());

// Типы для Alert
interface Alert {
  id: string;
  type: 'SECURITY' | 'FINOPS';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  resourceId: string;
  timestamp: Date;
}

// Rules Engine для проверки ресурсов
const checkSecurityRules = (instance: any): Alert[] => {
  const alerts: Alert[] = [];

  // Правило 1: Инстанс должен быть в VPC
  if (!instance.VpcId) {
    alerts.push({
      id: `sec-${instance.InstanceId}`,
      type: 'SECURITY',
      severity: 'HIGH',
      title: 'Instance not in VPC',
      description: 'EC2 instance must be in a VPC for enhanced security',
      resourceId: instance.InstanceId,
      timestamp: new Date(),
    });
  }

  // Правило 2: Проверка публичного IP адреса
  if (instance.PublicIpAddress && !instance.SecurityGroups?.length) {
    alerts.push({
      id: `sec-${instance.InstanceId}-2`,
      type: 'SECURITY',
      severity: 'CRITICAL',
      title: 'Publicly accessible instance without SG',
      description: 'Instance is publicly accessible but has no security group',
      resourceId: instance.InstanceId,
      timestamp: new Date(),
    });
  }

  return alerts;
};

// API Endpoint для сканирования AWS
app.post('/api/scan', async (req, res) => {
  const { accessKeyId, secretAccessKey, region } = req.body;

  const ec2 = new EC2Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    }
  });

  try {
    const command = new DescribeInstancesCommand({});
    const response = await ec2.send(command);

    let allAlerts: Alert[] = [];

    // Генерирование alerts для каждого инстанса
    response.Reservations?.forEach(reservation => {
      reservation.Instances?.forEach(instance => {
        const alerts = checkSecurityRules(instance);
        allAlerts = [...allAlerts, ...alerts];
      });
    });

    res.json({
      success: true,
      alertsCount: allAlerts.length,
      alerts: allAlerts,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to scan AWS resources' });
  }
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});
```

---

## 🎛️ State Management

### React Context API

**Паттерн использованный в проекте:**

```typescript
// Шаг 1: Создание контекста
const MyContext = createContext<MyContextType | undefined>(undefined);

// Шаг 2: Провайдер
export const MyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
};

// Шаг 3: Custom hook для использования
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error('Must be used within provider');
  return context;
};

// Шаг 4: Обворачивание приложения (в main.tsx или App.tsx)
<MyProvider>
  <App />
</MyProvider>
```

### sessionStorage для персистенции

```typescript
// Сохранение в sessionStorage (пример из AWSContext)
const saveCredentials = (creds: AWSCredentials) => {
  sessionStorage.setItem('aws_credentials', JSON.stringify(creds));
};

// Восстановление из sessionStorage
const loadCredentials = (): AWSCredentials | null => {
  try {
    const stored = sessionStorage.getItem('aws_credentials');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Очистка при выходе
const clearCredentials = () => {
  sessionStorage.removeItem('aws_credentials');
};
```

---

## 🎨 Стилизация

### Tailwind CSS

**Конфигурация:** `client/tailwind.config.js`

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Пользовательские шрифты
      fontFamily: {
        'albert-sans': ['Albert Sans', 'sans-serif'],
      },
      // CSS переменные для цветов
      colors: {
        main: "var(--main)",
        "main-collection-cost": "var(--main-collection-cost)",
        // ... другие цвета
      },
    },
  },
  plugins: [],
}
```

### CSS структура

**Файл:** `client/src/index.css`

```css
/* Определение CSS переменных */
:root {
  --main: #4f46e5;
  --main-collection-cost: #0f766e;
  /* ... другие переменные */
}

/* Reset и базовые стили */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Albert Sans', sans-serif;
  background-color: #f8fafc;
}
```

### Примеры использования Tailwind

```typescript
// Создание красивой карточки
<div className="
  bg-white 
  p-6 
  rounded-3xl 
  shadow-sm 
  border border-gray-100
  hover:shadow-md
  transition-shadow duration-300
">
  {/* Содержимое */}
</div>

// Создание градиента
<div className="
  bg-gradient-to-r 
  from-indigo-500 
  to-indigo-600
  rounded-lg
">
  {/* Содержимое */}
</div>

// Адаптивный сетка
<div className="
  grid 
  grid-cols-1 
  md:grid-cols-2 
  lg:grid-cols-4 
  gap-4
">
  {/* 4 колонки на экране, 2 на планшете, 1 на мобильном */}
</div>

// Flex layout
<div className="
  flex 
  items-center 
  justify-between 
  gap-4
">
  {/* Содержимое */}
</div>
```

---

## 🔌 API интеграция

### Axios настройка

```typescript
import axios from 'axios';

// Создание инстанса с базовой конфигурацией
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data);
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API Service функции

```typescript
// client/src/services/awsService.ts

export const awsService = {
  // Сканирование AWS ресурсов
  scanResources: async (credentials: AWSCredentials) => {
    return apiClient.post('/api/scan', credentials);
  },

  // Получение alerts
  getAlerts: async (filters?: AlertFilters) => {
    return apiClient.get('/api/alerts', { params: filters });
  },

  // Получение стоимости
  getCostAnalysis: async (resource: string) => {
    return apiClient.get(`/api/cost/${resource}`);
  },

  // Экспорт отчета
  exportReport: async (format: 'pdf' | 'csv') => {
    return apiClient.get(`/api/export/${format}`, {
      responseType: format === 'pdf' ? 'blob' : 'json',
    });
  },
};
```

---

## 🚀 Дополнительные техники

### 1️⃣ PDF Экспорт (html2canvas + jsPDF)

**Файл:** `client/src/utils/exportReport.ts`

```typescript
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export const exportDashboardAsPDF = async (elementId: string, fileName: string) => {
  try {
    // Шаг 1: Конвертировать HTML в canvas
    const element = document.getElementById(elementId);
    const canvas = await html2canvas(element!, {
      backgroundColor: '#ffffff',
      scale: 2,
    });

    // Шаг 2: Получить размеры
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = pdf.internal.pageSize.getWidth() - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Шаг 3: Добавить изображение в PDF
    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

    // Шаг 4: Сохранить
    pdf.save(`${fileName}-${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
  }
};

// Использование
<button onClick={() => exportDashboardAsPDF('dashboard', 'aws-report')}>
  Export as PDF
</button>
```

### 2️⃣ Иконки с lucide-react

```typescript
import { 
  AlertCircle, 
  TrendingUp, 
  Shield, 
  DollarSign,
  Zap,
  Lock
} from 'lucide-react';

// Использование
<div className="flex items-center gap-2">
  <AlertCircle className="text-red-500" size={20} />
  <span>Critical Alert</span>
</div>

// Динамическое изменение
<Icon color={isAlert ? 'red' : 'green'} size={24} />
```

### 3️⃣ TypeScript типы для AWS

```typescript
// Типы для EC2
interface EC2Instance {
  InstanceId: string;
  InstanceType: string;
  State: { Name: 'running' | 'stopped' | 'terminated' };
  LaunchTime: Date;
  PublicIpAddress?: string;
  PrivateIpAddress: string;
  SecurityGroups: Array<{ GroupId: string; GroupName: string }>;
  Tags?: Array<{ Key: string; Value: string }>;
}

// Типы для сканирования
interface ScanResult {
  scanId: string;
  timestamp: Date;
  resources: {
    ec2Instances: EC2Instance[];
    volumes: Volume[];
    securityGroups: SecurityGroup[];
  };
  alerts: Alert[];
}
```

### 4️⃣ ESLint конфигурация

**Файл:** `client/eslint.config.js`

```javascript
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
]
```

### 5️⃣ Vite конфигурация

**Файл:** `client/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
```

---

## 🔄 Workflow для создания нового Dashboard

### Шаг 1: Создать компонент
```typescript
// src/components/ui/NewDashboard.tsx
export const NewDashboard: React.FC = () => {
  const { credentials } = useAWS();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (credentials) {
      loadData();
    }
  }, [credentials]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await awsService.scanResources(credentials!);
      setData(result);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      {loading && <p>Loading...</p>}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* StatCards */}
        </div>
      )}
    </div>
  );
};
```

### Шаг 2: Добавить маршрут
```typescript
// client/src/App.tsx
import NewDashboard from './pages/NewDashboard';

function App() {
  const [page, setPage] = useState('dashboard');

  return (
    <div>
      {page === 'dashboard' && <NewDashboard />}
      {/* Другие страницы */}
    </div>
  );
}
```

### Шаг 3: Добавить стили Tailwind
```typescript
// Уже встроено - просто используй классы!
<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
```

### Шаг 4: Добавить API endpoint на backend
```typescript
// server/src/index.ts
app.post('/api/new-dashboard-data', async (req, res) => {
  // Логика получения данных
  res.json({ data: /* ... */ });
});
```

---

## 📦 Next.js vs React сравнение

### В этом проекте используется **REACT** (не Next.js)

#### React (этот проект):
✅ **Преимущества:**
- Простота настройки с Vite
- Полный контроль над структурой
- Меньше "магии" в фреймворке
- Быстрая разработка для SPA
- Легче интегрировать с AWS SDK

❌ **Недостатки:**
- Нет встроенного SSR
- Нужно самостоятельно управлять маршрутизацией
- Нет автоматической оптимизации изображений

#### Если бы это был Next.js:
```typescript
// next.js структура
pages/
  ├── /dashboard
  ├── /security
  ├── /resources
  └── /api/scan.ts (API маршруты)

// Server-side rendering
export async function getServerSideProps(context) {
  const data = await fetchAWSData();
  return { props: { data } };
}

// API маршруты
// pages/api/scan.ts
export default function handler(req, res) {
  // API логика
}
```

---

## 🚀 Быстрый старт для разработчика

### Frontend
```bash
# Установка зависимостей
cd client
npm install

# Запуск dev сервера
npm run dev
# Открыть http://localhost:5173

# Создание production сборки
npm run build
npm run preview
```

### Backend
```bash
# Установка зависимостей
cd server
npm install

# Запуск с nodemon (автоперезагрузка)
npm run dev
# Сервер на http://localhost:5000

# Требуется .env файл
echo "PORT=5000" > .env
echo "MONGODB_URI=mongodb://localhost:27017/aws-optimizer" >> .env
```

---

## 📚 Структура файлов - Best Practice

```
client/
├── src/
│   ├── components/         # Переиспользуемые компоненты
│   │   ├── ui/            # Базовые UI компоненты
│   │   └── Layout/        # Layout компоненты
│   ├── pages/             # Страницы приложения
│   ├── context/           # React Context
│   ├── utils/             # Утилиты (export, api)
│   ├── assets/            # Картинки, иконки
│   ├── App.tsx            # Главный компонент
│   └── index.css          # Глобальные стили
├── vite.config.ts         # Vite конфигурация
├── tailwind.config.js     # Tailwind конфигурация
└── tsconfig.json          # TypeScript конфигурация

server/
├── src/
│   ├── index.ts           # Main server file
│   ├── routes/            # API маршруты
│   ├── models/            # MongoDB модели (Mongoose)
│   └── utils/             # Утилиты (AWS SDK setup и т.д.)
├── package.json
└── tsconfig.json
```

---

## 🔐 Безопасность

### Обработка AWS Credentials
```typescript
// ❌ НЕПРАВИЛЬНО - не сохранять в localStorage
localStorage.setItem('accessKey', credentials.accessKeyId);

// ✅ ПРАВИЛЬНО - использовать sessionStorage (исчезает при закрытии)
sessionStorage.setItem('credentials', JSON.stringify(credentials));

// ✅ ЛУЧШЕ - использовать .env переменные на backend
// .env
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

// server/index.ts
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
```

---

## 🎯 Выводы

Этот проект демонстрирует:

1. **Чистую архитектуру** - разделение frontend/backend
2. **Современный стек** - React 19 + TypeScript + Vite
3. **Правильную работу с состоянием** - React Context API
4. **Безопасность** - правильное хранение credentials
5. **Type Safety** - использование TypeScript везде
6. **Профессиональный дизайн** - Tailwind CSS + готовые компоненты
7. **Интеграцию с облаком** - AWS SDK для реальных данных
8. **Расширяемость** - простая система добавления новых компонентов

---

**Последнее обновление:** Март 2026
