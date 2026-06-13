# 📚 ДИПЛОМНЫЙ ПРОЕКТ: AWS OPTIMIZER
## Детальный План Структуры

---

## 🎯 ИНФОРМАЦИЯ О ПРОЕКТЕ

**Название:** AWS Optimizer - Платформа для оптимизации облачной инфраструктуры AWS

**Цель проекта:** Помочь компаниям снизить облачные расходы, улучшить безопасность и оптимизировать инфраструктуру с использованием AI-рекомендаций

**Основная идея:** Веб-приложение, которое сканирует AWS окружение пользователя, выявляет проблемы безопасности (CSPM), возможности оптимизации затрат (FinOps) и предоставляет AI-советы через интеграцию с Groq LLM

---

# 📖 ГЛАВА 1: ТЕОРИЯ И ОБОСНОВАНИЕ
## (Почему, что и для чего нужен этот проект)

### 1.1 Введение
- **Проблема:** AWS - мощная, но сложная платформа. Компании часто переплачивают за облачные ресурсы (неиспользуемые инстансы, открытые security groups) и имеют уязвимости безопасности
- **Статистика:** 
  - ~30% облачного бюджета тратится впустую на неиспользуемые ресурсы
  - 60% нарушений безопасности происходит через неправильную конфигурацию
  - Компании теряют $14.1 млн в год на киберинциденты

### 1.2 Актуальность
- Быстрый рост облачных вычислений
- Необходимость постоянного мониторинга безопасности
- Растущие требования compliance (SOC2, ISO27001, CIS Benchmarks)
- Нехватка специалистов для ручного анализа

### 1.3 Решение
**AWS Optimizer** предоставляет:
1. **Автоматическое сканирование** инфраструктуры AWS
2. **Выявление проблем:**
   - Проблемы безопасности (Security Groups с открытыми портами, неиспользуемые IAM пользователи)
   - Неоптимизированные затраты (незагруженные EC2, неприсоединенные EBS, Elastic IPs)
3. **AI-рекомендации** на основе Groq LLM
4. **Health Score** - общая оценка безопасности/оптимизации
5. **Интерактивный dashboard** с визуализацией данных

### 1.4 Целевая аудитория
- DevOps инженеры и облачные архитекторы
- Компании с AWS инфраструктурой
- IT-отделы, заботящиеся о безопасности и затратах
- Начинающие AWS пользователи

### 1.5 Основные преимущества
| Преимущество | Описание |
|---|---|
| **Экономия** | Автоматически выявляет неиспользуемые ресурсы и сэкономить 20-40% |
| **Безопасность** | Проверяет 7+ правил безопасности в реальном времени |
| **AI помощник** | Интерактивный чат с Groq LLM для консультаций |
| **Простота** | Web UI - не требует установки CLI инструментов |
| **LocalStack поддержка** | Можно тестировать локально без реального AWS |

### 1.6 Использованные подходы
- **CSPM (Cloud Security Posture Management)** - проверка конфигурации безопасности
- **FinOps (Financial Operations)** - оптимизация облачных затрат
- **CIS Benchmarks** - стандарты безопасности от Center for Internet Security
- **LLM интеграция** - Groq для AI рекомендаций

### 1.7 Технологические требования
- Трехслойная архитектура (Frontend, Backend, Database)
- Аутентификация и авторизация пользователей
- Real-time данные из AWS
- Персистентное хранилище (MongoDB)

---

# 💻 ГЛАВА 2: ТЕХНИЧЕСКИЙ СТЕК И КОД
## (Какие технологии используем и для чего)

### 2.1 Архитектура приложения

```
┌─────────────────────────────────────────┐
│      PRESENTATION LAYER (Frontend)      │
│  React + TypeScript + Tailwind CSS      │
│  (Port 5173 - Vite Development Server)  │
└─────────────┬───────────────────────────┘
              │ HTTP/REST API
┌─────────────▼───────────────────────────┐
│    APPLICATION LAYER (Backend)          │
│  Express.js + TypeScript + Node.js      │
│  (Port 5000)                            │
└─────────────┬───────────────────────────┘
              │ MongoDB Queries
┌─────────────▼───────────────────────────┐
│   DATA PERSISTENCE LAYER (Database)     │
│  MongoDB (Port 27017)                   │
└─────────────────────────────────────────┘
```

