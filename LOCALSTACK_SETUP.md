# 🐳 LocalStack Setup - Полная инструкция

## ✅ Текущий статус

```
✅ Backend: http://localhost:5000
✅ Frontend: http://localhost:5174  
✅ MongoDB: mongodb://127.0.0.1:27017/aws_optimizer
✅ LocalStack: http://127.0.0.1:4566
✅ Test Resources: Созданы в LocalStack
```

---

## 🚀 Как использовать систему локально

### Шаг 1️⃣: Откройте браузер

Откройте **http://localhost:5174**

Будет показано: "Unable to Fetch Security Data - AWS credentials not configured"

### Шаг 2️⃣: Перейдите в Settings

В левом меню нажмите **Settings** tab

### Шаг 3️⃣: Заполните LocalStack Credentials

```
✏️ AWS Access Key ID:     test
✏️ AWS Secret Access Key: test
✏️ Region:                us-east-1
☑️ Use LocalStack:        ✓ (ВКЛЮЧИТЬ!)
✏️ LocalStack Endpoint:   http://localhost:4566
```

Нажмите **Save**

### Шаг 4️⃣: Перейдите на Security page

В левом меню нажмите **Security** tab

Система автоматически запустит сканирование тестовых ресурсов

### Шаг 5️⃣: Просмотрите результаты

Вы должны увидеть:

```
🔴 Security Alerts (Alerts tab):
   - Unused EBS Volumes (2 шт - vol-4246845b... и vol-6682b3ab...)
   - Unused Elastic IPs (1 шт - 127.43.20.236)

📋 Event Logs (Logs tab):
   - Timeline событий с временными метками
   - Cost savings информация для каждого ресурса
```

---

## 📊 Тестовые ресурсы которые были созданы

```
EBS Volumes:
├─ vol-3c21eae7e7b4d8276 (15GB) - ИСПОЛЬЗУЕТСЯ
├─ vol-9f9b8a234037818ce (20GB) - ИСПОЛЬЗУЕТСЯ  
├─ vol-9226ade20d73ae222 (25GB) - ИСПОЛЬЗУЕТСЯ
├─ vol-4246845b4b7c987f0 (5GB)  - НЕИСПОЛЬЗУЕМЫЙ ❌
└─ vol-6682b3abe681f132c (5GB)  - НЕИСПОЛЬЗУЕМЫЙ ❌

EC2 Instances:
└─ i-7adc5cea4a77a3a10 (t2.micro)

Elastic IPs:
└─ 127.43.20.236 (НЕИСПОЛЬЗУЕМЫЙ) ❌

Security Groups:
├─ default
└─ (может быть добавлены при создании инстансов)
```

---

## 🎯 Что будет отсканировано

Система проверит все 7 правил:

✅ **Rule 1:** SSH/RDP exposed → Не будет алертов (LocalStack не имеет публичных портов)

✅ **Rule 2:** DB ports exposed → Не будет алертов

✅ **Rule 3:** Unencrypted EBS → Не будет алертов (LocalStack не проверяет encryption флаг)

✅ **Rule 4:** Public instances → Не будет алертов  

✅ **Rule 5:** Unused EBS Volumes → **2 алерта!** ✨
   - vol-4246845b4b7c987f0 (5GB) = $0.40/месяц
   - vol-6682b3abe681f132c (5GB) = $0.40/месяц
   - **Всего экономия: $0.80/месяц**

✅ **Rule 6:** Unused Elastic IPs → **1 алерт!** ✨
   - 127.43.20.236 = $3.60/месяц
   - **Экономия: $3.60/месяц**

✅ **Rule 7:** Unused Security Groups → Зависит от конфигурации

**Total Estimated Savings: $4.40/месяц**

---

## 🔧 Команды для управления LocalStack

### Просмотреть ресурсы в LocalStack

```bash
# EC2 Instances
aws ec2 describe-instances --endpoint-url=http://localhost:4566

# EBS Volumes  
aws ec2 describe-volumes --endpoint-url=http://localhost:4566

# Elastic IPs
aws ec2 describe-addresses --endpoint-url=http://localhost:4566

# Security Groups
aws ec2 describe-security-groups --endpoint-url=http://localhost:4566
```

### Удалить тестовые ресурсы (если нужно)

```bash
# Удалить EBS том
aws ec2 delete-volume --volume-id vol-4246845b4b7c987f0 \
  --endpoint-url=http://localhost:4566

# Удалить Elastic IP
aws ec2 release-address --allocation-id eipalloc-d06c514aca5f3ca00 \
  --endpoint-url=http://localhost:4566

# Terminate EC2 инстанс
aws ec2 terminate-instances --instance-ids i-7adc5cea4a77a3a10 \
  --endpoint-url=http://localhost:4566
```

