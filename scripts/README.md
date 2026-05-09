# 📦 LocalStack Scripts for AWS Optimizer

Набор скриптов для создания тестовой инфраструктуры в LocalStack контейнере.

## 📁 Файлы в этой папке

- **`generate-massive-infra.sh`** - Основной скрипт для генерации массивной инфраструктуры с рисками
- **`README.md`** - Этот файл с инструкциями

## 🚀 Как использовать

### Шаг 1: Скопировать скрипт в контейнер

```bash
# Скопировать в LocalStack контейнер
docker cp generate-massive-infra.sh localstack:/tmp/

# Или если используете docker-compose, зависит от имени сервиса:
docker-compose cp generate-massive-infra.sh localstack:/tmp/
```

### Шаг 2: Запустить скрипт внутри контейнера

```bash
# Войти в контейнер
docker exec -it localstack bash

# Запустить скрипт
bash /tmp/generate-massive-infra.sh

# Или сразу без входа:
docker exec -it localstack bash /tmp/generate-massive-infra.sh
```

### Шаг 3: Проверить созданные ресурсы

```bash
# Внутри контейнера проверить ресурсы
awslocal ec2 describe-instances --query 'Reservations[].Instances[].Tags[0].Value'
awslocal ec2 describe-volumes --query 'Volumes[].Size'
awslocal ec2 describe-addresses
awslocal ec2 describe-security-groups
```

### Шаг 4: Запустить сканирование в AWS Optimizer

1. Откройте AWS Optimizer в браузере
2. На странице **Security** нажмите кнопку **Rescan**
3. Сканер подключится к LocalStack и обнаружит все созданные ресурсы с рисками

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