### 2.2 Frontend стек (React + TypeScript)

**Технология:** React 19, TypeScript 5+, Tailwind CSS 4, Vite

**Зачем нужны:**
- **React** - компонентный фреймворк для динамического UI
- **TypeScript** - типизация для безопасности кода
- **Tailwind CSS** - утилит-фреймворк для стилизации (Dark Mode)
- **Vite** - быстрый сборщик и dev сервер
- **Axios** - HTTP клиент для API запросов

**Пример кода - API запрос к backend:**

```typescript
// src/services/ai-service.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

export const chatWithAI = async (message: string, token: string) => {
  const response = await axios.post(
    `${API_BASE_URL}/ai-advisor/chat`,
    { message },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};

export const getScanRecommendations = async (token: string) => {
  const response = await axios.get(
    `${API_BASE_URL}/ai-advisor/recommendations`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return response.data;
};
```

**Пример - React компонент для отображения метрик:**

```typescript
// src/components/ui/StatCard.tsx
import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: { direction: 'up' | 'down'; percent: number };
  icon?: React.ReactNode;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  trend,
  icon,
  color = 'blue'
}) => {
  return (
    <div className={`bg-gradient-to-br from-${color}-500 to-${color}-600 p-6 rounded-lg text-white`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
        </div>
        {icon}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="text-xs">{trend.percent}% this month</span>
        </div>
      )}
    </div>
  );
};
```

**Структура компонентов:**

```
src/
├── pages/
│   ├── LoginPage.tsx         - Вход в систему с AWS credentials
│   ├── NewDashboard.tsx      - Главная страница с метриками
│   ├── SecurityPage.tsx      - Список алертов безопасности
│   ├── NewResourcesPage.tsx  - Каталог AWS ресурсов (EC2, EBS, IPs)
│   └── SettingsPage.tsx      - Настройки профиля
│
├── components/
│   ├── Layout/
│   │   ├── Header.tsx        - Верхняя навигация
│   │   └── Sidebar.tsx       - Боковое меню
│   │
│   └── ui/
│       ├── StatCard.tsx      - KPI карточки
│       ├── Chart.tsx         - Графики (Recharts)
│       ├── SecurityAlertsTable.tsx - Таблица алертов
│       ├── ResourcesTable.tsx      - Таблица ресурсов
│       └── HealthScore.tsx         - Gauge для оценки здоровья
│
├── context/
│   └── AWSContext.tsx        - Global state (React Context API)
│
└── services/
    └── ai-service.ts        - API для общения с backend
```

### 2.3 Backend стек (Express.js + Node.js)

**Технология:** Express.js, TypeScript, Node.js, AWS SDK v3, Mongoose, MongoDB

**Зачем нужны:**
- **Express.js** - REST API фреймворк
- **AWS SDK v3** - для подключения к AWS (EC2, EBS, IAM)
- **MongoDB + Mongoose** - база данных и ODM
- **JWT (JSON Web Tokens)** - аутентификация
- **Groq API** - AI рекомендации

**Пример кода - сканирование AWS ресурсов:**

```typescript
// server/src/index.ts
import { 
  EC2Client, 
  DescribeVolumesCommand, 
  DescribeInstancesCommand 
} from '@aws-sdk/client-ec2';

const scanAWSResources = async (accessKeyId: string, secretAccessKey: string) => {
  const ec2Client = new EC2Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  // Получить все EC2 инстансы
  const instancesResponse = await ec2Client.send(
    new DescribeInstancesCommand({})
  );

  // Получить все EBS томы
  const volumesResponse = await ec2Client.send(
    new DescribeVolumesCommand({})
  );

  return {
    instances: instancesResponse.Reservations,
    volumes: volumesResponse.Volumes,
  };
};
```

**Пример кода - правила безопасности (CSPM):**

