# 📸 Карта размещения скриншотов для ГЛАВЫ 3

## Структура размещения

### **Рисунок 3.1** — Интерфейс регистрации и аутентификации (Section 3.2.1)
**Где:** После текста "При проектировании данного модуля был отвергнут метод..."
**Что нужно:** Скриншот страницы **http://localhost:5174/login**
- Видны поля: Email, Password
- Кнопки: Login / Sign Up
- Логотип приложения

---

### **Рисунок 3.2** — Интерфейс конфигурирования AWS credentials (Section 3.2.3)
**Где:** После текста "В разделе «Настройки» (Settings) пользователь вводит ключи..."
**Что нужно:** Скриншот страницы **Settings**
- Видны поля: Access Key, Secret Key, Region
- Селектор: LocalStack или AWS
- Кнопка: Save/Validate
- Опционально: индикатор успешного подключения (зелёная галочка)

---

### **Рисунок 3.3** — Процесс параллельной инвентаризации (Section 3.3.1)
**Где:** Опционально — после кода "Promise.all()" для визуализации
**Что нужно:** Может быть диаграмма или скриншот консоли, показывающий:
- Параллельные запросы к EC2, EBS, IP, SG
- Время выполнения каждого запроса
- Общее время инвентаризации

**ПРИМЕЧАНИЕ:** Если диаграмму сложно найти, можно пропустить — текст хорошо объясняет через код.

---

### **Рисунок 3.4** — Вывод консоли Prowler (Section 3.3.2)
**Где:** После текста "На рисунке 3.4 представлен фрагмент вывода Prowler..."
**Что нужно:** Скриншот **терминала/консоли** при сканировании:
- Видны строчки типа:
  ```
  [PASS] S3.1 S3 Bucket Versioning enabled
  [FAIL] IAM.2 IAM password policy requires uppercase
  [PASS] EC2.1 Security Groups restrict ingress SSH
  ```
- Различные цвета: зелёные PASS, красные FAIL
- Прогресс-бар или процент выполнения
- Видны названия проверок (iam_mfa_enabled, s3_versioning, etc.)

---

### **Рисунок 3.5** — Алгоритм EBS Volume Alerts (Section 3.3.3)
**Где:** После кода "generateEBSVolumeAlerts"
**Что нужно:** **Диаграмма или иллюстрация**, показывающая:
- Входящие данные: массив томов
- Фильтрация: state === 'available'
- Выходящие данные: алерты с savings

**Альтернатива:** Можно оставить только текст и код — это достаточно ясно.

---

### **Рисунок 3.6** — Главная панель управления (Dashboard) (Section 3.4.1)
**Где:** В начале раздела 3.4.1, после текста "На рисунке 3.6 представлено состояние дашборда..."
**Что нужно:** Скриншот **Dashboard страницы** с видимыми:
- **KPI блоки** в верху:
  - Total Spend: $XX,XXX
  - Total Waste: XX%
  - Resources Count: 390
  - Wasted Resources: XX
- **Графики**:
  - Cost Trend (график с линиями расходов)
  - Spend by Service (круговая диаграмма с EBS 92.2%)
- **Временной период**: Last 30 days
- **Savings summary**: $4,555.45 saved

---

### **Рисунок 3.7** — Инвентаризация ресурсов (Resources) (Section 3.4.2)
**Где:** В разделе 3.4.2, после текста "Для управления жизненным циклом ресурсов..."
**Что нужно:** Скриншот **Resources страницы** с видимыми:
- Таблица с колонками: Resource ID, Type, Status, Cost/Month, Actions
- Фильтры вверху: Type, Status, Cost Range
- Примеры ресурсов:
  - i-xxx (EC2 Instance) | running | $85.20 | [Stop/Terminate]
  - vol-xxx (EBS Volume) | available | $50.00 | [Delete]
  - eip-xxx (Elastic IP) | unassociated | $3.60 | [Release]
- Пагинация: "Showing 1-20 of 390"

---

