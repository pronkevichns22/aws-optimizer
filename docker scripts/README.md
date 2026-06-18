# 📦 AWS Optimizer Scripts

Набор утилит и скриптов для автоматизации работы с AWS Optimizer.

---

## 📁 Файлы в этой папке

| Файл | Описание |
|------|---------|
| **`generate-massive-infra.sh`** | Генерация тестовой инфраструктуры с рисками (40+ инстансов, 240+ томов) |
| **`extended-ideas.md`** | Идеи для расширения функциональности |
| **`README.md`** | Этот файл |

---

## 🎯 generate-massive-infra.sh

Комплексный скрипт для создания реалистичной AWS инфраструктуры с:
- Проблемами безопасности (открытые порты, незашифрованные диски)
- Проблемами стоимости (неиспользуемые ресурсы, неоптимальные типы)
- Проблемами соответствия (нарушения лучших практик)

### 📊 Что создается

#### 1️⃣ EC2 Инстансы (40 штук)
```
✅ 15 Web серверов          (t3.medium - нормальные)
✅ 10 Database кластеров    (m5.4xlarge - дорогие)
✅ 5 AI/GPU рабочих         (p3.8xlarge - ОЧЕНЬ дорогие)
✅ 10 Stopped инстансов     (t3.large - забытые/dev)
```

**Проблемы**: Неправильные типы, stopped инстансы без причины, GPU без использования

#### 2️⃣ EBS Тома (240+ штук)
```
✅ 15 Больших резервных копий      (io1 4000GB, 5000 IOPS - $$$)
✅ 40 Заброшенных проектов         (gp3 1500GB)
✅ 80 Dev leftover томов           (gp2 50GB каждый)
✅ 50 Test/staging томов           (gp3 200GB)
```

**Проблемы**: Неиспользуемые ресурсы, неправильные типы, нет управления жизненным циклом

#### 3️⃣ Незашифрованные EBS Тома (25 штук)
```
✅ 25 Production дисков БЕЗ шифрования (gp3 300GB)
```

**Проблемы**: 🔓 Критические риски безопасности, данные открыты

#### 4️⃣ Security Groups (7 уязвимых групп)
```
🔴 SSH открыт для всего мира       (0.0.0.0/0 на порту 22)
🔴 RDP открыт для всего мира       (0.0.0.0/0 на порту 3389)
🔴 Базы данных открыты             (MySQL 3306, PostgreSQL 5432, MongoDB 27017)
🔴 Redis открыт                    (порт 6379 для 0.0.0.0/0)
🟡 HTTP без HTTPS                  (порт 80 открыт)
🟡 Большой диапазон портов         (1000-65535)
🔴 ANY TRAFFIC (КРИТИЧНО)          (все TCP и UDP портов открыты!)
```

**Проблемы**: Максимальная экспозиция, нарушение security group best practices

#### 5️⃣ Elastic IPs (100 штук)
```
✅ 100 неиспользуемых EIP (не привязаны к ничему)
```

**Стоимость**: ~$360/месяц за неиспользуемые IPs

#### 6️⃣ EBS Snapshots
```
✅ 10 snapshots старых резервных копий (без использования)
```

**Проблемы**: Занимают хранилище, добавляют расходы

---

## 🚀 Как использовать

### Вариант 1: Быстрый запуск через Docker

```bash
# Скопировать скрипт в LocalStack контейнер
docker cp generate-massive-infra.sh localstack:/tmp/

# Запустить сразу в контейнере
docker exec -it localstack bash /tmp/generate-massive-infra.sh
```

### Вариант 2: Обычный запуск

```bash
# Войти в контейнер
docker exec -it localstack bash

# Перейти в папку и запустить
bash /tmp/generate-massive-infra.sh

# Или напрямую
cd /scripts && bash generate-massive-infra.sh
```

### Вариант 3: Через docker-compose

```bash
# Если используете сервис с именем "localstack"
docker-compose exec localstack bash /tmp/generate-massive-infra.sh
```

---

## ✅ Проверка созданных ресурсов

### В контейнере LocalStack

```bash
# Войти в контейнер
docker exec -it localstack bash

# Проверить инстансы
awslocal ec2 describe-instances \
  --query 'Reservations[].Instances[].[InstanceId,InstanceType,Tags[0].Value]' \
  --output table

# Проверить тома
awslocal ec2 describe-volumes \
  --query 'Volumes[].[VolumeId,Size,VolumeType,State]' \
  --output table

# Проверить Elastic IPs
awslocal ec2 describe-addresses \
  --query 'Addresses[].[AllocationId,PublicIp,AssociationId]' \
  --output table

# Проверить Security Groups
awslocal ec2 describe-security-groups \
  --query 'SecurityGroups[].[GroupId,GroupName,IpPermissions[].FromPort]' \
  --output table

# Проверить Snapshots
awslocal ec2 describe-snapshots \
  --query 'Snapshots[].[SnapshotId,StartTime,VolumeSize]' \
  --output table
```