```typescript
// server/src/security-rules.ts

// Правило 1: Security Group открыт для всех (0.0.0.0/0)
export function checkOpenSecurityGroups(securityGroups: SecurityGroup[]): Alert[] {
  const alerts: Alert[] = [];

  for (const sg of securityGroups) {
    for (const rule of sg.IpPermissions || []) {
      for (const range of rule.IpRanges || []) {
        if (range.CidrIp === '0.0.0.0/0' && rule.FromPort === 22) {
          alerts.push({
            id: uuidv4(),
            type: 'SECURITY',
            severity: 'CRITICAL',
            title: `Security Group ${sg.GroupName} allows SSH from anywhere`,
            description: `SSH (port 22) is open to 0.0.0.0/0. Restrict to specific IPs.`,
            resourceId: sg.GroupId,
            resourceName: sg.GroupName,
            ruleId: 'SG_OPEN_SSH',
            timestamp: new Date(),
          });
        }
      }
    }
  }

  return alerts;
}

// Правило 2: Неиспользуемые Elastic IPs (FinOps)
export function checkUnusedElasticIPs(elasticIPs: Address[]): Alert[] {
  const alerts: Alert[] = [];

  for (const ip of elasticIPs) {
    if (!ip.AssociationId) { // IP не привязан к инстансу
      alerts.push({
        id: uuidv4(),
        type: 'FINOPS',
        severity: 'MEDIUM',
        title: `Unused Elastic IP: ${ip.PublicIp}`,
        description: `This Elastic IP is not associated with any EC2 instance. Cost: $3.60/month`,
        resourceId: ip.AllocationId,
        resourceName: ip.PublicIp,
        ruleId: 'EIP_UNUSED',
        timestamp: new Date(),
        metadata: { monthlyCost: 3.60 },
      });
    }
  }

  return alerts;
}
```

**API Endpoints:**

```typescript
// Аутентификация
POST /api/auth/register        - Регистрация пользователя
POST /api/auth/login           - Вход (с AWS credentials)
POST /api/auth/logout          - Выход

// Сканирование AWS
GET /api/scan/resources        - Получить все ресурсы
GET /api/scan/alerts           - Получить список алертов безопасности
POST /api/scan/run             - Запустить сканирование

// AI Advisor
POST /api/ai-advisor/chat      - Отправить сообщение в AI чат
GET /api/ai-advisor/recommendations - Получить AI рекомендации

// История чата
GET /api/chat/history          - Получить историю чата
DELETE /api/chat/history/:id   - Удалить сообщение
```

**Пример кода - AI advisor (Groq интеграция):**

```typescript
// server/src/ai-advisor.ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function getAIRecommendations(alerts: Alert[]): Promise<string> {
  const alertsSummary = alerts
    .map(a => `- [${a.severity}] ${a.title}: ${a.description}`)
    .join('\n');

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Проанализируй эти AWS алерты и дай рекомендации по приоритизации:\n\n${alertsSummary}`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}

export async function getUserAIResponse(message: string, context: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `AWS Context: ${context}\n\nВопрос пользователя: ${message}`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
```

### 2.4 База данных (MongoDB)

**Зачем нужна:** Хранение пользователей, истории чата, аудита, алертов

**Структура коллекций:**

```typescript
// User - аутентификация и профиль
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  awsAccessKeyId: string (encrypted),
  awsSecretAccessKey: string (encrypted),
  region: string,
  createdAt: Date,
}

// ChatHistory - история переговоров с AI
{
  _id: ObjectId,
  userId: ObjectId,
  messages: [
    {
      role: "user" | "assistant",
      content: string,
      timestamp: Date
    }
  ],
  createdAt: Date,
}

// Audit - логирование операций
{
  _id: ObjectId,
  userId: ObjectId,
  scanId: string,
  alerts: Alert[],
  healthScore: number,
  totalSpend: number,
  totalWasted: number,
  timestamp: Date,
}
```

### 2.5 Интеграции (Third-party APIs)

**AWS SDK v3**
- Подключение к EC2, EBS, IAM
- Получение данных о ресурсах
- Цена: Бесплатно (платишь только за AWS)

**Groq API** 
- AI рекомендации на основе LLM
- Быстрее, чем OpenAI
- Цена: Бесплатно/дешево

**Prowler (опционально)**
- CIS Benchmarks для AWS
- Дополнительные проверки безопасности
- Цена: Open source

---

# 🚀 ГЛАВА 3: ПРАКТИЧЕСКАЯ РЕАЛИЗАЦИЯ
## (Как все работает и как все связывается)

### 3.1 Сценарий использования: Полный цикл сканирования

**Этап 1: Пользователь входит в систему**

```
┌─ Frontend (React) ──────────────────┐
│ Пользователь вводит:               │
│ - AWS Access Key ID                │
│ - AWS Secret Access Key            │
│ - Регион (us-east-1)               │
└─────────────┬──────────────────────┘
              │
              ▼
   POST /api/auth/login
   {
     "email": "user@example.com",
     "password": "password",
     "awsAccessKeyId": "AKIA...",
     "awsSecretAccessKey": "wJal..."
   }
              │
              ▼
