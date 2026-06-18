# 🚀 AWS Optimizer

Комплексная платформа для сканирования AWS инфраструктуры, оптимизации расходов и проверки соответствия требованиям безопасности с AI-рекомендациями.

**Статус проекта**: Production Ready | **Версия**: 1.0.0

---

## 👨‍💻 Автор
 
**Автор**: Пронкевич Н.С.
**Группа:** СДП-КБ-221
**Специальность:** «Компьютерная безопасность»

---

## 📋 Требования

| Компонент | Версия |
|-----------|--------|
| Node.js | 16+ |
| npm/yarn | последняя |
| Docker | 20.10+ |
| Docker Compose | 2.0+ |
| MongoDB | 5.0+ |
| AWS CLI | v2 (для LocalStack) |

---

## 🏗️ Архитектура проекта

```
aws-optimizer/
├── client/                 # React Vite приложение
│   ├── src/
│   │   ├── components/    # UI компоненты (Dashboard, Forms, etc.)
│   │   ├── pages/         # Страницы (Dashboard, Security, Resources)
│   │   ├── services/      # API сервисы
│   │   └── utils/         # Утилиты (экспорт, форматирование)
│   └── package.json
│
├── server/                # Node.js API сервер
│   ├── src/
│   │   ├── ai-advisor.ts        # AI рекомендации
│   │   ├── auth-*.ts            # Аутентификация
│   │   ├── chat-routes.ts       # Chat API
│   │   ├── embeddings.ts        # Vector embeddings
│   │   ├── knowledge-base.ts    # База знаний
│   │   ├── prowler-integration.ts
│   │   ├── security-rules.ts    # Правила безопасности
│   │   └── vector-store.ts      # Vector хранилище
│   └── package.json
│
├── docker-compose.yml    # Docker оркестрация (MongoDB, LocalStack, Mongo Express)
├── scripts/              # Утилиты (генерация тестовой инфраструктуры)
└── README.md            # Этот файл
```

---

## ⚙️ Docker Сервисы

### LocalStack (AWS Эмулятор)
```yaml
Порт: 4566
Сервисы: EC2, S3, Lambda, IAM, и другие
Эндпоинт: http://localhost:4566
```

### MongoDB (База данных)
```yaml
Порт: 27017
Пользователь: root
Пароль: password
Строка подключения: mongodb://root:password@mongodb:27017/aws_optimizer?authSource=admin
```

### Mongo Express (Админка БД)
```yaml
Порт: 8081
URL: http://localhost:8081
Пользователь: admin
Пароль: admin
```

---

## 🚀 Быстрый старт

### Шаг 1: Клонируйте репозиторий

```bash
git clone https://github.com/pronkevichns22/aws-optimizer.git
cd aws-optimizer
```

### Шаг 2: Запустите Docker сервисы

```bash
# Запустить все сервисы в фоне
docker-compose up -d

# Проверить статус контейнеров
docker-compose ps

# Просмотр логов (опционально)
docker-compose logs -f
```

**✅ Все сервисы готовы!** Проверьте доступность:
- 🟢 MongoDB: `mongodb://localhost:27017`
- 🟢 Mongo Express: http://localhost:8081
- 🟢 LocalStack: http://localhost:4566

### Шаг 3: Установите зависимости Server

```bash
cd server
npm install
```

### Шаг 4: Установите зависимости Client

```bash
cd ../client
npm install
```

### Шаг 5: Создайте файлы переменных окружения

**Для server** (`server/.env`):
```env
# Сервер
PORT=5000
NODE_ENV=development

# БД
MONGODB_URI=mongodb://root:password@localhost:27017/aws_optimizer?authSource=admin

# Безопасность
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRY=7d

# AWS / LocalStack
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# AI
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=sk-... (опционально)

# Опции
LOG_LEVEL=debug
DEBUG=true
```

**Для client** (`client/.env`):
```env
VITE_API_URL=http://localhost:5000
VITE_LOCALSTACK_ENDPOINT=http://localhost:4566
VITE_APP_NAME=AWS Optimizer
VITE_DEBUG=true
```

### Шаг 6: Запустите Server

```bash
cd server
npm run dev
```

**✅ API запущена:** http://localhost:5000

### Шаг 7: Запустите Client (в новом терминале)

```bash
cd client
npm run dev
```

**✅ App запущена:** http://localhost:5173

---

## 📊 Генерация тестовых данных

Для тестирования используйте скрипт генерации инфраструктуры:

```bash
cd scripts
bash generate-massive-infra.sh
```

Это создаст:
- 🖥️ **40+ EC2 инстансов** (различных типов)
- 💾 **240+ EBS томов** (с разными конфигурациями)
- 🌐 **100 Elastic IPs** (неиспользуемых)
- 🔐 **7+ Security Groups** (с уязвимостями)
- 📸 **Snapshots** (для проверки хранилища)

Затем запустите **Rescan** в приложении, чтобы обнаружить все проблемы.

---

## 🔐 API Аутентификация

### Регистрация
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "Your Name"
}
```

### Логин
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

Ответ содержит `token`, используйте его в заголовках:
```bash
Authorization: Bearer <token>
```

---

## 📚 Основные API Эндпоинты

| Метод | Эндпоинт | Описание |
|-------|----------|---------|
| GET | `/api/resources` | Список ресурсов |
| POST | `/api/resources/scan` | Начать сканирование |
| GET | `/api/security/alerts` | Список уязвимостей |
| POST | `/api/chat` | AI чат для рекомендаций |
| GET | `/api/dashboard/metrics` | Метрики дашборда |
| POST | `/api/export/report` | Экспорт отчета |

---

## 🛑 Остановка и Очистка

```bash
# Остановить все сервисы
docker-compose down

# Остановить и удалить тома (ОСТОРОЖНО - удалит данные MongoDB)
docker-compose down -v

# Просмотр логов сервисов
docker-compose logs mongodb
docker-compose logs localstack
```

---

## 🐛 Troubleshooting

### MongoDB не подключается
```bash
# Проверить статус контейнера
docker-compose ps mongodb

# Проверить логи
docker-compose logs mongodb

# Перезагрузить сервис
docker-compose restart mongodb
```

### LocalStack не доступен
```bash
# Проверить инициализацию
docker-compose logs localstack

# Очистить и пересоздать
docker-compose down localstack
docker-compose up -d localstack
```

### Port уже в использовании
```bash
# Найти процесс на порту (Windows)
netstat -ano | findstr :5000

# Найти и убить процесс (Linux/Mac)
lsof -ti:5000 | xargs kill -9
```

---

## 📦 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB + Vector Store для embeddings
- **Infra**: LocalStack (AWS emulation), Docker
- **AI**: Groq LLM, OpenAI Embeddings
- **Testing**: Jest, React Testing Library
- **Deployment**: Docker Compose, готово к K8s

---

## 🤝 Contributing

1. Fork репозиторий
2. Создайте feature ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 📄 Лицензия

MIT License - см. `LICENSE` файл

---

## 🔐 Безопасность

**Никогда не коммитайте:**
- `.env` файлы с паролями и ключами
- AWS ключи доступа
- API ключи и токены

Используйте `.env.example` как шаблон для локальной конфигурации.

---

## 📚 Дополнительная информация

Подробные инструкции для работы со скриптами - см. [scripts/README.md](scripts/README.md).
