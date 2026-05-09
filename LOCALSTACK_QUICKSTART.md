# 🎉 LocalStack + MongoDB - Полный Setup Guide

## ✅ Текущий статус

```
✅ Backend: http://localhost:5000
✅ Frontend: http://localhost:5174  
✅ MongoDB: mongodb://127.0.0.1:27017/aws_optimizer (подключена!)
✅ LocalStack: http://127.0.0.1:4566
✅ Test Resources: 8 ресурсов созданы в LocalStack
✅ Settings Form: Полная форма для AWS credentials с LocalStack поддержкой
```

---

## 🚀 Быстрый старт (5 минут)

### 1️⃣ Откройте браузер на http://localhost:5174

Вы увидите экран "Unable to Fetch Security Data - AWS credentials not configured"

### 2️⃣ Нажмите Settings (левое меню)

### 3️⃣ Заполните форму

```
┌─ AWS Credentials ─────────────────┐
│                                  │
│ 📝 Access Key ID:     test        │
│ 📝 Secret Access Key: test        │
│ 📍 Region:            us-east-1   │
│                                  │
├─ LocalStack Config ──────────────┤
│                                  │
│ ☑️  Use LocalStack                │
│ 🔗 Endpoint: http://localhost:4566│
│                                  │
└──────────────────────────────────┘
```

### 4️⃣ Нажмите кнопки

- ✅ **Save Credentials** - сохранить конфигурацию
- 🔗 **Test Connection** - проверить подключение
- ✕ **Clear** - очистить поля

### 5️⃣ Перейдите на Security (левое меню)

Система автоматически запустит сканирование LocalStack ресурсов

### 6️⃣ Просмотрите результаты

Вы должны увидеть:

```
📊 Security Alerts:
   ✅ Found 0 critical issues
   ✅ Found 0 high severity issues
   
💰 Cost Alerts:
   ⚠️ Unused EBS Volumes: 2 alerts ($0.40/month can be saved)
   ⚠️ Unused Elastic IPs: 1 alert ($3.60/month can be saved)
   
   🎯 Total Potential Savings: $4.00/month
```

---

## 🎨 SettingsPage Features

### New Settings Form включает:

✅ **Access Key ID поле**
- Вводит ваш AWS или LocalStack Access Key
- Сохраняется в sessionStorage
- Обязательное поле для сканирования

✅ **Secret Access Key поле**
- Вводит Secret Key (скрывается как пароль)
- Обязательное поле

✅ **Region Dropdown**
- Выбор AWS региона
- Default: us-east-1
- Поддерживает все основные регионы

✅ **Use LocalStack Checkbox**
- Включение/отключение LocalStack режима
- При включении показывает endpoint поле

✅ **LocalStack Endpoint поле**
- Адрес LocalStack сервера
- Default: http://localhost:4566
- Видно только если LocalStack включён

✅ **Test Connection Button**
- Проверяет подключение к backend
- Отправляет пробный сканирование
- Показывает количество найденных алертов
- Индикатор "Testing..." во время запроса

✅ **Success/Error Messages**
- Зелёное сообщение при успехе
- Красное сообщение при ошибке
- Автоматически исчезает через 3 секунды

---

## 📊 Что видите при сканировании LocalStack

Система проверяет 7 правил и найдёт:

### ✅ ALERTS FOUND (в вашем текущем setupe):

```
🟡 WARNING - Unused EBS Volumes: 2
  ├─ vol-4246845b4b7c987f0 (5GB) = $0.40/month
  └─ vol-6682b3abe681f132c (5GB) = $0.40/month

🟡 WARNING - Unused Elastic IPs: 1
  └─ 127.43.20.236 = $3.60/month
```

### ❌ NO ALERTS (из-за LocalStack ограничений):

```
❌ SSH/RDP Exposed to World (CRITICAL)
   → LocalStack не имеет публичных портов

❌ Database Ports Exposed (HIGH)
   → Нет открытых БД портов в тесте

❌ Unencrypted EBS Volumes (HIGH)
   → LocalStack не проверяет encryption флаг

❌ Public Instances with SSH (WARNING)
   → Нет публичных инстансов в тесте

❌ Unused Security Groups (INFO)
   → Есть только default SG
```

---

## 🎯 Как добавить больше тестовых сценариев

### Сценарий 1: Добавить Security Group с открытым SSH

```bash
# Отредактируйте server/src/create-test-resources.ts
# И добавьте:

const sgResult = await ec2.send(
  new CreateSecurityGroupCommand({
    GroupName: 'open-ssh-sg',
    Description: 'Security group with SSH exposed to world',
  })
);

await ec2.send(
  new AuthorizeSecurityGroupIngressCommand({
    GroupId: sgResult.GroupId,
    IpPermissions: [{
      IpProtocol: 'tcp',
      FromPort: 22,
      ToPort: 22,
      IpRanges: [{ CidrIp: '0.0.0.0/0' }],
    }],
  })
);
```

Потом создайте ресурсы снова:
```bash
npx ts-node src/create-test-resources.ts
```

