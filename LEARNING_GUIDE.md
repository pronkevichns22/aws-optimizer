# 📚 AWS Optimizer - Полный гайд обучения

## Оглавление
1. [React 19 - Основы](#react-19-основы)
2. [TypeScript - Типизация](#typescript-типизация)
3. [React Context API](#react-context-api)
4. [React Hooks](#react-hooks)
5. [Express.js Backend](#expressjs-backend)
6. [AWS SDK интеграция](#aws-sdk-интеграция)
7. [MongoDB и Mongoose](#mongodb-и-mongoose)
8. [Tailwind CSS](#tailwind-css)
9. [API интеграция (Axios)](#api-интеграция-axios)
10. [Архитектурные паттерны](#архитектурные-паттерны)
11. [Best Practices](#best-practices)

---

# 🎯 React 19 - Основы

## Что такое React?
**React** - это JavaScript библиотека для построения пользовательских интерфейсов с использованием компонентов.

### Ключевые концепции:

#### 1. Компоненты
Компоненты - это переиспользуемые части UI:

```typescript
// Функциональный компонент (современный способ)
export const Button: React.FC = () => {
  return <button>Click me</button>;
};

// С props (входные параметры)
interface ButtonProps {
  text: string;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ text, onClick }) => {
  return <button onClick={onClick}>{text}</button>;
};
```

**Пример из проекта:** `client/src/components/ui/StatCard.tsx`
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'red' | 'green';
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = 'blue' 
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold mt-2">{value}</p>
      {icon && <div className={`${color}-class`}>{icon}</div>}
    </div>
  );
};
```

**Использование:**
```typescript
<StatCard 
  title="Total Spend" 
  value="$1,234.56" 
  color="blue"
/>
```

#### 2. JSX - синтаксис
JSX позволяет писать HTML-подобный код в JavaScript:

```typescript
// ❌ Без JSX (сложно)
React.createElement('div', { className: 'container' },
  React.createElement('h1', null, 'Hello'),
  React.createElement('p', null, 'World')
);

// ✅ С JSX (просто и читаемо)
<div className="container">
  <h1>Hello</h1>
  <p>World</p>
</div>
```

#### 3. Virtual DOM
React создает виртуальное дерево элементов и эффективно обновляет только измененные части реального DOM.

```
User Input → React сравнивает → Обновляет только нужные элементы
  (click)    Virtual DOM       (реальный DOM)
```

---

## React в нашем проекте

### Структура приложения:

```
client/
├── src/
│   ├── main.tsx          # Точка входа
│   ├── App.tsx           # Главный компонент
│   ├── components/       # Компоненты UI
│   │   ├── ui/           # Переиспользуемые компоненты
│   │   ├── Layout/       # Layout компоненты
│   │   └── AIAdvisor.tsx # Специфичные компоненты
│   ├── pages/            # Страницы приложения
│   │   ├── LoginPage.tsx
│   │   ├── NewDashboard.tsx
│   │   ├── SecurityPage.tsx
│   │   └── SettingsPage.tsx
│   ├── context/          # React Context
│   └── utils/            # Утилиты
```

### Файл main.tsx (точка входа):

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

# 📘 TypeScript - Типизация

## Что такое TypeScript?
**TypeScript** - это надстройка над JavaScript, добавляющая статическую типизацию.

### Преимущества:
- 🛡️ Перехвата ошибок на этапе разработки
- 📖 Лучшая документация кода
- 🚀 Лучшая производительность IDE
- 🔒 Безопаснее рефакторинг

## Основные типы

```typescript
// Примитивные типы
const name: string = "AWS Optimizer";
const count: number = 42;
const active: boolean = true;
const nothing: null = null;
const undef: undefined = undefined;

// Объединение типов (Union)
type AlertType = 'SECURITY' | 'FINOPS';
const alertType: AlertType = 'SECURITY'; // ✅
const alertType2: AlertType = 'OTHER';   // ❌ Error!

// Массивы
const numbers: number[] = [1, 2, 3];
const strings: Array<string> = ["a", "b"];

// Объекты
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = {
  id: "123",
  name: "John",
  email: "john@example.com"
};

// Опциональные свойства (?)
interface Product {
  name: string;
  price: number;
  description?: string; // опционально
}

// Функции с типами
function add(a: number, b: number): number {
  return a + b;
}

// Функции с объектами
interface ScanRequest {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

function scanAWS(request: ScanRequest): Promise<ScanResult> {
  // ...
}
```

## TypeScript в нашем проекте

### Пример 1: AWS Credentials тип

**Файл:** `client/src/context/AWSContext.tsx`

```typescript
// Определяем точную структуру данных
export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  isLocalStack: boolean;
}

// Тип контекста
interface AWSContextType {
  credentials: AWSCredentials | null;
  setCredentials: (creds: AWSCredentials) => void;
  clearCredentials: () => void;
  isAuthenticated: boolean;
}

// Теперь все функции знают точную структуру
function useAWSCredentials(): AWSCredentials {
  // IDE подскажет доступные свойства
}
```

### Пример 2: Alert тип

**Файл:** `server/src/index.ts`

```typescript
interface Alert {
  id: string;
  type: 'SECURITY' | 'FINOPS';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  resourceId: string;
  timestamp: Date;
  metadata?: {
    affectedCount?: number;
    suggestedAction?: string;
  };
}

// Теперь функция ожидает правильную структуру
function generateAlert(data: Alert): void {
  console.log(`[${data.severity}] ${data.title}`);
}

generateAlert({
  id: "1",
  type: "SECURITY",
  severity: "HIGH",  // ✅ Только эти значения!
  title: "Security Issue",
  description: "...",
  resourceId: "i-12345",
  timestamp: new Date()
});
```

---

# 🎛️ React Context API

## Что это?
**Context API** - встроенный способ React для передачи данных через дерево компонентов без использования props на каждом уровне (избегаем "prop drilling").

## Проблема, которую решает Context API

### Без Context (prop drilling):
```
App (credentials) 
  ↓ props
├─ Header (props)
│   ↓ props
│   └─ User (props) ✗ НЕ нужны на каждом уровне!
└─ Dashboard (props)
    ↓ props
    └─ Chart (нужны credentials)
```

### С Context API:
```
Context.Provider (credentials доступны везде)
├─ App
│   ├─ Header
│   │   └─ User (берет из Context)
│   └─ Dashboard
│       └─ Chart (берет из Context)
```

## Как это работает?

### Шаг 1: Создание Context

```typescript
import { createContext } from 'react';

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  isLocalStack: boolean;
}

interface AWSContextType {
  credentials: AWSCredentials | null;
  setCredentials: (creds: AWSCredentials) => void;
  clearCredentials: () => void;
  isAuthenticated: boolean;
}

// Создаем Context с типом или undefined
const AWSContext = createContext<AWSContextType | undefined>(undefined);

export default AWSContext;
```

### Шаг 2: Создание Provider (компонент-оборачиватель)

```typescript
import React, { useState, ReactNode } from 'react';
import AWSContext, { AWSCredentials, AWSContextType } from './AWSContext';

export const AWSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Состояние credentials
  const [credentials, setCredentialsState] = useState<AWSCredentials | null>(null);

  // Функция для установки credentials
  const setCredentials = (creds: AWSCredentials) => {
    setCredentialsState(creds);
    // Сохраняем в sessionStorage для сохранения при перезагрузке
    sessionStorage.setItem('aws_credentials', JSON.stringify(creds));
  };

  // Функция для очистки credentials
  const clearCredentials = () => {
    setCredentialsState(null);
    sessionStorage.removeItem('aws_credentials');
  };

  // Значение, которое будет доступно всем компонентам
  const value: AWSContextType = {
    credentials,
    setCredentials,
    clearCredentials,
    isAuthenticated: credentials !== null,
  };

  return (
    <AWSContext.Provider value={value}>
      {children}
    </AWSContext.Provider>
  );
};
```

### Шаг 3: Создание Custom Hook для удобного использования

```typescript
import { useContext } from 'react';
import AWSContext, { AWSContextType } from './AWSContext';

export const useAWS = (): AWSContextType => {
  const context = useContext(AWSContext);
  
  // Проверяем, что компонент находится внутри Provider
  if (!context) {
    throw new Error('useAWS must be used within AWSProvider');
  }
  
  return context;
};
```

### Шаг 4: Обворачивание приложения Provider'ом

**Файл:** `client/src/main.tsx`

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AWSProvider } from './context/AWSContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AWSProvider>
      <App />
    </AWSProvider>
  </React.StrictMode>,
)
```

### Шаг 5: Использование в компонентах

```typescript
import { useAWS } from '../context/AWSContext';

export const Dashboard: React.FC = () => {
  const { credentials, isAuthenticated } = useAWS();

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <h1>Dashboard</h1>
          <p>Connected to: {credentials?.region}</p>
        </div>
      ) : (
        <p>Please login first</p>
      )}
    </div>
  );
};
```

## Жизненный цикл Context

```
1. Пользователь заходит на сайт
   ↓
2. AWSProvider выполняет useState - создает пустые credentials
   ↓
3. sessionStorage.getItem() - пытается восстановить сохраненные данные
   ↓
4. Компонент использует AWSContext через useAWS()
   ↓
5. Пользователь логинится → setCredentials() → состояние обновляется
   ↓
6. Все компоненты, использующие useAWS(), перерендериваются с новыми данными
   ↓
7. При выходе → clearCredentials() → состояние очищается
```

---

# 🎣 React Hooks

## Что такое Hooks?
**Hooks** - специальные функции, которые позволяют использовать возможности React (состояние, побочные эффекты и т.д.) в функциональных компонентах.

## useState - Управление состоянием

### Концепция:
Состояние (state) - это данные, которые могут изменяться и влияют на render компонента.

### Синтаксис:
```typescript
const [state, setState] = useState<Type>(initialValue);
```

### Пример 1: Простое булево значение

```typescript
import { useState } from 'react';

export const ToggleButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? 'Close' : 'Open'}
      </button>
      {isOpen && <p>Panel is open!</p>}
    </div>
  );
};
```

**Как это работает:**
```
1. Компонент рендерится, isOpen = false
2. Пользователь кликнет на кнопку
3. onClick вызывает setIsOpen(true)
4. React перерендеривает компонент с новым состоянием
5. isOpen = true, появляется панель
```

### Пример 2: Объект со сложной структурой

```typescript
import { useState } from 'react';

interface DashboardData {
  totalSpend: number;
  totalWaste: number;
  resources: string[];
}

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    totalSpend: 0,
    totalWaste: 0,
    resources: []
  });

  const updateData = (newData: DashboardData) => {
    setData(newData);
  };

  return (
    <div>
      <h1>Total Spend: ${data.totalSpend}</h1>
      <h2>Total Waste: ${data.totalWaste}</h2>
      <p>Resources: {data.resources.length}</p>
    </div>
  );
};
```

### Пример 3: Из нашего проекта (новая разработка)

```typescript
export const NewDashboard: React.FC = () => {
  // Состояние для данных
  const [data, setData] = useState<DashboardData | null>(null);
  
  // Состояние для загрузки
  const [loading, setLoading] = useState<boolean>(false);
  
  // Состояние для ошибок
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/dashboard');
      setData(response.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={loadData}>Load Data</button>
      
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {data && (
        <div>
          <h1>${data.totalSpend}</h1>
        </div>
      )}
    </div>
  );
};
```

## useEffect - Побочные эффекты

### Что такое побочные эффекты?
Это операции, которые должны происходить после рендеринга:
- Загрузка данных с API
- Подписка на события
- Таймеры
- Изменение DOM напрямую

### Синтаксис:
```typescript
useEffect(() => {
  // Код, который выполняется после рендеринга
  
  return () => {
    // Опционально: cleanup функция
  };
}, [dependencies]); // Массив зависимостей
```

### Пример 1: Загрузка данных при монтировании

```typescript
import { useState, useEffect } from 'react';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Эта функция выполнится ОДИН РАЗ когда компонент монтируется
    const fetchData = async () => {
      try {
        const response = await api.get('/dashboard');
        setData(response.data);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Пустой массив = выполнить один раз

  return <div>{loading ? 'Loading...' : <h1>${data.totalSpend}</h1>}</div>;
};
```

### Пример 2: Реагирование на изменение prop

```typescript
interface ProfileProps {
  userId: string;
}

export const Profile: React.FC<ProfileProps> = ({ userId }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Эта функция выполнится когда компонент монтируется
    // И каждый раз когда изменится userId
    const loadProfile = async () => {
      const response = await api.get(`/user/${userId}`);
      setProfile(response.data);
    };

    loadProfile();
  }, [userId]); // userId в зависимостях

  return <div>{profile?.name}</div>;
};
```

### Пример 3: Cleanup функция

```typescript
export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    // Подписываемся на события
    const unsubscribe = notificationService.subscribe((notification) => {
      setNotifications(prev => [...prev, notification]);
    });

    // Cleanup функция - отписываемся при размонтировании
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <ul>
      {notifications.map((n, idx) => <li key={idx}>{n}</li>)}
    </ul>
  );
};
```

### Пример 4: Из нашего проекта

```typescript
export const AWSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [credentials, setCredentialsState] = useState<AWSCredentials | null>(() => {
    // Восстанавливаем credentials из sessionStorage при монтировании
    try {
      const stored = sessionStorage.getItem('aws_credentials');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    // Дополнительная логика при изменении credentials
    if (credentials) {
      console.log('New credentials set:', credentials.region);
    }
  }, [credentials]); // Выполняется когда credentials изменяются

  // ...
};
```

---

# 🖥️ Express.js Backend

## Что такое Express?
**Express** - легкий и гибкий веб-фреймворк для Node.js для создания REST API.

## Основные концепции

### 1. Приложение и маршруты
```typescript
import express from 'express';

const app = express();

// GET маршрут
app.get('/api/dashboard', (req, res) => {
  res.json({ totalSpend: 1000 });
});

// POST маршрут
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  // Обработка логина
  res.json({ token: 'xxx' });
});

// Запуск сервера
app.listen(5000, () => {
  console.log('Server on port 5000');
});
```

### 2. Middleware (обработчики)
**Middleware** - функции, которые выполняются на каждом запросе.

```typescript
// Встроенное middleware для парсинга JSON
app.use(express.json());

// Встроенное middleware для CORS
import cors from 'cors';
app.use(cors());

// Кастомный middleware для логирования
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next(); // Передаем управление следующему middleware/маршруту
});

// Middleware может быть и для конкретного маршрута
app.get('/api/protected', authenticate, (req, res) => {
  res.json({ data: 'secret' });
});
```

### 3. Request и Response

```typescript
app.post('/api/scan', async (req, res) => {
  // req - информация о запросе
  const { accessKeyId, secretAccessKey } = req.body;
  const region = req.query.region;
  const userId = req.params.id;
  
  // res - отправка ответа
  if (!accessKeyId) {
    // Отправить ошибку
    return res.status(400).json({ error: 'Missing credentials' });
  }
  
  try {
    const result = await scanAWS(accessKeyId, secretAccessKey);
    // Отправить успешный результат
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    // Отправить ошибку сервера
    res.status(500).json({ error: 'Server error' });
  }
});
```

## Express в нашем проекте

### Файл: `server/src/index.ts`

```typescript
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ========== Middleware Setup ==========
app.use(cors());
app.use(express.json());

// ========== Types ==========
interface Alert {
  id: string;
  type: 'SECURITY' | 'FINOPS';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  resourceId: string;
  timestamp: Date;
}

// ========== Database Connection ==========
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aws-optimizer')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('DB Error:', err));

// ========== Routes ==========

// GET - получить все alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST - создать новую сканирование
app.post('/api/scan', async (req, res) => {
  const { accessKeyId, secretAccessKey, region } = req.body;

  if (!accessKeyId || !secretAccessKey) {
    return res.status(400).json({ error: 'Missing credentials' });
  }

  try {
    // Используем AWS SDK для сканирования
    const alerts = await performAWSScan(accessKeyId, secretAccessKey, region);
    
    // Сохраняем в БД
    await Alert.insertMany(alerts);
    
    res.json({
      success: true,
      alertsCount: alerts.length,
      alerts: alerts
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ error: 'Scan failed' });
  }
});

// DELETE - удалить alert
app.delete('/api/alerts/:id', async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ========== Error handling middleware ==========
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ========== Start server ==========
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

# ☁️ AWS SDK интеграция

## Что такое AWS SDK?
**AWS SDK** - библиотека для взаимодействия с AWS сервисами из Node.js приложения.

## Установка
```bash
npm install @aws-sdk/client-ec2 @aws-sdk/client-iam
```

## Основные концепции

### 1. Создание клиента

```typescript
import { EC2Client } from '@aws-sdk/client-ec2';

const ec2Client = new EC2Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});
```

### 2. Отправка команды

```typescript
import { DescribeInstancesCommand } from '@aws-sdk/client-ec2';

const command = new DescribeInstancesCommand({
  MaxResults: 10,
  Filters: [
    {
      Name: 'instance-state-name',
      Values: ['running']
    }
  ]
});

const response = await ec2Client.send(command);
console.log(response.Reservations);
```

## AWS SDK в нашем проекте

### Rules Engine - автоматическая проверка безопасности

```typescript
// Функция проверки правил безопасности для EC2
function checkSecurityRules(instance: any): Alert[] {
  const alerts: Alert[] = [];

  // Правило 1: Инстанс должен быть в VPC
  if (!instance.VpcId) {
    alerts.push({
      id: `sec-${instance.InstanceId}`,
      type: 'SECURITY',
      severity: 'HIGH',
      title: 'Instance not in VPC',
      description: 'EC2 instance should be in a VPC for better security',
      resourceId: instance.InstanceId,
      timestamp: new Date(),
    });
  }

  // Правило 2: Проверка публичного доступа
  if (instance.PublicIpAddress) {
    // Проверяем Security Groups
    const hasRestrictiveRules = instance.SecurityGroups?.some(
      (sg: any) => sg.IpPermissions?.every(
        (perm: any) => perm.IpRanges?.every((ip: any) => !ip.CidrIp?.includes('0.0.0.0/0'))
      )
    );

    if (!hasRestrictiveRules) {
      alerts.push({
        id: `sec-${instance.InstanceId}-public`,
        type: 'SECURITY',
        severity: 'CRITICAL',
        title: 'Instance publicly accessible without restrictions',
        description: 'This instance has a public IP and allows traffic from 0.0.0.0/0',
        resourceId: instance.InstanceId,
        timestamp: new Date(),
      });
    }
  }

  // Правило 3: Root volume should be encrypted
  if (instance.BlockDeviceMappings) {
    instance.BlockDeviceMappings.forEach((bdm: any) => {
      if (!bdm.Ebs?.Encrypted) {
        alerts.push({
          id: `sec-${instance.InstanceId}-encrypted`,
          type: 'SECURITY',
          severity: 'MEDIUM',
          title: 'EBS volume not encrypted',
          description: 'Root volume should be encrypted for better security',
          resourceId: instance.InstanceId,
          timestamp: new Date(),
        });
      }
    });
  }

  return alerts;
}

// Используем в API endpoint
app.post('/api/scan', async (req, res) => {
  const { accessKeyId, secretAccessKey, region } = req.body;

  const ec2 = new EC2Client({
    region,
    credentials: { accessKeyId, secretAccessKey }
  });

  try {
    // Получаем все инстансы
    const command = new DescribeInstancesCommand({});
    const response = await ec2.send(command);

    let allAlerts: Alert[] = [];

    // Проверяем каждый инстанс
    response.Reservations?.forEach(reservation => {
      reservation.Instances?.forEach(instance => {
        const alerts = checkSecurityRules(instance);
        allAlerts.push(...alerts);
      });
    });

    // Сохраняем alerts в БД
    if (allAlerts.length > 0) {
      await Alert.insertMany(allAlerts);
    }

    res.json({
      success: true,
      alertsCount: allAlerts.length,
      alerts: allAlerts,
    });
  } catch (error) {
    console.error('AWS Scan Error:', error);
    res.status(500).json({ error: 'Failed to scan AWS' });
  }
});
```

### FinOps Rules - проверка стоимости

```typescript
function checkFinOpsRules(instance: any): Alert[] {
  const alerts: Alert[] = [];

  // Правило 1: Неиспользуемый инстанс (вот по метрикам)
  if (instance.CpuUtilization < 5) {
    alerts.push({
      id: `finops-${instance.InstanceId}`,
      type: 'FINOPS',
      severity: 'MEDIUM',
      title: 'Underutilized instance',
      description: `Instance has very low CPU utilization (${instance.CpuUtilization}%)`,
      resourceId: instance.InstanceId,
      timestamp: new Date(),
    });
  }

  // Правило 2: Старый инстанс
  const ageInDays = (Date.now() - instance.LaunchTime.getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays > 365 && !instance.Tags?.find((t: any) => t.Key === 'NoResize')) {
    alerts.push({
      id: `finops-${instance.InstanceId}-old`,
      type: 'FINOPS',
      severity: 'LOW',
      title: 'Old instance type',
      description: `Consider upgrading instance type (running for ${Math.floor(ageInDays)} days)`,
      resourceId: instance.InstanceId,
      timestamp: new Date(),
    });
  }

  return alerts;
}
```

---

# 🗄️ MongoDB и Mongoose

## Что такое MongoDB?
**MongoDB** - база данных NoSQL, которая хранит данные в виде JSON-подобных документов (BSON).

## Основная идея

```
Традиционный SQL:           MongoDB:
┌──────────────────┐       ┌─────────────────────┐
│ users таблица    │       │ users коллекция     │
├──────────────────┤       ├─────────────────────┤
│ id │  name │ age │       │ {                   │
├────┼───────┼─────┤       │   _id: ObjectId,    │
│ 1  │ John  │ 25  │       │   name: "John",     │
│ 2  │ Jane  │ 30  │       │   age: 25,          │
└────┴───────┴─────┘       │   skills: ["JS"]    │
                           │ }                   │
                           └─────────────────────┘
```

## Mongoose - ODM для MongoDB

**Mongoose** - библиотека для работы с MongoDB в Node.js, добавляет схемы и валидацию.

### Установка
```bash
npm install mongoose
```

## Создание модели

```typescript
import mongoose from 'mongoose';

// Определяем схему (структура документа)
const alertSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['SECURITY', 'FINOPS'],
    required: true,
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'WARNING', 'INFO'],
    required: true,
  },
  title: String,
  description: String,
  resourceId: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  resolved: {
    type: Boolean,
    default: false,
  }
});

// Создаем модель (класс для работы с документами)
const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
```

## Использование модели

### Create (создание)
```typescript
const newAlert = await Alert.create({
  id: 'alert-123',
  type: 'SECURITY',
  severity: 'HIGH',
  title: 'Security Issue',
  description: 'Insecure permissions',
  resourceId: 'i-12345'
});

console.log(newAlert._id); // MongoDB автоматически генерирует ID
```

### Read (чтение)
```typescript
// Получить один документ
const alert = await Alert.findById('alert-123');

// Получить несколько документов
const criticalAlerts = await Alert.find({ severity: 'CRITICAL' });

// С условиями
const recentAlerts = await Alert
  .find({ timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) } })
  .limit(10)
  .sort({ timestamp: -1 });