┌─ Backend (Express) ────────────────┐
│ 1. Валидация email/password       │
│ 2. Хеширование AWS ключей        │
│ 3. Сохранение в MongoDB           │
│ 4. Генерация JWT токена           │
└─────────────┬──────────────────────┘
              │
              ▼
   Response:
   {
     "token": "eyJhbGc...",
     "user": { "id": "...", "email": "user@example.com" }
   }
              │
              ▼
┌─ Frontend ─────────────────────────┐
│ Сохранение токена в localStorage  │
│ Перенаправление на dashboard      │
└────────────────────────────────────┘
```

**Этап 2: Запуск сканирования AWS**

```
┌─ Frontend ─────────────────────────┐
│ Пользователь клик "Run Scan"       │
└─────────────┬──────────────────────┘
              │
              ▼
   POST /api/scan/run
   Headers: Authorization: Bearer {token}
              │
              ▼
┌─ Backend ──────────────────────────┐
│ 1. Извлечение AWS ключей из БД    │
│ 2. Подключение к AWS (EC2 client) │
│ 3. Выполнение запросов:            │
│    - DescribeInstances (EC2)       │
│    - DescribeVolumes (EBS)         │
│    - DescribeAddresses (IPs)       │
│    - DescribeSecurityGroups (SGs)  │
│ 4. Запуск правил безопасности      │
└─────────────┬──────────────────────┘
              │
              ▼
    checkOpenSecurityGroups()
    checkUnusedElasticIPs()
    checkIdleEC2Instances()
    ... (7+ правил)
              │
              ▼
┌─ Alert Engine ─────────────────────┐
│ Генерирование массива Alert{}      │
│ Расчет Health Score                │
│ Расчет финансовых показателей      │
└─────────────┬──────────────────────┘
              │
              ▼
   Сохранение в MongoDB
   - Коллекция: audit
   - Статус: COMPLETED
              │
              ▼
   Response:
   {
     "scanId": "scan-123",
     "alerts": [
       {
         "id": "...",
         "type": "SECURITY",
         "severity": "CRITICAL",
         "title": "Open SSH port",
         ...
       }
     ],
     "healthScore": 42,
     "totalSpend": "$1,240",
     "totalWasted": "$340"
   }
              │
              ▼
┌─ Frontend ─────────────────────────┐
│ 1. Отображение результатов         │
│ 2. Обновление Dashboard:           │
│    - Security Score gauge          │
│    - Alerts table                  │
│    - Cost trend chart              │
│ 3. Пользователь видит:             │
│    - 3 CRITICAL алерта             │
│    - 5 HIGH алертов                │
│    - Можно сэкономить $340/мес     │
└────────────────────────────────────┘
```

### 3.2 Реальный пример: Как работает одно правило

**Правило: "Найти Security Group с открытым SSH портом"**

**Входные данные от AWS:**

```json
{
  "SecurityGroups": [
    {
      "GroupId": "sg-12345678",
      "GroupName": "web-server-sg",
      "IpPermissions": [
        {
          "IpProtocol": "tcp",
          "FromPort": 22,
          "ToPort": 22,
          "IpRanges": [
            {"CidrIp": "0.0.0.0/0"}  // ⚠️ Открыто для всех!
          ]
        },
        {
          "IpProtocol": "tcp",
          "FromPort": 80,
          "ToPort": 80,
          "IpRanges": [
            {"CidrIp": "0.0.0.0/0"}  // Окей для HTTP
          ]
        }
      ]
    }
  ]
}
```

**Обработка в backend:**

```typescript
// Step 1: Итерация по Security Groups
for (const sg of securityGroups) {
  // Step 2: Итерация по правилам входа
  for (const rule of sg.IpPermissions) {
    // Step 3: Проверка - это SSH порт?
    if (rule.FromPort === 22) {
      // Step 4: Проверка - открыт для всех?
      for (const range of rule.IpRanges) {
        if (range.CidrIp === '0.0.0.0/0') {
          // Step 5: Генерирование алерта
          const alert = {
            id: "alert-987",
            type: "SECURITY",
            severity: "CRITICAL",  // Высокий приоритет!
            title: "SSH exposed to the internet",
            description: "Security group 'web-server-sg' allows SSH (port 22) from 0.0.0.0/0",
            resourceId: "sg-12345678",
            resourceName: "web-server-sg",
            ruleId: "SG_OPEN_SSH",
            timestamp: "2026-05-13T10:30:00Z",
            metadata: {
              port: 22,
              protocol: "tcp",
              cidr: "0.0.0.0/0",
              recommendation: "Restrict SSH access to specific IP addresses"
            }
          };
          alerts.push(alert);
        }
      }
    }
  }
}
```

**Результат в Frontend:**

```
┌─────────────────────────────────────┐
│ 🔴 CRITICAL - SSH exposed           │
├─────────────────────────────────────┤
│ Resource: web-server-sg (sg-12345)  │
│ Issue: Port 22 is open to 0.0.0.0/0 │
│                                     │
│ Recommendation:                     │
│ Restrict SSH access to specific     │
│ IPs (e.g., your office VPN)        │
│                                     │
│ Severity: CRITICAL                  │
│ Type: SECURITY                      │
│ [View] [Dismiss] [Fix]              │
└─────────────────────────────────────┘
```

### 3.3 Пример интеграции с AI Advisor

**Сценарий: Пользователь спрашивает совет у AI**

```
User Input:
"Какие из этих алертов самые критичные и как их исправить?"