### Подсчет ресурсов

```bash
# Количество инстансов
awslocal ec2 describe-instances --query 'Reservations[].Instances[]' --output text | wc -l

# Количество томов
awslocal ec2 describe-volumes --query 'Volumes[]' --output text | wc -l

# Количество EIPs
awslocal ec2 describe-addresses --query 'Addresses[]' --output text | wc -l

# Количество Security Groups
awslocal ec2 describe-security-groups --query 'SecurityGroups[]' --output text | wc -l
```

---

## 🔍 Запуск сканирования в AWS Optimizer

### Метод 1: Через UI

1. 🌐 Откройте AWS Optimizer в браузере: http://localhost:5173
2. 📱 Зайдите в аккаунт (регистрация → логин)
3. 🖥️ Перейдите на страницу **Dashboard** или **Security**
4. 🔄 Нажмите кнопку **Rescan** или **Scan AWS**
5. ⏳ Дождитесь завершения сканирования (~1-2 минуты)

### Метод 2: Через API

```bash
# Начать сканирование
curl -X POST http://localhost:5000/api/resources/scan \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# Получить результаты сканирования
curl http://localhost:5000/api/resources/scan-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Получить список ресурсов
curl http://localhost:5000/api/resources \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Получить уязвимости
curl http://localhost:5000/api/security/alerts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📊 Ожидаемые результаты сканирования

После запуска скрипта и сканирования вы должны увидеть:

| Уровень | Количество | Примеры |
|---------|-----------|---------|
| 🔴 **CRITICAL** | 20+ | SSH/RDP открыт, ANY TRAFFIC, данные без шифрования |
| 🔴 **HIGH** | 30+ | DB порты открыты, неиспользуемые ресурсы, неправильные типы |
| 🟡 **MEDIUM** | 15+ | HTTP без HTTPS, большие диапазоны портов |
| 🟠 **WARNING** | 60+ | Неиспользуемые EBS, stopped инстансы, orphaned snapshots |
| ℹ️ **INFO** | 15+ | Рекомендации по оптимизации, лучшие практики |

---

## 🛠️ Модификация скрипта

### Изменить количество ресурсов

```bash
# Отредактировать скрипт
nano generate-massive-infra.sh

# Найти строки вида:
# for i in {1..15}; do ... done

# Изменить числа на нужные вам:
# for i in {1..30}; do ... done  # 30 вместо 15
```

### Добавить новые ресурсы

```bash
# Добавить S3 бакеты
awslocal s3 mb s3://my-bucket-name

# Добавить Lambda функции
awslocal lambda create-function \
  --function-name my-function \
  --runtime python3.9 \
  --role arn:aws:iam::000000000000:role/lambda
```

---

## 🧹 Очистка ресурсов

### Удалить ВСЕ созданные ресурсы

```bash
# Войти в контейнер
docker exec -it localstack bash

# Удалить инстансы
awslocal ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --output text | \
  xargs -I {} awslocal ec2 terminate-instances --instance-ids {}

# Удалить неиспользуемые тома
awslocal ec2 describe-volumes --filters Name=status,Values=available --query 'Volumes[].VolumeId' --output text | \
  xargs -I {} awslocal ec2 delete-volume --volume-id {}

# Удалить EIPs
awslocal ec2 describe-addresses --query 'Addresses[].AllocationId' --output text | \
  xargs -I {} awslocal ec2 release-address --allocation-id {}

# Удалить Security Groups (кроме default)
awslocal ec2 describe-security-groups --filters Name=group-name,Values=default --invert --query 'SecurityGroups[].GroupId' --output text | \
  xargs -I {} awslocal ec2 delete-security-group --group-id {}

# Удалить Snapshots
awslocal ec2 describe-snapshots --query 'Snapshots[].SnapshotId' --output text | \
  xargs -I {} awslocal ec2 delete-snapshot --snapshot-id {}
```

### Полная очистка (пересоздать LocalStack)

```bash
# Остановить и удалить контейнер
docker-compose down localstack

# Пересоздать
docker-compose up -d localstack

# Подождать инициализации
sleep 10

