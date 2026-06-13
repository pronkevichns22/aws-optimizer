# 🔌 AWS & LocalStack Connection Guide

**Подробное описание того, как AWS Optimizer подключается к AWS или LocalStack**

---

## 📋 Оглавление

1. [Общая архитектура подключения](#общая-архитектура-подключения)
2. [AWS Credentials (Учётные данные)](#aws-credentials-учётные-данные)
3. [Процесс введения credentials на frontend](#процесс-введения-credentials-на-frontend)
4. [Процесс сохранения и шифрования на backend](#процесс-сохранения-и-шифрования-на-backend)
5. [Процесс подключения при сканировании](#процесс-подключения-при-сканировании)
6. [LocalStack (Локальное тестирование)](#localstack-локальное-тестирование)
7. [AWS SDK v3 конфигурация](#aws-sdk-v3-конфигурация)
8. [Примеры подключений](#примеры-подключений)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ Общая архитектура подключения

```
┌─────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                                │
│               client/src/pages/SettingsPage.tsx                    │
│                                                                     │
│  Пользователь вводит credentials в форму:                         │
│  ├─ Access Key ID                                                  │
│  ├─ Secret Access Key                                              │
│  ├─ Region (us-east-1, eu-west-1, etc)                           │
│  └─ LocalStack toggle (if testing locally)                         │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          │ POST /api/scan
                          │ {accessKeyId, secretAccessKey, region, isLocalStack}
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js)                             │
│               server/src/index.ts - /api/scan endpoint             │
│                                                                     │
│  1. Получает credentials из request.body                           │
│  2. Создает EC2Client с credentials                               │
│  3. Если LocalStack: использует endpoint localhost:4566           │
│  4. Если AWS: использует default AWS endpoint                     │
│  5. Запускает AWS API запросы                                     │
│  6. Обрабатывает результаты                                       │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                ┌─────────┴─────────┐
                │                   │
                ↓                   ↓
         ┌──────────────┐     ┌──────────────────┐
         │     AWS      │     │    LocalStack    │
         │   APIs       │     │  (localhost)     │
         │  (us-east-1) │     │  (port 4566)     │
         └──────────────┘     └──────────────────┘
                │                   │
                └─────────┬─────────┘
                          │
                          ↓
         ┌─────────────────────────────────────┐
         │  Response с инфраструктурой:        │
         │  - EC2 instances                    │
         │  - EBS volumes                      │
         │  - Security Groups                  │
         │  - IAM users                        │
         │  - Elastic IPs                      │
         └─────────────────────────────────────┘
```

---

## 🔐 AWS Credentials (Учётные данные)

### Что такое AWS Credentials?

AWS Credentials - это **учётные данные для доступа к AWS API**. Состоят из двух частей:

| Название | Значение | Пример | Где найти |
|---|---|---|---|
| **Access Key ID** | Публичный ID (не секретный!) | `AKIAIOSFODNN7EXAMPLE` | AWS Console → My Security Credentials |
| **Secret Access Key** | Приватный ключ (СЕКРЕТНЫЙ!) | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | AWS Console → показывается ОД РАЗ при создании! |

**⚠️ ВАЖНО:** Никогда не коммитьте эти ключи в Git! Они дают полный доступ к вашему AWS аккаунту.

### Где взять AWS Credentials

#### Способ 1: AWS Console (Рекомендуется)

```
1. Перейти в AWS Console: https://console.aws.amazon.com
2. Нажать на профиль (верхний правый угол)
3. Выбрать "Security Credentials"
4. Нажать "Access Keys (access key ID and secret access key)"
5. Нажать "Create New Access Key"
6. Скопировать Access Key ID и Secret Access Key
7. Сохранить в безопасном месте!
```

#### Способ 2: Via AWS CLI

```bash
# Если уже установлен AWS CLI и сконфигурирован
aws iam create-access-key --user-name YOUR_USERNAME

# Получите ответ:
# {
#   "AccessKey": {
#     "AccessKeyId": "AKIAIOSFODNN7EXAMPLE",
#     "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
#   }
# }
```

#### Способ 3: AWS IAM (Создать отдельного пользователя)

```bash
# Создать нового IAM пользователя с ограниченными правами
aws iam create-user --user-name aws-optimizer

# Добавить policy для EC2, EBS, IAM чтения
aws iam attach-user-policy \
  --user-name aws-optimizer \
  --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess

# Создать access keys для этого пользователя
aws iam create-access-key --user-name aws-optimizer
```

### Типы доступа в AWS

```
ПОЛНЫЙ ДОСТУП (обычно не рекомендуется):
- Policy: AdministratorAccess
- Может: создавать, удалять, изменять что угодно
- Риск: если ключи скомпрометированы → полный доступ

ТОЛЬКО ДЛЯ ЧТЕНИЯ (рекомендуется для сканирования):
- Policy: ReadOnlyAccess
- Может: смотреть все ресурсы
- Не может: ничего менять
- Риск: очень низкий
- Идеально для: AWS Optimizer (сканирование без изменений)

МИНИМАЛЬНЫЙ ДОСТУП:
- Нужны права только на: EC2, EBS, IAM, S3, CloudTrail
- Ограничиваем на конкретные действия (DescribeInstances, ListBuckets, etc)
- Идеально для: Production окружения
```

---

## 💻 Процесс введения credentials на frontend

### Step 1: Пользователь открывает Settings Page

```typescript
// client/src/pages/SettingsPage.tsx

const SettingsPage = ({ onPageChange, onAIModalStateChange }: SettingsPageProps) => {
  const { credentials, setCredentials } = useAWS();
  
  // Инициализируем state с уже сохранёнными credentials (если есть)
  const [accessKey, setAccessKey] = useState<string>(credentials?.accessKeyId || '');
  const [secretKey, setSecretKey] = useState<string>(credentials?.secretAccessKey || '');
  const [region, setRegion] = useState<string>(credentials?.region || 'us-east-1');
  const [useLocalStack, setUseLocalStack] = useState<boolean>(credentials?.isLocalStack || false);
  const [localStackEndpoint, setLocalStackEndpoint] = useState<string>(
    localStorage.getItem('localstack_endpoint') || 'http://localhost:4566'
  );
```

### Step 2: Пользователь заполняет форму

```html
<!-- SettingsPage UI -->

<!-- AWS Mode / LocalStack Mode Toggle -->
<label>Environment</label>
<input 
  type="radio" 
  name="environment" 
  value="aws" 
  checked={!useLocalStack}
  onChange={() => setUseLocalStack(false)}
/> AWS Production
<input 
  type="radio" 
  name="environment" 
  value="localstack" 
  checked={useLocalStack}
  onChange={() => setUseLocalStack(true)}
/> LocalStack (Local Testing)

<!-- AWS Mode - Credentials Input -->
{!useLocalStack && (
  <>
    <input 
      type="text" 
      placeholder="AWS Access Key ID"
      value={accessKey}
      onChange={(e) => setAccessKey(e.target.value)}
    />
    <input 
      type="password" 
      placeholder="AWS Secret Access Key"
      value={secretKey}
      onChange={(e) => setSecretKey(e.target.value)}
    />
    <select value={region} onChange={(e) => setRegion(e.target.value)}>
      <option value="us-east-1">us-east-1 (N. Virginia)</option>
      <option value="us-west-2">us-west-2 (Oregon)</option>
      <option value="eu-west-1">eu-west-1 (Ireland)</option>
      <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
    </select>
  </>
)}

<!-- LocalStack Mode - Endpoint Input -->
{useLocalStack && (
  <input 
    type="text" 
    placeholder="LocalStack Endpoint"
    value={localStackEndpoint}
    onChange={(e) => setLocalStackEndpoint(e.target.value)}
  />
)}

<button onClick={handleTestConnection}>Test Connection</button>
<button onClick={handleSaveCredentials}>Save Credentials</button>
```

### Step 3: Пользователь нажимает "Test Connection"

```typescript
// SettingsPage.tsx - handleTestConnection()

const handleTestConnection = async () => {
  try {
    console.log('🔍 Testing connection...');
    
    // Отправляем credentials на backend для тестирования
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
        region: region,
        isLocalStack: useLocalStack,
        endpoint: useLocalStack ? localStackEndpoint : undefined,
        // Добавляем флаг чтобы только провверить, не сохранять
        testOnly: true
      })
    });

    if (!response.ok) {
      throw new Error('Credentials are invalid');
    }

    showNotification('success', '✅ Connection successful!');
  } catch (error: any) {
    showNotification('error', `❌ Connection failed: ${error.message}`);
  }
};
```

### Step 4: Пользователь нажимает "Save Credentials"

```typescript
// SettingsPage.tsx - handleSaveCredentials()

const handleSaveCredentials = async () => {
  // Валидация
  if (!useLocalStack && (!accessKey.trim() || !secretKey.trim())) {
    showNotification('error', 'Access Key and Secret Key are required');
    return;
  }

  // Подготавливаем credentials
  const finalAccessKey = useLocalStack ? 'test' : accessKey;
  const finalSecretKey = useLocalStack ? 'test' : secretKey;

  // Обновляем context (локальное состояние)
  setCredentials({
    accessKeyId: finalAccessKey,
    secretAccessKey: finalSecretKey,
    region: region || 'us-east-1',
    isLocalStack: useLocalStack,
  });

  // Сохраняем в localStorage для persistence
  localStorage.setItem('aws_access_key', finalAccessKey);
  localStorage.setItem('aws_secret_key', finalSecretKey);
  localStorage.setItem('aws_region', region || 'us-east-1');
  localStorage.setItem('localstack_endpoint', localStackEndpoint);

  showNotification('success', '✅ Credentials saved locally!');
};
```

---

## 🔒 Процесс сохранения и шифрования на backend

### Маршрут: POST /api/auth/credentials (if user authenticated)

```typescript
// server/src/index.ts

app.post('/api/auth/credentials', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { accessKeyId, secretAccessKey, region, isLocalStack } = req.body;

    console.log('💾 Saving encrypted AWS credentials for user:', userId);

    // Шаг 1: Валидация
    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({ 
        error: 'Missing AWS credentials',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Шаг 2: Шифрование credentials
    const { encrypted, iv } = encryptCredentials(accessKeyId, secretAccessKey);
    
    console.log('🔐 Credentials encrypted with AES-256-CBC');
    console.log('   IV:', iv);

    // Шаг 3: Сохранение в MongoDB
    await User.updateOne(
      { _id: userId },
      {
        awsAccessKeyIdEncrypted: encrypted,
        awsSecretAccessKeyEncrypted: encrypted, // Both encrypted with same IV
        awsEncryptionIV: iv,
        awsRegion: region || 'us-east-1',
        isLocalStack: !!isLocalStack,
        lastCredentialsUpdate: new Date()
      }
    );

    // Шаг 4: Тест подключения (опционально)
    const testEC2 = new EC2Client({
      region: region || 'us-east-1',
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    // Проверяем валидность с простым запросом
    await testEC2.send(new DescribeInstancesCommand({}));

    res.json({ 
      success: true, 
      message: 'AWS credentials saved and validated successfully',
      data: {
        region: region || 'us-east-1',
        isLocalStack: !!isLocalStack,
        credentialsId: encrypted.substring(0, 20) + '...' // Не отправляем полный ключ
      }
    });
  } catch (error: any) {
    console.error('❌ Error saving credentials:', error.message);
    res.status(500).json({ 
      error: error.message,
      code: 'CREDENTIAL_SAVE_ERROR'
    });
  }
});
```

### Процесс шифрования (auth-utils.ts)

```typescript
// server/src/auth-utils.ts

export function encryptCredentials(accessKey: string, secretKey: string): { encrypted: string; iv: string } {
  try {
    // ============ ШАГИ ШИФРОВАНИЯ ============
    
    // Шаг 1: Создаём 32-байтовый ключ из строки
    // AES-256 требует ключ размером ровно 32 байта (256 бит)
    const key = crypto.createHash('sha256')
      .update(ENCRYPTION_KEY)  // Берёт из .env: ENCRYPTION_KEY=...
      .digest();               // Преобразует в хекс
    
    // Шаг 2: Генерируем случайный IV (Initialization Vector)
    // IV нужен для нарушения паттернов в зашифрованном тексте
    // Разные IV = разный результат даже для одного текста
    const iv = crypto.randomBytes(16);  // 16 байт = 128 бит для AES
    
    // Шаг 3: Создаём cipher объект
    // Алгоритм: AES-256-CBC (Cipher Block Chaining)
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    // Шаг 4: Комбинируем credentials в JSON
    const credentials = JSON.stringify({ accessKey, secretKey });
    
    // Шаг 5: Шифруем
    let encrypted = cipher.update(credentials, 'utf-8', 'hex');  // Input: UTF-8, Output: HEX
    encrypted += cipher.final('hex');
    
    // Шаг 6: Возвращаем зашифрованные данные и IV
    return {
      encrypted,  // Зашифрованная строка (hex)
      iv: iv.toString('hex'),  // IV в hex формате
    };
  } catch (error) {
    console.error('❌ Encryption error:', error);
    throw new Error('Failed to encrypt credentials');
  }
}
```

### Схема MongoDB для хранения

```javascript
// server/src/models.ts - UserSchema

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, required: true },
  passwordHash: String,  // Bcrypt hash (неразшифруемое)
  
  // AWS Credentials (ЗАШИФРОВАННЫЕ!)
  awsAccessKeyIdEncrypted: String,      // Зашифрованный ключ
  awsSecretAccessKeyEncrypted: String,  // Зашифрованный секрет
  awsEncryptionIV: String,              // IV для дешифровки
  awsRegion: { type: String, default: 'us-east-1' },
  isLocalStack: Boolean,
  lastCredentialsUpdate: Date,
});

// Пример документа в MongoDB:
// {
//   "_id": ObjectId("6674a1c2f8b2c3d4e5f6g7h8"),
//   "email": "admin@company.com",
//   "passwordHash": "$2b$10$xKXn8vG...n1v3xKz5n",
//   "awsAccessKeyIdEncrypted": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
//   "awsSecretAccessKeyEncrypted": "q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6",
//   "awsEncryptionIV": "f1e2d3c4b5a69081d2c3b4a5f6e7d8c9",
//   "awsRegion": "us-east-1",
//   "isLocalStack": false,
//   "lastCredentialsUpdate": ISODate("2024-05-14T14:30:00Z")
// }
```

**⚠️ ВАЖНО:** Даже если кто-то получит доступ к MongoDB, credentials остаются зашифрованными и бесполезны без ENCRYPTION_KEY!

---

## 📡 Процесс подключения при сканировании

### Шаг 1: Пользователь нажимает "Rescan"

```typescript
// NewDashboard.tsx

const handleRescan = async () => {
  console.log('🔍 Starting AWS scan...');
  setScanning(true);

  try {
    // Отправляем сохранённые credentials на backend
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // JWT token
      },
      body: JSON.stringify({
        accessKeyId: credentials?.accessKeyId,
        secretAccessKey: credentials?.secretAccessKey,
        region: credentials?.region || 'us-east-1',
        isLocalStack: credentials?.isLocalStack || false,
        endpoint: credentials?.isLocalStack ? 'http://localhost:4566' : undefined
      })
    });

    const data = await response.json();
    setScanResults(data);
  } catch (error) {
    console.error('❌ Scan error:', error);
  } finally {
    setScanning(false);
  }
};
```

### Шаг 2: Backend получает credentials и создаёт AWS SDK Client

```typescript
// server/src/index.ts - POST /api/scan

app.post('/api/scan', optionalAuthMiddleware, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;

    console.log('🔐 Creating EC2 client with credentials');

    // ============ СОЗДАНИЕ EC2 CLIENT ============
    
    const ec2Config = {
      region: region || 'us-east-1',
      credentials: {
        accessKeyId,        // AKIAIOSFODNN7EXAMPLE
        secretAccessKey     // wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
      }
    };

    // Если LocalStack: используем локальный endpoint
    if (isLocalStack) {
      ec2Config.endpoint = endpoint || 'http://localhost:4566';
      console.log(`🔧 Using LocalStack endpoint: ${ec2Config.endpoint}`);
    } else {
      console.log(`☁️  Using AWS endpoint: https://ec2.${region}.amazonaws.com`);
    }

    // Создаём AWS SDK v3 EC2 Client
    const ec2Client = new EC2Client(ec2Config);
```

### Шаг 3: AWS SDK использует credentials для подписания запросов

```typescript
// AWS SDK v3 - Signature Process

// Когда мы запускаем:
const response = await ec2Client.send(new DescribeInstancesCommand({}));

// AWS SDK v3 делает это:
// 1. Берёт accessKeyId и secretAccessKey
// 2. Создаёт подпись запроса (AWS Signature Version 4)
// 3. Добавляет заголовки аутентификации
// 4. Отправляет запрос к AWS (или LocalStack)
//
// Пример подписанного запроса:
// POST /ec2.amazonaws.com/
// Authorization: AWS4-HMAC-SHA256 
//   Credential=AKIAIOSFODNN7EXAMPLE/20240514/us-east-1/ec2/aws4_request,
//   SignedHeaders=host;x-amz-date,
//   Signature=abcdef123456789...
```

### Шаг 4: AWS проверяет подпись и возвращает результат

```typescript
// Успешный ответ от AWS:

{
  Reservations: [
    {
      Instances: [
        {
          InstanceId: 'i-0f1a2b3c4d5e6f7g8h',
          InstanceType: 't3.medium',
          State: { Name: 'running' },
          PublicIpAddress: '52.123.45.67',
          SecurityGroups: [{ GroupId: 'sg-12345abc' }],
          // ... и ещё данные
        },
        // ... и ещё инстансы
      ]
    }
  ]
}
```

### Шаг 5: Backend применяет Rules Engine и возвращает результат

```typescript
// Результат сканирования отправляется на frontend:

{
  success: true,
  data: {
    scanId: 'scan-20240514-143000',
    executionTimeMs: 15234,
    metrics: {
      totalResources: 52,
      totalSpend: 5200,
      healthScore: 78,
      alertsCount: 18
    },
    alerts: [
      {
        id: 'alert-1234',
        severity: 'CRITICAL',
        title: 'SSH 0.0.0.0/0',
        resourceId: 'sg-12345abc'
      },
      // ... больше alerts
    ],
    resources: {
      ec2: [...],
      ebs: [...],
      eip: [...]
    }
  }
}
```

---

## 🐳 LocalStack (Локальное тестирование)

### Что такое LocalStack?

LocalStack - это **локальная эмуляция AWS сервисов**, работающая в Docker. Идеально для:
- 🧪 Тестирования без затрат на AWS
- 🔄 Разработки без интернета
- 🔐 Безопасного тестирования с fake credentials

### Установка LocalStack

```bash
# 1. Установить Docker Desktop
# https://www.docker.com/products/docker-desktop

# 2. Запустить LocalStack через Docker Compose
# (должен быть docker-compose.yml в проекте)

cd aws-optimizer
docker-compose up -d localstack

# 3. Проверить, что LocalStack запущена
curl -s http://localhost:4566/_localstack/health | jq

# Ожидаемый результат:
# {
#   "services": {
#     "ec2": "available",
#     "s3": "available",
#     "iam": "available"
#   }
# }
```

### docker-compose.yml конфигурация

```yaml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    container_name: aws_optimizer_localstack
    ports:
      - "4566:4566"           # LocalStack Gateway
      - "4571:4571"           # Services
    environment:
      - SERVICES=ec2,s3,iam,cloudtrail
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "${TMPDIR}:/tmp/localstack"
      - "/var/run/docker.sock:/var/run/docker.sock"
    networks:
      - aws-optimizer-network

networks:
  aws-optimizer-network:
    driver: bridge
```

### Использование LocalStack в AWS Optimizer

```typescript
// SettingsPage.tsx

// 1. Переключитесь на LocalStack mode
const [useLocalStack, setUseLocalStack] = useState(true);

// 2. Вводим LocalStack endpoint
const [localStackEndpoint, setLocalStackEndpoint] = useState('http://localhost:4566');

// 3. Credentials для LocalStack (не нужны реальные!)
const [accessKey, setAccessKey] = useState('test');
const [secretKey, setSecretKey] = useState('test');

// 4. Нажимаем "Save Credentials"
// Backend использует эти fake credentials для подключения к LocalStack
```

### Создание тестовых ресурсов в LocalStack

```bash
# Используем AWS CLI, указав LocalStack endpoint

# Создать EC2 инстанс
aws ec2 run-instances \
  --image-id ami-12345678 \
  --instance-type t2.micro \
  --endpoint-url http://localhost:4566

# Создать Security Group
aws ec2 create-security-group \
  --group-name test-sg \
  --description "Test security group" \
  --endpoint-url http://localhost:4566

# Создать EBS volume
aws ec2 create-volume \
  --size 100 \
  --availability-zone us-east-1a \
  --encrypted \
  --endpoint-url http://localhost:4566

# Выключить LocalStack после тестирования
docker-compose down
```

### Различия между AWS и LocalStack

| Параметр | AWS | LocalStack |
|---|---|---|
| **Стоимость** | Реальные деньги | Бесплатно |
| **Данные** | Реальная инфраструктура | Эмулирует в памяти/диске |
| **Endpoint** | `https://ec2.us-east-1.amazonaws.com` | `http://localhost:4566` |
| **Access Key** | Реальный AKIA... | Любой (test, fake, etc) |
| **Persistence** | Часы/дни/месяцы | До перезагрузки контейнера |
| **Масштаб** | Unlimited | Ограничено памятью машины |
| **Compliance** | Реальные условия | Только для тестирования |

---

## ⚙️ AWS SDK v3 конфигурация

### Полная конфигурация EC2 Client

```typescript
// server/src/index.ts

const EC2ClientConfig = {
  // ТРЕБУЕМЫЕ параметры
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
  },

  // ОПЦИОНАЛЬНЫЕ параметры
  endpoint: 'http://localhost:4566',  // Для LocalStack
  maxAttempts: 3,                      // Переподключения
  connectionTimeout: 5000,              // 5 сек таймаут
  requestTimeout: 10000,                // 10 сек на запрос

  // Логирование
  logger: console,
  logLevel: 'debug'
};

const ec2Client = new EC2Client(EC2ClientConfig);
```

### Порядок приоритета credentials

AWS SDK v3 ищет credentials в этом порядке:

```javascript
// 1. Параметры конструктора (САМЫЙ ВЫСОКИЙ ПРИОРИТЕТ)
new EC2Client({
  credentials: { accessKeyId: '...', secretAccessKey: '...' }
});

// 2. Переменные окружения
// AWS_ACCESS_KEY_ID
// AWS_SECRET_ACCESS_KEY
// AWS_DEFAULT_REGION

// 3. Профиль из ~/.aws/credentials
// [default]
// aws_access_key_id = AKIAIOSFODNN7EXAMPLE
// aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

// 4. Metadata сервис (для EC2 инстансов в AWS)
// Автоматическое получение credentials из IAM role

// 5. Контейнеры и Lambda
// Через IAM role, привязанный к сервису
```

### Параллельные запросы (как это работает)

```typescript
// server/src/index.ts

console.log('📡 Fetching AWS Infrastructure Data...\n');

// Запускаем все запросы ПАРАЛЛЕЛЬНО через Promise.all()
// Это в ~4 раза быстрее, чем последовательно!

const [instData, volData, ipData, sgData] = await Promise.all([
  // Запрос 1: EC2 инстансы
  ec2.send(new DescribeInstancesCommand({}))
    .then(data => data.Reservations?.flatMap(r => r.Instances || []) || [])
    .catch(err => {
      console.error('❌ EC2 error:', err.message);
      return [];
    }),

  // Запрос 2: EBS томы
  ec2.send(new DescribeVolumesCommand({}))
    .then(data => data.Volumes || [])
    .catch(err => {
      console.error('❌ EBS error:', err.message);
      return [];
    }),

  // Запрос 3: Elastic IPs
  ec2.send(new DescribeAddressesCommand({}))
    .then(data => data.Addresses || [])
    .catch(err => {
      console.error('❌ Elastic IP error:', err.message);
      return [];
    }),

  // Запрос 4: Security Groups
  ec2.send(new DescribeSecurityGroupsCommand({}))
    .then(data => data.SecurityGroups || [])
    .catch(err => {
      console.error('❌ Security Group error:', err.message);
      return [];
    })
]);

// Все 4 запроса запущены одновременно
// Total time ≈ самый долгий запрос (не сумма всех!)
```

---

## 📝 Примеры подключений

### Пример 1: Подключение к AWS Production

```javascript
// Шаги:

1. Получить AWS credentials:
   - Перейти в AWS Console
   - Скопировать Access Key ID и Secret Access Key

2. Открыть AWS Optimizer Settings
   - Выбрать "AWS" (не LocalStack)
   - Вставить Access Key ID
   - Вставить Secret Access Key
   - Выбрать регион: us-east-1
   - Нажать "Test Connection"

3. Если тест успешен:
   - Нажать "Save Credentials"
   - Перейти на Dashboard
   - Нажать "Rescan AWS Infrastructure"
   - Ждём результата (5-20 сек)

4. Результат:
   - Dashboard обновится с KPI
   - Alerts таблица покажет все найденные проблемы
   - Можем просмотреть рекомендации в AI Advisor
```

### Пример 2: Подключение к LocalStack для разработки

```javascript
// Шаги:

1. Запустить LocalStack:
   docker-compose up -d localstack

2. Проверить, что LocalStack работает:
   curl http://localhost:4566/_localstack/health

3. Открыть AWS Optimizer Settings
   - Выбрать "LocalStack (Local Testing)"
   - Вставить LocalStack Endpoint: http://localhost:4566
   - Нажать "Test Connection"

4. Если тест успешен:
   - Нажать "Save Credentials"
   - Перейти на Dashboard
   - Нажать "Rescan AWS Infrastructure"
   - Ждём результата (должно быть быстро, т.к. тестовые ресурсы)

5. Создать тестовые ресурсы (если нужно):
   aws ec2 run-instances \
     --image-id ami-12345678 \
     --instance-type t2.micro \
     --endpoint-url http://localhost:4566

6. Результат:
   - Dashboard покажет тестовую инфраструктуру
   - Alerts будут основаны на тестовых ресурсах
   - Идеально для разработки и тестирования!
```

### Пример 3: Подключение с IAM Role (для EC2 инстанса в AWS)

```javascript
// Если AWS Optimizer работает на EC2 инстансе:

// 1. Создать IAM Role с правами ReadOnlyAccess
// 2. Привязать Role к EC2 инстансу
// 3. В AWS Optimizer Settings: оставить поля пустыми
// 4. AWS SDK автоматически получит credentials из metadata service

// В таком случае credentials НЕ нужны!
// AWS SDK будет использовать:
// - http://169.254.169.254/latest/meta-data/iam/security-credentials/role-name

// Преимущества:
// - Credentials не хранятся нигде
// - Автоматическое обновление
// - Максимально безопасно для production
```

---

## 🔧 Troubleshooting

### Ошибка 1: "Invalid Access Key ID"

```
❌ Error: The Access Key ID you provided does not exist in our records.

Решение:
1. Проверить, что скопировали ВЕСЬ Access Key ID (AKIAIOSFODNN7EXAMPLE)
2. Проверить, что Access Key не истёк (в AWS Console → Security Credentials)
3. Создать новый Access Key если старый устарел
4. Убедиться, что это Access Key ID, а не что-то другое
```

### Ошибка 2: "Invalid Access Key Signature"

```
❌ Error: The request signature we calculated does not match the signature you provided.

Решение:
1. Проверить, что Secret Access Key введён ПОЛНОСТЬЮ
2. Убедиться, что нет пробелов в начале/конце
3. Пересоздать Access Key (может быть скопирован неправильно)
4. Проверить системное время (AWS проверяет временную метку запроса)
```

### Ошибка 3: "UnauthorizedOperation - You are not authorized to perform: ec2:DescribeInstances"

```
❌ Error: You do not have permission to access this resource.

Решение:
1. Проверить IAM permissions для User
2. Добавить ReadOnlyAccess policy:
   aws iam attach-user-policy \
     --user-name USERNAME \
     --policy-arn arn:aws:iam::aws:policy/ReadOnlyAccess
3. Дождаться распространения прав (может занять 1-2 минуты)
4. Попробовать ещё раз
```

### Ошибка 4: "Cannot reach LocalStack endpoint"

```
❌ Error: connect ECONNREFUSED 127.0.0.1:4566

Решение:
1. Проверить, что LocalStack запущена:
   docker ps | grep localstack

2. Если не запущена, запустить:
   docker-compose up -d localstack

3. Проверить, что endpoint правильный:
   curl http://localhost:4566/_localstack/health

4. Если curl не работает, проверить Docker:
   docker logs aws_optimizer_localstack

5. Переделать контейнер:
   docker-compose down
   docker-compose up -d localstack
```

### Ошибка 5: "Request timeout"

```
❌ Error: Request timeout after 10000ms

Решение:
1. Это может быть из-за большого количества ресурсов (1000+)
2. Проверить интернет соединение
3. Попробовать снова (может быть временная задержка AWS)
4. Если регулярно, увеличить timeout:
   - Открыть server/src/index.ts
   - Найти EC2ClientConfig
   - Изменить requestTimeout: 10000 → 30000
```

### Ошибка 6: "Region is not valid"

```
❌ Error: us-east-5 is not a valid AWS region

Решение:
1. Проверить, что выбран существующий регион:
   - us-east-1, us-west-2, eu-west-1, ap-southeast-1, etc
2. В SettingsPage выбрать из dropdown, не писать вручную
3. Если нужен другой регион, открыть PR чтобы добавить его
```

---

## 🎓 Дополнительные ресурсы

- [AWS SDK v3 Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [LocalStack Documentation](https://docs.localstack.cloud/)
- [AWS Signature Version 4](https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html)
- [AWS Regions and Endpoints](https://docs.aws.amazon.com/general/latest/gr/endpoints-arb.html)

---

**Версия документа:** 1.0  
**Последнее обновление:** Май 2024