↓

Frontend отправляет:
POST /api/ai-advisor/chat
{
  "message": "Какие из этих алертов самые критичные и как их исправить?"
}

↓

Backend:
1. Получить последний scan для пользователя
2. Собрать контекст:
   - Список всех алертов
   - Health Score
   - Финансовые потери
3. Отправить Groq API:
```

```typescript
const context = `
Last AWS Scan Results:
- Total Alerts: 12 (3 CRITICAL, 5 HIGH, 4 MEDIUM)
- Health Score: 42/100
- Estimated Monthly Waste: $340

Critical Alerts:
1. SSH exposed to internet (port 22 on sg-12345)
2. RDS database publicly accessible
3. S3 bucket with public read access
`;

const userMessage = "Какие из этих алертов самые критичные и как их исправить?";

// Запрос к Groq (Claude)
const response = await client.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [
    {
      role: 'user',
      content: `${context}\n\n${userMessage}`
    }
  ]
});
```

**AI Response:**

```
Ваши 3 CRITICAL алерта требуют немедленного внимания:

1. **SSH exposed to internet** (КРИТИЧНО)
   Порт 22 открыт для всех (0.0.0.0/0) - это главный вектор атак
   Решение: Ограничить SSH доступ только до вашего офиса/VPN
   
2. **RDS публично доступна** (КРИТИЧНО)
   База данных видна из интернета - риск взлома
   Решение: Переместить в VPC, использовать Security Groups
   
3. **S3 с публичным доступом** (КРИТИЧНО)
   Возможна утечка конфиденциальных данных
   Решение: Сделать приватным, использовать IAM policies

Начните с #1 - это займет 10 минут и значительно повысит безопасность.
Потом займитесь #2 и #3 - они блокируют доступ к БД и хранилищу.

Экономия: Исправление этих проблем не сэкономит деньги, но защитит от взлома.
```

↓

Frontend отображает в чате

### 3.4 Data Flow диаграмма

```
┌─────────────────────────────────────────────────────────────────┐
│ USER INTERACTION FLOW                                           │
└─────────────────────────────────────────────────────────────────┘

1. AUTHENTICATION
   User (Email/Password) → Login Form → Backend → JWT Token

2. AWS CREDENTIAL SETUP
   AWS Keys → Settings Form → Backend → MongoDB (encrypted)

3. SCAN EXECUTION
   [Run Scan Button] → AWS SDK → Fetch Resources → Run Rules → Alert Engine

4. DATA VISUALIZATION
   Alerts → React Components → Charts, Tables, Gauges

5. AI CONSULTATION
   User Question → AI Chat → Groq LLM → Recommendation → Display

6. AUDIT TRAIL
   Every Action → MongoDB (audit collection) → For compliance/history
