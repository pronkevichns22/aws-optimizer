# AWS Optimizer

Comprehensive cloud management platform for AWS infrastructure scanning, cost optimization, and security compliance with AI-powered recommendations.

## 📋 Требования

* Node.js 16+ 
* npm или yarn
* Docker и Docker Compose (опционально, для локальной инфраструктуры)
* MongoDB (локально или в Docker, или Atlas)
* AWS учётные данные (для сканирования)

## 🚀 Как запустить

### 1. Клонируйте репозиторий

```bash
git clone https://github.com/yourusername/aws-optimizer.git
cd aws-optimizer
```

### 2. Установите зависимости для server

```bash
cd server
npm install
```

### 3. Установите зависимости для client

```bash
cd ../client
npm install
```

### 4. Запустите инфраструктуру (Docker) 

**Вариант A: С Docker Compose** (рекомендуется)

```bash
# Запустить все сервисы (MongoDB, Mongo Express, LocalStack)
docker-compose up -d

# Проверить статус
docker-compose ps
```

**Сервисы будут доступны на:**
- **MongoDB**: `mongodb://localhost:27017` (username: `root`, password: `password`)
- **Mongo Express** (веб-интерфейс): http://localhost:8081 (username: `admin`, password: `admin`)
- **LocalStack** (AWS эмулятор): http://localhost:4566

**Вариант B: Локально (без Docker)**

```bash
# Если установлен MongoDB локально
mongod

# Или используйте MongoDB Atlas и обновите MONGODB_URI в .env
```

### 5. Настройте переменные окружения

**Для server** (`server/.env`):
```env
PORT=5000

# Если используете Docker:
MONGODB_URI=mongodb://root:password@localhost:27017/aws_optimizer?authSource=admin

# Если используете локальный MongoDB:
# MONGODB_URI=mongodb://localhost:27017/aws_optimizer

JWT_SECRET=your_secret_key_here
GROQ_API_KEY=your_groq_api_key
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566
```

**Для client** (`client/.env`):
```env
VITE_API_URL=http://localhost:5000
VITE_LOCALSTACK_ENDPOINT=http://localhost:4566
```

### 6. Запустите сервер

```bash
cd server
npm run dev
```

Сервер запустится на `http://localhost:5000`

### 7. В отдельном терминале запустите клиент

```bash
cd client
npm run dev
```

Приложение откроется на `http://localhost:5173`

## 📁 Структура проекта

```
aws-optimizer/
├── client/               # React + TypeScript (Vite)
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── server/              # Express.js + TypeScript
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── docs/                # Документация
├── scripts/             # Служебные скрипты
└── README.md
```

## 🛠 Основные команды

### Docker (инфраструктура)
```bash
# Запустить все сервисы (MongoDB, Mongo Express, LocalStack)
docker-compose up -d

# Остановить сервисы
docker-compose down

# Посмотреть логи
docker-compose logs -f

# Перезапустить
docker-compose restart

# Удалить данные (осторожно!)
docker-compose down -v
```

### Server
```bash
cd server
npm run dev      # Запуск в режиме разработки
npm run build    # Сборка для production
npm run start    # Запуск production версии
npm test         # Запуск тестов
```

### Client
```bash
cd client
npm run dev      # Запуск dev сервера
npm run build    # Сборка для production
npm run preview  # Preview production версии
```

## 🔐 Важно: Безопасность

**Никогда не коммитайте:**
- `.env` файлы с паролями
- Ключи AWS
- API ключи

Используйте `.env.example` как шаблон.

## 📚 Дополнительная информация

Детальная документация находится в папке `docs/`

## ✅ Проверка перед сдачей

- [ ] Docker и Docker Compose установлены (опционально)
- [ ] `docker-compose up -d` запускает все сервисы без ошибок
- [ ] MongoDB доступна на localhost:27017
- [ ] Mongo Express доступен на http://localhost:8081
- [ ] LocalStack доступен на http://localhost:4566
- [ ] `npm install` устанавливает все зависимости
- [ ] Сервер запускается: `cd server && npm run dev`
- [ ] Клиент запускается: `cd client && npm run dev`
- [ ] `.env` файлы в `.gitignore`
- [ ] Нет папок `node_modules/` в git
- [ ] MongoDB подключается корректно

## 📞 Контакты

Вопросы и предложения приветствуются!