```

### Update (обновление)
```typescript
const updated = await Alert.findByIdAndUpdate(
  'alert-123',
  { resolved: true },
  { new: true } // Возвращает обновленный документ
);
```

### Delete (удаление)
```typescript
await Alert.findByIdAndDelete('alert-123');

// Удалить несколько
await Alert.deleteMany({ resolved: true });
```

## MongoDB в нашем проекте

### Модель Alert

```typescript
// server/models/Alert.ts
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['SECURITY', 'FINOPS'],
    required: true,
    index: true,
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'WARNING', 'INFO'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  resourceId: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  resolvedAt: Date,
  metadata: mongoose.Schema.Types.Mixed, // Любые доп данные
});

// Создаем индексы для быстрого поиска
alertSchema.index({ resourceId: 1, timestamp: -1 });
alertSchema.index({ resolved: 1, timestamp: -1 });

export const Alert = mongoose.model('Alert', alertSchema);
```

### API endpoints с MongoDB

```typescript
// server/src/index.ts

// GET все alerts с фильтрацией
app.get('/api/alerts', async (req, res) => {
  try {
    const { severity, resolved, limit = 50 } = req.query;
    
    const query: any = {};
    if (severity) query.severity = severity;
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const alerts = await Alert
      .find(query)
      .limit(Number(limit))
      .sort({ timestamp: -1 });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// POST создать alert
app.post('/api/alerts', async (req, res) => {
  try {
    const newAlert = await Alert.create(req.body);
    res.status(201).json(newAlert);
  } catch (error) {
    res.status(400).json({ error: 'Invalid alert data' });
  }
});

// PUT обновить alert
app.put('/api/alerts/:id', async (req, res) => {
  try {
    const updated = await Alert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

// DELETE удалить alert
app.delete('/api/alerts/:id', async (req, res) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// GET статистика
app.get('/api/alerts/stats', async (req, res) => {
  try {
    const stats = await Alert.aggregate([
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});
```

---

# 🎨 Tailwind CSS

## Что такое Tailwind CSS?
**Tailwind CSS** - фреймворк для создания пользовательских интерфейсов с использованием утилити-классов.

## Основная идея

```
❌ Традиционный CSS:
.button {
  padding: 10px 20px;
  border: 1px solid blue;
  border-radius: 4px;
  background-color: blue;
  color: white;
}

✅ Tailwind CSS:
<button class="px-5 py-2 border border-blue-500 rounded bg-blue-500 text-white">
  Click me
</button>
```

## Основные утилиты

### Padding и Margin
```
p-4   = padding: 1rem
px-4  = padding-left и padding-right: 1rem
py-4  = padding-top и padding-bottom: 1rem
m-2   = margin: 0.5rem
mx-auto = margin-left и margin-right: auto
```

### Flexbox и Grid
```
flex                = display: flex
flex-col            = flex-direction: column
items-center        = align-items: center
justify-between     = justify-content: space-between
gap-4               = gap: 1rem

grid                = display: grid
grid-cols-3         = grid-template-columns: repeat(3, 1fr)
lg:grid-cols-4      = на больших экранах 4 колонки
```

### Цвета и текст
```
bg-white            = background-color: white
text-blue-600       = color
text-lg             = font-size: 1.125rem
font-bold           = font-weight: 700
text-center         = text-align: center
```

### Размеры и позиция
```
w-full              = width: 100%
h-12                = height: 3rem
rounded-lg          = border-radius: 0.5rem
shadow-md           = коробочная тень
border-2            = border: 2px
```

### Адаптивность (Responsive)
```
md:flex              = на средних экранах (и выше) flex
lg:grid-cols-4       = на больших экранах grid с 4 колонками
sm:text-sm lg:text-lg = разные размеры шрифта на разных экранах
```

## Tailwind в нашем проекте

### Конфигурация

**Файл:** `client/tailwind.config.js`

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'albert-sans': ['Albert Sans', 'sans-serif'],
      },
      colors: {
        main: "var(--main)",
        "main-collection-cost": "var(--main-collection-cost)",
        // Кастомные цвета для вашего приложения
      },
    },
  },
  plugins: [],
}
```

### Примеры компонентов

#### Stat Card компонент

```typescript
// client/src/components/ui/StatCard.tsx
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: 'blue' | 'red' | 'green';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
    green: 'bg-green-50 text-green-600'
  };

  return (
    // Белая карточка с бордером и тенью
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      {/* Flex контейнер для заголовка и иконки */}
      <div className="flex items-center justify-between">
        <div>
          {/* Серый текст для заголовка */}
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          {/* Большое число */}
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        
        {/* Иконка в цветной коробке */}
        {icon && (
          <div className={`${colorClasses[color]} p-3 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
```

#### Dashboard Grid

```typescript
<div className="p-8">
  <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
  
  {/* Адаптивная сетка */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard title="Total Spend" value="$12,345" color="blue" />
    <StatCard title="Waste" value="$2,345" color="red" />
    <StatCard title="Efficiency" value="82%" color="green" />
    <StatCard title="Alerts" value="12" color="red" />
  </div>

  {/* Две колонки с чартами */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Содержимое чарта 1 */}
    </div>
    <div className="bg-white p-6 rounded-lg shadow-sm">
      {/* Содержимое чарта 2 */}
    </div>
  </div>
</div>
```

#### Таблица со стилями

```typescript
<div className="overflow-x-auto">
  <table className="w-full text-left">
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-6 py-3 font-semibold text-gray-900">Resource</th>
        <th className="px-6 py-3 font-semibold text-gray-900">Status</th>
        <th className="px-6 py-3 font-semibold text-gray-900">Cost</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {resources.map(resource => (
        <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
          <td className="px-6 py-4">{resource.name}</td>
          <td className="px-6 py-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              resource.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {resource.status}
            </span>
          </td>
          <td className="px-6 py-4 font-semibold">${resource.cost}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

# 🔌 API интеграция (Axios)

## Что такое Axios?
**Axios** - библиотека для выполнения HTTP запросов из браузера или Node.js.

## Базовое использование

```typescript
import axios from 'axios';

// GET запрос
const response = await axios.get('/api/dashboard');
console.log(response.data);

// POST запрос
const result = await axios.post('/api/login', {
  username: 'john',
  password: 'secret'
});

// PUT запрос (обновление)
await axios.put('/api/user/123', { name: 'John Updated' });

// DELETE запрос
await axios.delete('/api/alerts/123');
```

## Configurация Axios

### Создание inстанса с конфигурацией

```typescript
// client/src/utils/api.ts
import axios from 'axios';

// Создаем инстанс с базовыми настройками
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 10000, // 10 секунд
  headers: {
    'Content-Type': 'application/json',
  }
});

export default apiClient;
```

### Интерцепторы (обработчики запросов/ответов)

```typescript
import apiClient from './api';

// Интерцептор для обработки успешных ответов
apiClient.interceptors.response.use(
  // При успехе просто возвращаем данные
  (response) => response.data,
  
  // При ошибке
  (error) => {
    // Логируем ошибку
    console.error('API Error:', error.response?.data);
    
    // Можно добавить обработку разных кодов ошибок
    if (error.response?.status === 401) {
      // Перенаправляем на логин если не авторизован
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
```

## API интеграция в нашем проекте

### Service для работы с AWS API

```typescript
// client/src/services/awsService.ts
import apiClient from '../utils/api';
import type { AWSCredentials } from '../context/AWSContext';

interface AlertFilters {
  severity?: string;
  resolved?: boolean;
  limit?: number;
}

export const awsService = {
  // 1. Сканирование AWS ресурсов
  scanResources: async (credentials: AWSCredentials) => {
    try {
      const response = await apiClient.post('/api/scan', {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        region: credentials.region,
      });
      return response;
    } catch (error) {
      console.error('Scan error:', error);
      throw error;
    }
  },

  // 2. Получение alerts с фильтрацией
  getAlerts: async (filters?: AlertFilters) => {
    return apiClient.get('/api/alerts', { params: filters });
  },

  // 3. Получение конкретного alert
  getAlert: async (alertId: string) => {
    return apiClient.get(`/api/alerts/${alertId}`);
  },

  // 4. Обновление alert (например пометить как разрешенный)
  updateAlert: async (alertId: string, updateData: any) => {
    return apiClient.put(`/api/alerts/${alertId}`, updateData);
  },

  // 5. Удаление alert
  deleteAlert: async (alertId: string) => {
    return apiClient.delete(`/api/alerts/${alertId}`);
  },

  // 6. Получение статистики
  getStats: async () => {
    return apiClient.get('/api/alerts/stats');
  },

  // 7. Экспорт в PDF
  exportPDF: async () => {
    return apiClient.get('/api/export/pdf', {
      responseType: 'blob' // Важно для файлов!
    });
  }
};

export default awsService;
```

### Использование в компонентах

```typescript
// client/src/pages/NewDashboard.tsx
import { useState, useEffect } from 'react';
import { useAWS } from '../context/AWSContext';
import awsService from '../services/awsService';

export const NewDashboard: React.FC = () => {
  const { credentials } = useAWS();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузить alerts при монтировании
  useEffect(() => {
    if (credentials) {
      loadAlerts();
    }
  }, [credentials]);

  const loadAlerts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await awsService.getAlerts({ limit: 50 });
      setAlerts(data);
    } catch (err) {
      setError('Failed to load alerts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanAWS = async () => {
    if (!credentials) return;

    setLoading(true);
    try {
      const result = await awsService.scanResources(credentials);
      setAlerts(result.alerts);
    } catch (err) {
      setError('Scan failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await awsService.updateAlert(alertId, { resolved: true });
      // Обновляем локальное состояние
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (err) {
      setError('Failed to resolve alert');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">AWS Optimizer</h1>

      <button 
        onClick={handleScanAWS}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
      >
        {loading ? 'Scanning...' : 'Scan AWS'}
      </button>

      {error && <p className="text-red-600 mt-4">{error}</p>}
      {loading && <p className="text-gray-600 mt-4">Loading...</p>}

      <div className="mt-8 space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">{alert.title}</h3>
                <p className="text-gray-600">{alert.description}</p>
                <span className={`mt-2 inline-block px-3 py-1 rounded text-sm font-medium
                  ${alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {alert.severity}
                </span>
              </div>
              <button 
                onClick={() => handleResolveAlert(alert.id)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

# 🏛️ Архитектурные паттерны

## MVC-подобная архитектура

Наш проект использует разделение ответственности:

```
┌─────────────────────────────────────────────────────┐
│                   View Layer (React)                 │
│  components/, pages/ - отвечает за отображение       │
└─────────────┬──────────────────────────────────────┘
              │ API calls (Axios)
┌─────────────▼──────────────────────────────────────┐
│              Controller Layer (Express)              │
│  route handlers - бизнес логика, валидация          │
└─────────────┬──────────────────────────────────────┘
              │ Database queries
┌─────────────▼──────────────────────────────────────┐
│              Data Layer (MongoDB)                    │
│  Models, Collections - хранение данных              │
└────────────────────────────────────────────────────┘
```

## Service Pattern

Извлечение логики в отдельные сервисы:

```typescript
// client/src/services/awsService.ts
export const awsService = {
  scanResources: async (credentials) => { /* ... */ },
  getAlerts: async (filters) => { /* ... */ },
  exportPDF: async () => { /* ... */ }
};

// Использование в компонентах (чистый код)
const data = await awsService.getAlerts();
```

## Hook Pattern (Custom Hooks)

Переиспользование логики через custom hooks:

```typescript
// client/src/hooks/useAlerts.ts
export const useAlerts = (filters?: AlertFilters) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await awsService.getAlerts(filters);
      setAlerts(data);
    } catch (err) {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return { alerts, loading, error, loadAlerts };
};

// Использование в нескольких компонентах
function Component1() {
  const { alerts } = useAlerts({ severity: 'CRITICAL' });
}

function Component2() {
  const { alerts, loading } = useAlerts();
}
```

## Rules Engine Pattern

Отделение бизнес-правил от логики обработки:

```typescript
// Правила в отдельной функции
const securityRules = [
  (instance) => {
    if (!instance.VpcId) return { severity: 'HIGH', title: 'Not in VPC' };
  },
  (instance) => {
    if (instance.PublicIpAddress && !hasSecurityGroup(instance)) {
      return { severity: 'CRITICAL', title: 'Publicly accessible' };
    }
  },
  // ... больше правил
];

// Применение правил
function checkInstance(instance) {
  const alerts = [];
  securityRules.forEach(rule => {
    const result = rule(instance);
    if (result) alerts.push(result);
  });
  return alerts;
}
```

---

# ✅ Best Practices

## 1. TypeScript - всегда используй типы

```typescript
// ❌ Плохо
const getUser = (id) => {
  return api.get(`/user/${id}`);
};

// ✅ Хорошо
const getUser = (id: string): Promise<User> => {
  return api.get(`/user/${id}`);
};

// ✅ Лучше - явно указываем return type
interface User {
  id: string;
  name: string;
  email: string;
}

const getUser = async (id: string): Promise<User> => {
  const response = await api.get<User>(`/user/${id}`);
  return response;
};
```

## 2. Error Handling

```typescript
// ❌ Плохо
const loadData = async () => {
  const data = await api.get('/data');
  setData(data);
};

// ✅ Хорошо
const loadData = async () => {
  try {
    const data = await api.get('/data');
    setData(data);
  } catch (error) {
    console.error('Failed to load data:', error);
    setError('An error occurred');
  } finally {
    setLoading(false);
  }
};
```

## 3. React Best Practices

### Избегай prop drilling
```typescript
// ❌ Плохо - передаем через много уровней
<Parent>
  <Child1 data={data}>
    <Child2 data={data}>
      <Child3 data={data} />
    </Child2>
  </Child1>
</Parent>

// ✅ Хорошо - используем Context
<Provider>
  <Parent>
    <Child3 /> {/* Берет из Context */}
  </Parent>
</Provider>
```

### Изолируй состояние
```typescript
// ❌ Плохо - все состояние в одном месте
const [user, setUser] = useState(null);
const [posts, setPosts] = useState([]);
const [comments, setComments] = useState([]);
const [notifications, setNotifications] = useState([]);

// ✅ Хорошо - разделяй по логическим частям
const useUser = () => { /* user state */ };
const usePosts = () => { /* posts state */ };
const useComments = () => { /* comments state */ };
const useNotifications = () => { /* notifications state */ };
```

### Используй keys в lists
```typescript
// ❌ Плохо - используется index
{items.map((item, idx) => <Item key={idx} data={item} />)}

// ✅ Хорошо - используется уникальный ID
{items.map(item => <Item key={item.id} data={item} />)}
```

## 4. Security

### Credentials безопасность
```typescript
// ❌ НИКОГДА не делай так
localStorage.setItem('aws_key', credentials.accessKeyId);

// ✅ Используй sessionStorage (исчезает при закрытии браузера)
sessionStorage.setItem('credentials', JSON.stringify(credentials));

// ✅ ЛУЧШЕ - сохраняй на backend
// - Клиент отправляет credentials на backend
// - Backend генерирует токен
// - Клиент сохраняет токен и отправляет его в каждом запросе
```

### SQL Injection prevention
```typescript
// ❌ Плохо - конкатенация строк
db.find(`{"resourceId": "${resourceId}"}`);

// ✅ Хорошо - используй параметры
db.find({ resourceId: resourceId });
```

## 5. Performance

### Используй useMemo для дорогостоящих вычислений
```typescript
import { useMemo } from 'react';

const expensiveCalculation = useMemo(() => {
  return complexAlgorithm(data);
}, [data]); // Перевычисляется только когда data изменяется
```

### Используй useCallback для стабилизации функций
```typescript
const handleClick = useCallback(() => {
  console.log('clicked');
}, []); // Функция создается один раз

<Button onClick={handleClick} /> // Не перерендеривается
```

### Ленивая загрузка (Code Splitting)
```typescript
import { lazy, Suspense } from 'react';

const SecurityPage = lazy(() => import('./pages/SecurityPage'));

<Suspense fallback={<Loading />}>
  <SecurityPage />
</Suspense>
```

## 6. Code Organization

### Правильная структура папок
```
client/
├── src/
│   ├── components/           # Переиспользуемые компоненты
│   │   ├── ui/              # Базовые компоненты (Button, Card и т.д.)
│   │   ├── Layout/          # Layout компоненты
│   │   └── features/        # Компоненты для конкретных фич
│   ├── pages/               # Полные страницы
│   ├── context/             # React Context
│   ├── hooks/               # Custom hooks
│   ├── services/            # API сервисы
│   ├── utils/               # Утилиты (helpers, constants)
│   ├── types/               # TypeScript типы
│   └── App.tsx
```

### Именование файлов
```typescript
// ✅ Компоненты - PascalCase
StatCard.tsx
SecurityPage.tsx

// ✅ Остальное - camelCase или kebab-case
awsService.ts
use-alerts.ts
```

## 7. Testing

```typescript
// Примеры unit тестов
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Test" value="100" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
```

## 8. Comments и Documentation

```typescript
// ❌ Плохие комментарии (очевидные)
// Устанавливаем loading на true
setLoading(true);

// ✅ Хорошие комментарии (объясняют почему)
// Мы перезагружаем данные при изменении фильтра,
// чтобы показать актуальные результаты
useEffect(() => {
  loadAlerts();
}, [filters]);

// ✅ Используй JSDoc для функций
/**
 * Сканирует AWS ресурсы и генерирует alerts
 * @param credentials - AWS credentials для доступа
 * @returns Promise с найденными alerts
 * @throws Error если сканирование не удалось
 */
async function scanAWSResources(credentials: AWSCredentials): Promise<Alert[]> {
  // ...
}
```

---

# 🎓 Заключение

## Что ты теперь знаешь:

1. ✅ **React 19** - компоненты, JSX, Virtual DOM
2. ✅ **TypeScript** - типизация для безопасности кода
3. ✅ **React Hooks** - useState, useEffect, custom hooks
4. ✅ **Context API** - управление глобальным состоянием
5. ✅ **Express.js** - создание REST API
6. ✅ **AWS SDK** - интеграция с облачными сервисами
7. ✅ **MongoDB** - работа с NoSQL базой данных
8. ✅ **Tailwind CSS** - современная стилизация
9. ✅ **Axios** - HTTP запросы
10. ✅ **Архитектурные паттерны** - чистый, масштабируемый код
11. ✅ **Best Practices** - профессиональная разработка

## Следующие шаги:

1. **Углубить знания React** - изучить React Query, SWR для data fetching
2. **Изучить тестирование** - Jest, React Testing Library
3. **Узнать про деплой** - Docker, GitHub Actions, CI/CD
4. **Микросервисы** - разделить backend на несколько сервисов
5. **Масштабирование** - добавить кэширование, очереди сообщений

---

**Создано:** Март 2026
**Актуальность:** Покрывает все технологии и техники, используемые в AWS Optimizer проекте