```

### 3.5 Health Score: Как вычисляется

```typescript
function calculateHealthScore(alerts: Alert[]): number {
  let score = 100;

  for (const alert of alerts) {
    const deduction = {
      'CRITICAL': 15,
      'HIGH': 10,
      'MEDIUM': 5,
      'WARNING': 2,
      'INFO': 1
    }[alert.severity] || 0;

    score -= deduction;
  }

  return Math.max(score, 0);  // Минимум 0
}

// Пример:
// 100 - 15 (CRITICAL) - 10 (HIGH) - 5 (MEDIUM) = 70/100
// Индикатор: 🟡 MEDIUM (нужно улучшение)
```

### 3.6 Интеграция с LocalStack (для тестирования)

**LocalStack** - эмулирует AWS локально на компьютере

```yaml
# docker-compose.yml
services:
  localstack:
    image: localstack/localstack
    ports:
      - "4566:4566"
    environment:
      - SERVICES=ec2,iam,s3
      - DEBUG=1
      - DOCKER_HOST=unix:///var/run/docker.sock

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"

  app:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      - AWS_ENDPOINT_URL=http://localstack:4566
```

**Преимущества:**
- Можно тестировать без реальных AWS ключей
- Быстрое включение/выключение
- Безопасно для разработки

---

## 📊 ИТОГОВАЯ СТРУКТУРА ДИПЛОМНОЙ РАБОТЫ

```
ДИПЛОМНАЯ РАБОТА
│
├─ ВВЕДЕНИЕ (1-2 стр)
│  └─ Актуальность, цель, задачи
│
├─ ГЛАВА 1: ТЕОРИЯ (10-15 стр)
│  ├─ 1.1 Проблема (неконтролируемые расходы AWS)
│  ├─ 1.2 Актуальность и статистика
│  ├─ 1.3 Обзор существующих решений
│  ├─ 1.4 AWS Optimizer - наше решение
│  ├─ 1.5 Архитектурные принципы
│  └─ 1.6 CSPM и FinOps подходы
│
├─ ГЛАВА 2: ТЕХНИЧЕСКИЙ СТЕК (15-20 стр)
│  ├─ 2.1 Frontend архитектура (React, TypeScript)
│  ├─ 2.2 Backend архитектура (Express, AWS SDK)
│  ├─ 2.3 База данных (MongoDB)
│  ├─ 2.4 Примеры кода (с пояснениями)
│  ├─ 2.5 API endpoints (полный список)
│  └─ 2.6 Интеграции (AWS SDK, Groq, Prowler)
│
├─ ГЛАВА 3: ПРАКТИКА (20-25 стр)
│  ├─ 3.1 Полный цикл использования (диаграммы)
│  ├─ 3.2 Deep dive в одно правило безопасности
│  ├─ 3.3 AI advisor - как работает
│  ├─ 3.4 Реальные сценарии использования
│  ├─ 3.5 Тестирование с LocalStack
│  ├─ 3.6 Performance metrics
│  └─ 3.7 Результаты и выводы
│
├─ ЗАКЛЮЧЕНИЕ (2-3 стр)
│  └─ Достижения, будущие улучшения
│
└─ ПРИЛОЖЕНИЯ
   ├─ Полные исходные коды ключевых модулей
   ├─ Диаграммы архитектуры
   ├─ Screenshots интерфейса
   └─ API документация
```

---

## 🎓 РЕКОМЕНДАЦИИ ДЛЯ НАПИСАНИЯ

### Для Главы 1 (Теория)
- Используйте реальную статистику утечек AWS (ищите в статьях)
- Объясните, почему CSPM и FinOps важны
- Сравните с конкурентами (CloudTrail, SecurityHub, etc.)

### Для Главы 2 (Технология)
- Приводите реальные примеры кода из вашего проекта
- Объясняйте ПОЧЕМУ вы выбрали каждую технологию
- Добавляйте диаграммы архитектуры

### Для Главы 3 (Практика)
- Используйте скриншоты UI
- Показывайте flow диаграммы
- Приводите реальные примеры алертов
- Демонстрируйте работу AI advisor

---

**Примерный объем:** 50-70 страниц А4 (12pt, 1.5 интервал)
**Время написания:** 2-3 недели работая параллельно

Good luck! 🚀