### Создать новые тестовые ресурсы

```bash
# Снова запустить скрипт создания
cd server
npx ts-node src/create-test-resources.ts
```

---

## 🐛 Troubleshooting

### Ошибка: "Cannot connect to MongoDB"

**Решение:**
```bash
# Проверьте что MongoDB запущен
mongosh  # или mongo

# Если не работает, установите MongoDB Community
# https://docs.mongodb.com/manual/installation/
```

### Ошибка: "Cannot connect to LocalStack"

**Решение:**
```bash
# Проверьте что LocalStack запущен
docker ps | grep localstack

# Если не запущен:
docker run -d -p 4566:4566 localstack/localstack
```

### Ошибка: "Connection refused" при сканировании

**Решение:**
1. Убедитесь что LocalStack работает: `http://127.0.0.1:4566/_localstack/version`
2. Убедитесь что в Settings включено "Use LocalStack"
3. Проверьте .env файл:
```
AWS_ENDPOINT=http://127.0.0.1:4566
MONGO_URI=mongodb://127.0.0.1:27017/aws_optimizer
```

### Backend не показывает логи

**Решение:**
Проверьте что `npm run dev` был запущен в папке `server/`

```bash
cd server
npm run dev
```

---

## 📈 Как добавить ещё ресурсов для тестирования

Отредактируйте `server/src/create-test-resources.ts` и добавьте:

### Пример: Добавить Security Group с открытым SSH

```typescript
console.log('\n🔐 Создаём Security Group...');
const sgResult = await ec2.send(
  new CreateSecurityGroupCommand({
    GroupName: 'test-web-sg',
    Description: 'Test security group with SSH exposed',
    VpcId: 'vpc-12345678', // Или оставить пустым для default
  })
);

// Открыть SSH для всех
await ec2.send(
  new AuthorizeSecurityGroupIngressCommand({
    GroupId: sgResult.GroupId,
    IpPermissions: [
      {
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        IpRanges: [{ CidrIp: '0.0.0.0/0' }],
      },
    ],
  })
);
console.log(`   ✅ Создана Security Group: ${sgResult.GroupId}`);
```

Затем запустите:
```bash
npx ts-node src/create-test-resources.ts
```

---

## 🎓 Полный флоу использования

```
1. LocalStack работает на http://127.0.0.1:4566
   ↓
2. Backend подключается к LocalStack
   ↓
3. Создаём тестовые ресурсы в LocalStack
   ↓
4. Frontend запускает сканирование
   ↓
5. Backend получает credentials с флагом "useLocalStack=true"
   ↓
6. rulesEngine() анализирует ресурсы из LocalStack
   ↓
7. Генерируются алерты и сохраняются в MongoDB
   ↓
8. Frontend отображает результаты (Alerts + Logs)
   ↓
9. Пользователь видит найденные проблемы и может их удалить
```

---

## 📝 Что делать дальше

### Тестирование системы

- [ ] Проверить что система находит Unused EBS volumes
- [ ] Проверить что система находит Unused Elastic IPs
- [ ] Попробовать фильтровать алерты по severity
- [ ] Проверить Event Logs таб и временные метки
- [ ] Нажать Export и скачать PDF отчёт

### Добавление новых сценариев

- [ ] Создать Security Group с открытым SSH (будет CRITICAL алерт)
- [ ] Создать Security Group с открытой БД (будет HIGH алерт)  
- [ ] Создать том без шифрования (будет HIGH алерт)
- [ ] Создать публичный инстанс с SSH (будет WARNING)

### Наблюдение логов

**Backend логи:**
```
Terminal 1: npm run dev (server/)
Смотрите вывод для: "🔍 Running Rules Engine..."
```

**Frontend логи:**
```
Browser DevTools (F12 → Console)
Смотрите: POST http://localhost:5000/api/scan
```

**MongoDB:**
```bash
mongosh
use aws_optimizer
db.audits.find().pretty()  # Просмотреть последний сканирование
```

---

## 🎉 Готово!

Система полностью настроена для локального тестирования через LocalStack + MongoDB!

**Следующий шаг:** Откройте http://localhost:5174 в браузере и запустите сканирование. 

Вы должны увидеть алерты о неиспользуемых ресурсах. 🎯

---

**Дата:** 14 апреля 2026  
**Статус:** ✅ Полностью готово  
**Версия:** LocalStack 1.0