# Запустить скрипт заново
docker exec -it localstack bash /tmp/generate-massive-infra.sh
```

---

## 📝 Примеры вывода

### Успешное выполнение скрипта

```
╔═══════════════════════════════════════════════════════════════════════╗
║   🔥 CLOUDOPTI: MASSIVE INFRASTRUCTURE GENERATION 🔥                 ║
║   Creating realistic AWS environment with all risk categories        ║
╚═══════════════════════════════════════════════════════════════════════╝

[1/8] 🖥️  Booting up 40 EC2 Instances...
   ✅ 15 Web servers created (t3.medium)
   ✅ 10 Database clusters created (m5.4xlarge - EXPENSIVE)
   ✅ 5 AI/GPU workers created (p3.8xlarge - VERY EXPENSIVE)
   ✅ 10 Stopped instances created (forgotten/dev)

[2/8] 💾 Generating 200+ Unattached EBS Volumes...
   ✅ 15 Huge IO1 backups (4000GB @ io1 = $$$)
   ✅ 40 Abandoned project volumes (1500GB gp3)
   ✅ 80 Small gp2 volumes (50GB each - dev cleanup)
   ✅ 50 Test volumes (200GB gp3)

[3/8] 🔓 Creating Unencrypted EBS Volumes (SECURITY RISK)...
   ✅ 25 Unencrypted production volumes (300GB gp3)

...

📊 CREATED RESOURCES SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥️  EC2 INSTANCES: 40
💾 EBS VOLUMES: 245
🌐 ELASTIC IPs: 100
🔐 SECURITY GROUPS: 8

🎯 EXPECTED ALERTS IN AWS OPTIMIZER:
   🔴 CRITICAL: 20+ alerts
   🔴 HIGH: 30+ alerts
   🟡 MEDIUM: 15+ alerts
   🟠 WARNING: 60+ alerts
```

---

## 🐛 Troubleshooting

| Проблема | Решение |
|----------|---------|
| **script: command not found** | `bash generate-massive-infra.sh` вместо `./generate-massive-infra.sh` |
| **awslocal: command not found** | LocalStack не инициализирован, подождите и повторите |
| **Connection refused** | LocalStack не запущен - `docker-compose up -d localstack` |
| **Permission denied** | Добавить права - `chmod +x generate-massive-infra.sh` |
| **Docker: Cannot connect** | Проверить Docker daemon - `docker ps` |

---

## 📚 Дополнительные ресурсы

- **LocalStack документация**: https://docs.localstack.cloud/
- **AWS CLI Reference**: https://docs.aws.amazon.com/cli/latest/reference/
- **AWS Best Practices**: https://aws.amazon.com/architecture/well-architected/

---

## 🤝 Поддержка

Если у вас есть вопросы или проблемы, откройте Issue в репозитории.

## 📊 Что создается скрипт

### EC2 Instances (40 штук)
- 15 Web servers (t3.medium - нормальная цена)
- 10 Database clusters (m5.4xlarge - **дорого**)
- 5 AI/GPU workers (p3.8xlarge - **очень дорого**)
- 10 Stopped instances (забытые разработчиком)

### EBS Volumes (240+ штук)
- 15 огромных io1 бэкапов (4000GB @ io1 = $$$$) - **финансовые потери**
- 40 заброшенных проектов (1500GB gp3) - **финансовые потери**
- 80 мелких разработчика (50GB gp2) - **беспорядок**
- 50 тестовых томов (200GB gp3) - **финансовые потери**
- 25 **незашифрованных** production томов (300GB) - **HIGH SECURITY RISK**

### Security Groups (7 уязвимых)
- ✅ SSH открыт всему миру 0.0.0.0/0 - **CRITICAL**
- ✅ RDP открыт всему миру 0.0.0.0/0 - **CRITICAL**
- ✅ MySQL, PostgreSQL, MongoDB открыты 0.0.0.0/0 - **HIGH**
- ✅ Redis открыт всему миру - **HIGH**
- ✅ HTTP без HTTPS - **MEDIUM**
- ✅ Большие port ranges 1000-65535 - **MEDIUM**
- ✅ ANY traffic (все TCP+UDP) - **CRITICAL**

### Elastic IPs (100 штук)
- Все **не привязаны** ничему
- Стоят **$3.60/месяц каждый**
- Всего потерь: **$360/месяц** (~$4,320/год)

## 🎯 Ожидаемые результаты

После сканирования в AWS Optimizer должны появиться:

```
🔴 CRITICAL ALERTS (20+)
   ✓ SSH publicly accessible
   ✓ RDP publicly accessible  
   ✓ Any traffic allowed (all TCP+UDP)
   ✓ Multiple public instances with admin ports