### **Рисунок 3.8** — Панель безопасности (Security) (Section 3.4.3)
**Где:** В разделе 3.4.3, после текста "На рисунке 3.8 зафиксировано критическое состояние..."
**Что нужно:** Скриншот **Security страницы** с видимыми:
- **Security Score**: 0/100 (большой, красный)
- **Alert Statistics**:
  - CRITICAL: 5 (красный)
  - HIGH: 263 (оранжевый)
  - MEDIUM: 42 (жёлтый)
- **Таблица инцидентов** с колонками:
  - Alert Title | Resource | Severity | Description | Actions
- Примеры:
  - SSH exposed to 0.0.0.0/0 | sg-prod-web | CRITICAL | Open port 22
  - Unencrypted EBS | vol-xxx | HIGH | Volume without encryption
  - MongoDB exposed | sg-xxx | CRITICAL | Exposed to World

---

### **Рисунок 3.9** — Результаты unit тестов (Section 3.6)
**Где:** После текста "Рисунок 3.9 — Отчет о выполнении unit тесто" 
**Что нужно:** Скриншот **терминала npm test** (verbose output):
```
PASS src/auth-middleware.test.ts
  ✓ should reject request without Authorization header (401)
  ✓ should reject request with invalid Bearer format
  ✓ should attach user to request on valid token
  
PASS src/security-rules.test.ts
  ✓ SSH Exposure Detection (Rule 1.1)
  ✓ EBS Encryption Detection (Rule 2.1)
  ✓ Alert Deduplication

Test Suites: 12 passed, 12 total
Tests: 243 passed, 243 total
Time: 19.579 s
```

---

### **Рисунок 3.10** — Отчёт покрытия кода (Code Coverage) (Section 3.6)
**Где:** После текста "Рисунок 3.10 — Результаты работы Code Coverage test"
**Что нужно:** Скриншот **таблицы Code Coverage Report**:
```
File                      % Stmts  % Branch  % Funcs  % Lines  Uncovered Line #s
All files                  39.02    29.39    63.26    38.4    ...
auth-middleware.ts         100      100      100      100      
finops-calculator.ts       100      50       100      100      30
models.ts                  100      100      100      100      
auth-utils.ts              93.33    100      100      93.1     ...272,315,327-389
security-rules.ts          69.81    82       94.73    67.78    146,472,482-558
```

---

## 🎬 Дополнительные скриншоты для AI Advisor (опционально)

### **Рисунок 3.11** — AI Advisor в действии (Section 3.5.3)
**Где:** После примера "Пример 1: Security Group с открытым SSH"
**Что нужно:** Скриншот **чата AI Advisor**:
- Пользовательский вопрос в левой части
- Ответ AI (система) в правой части
- Видна история диалога выше (64 сообщения)
- Кнопка копирования AWS CLI команд

---

## 📋 Порядок создания скриншотов

1. **Войти в приложение**: http://localhost:5174/login
   - Эмейл: test@example.com
   - Пароль: любой

2. **Скриншоты для создания:**
   - ✅ Рисунок 3.1 → Login page
   - ✅ Рисунок 3.2 → Settings page (с AWS ключами или LocalStack)
   - ✅ Рисунок 3.4 → Prowler console output (из терминала backend'а)
   - ✅ Рисунок 3.6 → Dashboard (главная страница)
   - ✅ Рисунок 3.7 → Resources page
   - ✅ Рисунок 3.8 → Security page
   - ✅ Рисунок 3.9 → npm test verbose output
   - ✅ Рисунок 3.10 → npm test --coverage (таблица)

---

## 💾 Где хранить скриншоты

Рекомендуемая структура:
```
aws-optimizer/
├── screenshots/
│   ├── chapter3/
│   │   ├── 3.1_login.png
│   │   ├── 3.2_settings.png
│   │   ├── 3.4_prowler_console.png
│   │   ├── 3.6_dashboard.png
│   │   ├── 3.7_resources.png
│   │   ├── 3.8_security.png
│   │   ├── 3.9_unit_tests.png
│   │   └── 3.10_coverage_report.png
```

---

## ✏️ Формат вставки в Markdown

```markdown
**Рисунок 3.6** — Главная аналитическая панель управления комплексом CloudOpti

![Dashboard Screenshot](../../screenshots/chapter3/3.6_dashboard.png)

Примечание: Источник — собственная разработка
```
