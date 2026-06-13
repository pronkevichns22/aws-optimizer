# 🔍 Процесс сканирования AWS/LocalStack

**Полная разборка: Что происходит когда вы нажимаете кнопку "Rescan"?**

---

## 📚 Оглавление

1. [Визуальная схема процесса](#визуальная-схема-процесса)
2. [Шаг за шагом](#шаг-за-шагом)
3. [Frontend часть](#frontend-часть)
4. [Backend часть](#backend-часть)
5. [AWS/LocalStack часть](#awslocalstack-часть)
6. [Rules Engine часть](#rules-engine-часть)
7. [Сохранение результатов](#сохранение-результатов)
8. [Временные характеристики](#временные-характеристики)
9. [Примеры реальных ответов](#примеры-реальных-ответов)

---

## 📊 Визуальная схема процесса

```
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND (React - NewDashboard.tsx)                                 │
│                                                                     │
│  🖱️  Пользователь нажимает кнопку "Rescan AWS Infrastructure"     │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ onClick={handleRescan}
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 1️⃣ PREPARE REQUEST (Подготовка запроса)                            │
│                                                                     │
│  ├─ Получить credentials из localStorage / context                 │
│  ├─ Подготовить body:                                              │
│  │  {                                                               │
│  │    accessKeyId: "AKIAIOSFODNN7EXAMPLE",                         │
│  │    secretAccessKey: "wJalrXUtnFEMI/K7MDENG/...",               │
│  │    region: "us-east-1",                                         │
│  │    isLocalStack: false,                                         │
│  │    endpoint: undefined                                          │
│  │  }                                                               │
│  └─ Добавить JWT token в Authorization header                     │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ POST /api/scan
                          │ Content-Type: application/json
                          │ Authorization: Bearer eyJhbGc...
                          │
                          ↓ ⏱️ 0ms - request отправляется
┌─────────────────────────────────────────────────────────────────────┐
│ BACKEND (Express.js - server/src/index.ts)                         │
│                                                                     │
│ 2️⃣ RECEIVE REQUEST & VALIDATE (Получение и валидация)             │
│                                                                     │
│  ├─ Получить body параметры                                        │
│  ├─ Проверить что credentials присутствуют                         │
│  ├─ Логирование в консоль ✅                                       │
│  └─ Создать configuration объект                                   │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ↓ ⏱️ 10ms
┌─────────────────────────────────────────────────────────────────────┐
│ 3️⃣ CREATE AWS SDK CLIENTS                                           │
│                                                                     │
│  ├─ Создать EC2Client с credentials                               │
│  │  const ec2 = new EC2Client({                                    │
│  │    region: 'us-east-1',                                         │
│  │    credentials: { accessKeyId, secretAccessKey }               │
│  │  })                                                              │
│  ├─ Если LocalStack: добавить endpoint: 'http://localhost:4566'  │
│  └─ Готов к запросам! ✅                                           │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ↓ ⏱️ 20ms
┌─────────────────────────────────────────────────────────────────────┐
│ 4️⃣ PARALLEL AWS API CALLS (Параллельные запросы)                   │
│                                                                     │
│  Запускаем 4 запроса ОДНОВРЕМЕННО через Promise.all():             │
│                                                                     │
│  ┌─────────────────────┐  ┌──────────────────┐                     │
│  │ DescribeInstances   │  │ DescribeVolumes  │                     │
│  │ Получить EC2        │  │ Получить EBS     │                     │
│  └────────┬────────────┘  └────────┬─────────┘                     │
│           │                        │                                │
│  ┌────────┴────────────┐  ┌────────┴─────────┐                     │
│  │ DescribeAddresses   │  │ DescribeSecurityGroups │              │
│  │ Получить EIP        │  │ Получить SG      │                     │
│  └────────┬────────────┘  └────────┬─────────┘                     │
│           │                        │                                │
│           └────────────┬───────────┘                                │
│                        │                                             │
│                   Все 4 выполняются параллельно!                   │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ↓ ⏱️ 20ms - 5000ms (зависит от AWS)
┌─────────────────────────────────────────────────────────────────────┐
│ 5️⃣ PROCESS RESPONSES (Обработка результатов)                       │
│                                                                     │
│  ├─ instances = [...] → Array of EC2 instances                    │
│  ├─ volumes = [...] → Array of EBS volumes                        │
│  ├─ elasticIPs = [...] → Array of Elastic IPs                     │
│  ├─ securityGroups = [...] → Array of Security Groups             │
│  └─ Логирование количеств найденных ресурсов ✅                  │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ↓ ⏱️ 5020ms
┌─────────────────────────────────────────────────────────────────────┐
│ 6️⃣ RUN RULES ENGINE (Запуск Rules Engine)                          │
│                                                                     │
│  Анализируем ВСЕ ресурсы по встроенным правилам:                 │
│                                                                     │
│  ├─ generateSecurityGroupAlerts() - SSH/RDP 0.0.0.0/0              │
│  ├─ generatePermissiveSecurityGroupAlerts() - DB ports             │
│  ├─ generateUnencryptedVolumeAlerts() - EBS без шифрования         │
│  ├─ generatePublicInstanceAlerts() - Public инстансы               │
│  ├─ generateEBSVolumeAlerts() - Orphaned EBS                       │
│  ├─ generateElasticIPAlerts() - Orphaned EIP                       │
│  ├─ generateUnusedSecurityGroupAlerts() - Unused SG                │
│  ├─ generateMediumSecurityAlerts() - Best practices                │
│  ├─ generateHighSecurityAlerts() - HIGH severity issues            │
│  └─ generateInfoAlerts() - Recommendations                         │
│                                                                     │
│  Результат: alerts = [Alert, Alert, Alert, ...]                   │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ↓ ⏱️ 5200ms
┌─────────────────────────────────────────────────────────────────────┐
│ 7️⃣ RUN PROWLER (Опционально, если установлен)                      │
│                                                                     │
│  ├─ isProwlerInstalled()? → true/false                             │
│  ├─ Если true:                                                      │
│  │  └─ runProwlerCISBenchmark() - запуск 400+ проверок            │
│  │     ⏱️ Может занять 2-10 минут!                                │
│  └─ Если false:                                                     │
│     └─ Используем встроенные правила (уже выше)                   │
│                                                                     │
│  prowlerAlerts = [Alert, Alert, ...]                              │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ↓ ⏱️ 5200ms (или 7200ms+ с Prowler)
┌─────────────────────────────────────────────────────────────────────┐
│ 8️⃣ CALCULATE METRICS (Расчёт метрик)                              │
│                                                                     │
│  ├─ totalResources = EC2 + EBS + EIP + SG + IAM                   │
│  ├─ totalSpend = (EC2 × $15) + (EBS × $0.08) + (EIP × $3.60)      │
│  ├─ wastedSpend = orphaned resources cost                          │
│  ├─ healthScore = 100 - (alerts × weight)                          │
│  ├─ securityScore = 100 - (security alerts × weight)              │
│  └─ costScore = 100 - (cost alerts × weight)                       │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ↓ ⏱️ 5250ms
┌─────────────────────────────────────────────────────────────────────┐
│ 9️⃣ DEDUPLICATE ALERTS (Дедупликация результатов)                  │
│                                                                     │
│  Если у нас есть:                                                   │
│  - Alerts от встроенных правил                                     │
│  - Alerts от Prowler                                               │
│  - Alerts от Extended Security Rules                               │
│                                                                     │
│  Комбинируем и удаляем дубликаты по ruleId                        │
│                                                                     │
│  finalAlerts = [...] (без дубликатов)                              │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ↓ ⏱️ 5300ms
┌─────────────────────────────────────────────────────────────────────┐
│ 🔟 SAVE TO MONGODB (Сохранение результатов)                        │
│                                                                     │
│  Создаём Audit документ:                                            │
│  {                                                                  │
│    scanId: "scan-20240514-143000",                                 │
│    timestamp: 2024-05-14T14:30:00Z,                                │
│    userId: ObjectId(...),                                          │
│    metrics: { totalSpend, healthScore, ... },                      │
│    alerts: [...],                                                   │
│    resources: { ec2, ebs, eip, sgs },                              │
│    executionTimeMs: 5300                                           │
│  }                                                                  │
│                                                                     │
│  await Audit.create(auditDoc);                                     │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          ↓ ⏱️ 5350ms
┌─────────────────────────────────────────────────────────────────────┐
│ 1️⃣1️⃣ SEND RESPONSE (Отправка результатов)                         │
│                                                                     │
│  res.json({                                                         │
│    success: true,                                                   │
│    data: {                                                          │
│      scanId,                                                        │
│      executionTimeMs: 5350,                                        │
│      metrics: { totalSpend, healthScore, ... },                    │
│      alerts: [...],                                                 │
│      resources: {...}                                              │
│    }                                                                │
│  })                                                                 │
│                                                                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ JSON Response
                          │
                          ↓ ⏱️ 5350ms - response приходит
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND (React - NewDashboard.tsx)                                 │
│                                                                     │
│ 1️⃣2️⃣ RECEIVE & DISPLAY (Получение и отображение)                 │
│                                                                     │
│  ├─ setScanResults(data)                                           │
│  ├─ updateDashboardMetrics() - обновить KPI cards                 │
│  ├─ renderAlertsTable() - показать alerts                         │
│  ├─ updateCharts() - обновить графики                             │
│  ├─ setScanning(false) - отключить загрузку спиннер                │
│  └─ showNotification('success', 'Scan completed!')                 │
│                                                                     │
│  Dashboard обновляется в real-time! 🎉                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Шаг за шагом

### ШАГИ 1-3: Подготовка (< 50ms)

```
ШАГ 1: Пользователь видит Dashboard
─────────────────────────────────────
Кнопка "Rescan AWS Infrastructure" - ВИДНА И АКТИВНА
Если есть сохранённые credentials - кнопка светит синим (готов к сканированию)
Если нет credentials - кнопка серая (нужно сначала сохранить credentials)


ШАГ 2: Пользователь нажимает кнопку
─────────────────────────────────────
Frontend код:
  onClick={() => handleRescan()}
  
handleRescan():
  1. Получить credentials:
     const credentials = useAWS().credentials
     // { accessKeyId: "AKIA...", secretAccessKey: "wJal...", ... }
  
  2. Установить loading state:
     setScanning(true)
     // Кнопка становится серой, спиннер вращается
  
  3. Показать уведомление:
     showNotification('info', '🔍 Scanning AWS infrastructure...')


ШАГ 3: Подготовить и отправить запрос
──────────────────────────────────────
const response = await fetch('/api/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
  },
  body: JSON.stringify({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    region: credentials.region || 'us-east-1',
    isLocalStack: credentials.isLocalStack || false,
    endpoint: credentials.endpoint
  })
});
```

### ШАГИ 4-7: Backend обработка (50ms - 5200ms)

#### ШАГ 4: Backend получает запрос

```typescript
// server/src/index.ts - POST /api/scan endpoint

app.post('/api/scan', optionalAuthMiddleware, async (req, res) => {
  try {
    // Логирование
    console.log('\n' + '='.repeat(80));
    console.log('📨 /api/scan - CSPM & FinOps Scan Initiated');
    console.log('='.repeat(80));
    
    // Деструктурируем параметры
    const { accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;
    const userId = (req as any).userId; // Если пользователь авторизован
    
    // Валидация
    if (!accessKeyId || !secretAccessKey) {
      console.error('❌ Missing AWS credentials');
      return res.status(400).json({ error: 'Missing credentials' });
    }
    
    console.log('🔐 Credentials provided: ✓');
    console.log('🔧 Environment:', isLocalStack ? '🐳 LocalStack' : '☁️  AWS');
    console.log('📍 Region:', region || 'us-east-1');
```

#### ШАГ 5: Создание AWS SDK Clients

```typescript
// createEC2Client() helper function

const createEC2Client = (credentials: any) => {
    const config: any = {
        region: credentials.region || 'us-east-1',
        credentials: {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
        },
    };

    // ВАЖНО: Если LocalStack - используем локальный endpoint
    if (credentials.isLocalStack) {
        config.endpoint = credentials.endpoint || 'http://localhost:4566';
        console.log(`🔧 LocalStack Endpoint: ${config.endpoint}`);
    }

    console.log(`🔧 EC2 Client Config:`, {
        region: config.region,
        hasCredentials: !!config.credentials.accessKeyId,
        endpoint: credentials.endpoint || 'AWS (default)'
    });

    // Создаём клиент AWS SDK v3
    return new EC2Client(config);
};

const ec2 = createEC2Client({
    accessKeyId,
    secretAccessKey,
    region: region || 'us-east-1',
    isLocalStack,
    endpoint
});
```

#### ШАГ 6: Параллельные запросы к AWS/LocalStack

```typescript
// ПАРАЛЛЕЛЬНЫЕ ЗАПРОСЫ (все запускаются одновременно!)

console.log('\n📡 Fetching AWS Infrastructure Data...\n');

const [instances, volumes, elasticIPs, securityGroups] = await Promise.all([
  // ЗАПРОС 1: EC2 Instances
  (async () => {
    try {
      console.log('  🖥️  Fetching EC2 Instances...');
      const startTime = Date.now();
      
      const data = await ec2.send(new DescribeInstancesCommand({}));
      const result = data.Reservations?.flatMap(r => r.Instances || []) || [];
      
      const duration = Date.now() - startTime;
      console.log(`      ✓ Found ${result.length} instances (${duration}ms)`);
      return result;
    } catch (err: any) {
      console.error(`      ✗ Error: ${err.message}`);
      return [];
    }
  })(),

  // ЗАПРОС 2: EBS Volumes
  (async () => {
    try {
      console.log('  📦 Fetching EBS Volumes...');
      const startTime = Date.now();
      
      const data = await ec2.send(new DescribeVolumesCommand({}));
      const result = data.Volumes || [];
      
      const duration = Date.now() - startTime;
      console.log(`      ✓ Found ${result.length} volumes (${duration}ms)`);
      return result;
    } catch (err: any) {
      console.error(`      ✗ Error: ${err.message}`);
      return [];
    }
  })(),

  // ЗАПРОС 3: Elastic IPs
  (async () => {
    try {
      console.log('  💰 Fetching Elastic IPs...');
      const startTime = Date.now();
      
      const data = await ec2.send(new DescribeAddressesCommand({}));
      const result = data.Addresses || [];
      
      const duration = Date.now() - startTime;
      console.log(`      ✓ Found ${result.length} EIPs (${duration}ms)`);
      return result;
    } catch (err: any) {
      console.error(`      ✗ Error: ${err.message}`);
      return [];
    }
  })(),

  // ЗАПРОС 4: Security Groups
  (async () => {
    try {
      console.log('  🔒 Fetching Security Groups...');
      const startTime = Date.now();
      
      const data = await ec2.send(new DescribeSecurityGroupsCommand({}));
      const result = data.SecurityGroups || [];
      
      const duration = Date.now() - startTime;
      console.log(`      ✓ Found ${result.length} security groups (${duration}ms)`);
      return result;
    } catch (err: any) {
      console.error(`      ✗ Error: ${err.message}`);
      return [];
    }
  })()
]);

console.log('\n✅ All AWS API calls completed');
console.log(`📊 Total resources fetched: ${instances.length + volumes.length + elasticIPs.length + securityGroups.length}\n`);
```

**Как это работает:**
- Все 4 запроса запускаются ОДНОВРЕМЕННО (не последовательно!)
- `Promise.all()` ждёт, когда ВСЕ завершатся
- Общее время = самый долгий запрос (не сумма всех)
- Обычно: 200-5000ms в зависимости от размера инфраструктуры

---

## 🛠️ Frontend часть

### Файл: client/src/pages/NewDashboard.tsx

```typescript
// ГЛАВНЫЙ DASHBOARD COMPONENT

const NewDashboard = () => {
  const { credentials } = useAWS();
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any>(null);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);

  // ========== MAIN RESCAN HANDLER ==========
  const handleRescan = async () => {
    console.log('🔍 Starting AWS scan...');
    setScanning(true); // Показать спиннер
    
    try {
      // 1. Проверить что credentials есть
      if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
        throw new Error('AWS credentials not configured');
      }

      // 2. Отправить POST request
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        },
        body: JSON.stringify({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region: credentials.region || 'us-east-1',
          isLocalStack: credentials.isLocalStack || false,
          endpoint: credentials.endpoint || 'http://localhost:4566'
        })
      });

      // 3. Проверить статус ответа
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Scan failed');
      }

      // 4. Получить результаты
      const data = await response.json();
      
      // 5. Сохранить результаты
      setScanResults(data.data);
      setLastScanTime(new Date());
      
      // 6. Показать успех
      console.log('✅ Scan completed successfully');
      console.log('📊 Results:', data.data);
      
    } catch (error: any) {
      console.error('❌ Scan error:', error.message);
      // Показать пользователю ошибку
      alert(`Scan failed: ${error.message}`);
    } finally {
      setScanning(false); // Отключить спиннер
    }
  };

  return (
    <div className="dashboard">
      {/* Кнопка сканирования */}
      <button 
        onClick={handleRescan}
        disabled={scanning || !credentials?.accessKeyId}
        className={`scan-button ${scanning ? 'loading' : ''}`}
      >
        {scanning ? '🔄 Scanning...' : '🔍 Rescan AWS Infrastructure'}
      </button>

      {/* Показать результаты если есть */}
      {scanResults && (
        <div className="scan-results">
          <div className="kpi-cards">
            <StatCard 
              label="Health Score" 
              value={scanResults.metrics.healthScore} 
              max={100}
            />
            <StatCard 
              label="Total Spend" 
              value={`$${scanResults.metrics.totalSpend}`} 
            />
            <StatCard 
              label="Critical Alerts" 
              value={scanResults.alerts.filter(a => a.severity === 'CRITICAL').length} 
            />
          </div>

          <AlertsTable alerts={scanResults.alerts} />
          <ResourcesTable resources={scanResults.resources} />
        </div>
      )}

      {/* Показать время последнего сканирования */}
      {lastScanTime && (
        <p className="last-scan">Last scan: {lastScanTime.toLocaleString()}</p>
      )}
    </div>
  );
};
```

---

## ⚙️ Backend часть

### Файл: server/src/index.ts - POST /api/scan

```typescript
/**
 * ГЛАВНЫЙ ENDPOINT ДЛЯ СКАНИРОВАНИЯ
 * 
 * Процесс:
 * 1. Получить AWS credentials
 * 2. Создать AWS SDK clients
 * 3. Параллельные запросы к AWS
 * 4. Применить Rules Engine
 * 5. Запустить Prowler (если установлен)
 * 6. Дедупликация результатов
 * 7. Сохранить в MongoDB
 * 8. Вернуть результаты
 */

app.post('/api/scan', optionalAuthMiddleware, async (req, res) => {
    try {
        const startTime = Date.now();
        const { accessKeyId, secretAccessKey, region, isLocalStack, endpoint } = req.body;
        const userId = (req as any).userId;

        console.log('\n' + '='.repeat(80));
        console.log('📨 /api/scan - CSPM & FinOps Scan Initiated');
        console.log('='.repeat(80));

        // ============================================================
        // STEP 1: CREATE AWS CLIENTS
        // ============================================================
        console.log('\n🔧 STEP 1: Creating AWS SDK clients...\n');

        const ec2 = new EC2Client({
            region: region || 'us-east-1',
            credentials: { accessKeyId, secretAccessKey },
            ...(isLocalStack && { endpoint: endpoint || 'http://localhost:4566' })
        });

        const iam = new IAMClient({
            credentials: { accessKeyId, secretAccessKey }
        });

        // ============================================================
        // STEP 2: PARALLEL AWS API CALLS
        // ============================================================
        console.log('📡 STEP 2: Fetching AWS Infrastructure Data...\n');

        const [instances, volumes, elasticIPs, securityGroups] = await Promise.all([
            ec2.send(new DescribeInstancesCommand({}))
                .then(d => d.Reservations?.flatMap(r => r.Instances || []) || [])
                .catch(e => { console.error('EC2 error:', e.message); return []; }),
            ec2.send(new DescribeVolumesCommand({}))
                .then(d => d.Volumes || [])
                .catch(e => { console.error('EBS error:', e.message); return []; }),
            ec2.send(new DescribeAddressesCommand({}))
                .then(d => d.Addresses || [])
                .catch(e => { console.error('EIP error:', e.message); return []; }),
            ec2.send(new DescribeSecurityGroupsCommand({}))
                .then(d => d.SecurityGroups || [])
                .catch(e => { console.error('SG error:', e.message); return []; })
        ]);

        console.log(`✅ Fetched ${instances.length} instances`);
        console.log(`✅ Fetched ${volumes.length} volumes`);
        console.log(`✅ Fetched ${elasticIPs.length} elastic IPs`);
        console.log(`✅ Fetched ${securityGroups.length} security groups\n`);

        // ============================================================
        // STEP 3: RUN BUILT-IN RULES ENGINE
        // ============================================================
        console.log('🔍 STEP 3: Running built-in rules engine...\n');

        const costConfig = {
            PRICE_PER_GB: 0.08,
            PRICE_PER_SERVER: 15.00,
            PRICE_PER_IP: 3.60,
        };

        const builtInAlerts = rulesEngine(
            { instances, volumes, elasticIPs, securityGroups },
            costConfig
        );

        console.log(`✅ Generated ${builtInAlerts.length} built-in alerts\n`);

        // ============================================================
        // STEP 4: TRY PROWLER (if installed)
        // ============================================================
        console.log('🔍 STEP 4: Checking for Prowler CIS Benchmark...\n');

        let prowlerAlerts: Alert[] = [];
        const prowlerInstalled = await isProwlerInstalled();

        if (prowlerInstalled) {
            console.log('✅ Prowler detected - running CIS benchmark...\n');
            try {
                prowlerAlerts = await runProwlerCISBenchmark({
                    accessKeyId,
                    secretAccessKey,
                    region,
                    isLocalStack,
                    endpoint
                });
                console.log(`✅ Prowler: ${prowlerAlerts.length} CIS findings\n`);
            } catch (err: any) {
                console.warn(`⚠️  Prowler error: ${err.message}`);
                console.warn('📌 Continuing with built-in rules...\n');
            }
        } else {
            console.log('📌 Prowler not installed - using built-in rules only\n');
        }

        // ============================================================
        // STEP 5: RUN EXTENDED SECURITY RULES
        // ============================================================
        console.log('🔍 STEP 5: Running extended security rules...\n');

        const extendedAlerts = await runExtendedSecurityRules(
            instances,
            securityGroups,
            volumes,
            elasticIPs
        );

        console.log(`✅ Generated ${extendedAlerts.length} extended alerts\n`);

        // ============================================================
        // STEP 6: COMBINE & DEDUPLICATE ALERTS
        // ============================================================
        console.log('🔄 STEP 6: Deduplicating alerts...\n');

        const allAlerts = [...builtInAlerts, ...prowlerAlerts, ...extendedAlerts];
        
        // Удаляем дубликаты по ruleId
        const deduplicatedAlerts = Array.from(
            new Map(allAlerts.map(alert => [alert.ruleId, alert])).values()
        );

        console.log(`✅ Total alerts after deduplication: ${deduplicatedAlerts.length}\n`);

        // ============================================================
        // STEP 7: CALCULATE METRICS
        // ============================================================
        console.log('📊 STEP 7: Calculating metrics...\n');

        const totalResources = instances.length + volumes.length + elasticIPs.length + securityGroups.length;
        
        // Расчёт затрат
        const ec2Cost = instances.length * costConfig.PRICE_PER_SERVER;
        const ebsCost = volumes.reduce((sum, v) => sum + ((v.Size || 0) * costConfig.PRICE_PER_GB), 0);
        const eipCost = elasticIPs.filter(ip => !ip.AssociationId).length * costConfig.PRICE_PER_IP;
        const totalSpend = ec2Cost + ebsCost + eipCost;

        // Orphaned resources
        const wastedSpend = eipCost + 
            ebsCost * 0.2 + // Примерно 20% EBS может быть orphaned
            ec2Cost * 0.1;  // Примерно 10% EC2 может быть stopped

        // Calculation of Health Score
        const criticalAlerts = deduplicatedAlerts.filter(a => a.severity === 'CRITICAL').length;
        const highAlerts = deduplicatedAlerts.filter(a => a.severity === 'HIGH').length;
        const healthScore = Math.max(0, 100 - (criticalAlerts * 10) - (highAlerts * 5));

        console.log(`✅ Total Spend: $${totalSpend.toFixed(2)}`);
        console.log(`✅ Wasted Spend: $${wastedSpend.toFixed(2)}`);
        console.log(`✅ Health Score: ${healthScore}/100\n`);

        // ============================================================
        // STEP 8: SAVE TO MONGODB
        // ============================================================
        console.log('💾 STEP 8: Saving scan to MongoDB...\n');

        const scanId = `scan-${Date.now()}`;
        const auditDoc = {
            scanId,
            userId,
            timestamp: new Date(),
            region,
            isLocalStack,
            
            // Resources found
            instances,
            volumes,
            elasticIPs,
            securityGroups,
            totalResources,
            
            // Costs
            totalSpend,
            wastedSpend,
            potentialSavings: wastedSpend,
            costBreakdown: { ec2Cost, ebsCost, eipCost },
            
            // Health metrics
            healthScore,
            securityScore: Math.max(0, 100 - (criticalAlerts * 15)),
            costScore: Math.max(0, 100 - (deduplicatedAlerts.filter(a => a.type === 'FINOPS').length * 10)),
            
            // Alerts
            alerts: deduplicatedAlerts,
            alertSummary: {
                critical: criticalAlerts,
                high: highAlerts,
                medium: deduplicatedAlerts.filter(a => a.severity === 'MEDIUM').length,
                low: deduplicatedAlerts.filter(a => a.severity === 'WARNING').length
            },
            
            // Metadata
            executionTimeMs: Date.now() - startTime,
            prowlerUsed: prowlerInstalled && prowlerAlerts.length > 0
        };

        await Audit.create(auditDoc);
        console.log(`✅ Audit saved: ${scanId}\n`);

        // ============================================================
        // STEP 9: RETURN RESPONSE
        // ============================================================
        console.log('=' .repeat(80));
        console.log(`✅ SCAN COMPLETED in ${auditDoc.executionTimeMs}ms`);
        console.log('=' .repeat(80) + '\n');

        res.json({
            success: true,
            data: {
                scanId,
                executionTimeMs: auditDoc.executionTimeMs,
                metrics: {
                    totalResources,
                    totalSpend,
                    wastedSpend,
                    potentialSavings: wastedSpend,
                    healthScore,
                    securityScore: auditDoc.securityScore,
                    costScore: auditDoc.costScore
                },
                alertSummary: auditDoc.alertSummary,
                alerts: deduplicatedAlerts,
                resources: {
                    ec2: instances,
                    ebs: volumes,
                    eip: elasticIPs,
                    sgs: securityGroups
                }
            }
        });

    } catch (error: any) {
        console.error('\n❌ SCAN ERROR:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            error: error.message,
            code: 'SCAN_ERROR'
        });
    }
};
```

---

## ☁️ AWS/LocalStack часть

### Как AWS обрабатывает запросы

```
Когда мы запускаем:
const data = await ec2.send(new DescribeInstancesCommand({}));

Происходит:

1️⃣ AWS SDK v3 берёт credentials
   - accessKeyId: "AKIAIOSFODNN7EXAMPLE"
   - secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

2️⃣ Создаёт подпись (AWS Signature Version 4)
   - Берёт текущее время (для защиты от replay атак)
   - Берёт регион (us-east-1)
   - Берёт сервис (ec2)
   - Подписывает SECRET_KEY заголовок

3️⃣ Отправляет HTTPS запрос
   POST /ec2.amazonaws.com/ HTTP/1.1
   Host: ec2.us-east-1.amazonaws.com
   Content-Type: application/x-amz-json-1.1
   X-Amz-Date: 20240514T143000Z
   Authorization: AWS4-HMAC-SHA256 Credential=..., SignedHeaders=..., Signature=...
   
   Action=DescribeInstances&Version=2016-11-15

4️⃣ AWS проверяет подпись
   - Если подпись правильная → обработка запроса ✅
   - Если подпись неправильная → 403 Unauthorized ❌

5️⃣ AWS обрабатывает запрос
   - Вызывает EC2 API endpoint
   - Получает данные из БД AWS
   - Форматирует результат в JSON

6️⃣ Отправляет ответ
   HTTP/1.1 200 OK
   Content-Type: application/x-amz-json-1.1
   {
     "Reservations": [
       {
         "Instances": [
           {
             "InstanceId": "i-0f1a2b3c4d5e6f7g8h",
             "InstanceType": "t3.micro",
             "State": { "Name": "running" },
             ...
           }
         ]
       }
     ]
   }

7️⃣ AWS SDK v3 парсит ответ
   - Конвертирует JSON в TypeScript объекты
   - Проверяет типы
   - Возвращает результат в `const data`
```

### LocalStack отличия

```
Когда мы используем LocalStack вместо AWS:

AWS:
  Endpoint: https://ec2.us-east-1.amazonaws.com
  Port: 443 (HTTPS)
  Location: AWS servers somewhere in us-east-1 region

LocalStack:
  Endpoint: http://localhost:4566
  Port: 4566 (HTTP, не HTTPS)
  Location: Локальный Docker контейнер на машине разработчика

Но процесс ОДИН И ТОТ ЖЕ:
  - Credentials формируются так же
  - Подпись рассчитывается так же
  - JSON формат один и тот же
  - Только endpoint другой!

Преимущество: Совершенно идентичное поведение для тестирования!
```

---

## 🔧 Rules Engine часть

### Как работают правила

```typescript
// rulesEngine() - главная функция для анализа ресурсов

function rulesEngine(assets: AWSAssets, costConfig: CostConfig): Alert[] {
  const alerts: Alert[] = [];

  console.log('🔍 Running Rules Engine...');

  // ПРАВИЛО 1: SSH/RDP 0.0.0.0/0 (CRITICAL)
  console.log('  📋 Evaluating Security Group rules (SSH/RDP)...');
  for (const sg of assets.securityGroups) {
    for (const rule of sg.IpPermissions || []) {
      const fromPort = rule.FromPort || 0;
      const toPort = rule.ToPort || 65535;
      
      // Проверяем SSH (порт 22)
      const sshOpen = [fromPort, toPort].includes(22) || (fromPort <= 22 && toPort >= 22);
      const worldOpen = rule.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0');
      
      if (sshOpen && worldOpen) {
        // ❌ ПРОБЛЕМА НАЙДЕНА!
        alerts.push({
          id: uuidv4(),
          type: 'SECURITY',
          severity: 'CRITICAL',
          title: 'SSH 0.0.0.0/0',
          description: `Security Group allows SSH from 0.0.0.0/0`,
          resourceId: sg.GroupId,
          ruleId: 'sec-001'
        });
      }
    }
  }
  
  console.log(`    ✓ Found ${alerts.length} SSH alerts`);

  // ПРАВИЛО 2: EBS Orphaned (MEDIUM)
  console.log('  💰 Evaluating EBS Volume utilization...');
  for (const volume of assets.volumes) {
    // Orphaned = не привязан к инстансу
    if ((volume.Attachments || []).length === 0) {
      const monthlyCost = (volume.Size || 0) * costConfig.PRICE_PER_GB;
      
      alerts.push({
        id: uuidv4(),
        type: 'FINOPS',
        severity: 'MEDIUM',
        title: `Orphaned EBS Volume (${volume.Size}GB)`,
        description: `EBS volume not attached - costing $${monthlyCost}/month`,
        resourceId: volume.VolumeId,
        ruleId: 'cost-001'
      });
    }
  }
  
  console.log(`    ✓ Found ${alerts.length} EBS alerts`);

  // ... и ещё ~10 правил

  return alerts;
}
```

### Процесс генерации каждого alert

```
Для каждого alert:

┌─────────────────────────────────┐
│ 1. ОБНАРУЖИТЬ проблему          │
│    (проверить условие правила)  │
└──────────┬──────────────────────┘
           ↓
┌─────────────────────────────────┐
│ 2. СОЗДАТЬ Alert объект         │
│    - id (UUID)                  │
│    - severity (CRITICAL/HIGH)   │
│    - title (короткое название)  │
│    - resourceId (какой ресурс)  │
│    - ruleId (какое правило)     │
└──────────┬──────────────────────┘
           ↓
┌─────────────────────────────────┐
│ 3. ДОБАВИТЬ в массив            │
│    alerts.push(alert)           │
└──────────┬──────────────────────┘
           ↓
┌─────────────────────────────────┐
│ 4. ЛОГИРОВАТЬ в консоль         │
│    console.log('✓ Found alert') │
└─────────────────────────────────┘
```

---

## 💾 Сохранение результатов

### Структура Audit документа в MongoDB

```javascript
{
  "_id": ObjectId("6674a1c2f8b2c3d4e5f6g7h8"),
  
  // Идентификация
  "scanId": "scan-1715689800000",
  "userId": ObjectId("6674a0b1e8b2c3d4e5f6g7h7"),
  "timestamp": ISODate("2024-05-14T14:30:00.000Z"),
  "region": "us-east-1",
  "isLocalStack": false,
  
  // Ресурсы
  "instances": [
    {
      "InstanceId": "i-0f1a2b3c4d5e6f7g8h",
      "InstanceType": "t3.large",
      "State": { "Name": "running" },
      "PublicIpAddress": "52.123.45.67",
      // ... остальные поля
    }
  ],
  "volumes": [...],
  "elasticIPs": [...],
  "securityGroups": [...],
  
  // Подсчёты
  "totalResources": 52,
  
  // Затраты
  "totalSpend": 5200.50,
  "wastedSpend": 1100.25,
  "potentialSavings": 1100.25,
  "costBreakdown": {
    "ec2Cost": 2100,
    "ebsCost": 2800.50,
    "eipCost": 300
  },
  
  // Health Score
  "healthScore": 78,
  "securityScore": 82,
  "costScore": 65,
  
  // Alerts
  "alerts": [
    {
      "id": "5c3a9b8f-7e6d-4c3b-a2f1-e9d8c7b6a5f4",
      "type": "SECURITY",
      "severity": "CRITICAL",
      "title": "SSH 0.0.0.0/0",
      "description": "Security group allows SSH from 0.0.0.0/0",
      "resourceId": "sg-0f1a2b3c4d5e6f7g8h",
      "resourceName": "default",
      "ruleId": "sec-001",
      "timestamp": ISODate("2024-05-14T14:30:15.000Z"),
      "metadata": {
        "port": 22,
        "protocol": "SSH",
        "groupId": "sg-0f1a2b3c4d5e6f7g8h"
      }
    },
    // ... остальные alerts
  ],
  
  // Резюме alerts
  "alertSummary": {
    "critical": 3,
    "high": 5,
    "medium": 8,
    "low": 2
  },
  
  // Метаданные
  "executionTimeMs": 5347,
  "prowlerUsed": false,
  
  // MongoDB timestamps
  "createdAt": ISODate("2024-05-14T14:30:20.000Z"),
  "updatedAt": ISODate("2024-05-14T14:30:20.000Z")
}
```

---

## ⏱️ Временные характеристики

### Типичная разбивка по времени

```
┌─ Frontend подготовка                 ≈ 10ms
│
├─ Network latency (фронтенд→бекенд)   ≈ 10-50ms
│
├─ Backend подготовка                  ≈ 20ms
│
├─ Создание AWS SDK clients            ≈ 30ms
│
├─ Параллельные AWS API запросы:
│  ├─ DescribeInstances (100 instances) ≈ 1000ms
│  ├─ DescribeVolumes (500 volumes)     ≈ 800ms
│  ├─ DescribeAddresses (50 IPs)        ≈ 200ms
│  └─ DescribeSecurityGroups (50 SGs)   ≈ 500ms
│
│  TOTAL (параллельно!) ≈ 1000ms (самый долгий)
│
├─ Rules Engine анализ                 ≈ 200ms
│
├─ Prowler (если установлен)           ≈ 2-10 minutes ⚠️
│
├─ Дедупликация alerts                 ≈ 50ms
│
├─ Расчёт метрик                       ≈ 100ms
│
├─ Сохранение в MongoDB                ≈ 200ms
│
├─ JSON сериализация результатов       ≈ 50ms
│
├─ Network latency (бекенд→фронтенд)   ≈ 10-50ms
│
└─ ИТОГО БЕЗ PROWLER: ≈ 2-3 СЕКУНДЫ ✅
   ИТОГО С PROWLER: ≈ 5-15 МИНУТ ⏳

```

### Как ускорить сканирование?

```
1️⃣ Используйте только LocalStack (вместо AWS):
   - Нет сетевых задержек
   - Локально на машине
   - Результаты за 1-2 секунды
   - ИДЕАЛЬНО для разработки

2️⃣ Отключите Prowler (если не нужна полная CIS проверка):
   - Remove/rename prowler executable
   - Используются встроенные правила (10-20 правил)
   - Время: 1-2 секунды вместо 5+ минут

3️⃣ Ограничьте регион:
   - По умолчанию сканирует весь регион
   - Если много ресурсов (10000+) → медленнее
   - Решение: сканируйте только нужные resource types

4️⃣ Кеш результатов:
   - Не сканируйте каждый раз
   - Кешируйте на 5-10 минут
   - Сканируйте только при изменениях
```

---

## 📊 Примеры реальных ответов

### Пример 1: Успешный скан (LocalStack)

```json
{
  "success": true,
  "data": {
    "scanId": "scan-1715689800000",
    "executionTimeMs": 1234,
    "metrics": {
      "totalResources": 8,
      "totalSpend": 450.50,
      "wastedSpend": 120.25,
      "potentialSavings": 120.25,
      "healthScore": 65,
      "securityScore": 58,
      "costScore": 72
    },
    "alertSummary": {
      "critical": 2,
      "high": 3,
      "medium": 5,
      "low": 1
    },
    "alerts": [
      {
        "id": "5c3a9b8f-7e6d-4c3b-a2f1-e9d8c7b6a5f4",
        "type": "SECURITY",
        "severity": "CRITICAL",
        "title": "SSH 0.0.0.0/0",
        "description": "Security group sg-12345abc allows SSH from 0.0.0.0/0",
        "resourceId": "sg-12345abc",
        "resourceName": "default",
        "ruleId": "sec-001"
      },
      {
        "id": "7a5f9c2e-1d3b-4e6a-b8f5-c9e1d2a3b4c5",
        "type": "FINOPS",
        "severity": "HIGH",
        "title": "Orphaned EIP",
        "description": "Elastic IP eipalloc-12345678 is not associated with any instance",
        "resourceId": "eipalloc-12345678",
        "ruleId": "cost-002",
        "metadata": {
          "monthlyCost": 3.60
        }
      }
      // ... остальные alerts
    ],
    "resources": {
      "ec2": [
        {
          "InstanceId": "i-0f1a2b3c4d5e6f7g8h",
          "InstanceType": "t2.micro",
          "State": { "Name": "running" }
        }
      ],
      "ebs": [
        {
          "VolumeId": "vol-12345678",
          "Size": 100,
          "Encrypted": false
        }
      ],
      "eip": [
        {
          "PublicIp": "52.123.45.67",
          "AssociationId": null
        }
      ],
      "sgs": [
        {
          "GroupId": "sg-12345abc",
          "GroupName": "default"
        }
      ]
    }
  }
}
```

### Пример 2: Ошибка (Invalid Credentials)

```json
{
  "success": false,
  "error": "Invalid Access Key ID",
  "code": "INVALID_CREDENTIALS"
}
```

### Пример 3: Ошибка (LocalStack not running)

```json
{
  "success": false,
  "error": "connect ECONNREFUSED 127.0.0.1:4566",
  "code": "CONNECTION_ERROR"
}
```

---

## 🎓 Дополнительное

### Console output при успешном сканировании

```
================================================================================
📨 /api/scan - CSPM & FinOps Scan Initiated
================================================================================
🔐 Credentials provided: ✓
🔧 Environment: ☁️  AWS | Region: us-east-1

🔧 STEP 1: Creating AWS SDK clients...

🔧 EC2 Client Config: {
  region: 'us-east-1',
  hasCredentials: true,
  endpoint: 'AWS (default)'
}

📡 STEP 2: Fetching AWS Infrastructure Data...

  🖥️  Fetching EC2 Instances...
      ✓ Found 12 instances (1023ms)
  📦 Fetching EBS Volumes...
      ✓ Found 25 volumes (845ms)
  💰 Fetching Elastic IPs...
      ✓ Found 5 EIPs (215ms)
  🔒 Fetching Security Groups...
      ✓ Found 10 security groups (520ms)

✅ All AWS API calls completed
📊 Total resources fetched: 52

🔍 STEP 3: Running built-in rules engine...

🔍 Running Rules Engine...
  📋 Evaluating Security Group rules (SSH/RDP)...
    ✓ Found 2 security alerts
  📋 Evaluating permissive Security Group rules (DB, HTTP, etc)...
    ✓ Found 1 permissive rule alerts
  🔐 Evaluating EBS Volume encryption...
    ✓ Found 2 unencrypted volume alerts
  🌐 Evaluating public EC2 instances...
    ✓ Found 1 public instance alerts
  💰 Evaluating EBS Volume utilization...
    ✓ Found 3 EBS wastage alerts
  💰 Evaluating Elastic IP utilization...
    ✓ Found 2 Elastic IP wastage alerts
  📋 Evaluating Security Group usage...
    ✓ Found 1 unused security group alerts
  🟡 Evaluating security best practices (MEDIUM)...
    ✓ Found 2 medium severity alerts
  🔴 Evaluating public instance exposure (HIGH)...
    ✓ Found 1 high severity alerts
  ℹ️  Generating optimization recommendations...
    ✓ Found 2 recommendation alerts

✅ Rules Engine complete: 17 total alerts generated

✅ Generated 17 built-in alerts

🔍 STEP 4: Checking for Prowler CIS Benchmark...

📌 Prowler not installed - using built-in rules only

🔍 STEP 5: Running extended security rules...

✅ Generated 3 extended alerts

🔄 STEP 6: Deduplicating alerts...

✅ Total alerts after deduplication: 19

📊 STEP 7: Calculating metrics...

✅ Total Spend: $5200.50
✅ Wasted Spend: $1100.25
✅ Health Score: 78/100

💾 STEP 8: Saving scan to MongoDB...

✅ Audit saved: scan-1715689800000

================================================================================
✅ SCAN COMPLETED in 5347ms
================================================================================
```

---

**Версия документа:** 1.0  
**Последнее обновление:** Май 2024  
**Автор:** AWS Optimizer Development Team