🔴 HIGH ALERTS (30+)
   ✓ Database ports exposed
   ✓ Redis port exposed
   ✓ 25 Unencrypted EBS volumes
   ✓ Multiple instances at risk

🟡 MEDIUM ALERTS (15+)
   ✓ Large port ranges exposed
   ✓ HTTP without HTTPS
   ✓ Overly permissive configurations

🟠 WARNING ALERTS (60+)
   ✓ 185 unused/unattached volumes
   ✓ 100 unassociated Elastic IPs (~$360/month waste)
   ✓ 10 stopped instances
   ✓ Abandoned project volumes

ℹ️  INFO ALERTS (15+)
   ✓ Cost optimization opportunities
   ✓ Unused snapshots
   ✓ Infrastructure cleanup recommendations

ВСЕГО: 140+ алертов для анализа
```

## 💰 Приблизительные расходы

```
EC2 Instances:
  - 15 web servers (t3.medium @ ~$30/mo):     $450
  - 10 DB clusters (m5.4xlarge @ ~$600/mo):  $6,000 ⚠️
  - 5 GPU workers (p3.8xlarge @ ~$12K/mo):  $60,000 ⚠️⚠️
  - 10 stopped instances:                         $0

EBS Storage:
  - 240 volumes @ avg $0.08/GB/month:      ~$2,500 ⚠️

Elastic IPs:
  - 100 unused @ $3.60/month:              ~$360 ⚠️

────────────────────────────────────
TOTAL MONTHLY: ~$69,310 (~$830K/year) 📊
WITH OPTIMIZATION: Could save 40-60%
```

## 🔧 Если скрипт не работает

### Проблема: Command not found (awslocal)
```bash
# Решение: установить awslocal CLI внутри контейнера
pip install awscli-local
# или
npm install -g awscli-local
```

### Проблема: Connection refused
```bash
# Убедитесь, что LocalStack запущен
docker ps | grep localstack

# Если не запущен:
docker-compose up -d localstack
```

### Проблема: Permission denied
```bash
# Сделать скрипт исполняемым
chmod +x generate-massive-infra.sh

# Или запустить через bash:
bash generate-massive-infra.sh
```

### Проблема: No such file or directory
```bash
# Убедитесь, что скрипт скопирован в контейнер:
docker cp generate-massive-infra.sh localstack:/tmp/

# Или выполните скрипт напрямую из хоста:
docker exec localstack bash -c "$(cat generate-massive-infra.sh)"
```

## 📝 Дополнительные команды

### Очистить все ресурсы (если нужно)
```bash
# Удалить все EC2 инстансы
awslocal ec2 describe-instances --query 'Reservations[].Instances[].InstanceId' --output text | xargs -I {} awslocal ec2 terminate-instances --instance-ids {}

# Удалить все неиспользуемые томы
awslocal ec2 describe-volumes --query 'Volumes[?State==`available`].VolumeId' --output text | xargs -I {} awslocal ec2 delete-volume --volume-id {}

# Удалить все Elastic IPs
awslocal ec2 describe-addresses --query 'Addresses[].AllocationId' --output text | xargs -I {} awslocal ec2 release-address --allocation-id {}

# Удалить все Security Groups (кроме default)
awslocal ec2 describe-security-groups --query 'SecurityGroups[?GroupName!=`default`].GroupId' --output text | xargs -I {} awslocal ec2 delete-security-group --group-id {}
```

### Посмотреть статистику
```bash
echo "=== EC2 Instances ==="
awslocal ec2 describe-instances --query 'Reservations[].Instances[] | length(@)' --output text

echo "=== EBS Volumes ==="
awslocal ec2 describe-volumes --query 'Volumes[] | length(@)' --output text

echo "=== Elastic IPs ==="
awslocal ec2 describe-addresses --query 'Addresses[] | length(@)' --output text

echo "=== Security Groups ==="
awslocal ec2 describe-security-groups --query 'SecurityGroups[] | length(@)' --output text
```

## 🎓 Для разработки и расширения

Если хотите добавить в скрипт:
- S3 buckets с публичным доступом
- IAM users с лишними правами
- RDS базы данных
- Lambda функции
- CloudTrail logs с отключением логирования

Смотрите файл `extended-ideas.md` в корне проекта.

---

**Готово!** 🚀 Теперь у вас есть реалистичная тестовая инфраструктура для демонстрации AWS Optimizer.