---

## 🔧 Отладка проблем

### Проблема: Settings форма показывает ошибку при сохранении

**Решение:**
```
1. Убедитесь что оба поля заполнены (Access Key + Secret Key)
2. Нажмите "Save Credentials"
3. Должна появиться зелёная полоса "✅ Credentials saved successfully!"
```

### Проблема: Test Connection не работает

**Решение:**
```
1. Убедитесь что backend запущен (Terminal 1)
2. Проверьте что MongoDB запущена: mongosh
3. Проверьте что LocalStack запущен: docker ps | grep localstack
4. Попробуйте снова нажать "Test Connection"
```

### Проблема: Security page показывает "Unable to Fetch"

**Решение:**
```
1. Сохраните уже credentials в Settings
2. Убедитесь что "Use LocalStack" включён
3. Проверьте что LocalStack endpoint правильный: http://localhost:4566
4. Перезагрузите страницу (Ctrl+R)
5. Нажмите Rescan на Security page
```

### Проблема: Не видны созданные тестовые ресурсы

**Решение:**
```
# Проверьте что ресурсы на месте
aws ec2 describe-volumes --endpoint-url=http://localhost:4566

# Если ничего не видно, создайте снова
cd server
npx ts-node src/create-test-resources.ts
```

---

## 📈 Дальнейшее использование

### Для тестирования новых правил:

1. ✏️ Отредактируйте `server/src/create-test-resources.ts`
2. 🔧 Добавьте новые ресурсы с проблемами
3. 🚀 Запустите: `npx ts-node src/create-test-resources.ts`
4. 🔄 Вернитесь на Security page и нажмите Rescan
5. ✅ Убедитесь что новые алерты появились

### Примеры добавляемых сценариев:

```typescript
// Открыть MySQL порт для всей интернета
{
  IpProtocol: 'tcp',
  FromPort: 3306,
  ToPort: 3306,
  IpRanges: [{ CidrIp: '0.0.0.0/0' }],
}

// Открыть PostgreSQL порт
{
  IpProtocol: 'tcp',
  FromPort: 5432,
  ToPort: 5432,
  IpRanges: [{ CidrIp: '0.0.0.0/0' }],
}

// Открыть большой диапазон портов
{
  IpProtocol: 'tcp',
  FromPort: 1000,
  ToPort: 2000, // 1000 портов = MEDIUM alert
  IpRanges: [{ CidrIp: '0.0.0.0/0' }],
}
```

---

## 🌐 Полный флоу использования

```
START
  ↓
User navigates to http://localhost:5174
  ↓
Sees "AWS credentials not configured" error
  ↓
Clicks Settings button
  ↓
SettingsPage loads with empty form
  ↓
User fills form:
  - Access Key: test
  - Secret Key: test
  - Use LocalStack: ✓
  - Endpoint: http://localhost:4566
  ↓
Clicks "Save Credentials"
  ↓
✅ Message: "Credentials saved successfully!"
  ↓
User clicks "Test Connection"
  ↓
System sends test request to /api/scan
  ↓
Backend connects to LocalStack
  ↓
Finds 3 alerts (2 unused volumes, 1 unused IP)
  ↓
✅ Message: "Connection OK! Found 3 alerts"
  ↓
User navigates to Security page
  ↓
System auto-runs full scan
  ↓
Shows results:
  - Alerts Tab: Security findings
  - Logs Tab: Event timeline with savings
  ↓
User sees breakdown:
  💰 Total Savings: $4.00/month
  ⚠️  2 Unused EBS volumes
  ⚠️  1 Unused Elastic IP
  ↓
END
```

---

## 🎓 Key Commands Reference

```bash
# Check LocalStack is running
docker ps | grep localstack

# Check MongoDB is running
mongosh

# Restart LocalStack
docker stop $(docker ps -q --filter ancestor=localstack/localstack)
docker run -d -p 4566:4566 localstack/localstack

# Restart MongoDB
pkill mongod
mongod --dbpath /data/db

# View LocalStack resources
aws ec2 describe-volumes --endpoint-url=http://localhost:4566
aws ec2 describe-instances --endpoint-url=http://localhost:4566
aws ec2 describe-addresses --endpoint-url=http://localhost:4566

# View MongoDB data
mongosh
use aws_optimizer
db.audits.find().pretty()
db.audits.deleteMany({})  # Clear all scans
```

---

## 🎉 Done! You're Ready!

Теперь вы полностью готовы тестировать систему:

1. ✅ Backend работает на http://localhost:5000
2. ✅ Frontend работает на http://localhost:5174
3. ✅ MongoDB подключена и хранит данные
4. ✅ LocalStack имеет 8 тестовых ресурсов
5. ✅ SettingsPage позволяет конфигурировать credentials
6. ✅ Security page сканирует LocalStack и показывает результаты

**Следующий шаг:** Откройте http://localhost:5174/settings и заполните форму! 🚀

---

**Date:** April 14, 2026  
**Status:** ✅ Complete & Ready to Use  
**Version:** LocalStack 1.0 with Full UI
