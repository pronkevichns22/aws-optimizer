# 🏗️ Архитектура AWS Optimizer

## Обзор системы

AWS Optimizer - это полнофункциональное приложение для сканирования, анализа и оптимизации AWS инфраструктуры с использованием AI.

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INTERFACE                          │
│                    (React 18 + Vite)                         │
│              Dashboard | Security | Resources                │
└───────────────────────────┬─────────────────────────────────┘
                            │
                    HTTP REST API
                       (Port 5000)
                            │
┌───────────────────────────┴─────────────────────────────────┐
│                    API SERVER (Express)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Auth Module          Security Module    Chat Module  │   │
│  │ ├─ JWT              ├─ Rules            ├─ Groq LLM │   │
│  │ ├─ Bcrypt           ├─ Alerts           ├─ Vector   │   │
│  │ └─ Middleware       └─ Scoring          └─ RAG      │   │
│  │                                                      │   │
│  │ AWS Integration      Database           AI Analysis │   │
│  │ ├─ EC2 Scan        ├─ MongoDB          ├─ Embeddings
│  │ ├─ EBS Volumes     ├─ Vector Store     ├─ Recommendations
│  │ ├─ Security Groups │└─ Indexes         └─ Knowledge Base
│  │ └─ Prowler         
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┼────────────────┐
            │               │                │
        MongoDB         LocalStack      Groq API
       (Database)      (AWS Emulation) (LLM)
```

---

## 📂 Структура каталогов

### Frontend (`client/`)

```
client/
├── src/
│   ├── components/
│   │   ├── Layout/              # Основные макеты
│   │   │   ├── Header.tsx       # Шапка приложения
│   │   │   ├── Sidebar.tsx      # Боковая панель
│   │   │   └── ActionSidebar.tsx
│   │   │
│   │   ├── ui/                  # Переиспользуемые UI компоненты
│   │   │   ├── Chart.tsx        # Графики
│   │   │   ├── StatCard.tsx     # Карточки статистики
│   │   │   ├── ResourcesTable.tsx
│   │   │   ├── SecurityAlertsTable.tsx
│   │   │   └── ...(other components)
│   │   │
│   │   ├── AIAdvisor.tsx        # AI рекомендации
│   │   ├── AIAdvisorModal.tsx
│   │   └── ...
│   │
│   ├── pages/                   # Страницы приложения
│   │   ├── LoginPage.tsx        # Аутентификация
│   │   ├── RegisterPage.tsx
│   │   ├── NewDashboard.tsx     # Главный дашборд
│   │   ├── SecurityPage.tsx     # Анализ безопасности
│   │   ├── NewResourcesPage.tsx # Управление ресурсами
│   │   └── SettingsPage.tsx
│   │
│   ├── services/
│   │   └── ai-service.ts        # API сервис для AI
│   │
│   ├── utils/
│   │   └── exportReport.ts      # Генерация отчётов
│   │
│   ├── context/
│   │   └── AWSContext.tsx       # Global state (AWS данные)
│   │
│   ├── App.tsx                  # Главный компонент
│   └── main.tsx                 # Entry point
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

### Backend (`server/`)

```
server/
├── src/
│   ├── auth/
│   │   ├── auth.ts              # Основная логика аутентификации
│   │   ├── auth-routes.ts       # Express маршруты
│   │   ├── auth-middleware.ts   # JWT middleware
│   │   └── auth-utils.ts        # Вспомогательные функции
│   │
│   ├── security/
│   │   ├── security-rules.ts           # Правила проверки безопасности
│   │   ├── security-rules-generators.ts # Генераторы правил
│   │   ├── prowler-integration.ts      # Интеграция с Prowler
│   │   └── models.ts                   # Модели данных
│   │
│   ├── ai/
│   │   ├── ai-advisor.ts               # AI рекомендации
│   │   ├── embeddings.ts               # Vector embeddings
│   │   ├── knowledge-base.ts           # База знаний
│   │   ├── vector-store.ts             # Vector хранилище
│   │   └── chat-routes.ts              # Chat API endpoints
│   │
│   ├── utils/
│   │   ├── finops-calculator.ts        # Расчёты стоимости
│   │   └── create-test-resources.ts    # Генерация тестовых ресурсов
│   │
│   └── index.ts                 # Server entry point & routes
│
├── jest.config.js               # Jest конфигурация
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 🔄 Основные потоки данных

### 1. Сканирование AWS инфраструктуры

```
User clicks "Scan"
       ↓
PUT /api/resources/scan
       ↓
Server connects to AWS (via SDK or LocalStack)
       ↓
Scan EC2, EBS, Security Groups, etc.
       ↓
Apply security rules
       ↓
Store in MongoDB
       ↓
Send response with found resources
       ↓
UI updates with new data
```

### 2. AI Рекомендации

```
User sends message in chat
       ↓
POST /api/chat
       ↓
Generate embeddings (OpenAI)
       ↓
Search in vector store
       ↓
Retrieve relevant knowledge
       ↓
Send to Groq LLM with context
       ↓
