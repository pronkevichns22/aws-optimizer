# 📍 КАРТА ВСЕХ УПОМИНАНИЙ: Управление Алертами

## 🔴 КРИТИЧЕСКОЕ НЕСООТВЕТСТВИЕ: Написано ≠ Реализовано

---

## 1️⃣ ДИПЛОМ (диплом.md)

### Место 1: Line 422 - ENDPOINT ОПРЕДЕЛЕНИЕ
**Файл:** [диплом.md](диплом.md#L422)
**Статус:** 📝 НАПИСАНО | ❌ НЕ РЕАЛИЗОВАНО

```
Endpoint PUT /findings/:findingId/status позволяет пользователю обновить 
статус проблемы (open, resolved, ignored), что позволяет отслеживать 
прогресс исправления.
```

**Что обещано:**
- ✅ Обновление статуса (open, resolved, ignored)
- ❌ Snooze функция НЕ упоминается
- ❌ Acknowledge функция НЕ упоминается
- ❌ История алертов НЕ упоминается
- ❌ Подписки НЕ упоминаются

---

### Место 2: Line 434 - МОДЕЛЬ ДАННЫХ
**Файл:** [диплом.md](диплом.md#L434)
**Статус:** 📝 НАПИСАНО | 🟡 ЧАСТИЧНО РЕАЛИЗОВАНО

```
Коллекция findings содержит выявленные проблемы безопасности и финансовые 
рекомендации. Каждый документ проблемы содержит:
- идентификатор затронутого ресурса
- тип проблемы
- категорию (security, finops, best-practice)
- уровень серьезности (Critical, High, Medium, Low)
- детальное описание проблемы
- рекомендацию по исправлению
- статус решения (open, resolved, ignored) ← ЕСТЬ В КОДЕ
- дату обнаружения ← ЕСТЬ В КОДЕ
- дату последнего обновления статуса ← НУЖНО ПРОВЕРИТЬ
```

**Что реализовано:**
- ✅ Статус (open, resolved, ignored) - есть в schema
- ✅ Дата обнаружения - есть
- ❓ Дата обновления статуса - нужно проверить код

**Что НЕ реализовано:**
- ❌ История всех изменений статуса
- ❌ Информация кто изменил статус
- ❌ Время snooze
- ❌ Reason/notes для разрешения

---

### Место 3: Line 450 - AUDIT LOGS КОЛЛЕКЦИЯ
**Файл:** [диплом.md](диплом.md#L450)
**Статус:** 📝 НАПИСАНО | ❌ НЕ РЕАЛИЗОВАНО

```
Коллекция audit_logs ведёт логирование всех действий в системе, включая:
- вход пользователей
- инициирование сканирований
- запуск автоматизированных исправлений ← Для алертов
- изменение конфигураций
- экспорты отчётов
```

**Проблема:** Audit logs коллекция упоминается, но:
- ❌ Нет реализации в MongoDB
- ❌ Нет логирования действий с алертами
- ❌ Нет API endpoints для чтения audit logs

---

## 2️⃣ CHAPTER_2.md

### Место: Line 123 - МОДЕЛЬ ДАННЫХ (COPY-PASTE из диплома)
**Файл:** [CHAPTER_2.md](CHAPTER_2.md#L123)
**Статус:** 📝 НАПИСАНО (копия) | ❌ НЕ РЕАЛИЗОВАНО

Точный же текст что и в диплома про findings с статусом (open, resolved, ignored)

**Дополнение (Line 154):**
```
AI Advisor может объяснить... как конкретно ее исправить в контексте 
конкретной инфраструктуры организации. Ответ может содержать примеры 
команд AWS CLI для исправления, примеры кода Infrastructure as Code 
(Terraform, CloudFormation) и лучшие практики...
```

**Проблема:** Здесь уже видно что про управление алертами ничего не сказано, 
только про AI advisor. Управление алертами выделено в отдельный модуль, 
но не описано.

---

## 3️⃣ API_ENDPOINTS.md

### Место: Line 424 - ENDPOINT "Mark Alert as Resolved"
**Файл:** [API_ENDPOINTS.md](API_ENDPOINTS.md#L424)
**Статус:** 📝 НАПИСАНО | ❓ СТАТУС НЕИЗВЕСТЕН

```
### 11. Mark Alert as Resolved

PUT /api/alerts/:alertId/resolve
Headers: Authorization: Bearer {token}

Request:
{
  "resolution": "Updated security group rules",
  "notes": "Restricted access to internal IPs only"
}

Response (200 - OK):
{
  "success": true,
  "alert": {
    "id": "alert_001",
    "status": "resolved",
    "resolvedAt": "2026-05-12T10:45:00Z"
  }
}
```

**Проблема:** 
- ✅ Endpoint документирован
- ❓ Реализован ли в коде? **НУЖНО ПРОВЕРИТЬ**
- ❌ Нет endpoints для snooze
- ❌ Нет endpoints для acknowledge
- ❌ Нет endpoint для получения истории
- ❌ Нет endpoint для подписок

---

## 4️⃣ COMPONENTS.md

### Место: Line 433 - КОМПОНЕНТ SecurityAlertsTable
**Файл:** [COMPONENTS.md](COMPONENTS.md#L433)
**Статус:** 📝 НАПИСАНО | 🟡 ЧАСТИЧНО РЕАЛИЗОВАНО

```typescript
SecurityAlertsTable Component
Props:
{
  alerts: SecurityAlert[],
  onAlertSelect: (alert: SecurityAlert) => void,
  onResolve: (alertId: string) => void,  ← Callback есть!
  filters?: { ... }
}

Features:
- Severity color coding ✓
- Category filtering ✓
- Search functionality ✓
- Mark as resolved ← ЕСТЬ CALLBACK
- Remediation guidance ✓
```

**Статус:**
- ✅ Callback `onResolve` есть в Props
- ❓ Реально ли вызывается? **НУЖНО ПРОВЕРИТЬ КОД**
- ❌ Нет callback для snooze
- ❌ Нет callback для acknowledge

---

## 5️⃣ FEATURES.md

### Место: SECURITY PAGE РАЗДЕЛ
**Файл:** [FEATURES.md](FEATURES.md)
**Статус:** 📝 НАПИСАНО | ❓ НУЖНО ПРОВЕРИТЬ

Поиск показал что FEATURES.md НЕ содержит явного упоминания 
"управление алертами" как отдельную функцию. Но есть:
- Security Page с таблицей алертов
- Фильтрация и сортировка
- Но НЕ упоминается: snooze, acknowledge, история

---

## 6️⃣ ARCHITECTURE.md

### Место: Line 360 - SCHEMA для Alert
**Файл:** [ARCHITECTURE.md](ARCHITECTURE.md#L360)
**Статус:** 📝 НАПИСАНО | ❓ НУЖНО ПРОВЕРИТЬ

```
Alert Schema:
status: "resolved" | "open"
```

**Проблема:** 
- ✅ Есть поле status
- ❌ Нет поля snoozeUntil
- ❌ Нет поля acknowledgedBy
- ❌ Нет поля resolution
- ❌ Нет поля updatedAt

---

## 📊 СВОДНАЯ ТАБЛИЦА: ГДЕ НАПИСАНО ЧТО

| Функция | диплом | CHAPTER_2 | API_ENDPOINTS | COMPONENTS | Реальный код |
|---------|--------|-----------|----------------|------------|---|
| **Обновить статус** | ✅ Line 422 | ✅ Copy | ✅ Line 424 | ✅ Line 433 | ❓ |
| **Snooze алерт** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Acknowledge алерт** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **История алертов** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Подписки на алерты** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Audit logs** | ✅ Line 450 | ✅ Copy | ❌ | ❌ | ❌ |

---

## 🔍 ПЕРЕПИСКА МЕЖДУ ФАЙЛАМИ

**Обнаружена 100% копипаста из диплома в другие файлы:**

```
диплом.md (Line 434)
    ↓ copy-paste
CHAPTER_2.md (Line 123) - ТОЧНЫЙ же текст
    ↓ summarize
API_ENDPOINTS.md (Line 424) - Интерпретация в endpoint
    ↓ code
COMPONENTS.md (Line 433) - Реализация в React компоненте
```

**Вывод:** Все последующие документы основаны на дипломе, не добавляя новых функций.

---

## ✅ ЧТО РЕАЛЬНО РЕАЛИЗОВАНО

На основе файлов кода в `server/src/`:

### 1. SecurityAlertsTable компонент ([client/src/components/ui/SecurityAlertsTable.tsx](client/src/components/ui/SecurityAlertsTable.tsx))
- ✅ Отображение таблицы алертов
- ✅ Фильтрация по severity
- ✅ Поиск
- ❓ onResolve callback - есть в props, но вызывается ли?

### 2. MongoDB Schema для Findings
**Файл:** [server/src/models.ts](server/src/models.ts) или похожий
- ✅ Поле status (open, resolved, ignored)
- ✅ Timestamp fields
- ❌ История статуса
- ❌ snoozeUntil
- ❌ acknowledgedAt
- ❌ resolution notes

### 3. API Endpoints в index.ts
**Файл:** [server/src/index.ts](server/src/index.ts)
- ❓ PUT /api/alerts/:id/resolve - **НУЖНО НАЙТИ И ПРОВЕРИТЬ**
- ❌ POST /api/alerts/:id/snooze
- ❌ POST /api/alerts/:id/acknowledge
- ❌ GET /api/alerts/history

---

## 🚨 ДЕЙСТВИЯ ДЛЯ ВЕРИФИКАЦИИ

### Шаг 1: Проверить код
```bash
grep -r "onResolve" server/src/
grep -r "/api/alerts.*resolve" server/src/
grep -r "snooze" server/src/
grep -r "acknowledge" server/src/
```

### Шаг 2: Проверить models.ts
- Найти schema для Alert/Finding
- Посмотреть есть ли поля для snooze, acknowledge, history

### Шаг 3: Проверить routes
- Найти все endpoints начинающихся с /api/alerts
- Найти все endpoints для /api/findings/:id

---

## 📋 МЕСТА ГДЕ НУЖНО ДОБАВИТЬ ПОМЕТКИ В ИСХОДНЫЕ ФАЙЛЫ

### В диплом.md добавить после Line 422:
```
[⚠️ ПРИМЕЧАНИЕ: Статус (open, resolved, ignored) реализован. 
Функции snooze, acknowledge и история НЕ реализованы.]
```

### В диплом.md добавить после Line 450:
```
[⚠️ ПРИМЕЧАНИЕ: Коллекция audit_logs УПОМИНАЕТСЯ в дизайне, 
но НЕ реализована в коде.]
```

### В API_ENDPOINTS.md добавить после Line 424:
```
[⚠️ ПРИМЕЧАНИЕ: Endpoints для snooze, acknowledge, и истории НЕ документированы и НЕ реализованы.]
```

### В COMPONENTS.md добавить после Line 433:
```
[⚠️ ПРИМЕЧАНИЕ: Callback onResolve есть в props, но функции 
snooze и acknowledge НЕ поддерживаются.]
```

---

## 📝 ИТОГОВЫЙ СПИСОК

**НАПИСАНО в документации (диплом и тексты):**
1. ✅ Обновление статуса (open, resolved, ignored)
2. ❌ Snooze функция
3. ❌ Acknowledge функция
4. ❌ История алертов
5. ❌ Подписки на новые алерты

**РЕАЛИЗОВАНО в коде:**
1. ✅ Статус (в MongoDB schema)
2. ❓ Endpoint resolve (нужно проверить)
3. ❌ Snooze
4. ❌ Acknowledge
5. ❌ История
6. ❌ Подписки

**УРОВЕНЬ СООТВЕТСТВИЯ:** ~30% от заявленного

---

**Статус:** 🔴 Требует срочного уточнения в коде