LLM generates recommendation
       ↓
Stream response to frontend
       ↓
User sees AI advice
```

### 3. Экспорт отчёта

```
User clicks "Export"
       ↓
Collect resources from state
       ↓
Generate HTML structure
       ↓
Apply styling (print-friendly CSS)
       ↓
Calculate statistics
       ↓
Download as HTML or PDF
```

---

## 🔗 Ключевые интеграции

### AWS SDK Integration
- **Сканирование**: EC2, EBS, Security Groups, Elastic IPs
- **LocalStack**: Эмуляция AWS для локальной разработки
- **Prowler**: Дополнительное сканирование безопасности

### AI Integrations
- **Groq API**: Fast LLM для рекомендаций
- **OpenAI Embeddings**: Vector embeddings для RAG
- **Vector Store**: MongoDB для сохранения embeddings

### Database
- **MongoDB**: Основное хранилище данных
- **Collections**: 
  - `users` - Пользователи и их учётные записи
  - `scans` - История сканирований
  - `resources` - AWS ресурсы
  - `alerts` - Уязвимости и оповещения
  - `embeddings` - Vector embeddings для RAG

---

## 🔐 Безопасность

### Authentication Flow
```
Sign Up/Login
    ↓
Validate credentials
    ↓
Hash password (bcryptjs)
    ↓
Create JWT token
    ↓
Store in localStorage (client)
    ↓
Include in Authorization header
    ↓
Verify on every request
```

### Protected Resources
- ✅ JWT middleware на всех приватных маршрутах
- ✅ Password hashing перед сохранением
- ✅ .env файлы исключены из git
- ✅ CORS configured для безопасности
- ✅ Input validation на всех endpoints

---

## 🧪 Тестирование

### Server Tests
```
Jest framework
├── Unit tests
│   ├── auth-utils.test.ts
│   ├── finops-calculator.test.ts
│   └── ...
├── Integration tests
│   ├── auth-routes.test.ts
│   ├── chat-routes.test.ts
│   └── ...
└── E2E tests (optional)
```

### Client Tests  
```
Jest + React Testing Library
├── Component tests
├── Integration tests
└── Snapshot tests
```

---

## 📊 Модели данных

### User Schema
```typescript
interface User {
  _id: ObjectId;
  email: string;
  password: string; // hashed
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Resource Schema
```typescript
interface Resource {
  _id: ObjectId;
  userId: ObjectId;
  type: 'EC2' | 'EBS' | 'SecurityGroup' | 'ElasticIP';
  resourceId: string;
  tags: Record<string, string>;
  status: 'active' | 'stopped' | 'terminated';
  risks: Risk[];
  createdAt: Date;
  scannedAt: Date;
}
```

### Alert/Vulnerability Schema
```typescript
interface Alert {
  _id: ObjectId;
  userId: ObjectId;
  resourceId: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  title: string;
  description: string;
  rule: string;
  recommendation: string;
  createdAt: Date;
}
```

---

## 🚀 Развертывание

### Development
```bash
docker-compose up -d
cd server && npm run dev &
cd client && npm run dev &
```

### Production (рекомендуемо)
```bash
# Build
cd server && npm run build
cd client && npm run build

# Deploy to:
# - Backend: Vercel, Railway, AWS EC2, Heroku
# - Frontend: Vercel, Netlify, AWS S3 + CloudFront
# - Database: MongoDB Atlas
# - LLM: Groq Cloud API
```

---

## 📈 Производительность

### Оптимизации
- ✅ Lazy loading компонентов (React.lazy)
- ✅ Code splitting (Vite)
- ✅ MongoDB индексы на часто используемых полях
- ✅ Vector embeddings для быстрого поиска
- ✅ Кэширование результатов сканирования
- ✅ Paging для больших результирующих наборов

### Масштабируемость
- ✅ Stateless API (можно горизонтально масштабировать)
- ✅ MongoDB для масштабируемого хранилища
- ✅ Queue система для длительных операций (optional)
- ✅ CDN для статических файлов

---

## 🔮 Возможные расширения

1. **Мониторирование в реальном времени**
   - WebSocket для live updates
   - Cron jobs для периодического сканирования

2. **Автоматизация**
   - Auto-remediation для некоторых проблем
   - Интеграция с GitHub Actions/CI/CD

3. **Запросы на отчётность**
   - Экспорт в PDF/Excel
   - Историческое сравнение результатов

4. **Multi-cloud поддержка**
   - Azure integration
   - Google Cloud support
   - AWS Organizations support

5. **Улучшенная аналитика**
   - Machine Learning для прогнозов
   - Аномалия detection
   - Рекомендации по стоимости

---

## 📞 Контактная информация

Для подробностей о реализации, смотрите:
- 📖 `README.md` - Общая информация
- 🔧 `scripts/README.md` - Генерация тестовых данных
- 📝 `docs/SUBMISSION.md` - Детали сдачи

---

**Last Updated**: 2026  
**Автор**: Пронкевич Н.С.
**Группа:** СДП-КБ-221
**Специальность:** «Компьютерная безопасность»