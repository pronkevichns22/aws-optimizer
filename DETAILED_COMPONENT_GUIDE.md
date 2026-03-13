# 🎓 ПОЛНЫЙ ГАЙД ПО КОМПОНЕНТАМ AWS OPTIMIZER

## 📖 Оглавление
1. [Основная структура](#основная-структура)
2. [StatCard - Карточка статистики](#statcard)
3. [Chart - График с данными](#chart)
4. [HealthScore - Сложный компонент](#healthscore)
5. [Создание собственного компонента](#создание-собственного)
6. [Tailwind CSS классы](#tailwind)
7. [Lucide React иконки](#иконки)

---

## <a name="основная-структура"></a>📋 Основная структура компонента

### Шаг 1: Структура файла
```typescript
// 1️⃣ ИМПОРТЫ - всегда в начале файла
import React from 'react';
import { IconName } from 'lucide-react';  // Иконки из lucide-react

// 2️⃣ INTERFACE - тип параметров компонента (props)
interface MyComponentProps {
  title: string;           // Обязательный параметр
  count?: number;          // Опциональный (необязательный) с ?
  icon?: React.ReactNode;  // React элемент (иконка)
}

// 3️⃣ КОМПОНЕНТ - функция с export
export const MyComponent = ({ 
  title, 
  count, 
  icon 
}: MyComponentProps) => {
  
  // 4️⃣ ЛОГИКА - вычисления, условия
  const finalValue = count ? count * 100 : 0;
  
  // 5️⃣ JSX - HTML-подобный синтаксис для отрисовки
  return (
    <div>
      <h3>{title}</h3>
      <p>{finalValue}</p>
    </div>
  );
};
```

### Что означает каждая часть?

```
Interface Props  → Описывает какие параметры может получить компонент
? (вопросительный знак) → Означает что параметр опциональный
export const → Делает компонент доступным для импорта в других файлах
{ } (фигурные скобки в параметрах) → Деструктуризация - вытягиваем значения
className → CSS классы из Tailwind (не style!)
style={{ }} → Встроенные стили (используются когда нельзя в className)
```

---

## <a name="statcard"></a>🎨 КОМПОНЕНТ #1: StatCard (Карточка статистики)

### 📌 Что это делает?
Показывает одну метрику (число или текст) с иконкой. Используется для вывода важных цифр типа "Total Spend" или "Active Servers".

### 📂 Файл: [src/components/ui/StatCard.tsx](src/components/ui/StatCard.tsx)

### 🔍 ПОЛНЫЙ КОД С ПОДРОБНЫМИ КОММЕНТАРИЯМИ

```typescript
import React from 'react';

// INTERFACE - что может получить этот компонент
interface Props {
  // Название метрики (например: "Total Spend", "Active Servers", "Wasted Money")
  title: string;
  
  // Основное значение - может быть строка ($45,230) или число (125)
  value: string | number;
  
  // React элемент - обычно это иконка из lucide-react
  // Отрисуется в правом верхнем углу карточки
  icon: React.ReactNode;
  
  // Текст под главным значением (например: "Monthly Bill", "Potential Savings")
  trend: string;
  
  // Флаг: true = карточка будет тёмная и выделена (для главной метрики)
  //      false или не передан = обычная белая карточка
  isMain?: boolean;
}

export const StatCard = ({ title, value, icon, trend, isMain }: Props) => {
  return (
    // 🎯 ГЛАВНЫЙ КОНТЕЙНЕР - белый/тёмный блок с закругленными краями
    <div 
      className={`
        // 🎨 УСЛОВНЫЕ СТИЛИ - зависят от isMain
        ${isMain 
          // Если isMain=true (главная карточка - Wasted Money)
          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
          // Если isMain=false или не передан (обычная карточка)
          : 'bg-white text-slate-900 shadow-sm'
        } 
        
        // ☑️ СТИЛИ ПРИМЕНЯЮТСЯ К ОБОИМ ВАРИАНТАМ
        p-6                              // Отступ внутри (padding): 24px со всех сторон
        rounded-[2.5rem]                 // Скруглённые углы: 40px (выглядит красиво)
        border border-gray-100           // Тонкая серая граница со всех сторон
        flex flex-col justify-between    // Расположение: колонка, контент растягивается по высоте
        transition-transform             // Плавное изменение при наведении
        hover:scale-[1.02]               // При наведении мышки: увеличить на 2%
        duration-300                     // Скорость анимации: 300 миллисекунд
      `}
    >
      
      {/* 👆 ВЕРХНЯЯ ЧАСТЬ - заголовок слева + иконка справа */}
      <div className="flex justify-between items-start">
        
        {/* 📝 ЛЕВАЯ ЧАСТЬ - текстовая информация */}
        <div>
          {/* 🏷️ ЗАГОЛОВОК - маленький текст сверху */}
          <p 
            className={`
              text-xs                      // Очень маленький размер (0.75rem)
              font-bold                    // Жирный текст (вес 700)
              uppercase                    // ПРЕОБРАЗОВАТЬ В ЗАГЛАВНЫЕ БУКВЫ
              tracking-wider               // Больше пространства между буквами
              ${isMain 
                ? 'text-slate-400'         // Если главная: серый текст
                : 'text-slate-500'         // Если обычная: более тёмный серый
              }
            `}
          >
            {title}  {/* Выводим заголовок */}
          </p>
          
          {/* 💰 ОСНОВНОЕ ЗНАЧЕНИЕ - большой текст посередине */}
          <h3 
            className="
              text-3xl                     // Большой размер (3rem = 48px)
              font-black                   // Самый жирный вес (900)
              mt-2                         // Отступ сверху от заголовка (8px)
              tracking-tight               // Плотный интервал между буквами
            "
          >
            {value}  {/* Выводим значение (например: $45,230) */}
          </h3>
        </div>
        
        {/* 🎁 ПРАВАЯ ЧАСТЬ - иконка с цветным фоном */}
        <div 
          className={`
            p-3 rounded-2xl               // Контейнер для иконки (padding и углы)
            ${isMain 
              ? 'bg-white/10 text-white'  // Если главная: полупрозрачный белый фон
              : 'bg-indigo-50 text-indigo-600'  // Если обычная: светло-синий фон и синяя иконка
            }
          `}
        >
          {icon}  {/* Выводим иконку */}
        </div>
      </div>
      
      {/* 👇 НИЖНЯЯ ЧАСТЬ - тренд (статус) */}
      <div className="mt-6">  {/* Отступ сверху (24px) */}
        <span 
          className={`
            text-[10px]                   // Очень маленький размер
            font-bold                     // Жирный
            px-3 py-1                     // Отступ: по горизонтали 12px, по вертикали 4px
            rounded-full                  // Скруглённые края (как таблетка)
            ${isMain 
              ? 'bg-emerald-500 text-white'   // Если главная: зелёная таблетка
              : 'bg-slate-100 text-slate-500' // Если обычная: серая таблетка
            }
          `}
        >
          {trend}  {/* Выводим тренд (например: "Monthly Bill") */}
        </span>
      </div>
    </div>
  );
};
```

### 💡 КАК ИСПОЛЬЗОВАТЬ StatCard В App.tsx

```typescript
import { DollarSign, Server, AlertTriangle } from 'lucide-react';

// Пример 1: Белая карточка с деньгами
<StatCard 
  title="Total Spend"                    // Заголовок
  value={`$${data?.summary?.totalSpend?.toFixed(2) || '0.00'}`}  // Правильное форматирование
  icon={<DollarSign />}                  // Иконка доллара
  trend="Monthly Bill"                   // Тренд
  isMain={false}                         // Белая карточка
/>

// Пример 2: ВЫДЕЛЕННАЯ тёмная карточка (главная метрика)
<StatCard 
  title="Wasted Money"                   // Заголовок
  value={`$${data?.summary?.totalWaste?.toFixed(2) || '0.00'}`}
  icon={<AlertTriangle />}               // Иконка предупреждения
  trend="Potential Savings"              // Тренд
  isMain={true}                          // 🔴 ТЁМНАЯ ВЫДЕЛЕННАЯ КАРТОЧКА
/>

// Пример 3: С количеством (число вместо денег)
<StatCard 
  title="Active Servers"
  value={data?.summary?.serverCount || 0}  // Просто число, не валюта
  icon={<Server />}                      // Иконка сервера
  trend="EC2 Instances"
  isMain={false}
/>

// ПРАВИЛЬНОЕ ИСПОЛЬЗОВАНИЕ В СЕТКЕ
<div className="grid grid-cols-4 gap-6 mb-12">
  <StatCard title="..." icon={<DollarSign />} value="..." trend="..." />
  <StatCard title="..." icon={<Server />} value="..." trend="..." isMain={true} />
  <StatCard title="..." icon={<AlertTriangle />} value="..." trend="..." />
  <StatCard title="..." icon={<Zap />} value="..." trend="..." />
</div>
```

### ✅ Что происходит в StatCard пошагово?

```
1. Получаем props: { title, value, icon, trend, isMain }
2. Условная проверка: isMain === true ?
   → Да: используем bg-slate-900 (тёмный фон)
   → Нет: используем bg-white (белый фон)
3. Рисуем контейнер с нужными стилями
4. Внутри: раскладываем элементы в строку (flex justify-between)
5. Слева: маленький заголовок + большое число
6. Справа: иконка в цветном контейнере
7. Снизу: маленькая таблетка с трендом
8. Добавляем hover эффект (увеличение на 2%)
```

### 🎯 Ключевые концепции StatCard

| Концепция | Объяснение |
|-----------|-----------|
| `isMain` | Флаг для выделения главной карточки (тёмная vs белая) |
| `${isMain ? ... : ...}` | Тернарный оператор (если/то/иначе) |
| `className=` | Используем классы Tailwind (НЕ style!) |
| `<DollarSign />` | JSX иконка из lucide-react |
| `.toFixed(2)` | Форматирует число: 45.5 → "45.50" |
| `hover:scale-[1.02]` | При наведении увеличивается на 2% |

---

## <a name="chart"></a>📊 КОМПОНЕНТ #2: Chart (График с данными)

### 📌 Что это делает?
Показывает список элементов с их значениями в виде горизонтальных полосок с градиентом. Например: "Top 5 Most Expensive Resources".

### 📂 Файл: [src/components/ui/Chart.tsx](src/components/ui/Chart.tsx)

### 🔍 ПОЛНЫЙ КОД С ПОДРОБНЫМИ КОММЕНТАРИЯМИ

```typescript
import React from 'react';
import { BarChart, LineChart } from 'lucide-react';

// INTERFACE - описываем входящие данные
interface ChartProps {
  // Заголовок графика
  title: string;
  
  // Массив из объектов с label и value
  // ВОТ ПРИМЕР КАК ВЫГЛЯДИТ МАССИВ:
  // [
  //   { label: "EC2 Instance us-east-1", value: 4500.50 },
  //   { label: "RDS Database", value: 3200.75 },
  //   { label: "S3 Storage", value: 1250.25 }
  // ]
  data: { 
    label: string;       // Название элемента (например, "EC2 - us-east-1")
    value: number;       // Число для визуализации (например, стоимость)
  }[];
  
  // Тип графика (влияет только на иконку)
  // ? = опциональный параметр
  type?: 'bar' | 'line';
}

export const Chart = ({ title, data, type = 'bar' }: ChartProps) => {
  // 🔧 ВЫЧИСЛЯЕМ максимальное значение для масштабирования
  // Нужно знать максимум чтобы правильно растянуть полоски
  
  // ...data.map(d => d.value) - берём все value из массива
  // Math.max(...) - находим самый большой
  // , 1 - если массив пуст, используем 1 (чтобы не было деления на 0)
  const maxValue = Math.max(...data.map(d => d.value), 1);
  // ✨ ПРИМЕР: Если data = [{ value: 100 }, { value: 250 }, { value: 150 }]
  //           то maxValue = 250
  
  return (
    // 🎯 ГЛАВНЫЙ КОНТЕЙНЕР - стандартный белый блок
    <div className="
      bg-white                    // Белый фон
      p-6                         // Внутренний отступ
      rounded-3xl                 // Скруглённые углы
      shadow-sm                   // Маленькая тень
      border border-gray-100      // Тонкая серая граница
    ">
      
      {/* 👆 ШАПКА - заголовок и иконка */}
      <div className="
        flex justify-between       // Задвинуть в разные стороны
        items-center               // Вертикально центрировать
        mb-6                       // Отступ снизу (24px)
      ">
        {/* ЗАГОЛОВОК */}
        <h3 className="
          text-lg                  // Размер (1.125rem)
          font-bold                // Жирный
          text-slate-900           // Тёмный цвет
        ">
          {title}
        </h3>
        
        {/* ИКОНКА - зависит от type */}
        <div className="text-indigo-600">  {/* Синий цвет */}
          {type === 'bar' 
            ? <BarChart size={20} />   // Если type='bar': столбцовая иконка
            : <LineChart size={20} />  // Если type='line': линейная иконка
          }
        </div>
      </div>
      
      {/* 📋 ОСНОВНОЙ КОНТЕНТ - список с полосками */}
      <div className="space-y-4">  {/* space-y-4: отступ между строками 16px */}
        
        {/* 🔄 ЦИКЛ - для каждого элемента рисуем полоску */}
        {/* .map((item, idx) => ...) - перебираем каждый элемент массива */}
        {/* item - текущий элемент ({ label: "...", value: ... }) */}
        {/* idx - порядковый номер (0, 1, 2, 3...) */}
        {data.map((item, idx) => (
          // 🎯 КОНТЕЙНЕР ОДНОЙ СТРОКИ
          <div key={idx} className="space-y-1">
            {/* space-y-1: отступ между label/value и полоской 4px */}
            {/* key={idx} - ОБЯЗАТЕЛЬНО указывать при .map()! */}
            
            {/* 🏷️ СТРОКА 1: НАЗВАНИЕ И ЗНАЧЕНИЕ */}
            <div className="
              flex justify-between       // Название слева, значение справа
              items-center               // Вертикально центрировать
              text-sm                    // Маленький размер шрифта
            ">
              {/* НАЗВАНИЕ */}
              <span className="
                font-semibold            // Полужирный (вес 600)
                text-slate-900           // Тёмный цвет
              ">
                {item.label}  {/* Например: "EC2 Instance us-east-1" */}
              </span>
              
              {/* ЗНАЧЕНИЕ СПРАВА */}
              <span className="
                text-indigo-600          // Синий цвет
                font-bold                // Жирный
              ">
                ${item.value.toFixed(2)}  {/* Например: "$4500.50" */}
                {/* .toFixed(2) = форматирует число до 2 знаков после запятой */}
              </span>
            </div>
            
            {/* 📊 СТРОКА 2: ПОЛОСКА-ПРОГРЕСС-БАР */}
            <div className="
              w-full                     // Занимает всю ширину контейнера
              bg-gray-100                // Серый фон (основа полоски)
              rounded-full               // Очень скруглённые края (как таблетка)
              h-2                        // Высота: 8px
              overflow-hidden            // Скрывает части которые вышли за границы
            ">
              {/* 🎨 ЗАПОЛНЕННАЯ ЧАСТЬ ПОЛОСКИ */}
              <div 
                className="
                  bg-gradient-to-r from-indigo-500 to-indigo-600
                    // Градиент слева направо: от более светлого синего к более тёмному
                  h-full                 // Занимает всю высоту родителя
                  rounded-full           // Скруглённые края
                  transition-all duration-500
                    // Плавная анимация при изменении ширины (500мс)
                "
                // ДИНАМИЧЕСКАЯ ШИРИНА - плавно меняется
                // (item.value / maxValue) * 100 = вычисляем проценты
                // ПРИМЕР: если value=250 и maxValue=1000, то ширина будет 25%
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 💡 КАК ПОДГОТОВИТЬ И ИСПОЛЬЗОВАТЬ ДАННЫЕ

```typescript
// ШАГ 1: Функция подготовки данных (в App.tsx)
const prepareChartData = () => {
  // Проверяем есть ли данные
  if (!data?.resources) return [];
  
  return data.resources
    // ШАГ 2: Сортируем по стоимости (от большей к меньшей)
    .sort((a: any, b: any) => b.cost - a.cost)
    // ШАГ 3: Берём только первые 5 элементов
    .slice(0, 5)
    // ШАГ 4: Преобразуем в формат { label, value }
    .map((r: any) => ({
      // Создаём label из типа и ID ресурса
      label: `${r.type} - ${r.id.substring(0, 8)}`,
      // Берём cost как value
      value: r.cost
    }));
};

// ШАГ 5: Используем в JSX
<Chart 
  title="Top 5 Most Expensive Resources"
  data={prepareChartData()}
  type="bar"
/>

// 🎯 РЕЗУЛЬТАТ В БРАУЗЕРЕ:
// ┌──────────────────────────────┐
// │ Top 5 Most Expensive Resources┌─┐
// │                               │█│
// │ EC2 Instance us-east-1    $4500│████████████░░░ 45%
// │ RDS Database              $3200│██████████░░░░░ 32%
// │ S3 Storage                $1250│████░░░░░░░░░░░ 12%
// │ Lambda Function           $950 │███░░░░░░░░░░░░ 10%
// │ CloudFront                $100 │░░░░░░░░░░░░░░░  1%
// └──────────────────────────────┘
```

### 🎯 Что происходит пошагово?

```
1. Получаем props: { title, data, type }
2. Вычисляем maxValue = максимальное число из массива
3. Рисуем контейнер и заголовок
4. Проходим по каждому элементу массива (.map())
5. Для каждого элемента:
   a) Рисуем строку с названием и значением
   b) Вычисляем процент: (item.value / maxValue) * 100
   c) Рисуем полоску шириной равной этому проценту
   d) Добавляем плавную анимацию
```

### ✅ Ключевые концепции Chart

| Концепция | Объяснение |
|-----------|-----------|
| `.map()` | Цикл для перебора массива и создания элементов |
| `Math.max(...array)` | Находит максимальное значение в массиве |
| `toFixed(2)` | Форматирует число до 2 знаков: 45.5 → "45.50" |
| `(value / maxValue) * 100` | Вычисляет проценты для масштабирования |
| `style={{ width: ... }}` | Встроенный стиль (используется когда нельзя в className) |
| `transition-all duration-500` | Плавная анимация в течение 500мс |
| `gradient-to-r` | Градиент слева (from) направо (to) |

---

## <a name="healthscore"></a>🏥 КОМПОНЕНТ #3: HealthScore (Сложный компонент)

### 📌 Что это делает?
Показывает "здоровье" инфраструктуры в виде кругового графика с оценкой. Меняет цвет в зависимости от статуса (зелёный/жёлтый/красный).

### 📂 Файл: [src/components/ui/HealthScore.tsx](src/components/ui/HealthScore.tsx)

### 🔍 ПОЛНЫЙ КОД С ПОДРОБНЫМИ КОММЕНТАРИЯМИ

```typescript
import React from 'react';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

// INTERFACE - что может получить компонент
interface HealthScoreProps {
  // Общая стоимость облачной инфраструктуры
  totalSpend: number;
  
  // Сумма потраченных впустую денег
  totalWaste: number;
}

export const HealthScore = ({ totalSpend, totalWaste }: HealthScoreProps) => {
  // 📊 ВЫЧИСЛЯЕМ ПРОЦЕНТ ПОТЕРЬ
  // Если totalSpend > 0, то вычисляем: (потери / общая сумма) * 100
  // Иначе используем 0 (чтобы не было деления на 0)
  const wastePercentage = totalSpend > 0 
    ? (totalWaste / totalSpend) * 100 
    : 0;
  // ПРИМЕР: totalSpend=10000, totalWaste=1000 → waste%=10%
  
  // 🎯 ВЫЧИСЛЯЕМ ОЦЕНКУ ЗДОРОВЬЯ (0-100)
  // Базовая оценка 100, минус 5 очков за каждый процент потерь
  // Минимум 0 (не может быть отрицательным)
  const healthScore = Math.max(0, 100 - wastePercentage * 5);
  // ПРИМЕР: waste%=10% → healthScore = 100 - (10*5) = 50
  //         waste%=25% → healthScore = 100 - (25*5) = -25 → 0 (Math.max)
  
  // 🎨 ОПРЕДЕЛЯЕМ ЦВЕТ И СТАТУС В ЗАВИСИМОСТИ ОТ СОСТОЯНИЯ
  // По умолчанию - зелёный (всё хорошо)
  let color = 'text-emerald-600';        // Зелёный текст
  let bgColor = 'bg-emerald-50';         // Светло-зелёный фон
  let borderColor = 'border-emerald-200'; // Зелёная граница
  let statusLabel = 'Excellent';         // Статус
  let statusIcon = <CheckCircle size={20} />; // Иконка-галочка
  
  // Если потери > 20% - красный (КРИТИЧЕСКОЕ)
  if (wastePercentage > 20) {
    color = 'text-red-600';              // Красный текст
    bgColor = 'bg-red-50';               // Светло-красный фон
    borderColor = 'border-red-200';      // Красная граница
    statusLabel = 'Critical';            // Статус "Критическое"
    statusIcon = <AlertCircle size={20} />; // Иконка-предупреждение
  } 
  // Если потери между 10% и 20% - жёлтый (ПРЕДУПРЕЖДЕНИЕ)
  else if (wastePercentage > 10) {
    color = 'text-amber-600';            // Оранжевый текст
    bgColor = 'bg-amber-50';             // Светло-оранжевый фон
    borderColor = 'border-amber-200';    // Оранжевая граница
    statusLabel = 'Warning';             // Статус "Внимание"
    statusIcon = <TrendingUp size={20} />; // Иконка-тренд
  }
  
  // 📐 ВЫЧИСЛЕНИЯ ДЛЯ КРУГОВОГО ГРАФИКА (SVG)
  // Это сложная математика для анимированного круга
  const radius = 45;  // Радиус круга в пикселях
  
  // Длина окружности = 2 * π * r
  // Используется для анимации обхода по кругу
  const circumference = 2 * Math.PI * radius;
  
  // На сколько пикселей "отступить" при рисовании круга
  // Если healthScore=50%, то показываем половину круга
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;
  
  return (
    // 🎯 ГЛАВНЫЙ КОНТЕЙНЕР - цветной блок (цвет меняется в зависимости от статуса)
    <div className={`
      ${bgColor}                   // Цветной фон (зелёный/жёлтый/красный)
      border ${borderColor}        // Цветная граница
      p-8                          // Внутренний отступ (32px)
      rounded-3xl                  // Скруглённые углы
    `}>
      
      {/* 👆 ШАПКА - заголовок и статус */}
      <div className="flex items-center justify-between mb-6">
        {/* ЛЕВАЯ ЧАСТЬ - название и описание */}
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Cloud Health Score
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Infrastructure optimization rating
          </p>
        </div>
        
        {/* ПРАВАЯ ЧАСТЬ - статус с иконкой */}
        <div className={`flex items-center gap-2 ${color}`}>
          {statusIcon}  {/* Иконка меняется (галочка/предупреждение/тренд) */}
          <span className="font-bold">{statusLabel}</span>
        </div>
      </div>
      
      {/* 👇 ОСНОВНОЙ КОНТЕНТ - круг и метрики */}
      <div className="flex items-center justify-between">
        
        {/* 🔴 ЛЕВАЯ ЧАСТЬ - КРУГОВОЙ ГРАФИК */}
        <div className="relative w-40 h-40">  {/* 160px x 160px контейнер */}
          {/* SVG - для рисования круга (не для фото!) */}
          <svg 
            className="transform -rotate-90 w-full h-full"
            // -rotate-90 = поворот на 90 градусов против часовой стрелки
            // Это чтобы линия начиналась сверху, а не справа
            viewBox="0 0 100 100"  // Координатная система: 100x100
          >
            {/* ФОНОВЫЙ КРУГ (серый) */}
            <circle
              cx="50"               // X координата центра
              cy="50"               // Y координата центра
              r="45"                // Радиус
              fill="none"           // Без заполнения (только контур)
              stroke="currentColor" // Использует текущий цвет (из className)
              strokeWidth="3"       // Толщина линии
              className="text-gray-200" // Серый цвет
            />
            
            {/* ПРОГРЕСС КРУГ (цветной, анимированный) */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              
              // Штрихованная линия для эффекта "обхождения"
              strokeDasharray={circumference}
              // На сколько отступить (чем больше, тем меньше видно)
              strokeDashoffset={strokeDashoffset}
              
              strokeLinecap="round"  // Скруглённые концы линии
              className={color}      // Цвет меняется (зелёный/жёлтый/красный)
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              // Плавная анимация при изменении значения
            />
          </svg>
          
          {/* ЦЕНТР КРУГА - оценка в цифрах */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* inset-0 = растянуть на весь родитель */}
            <span className={`text-4xl font-black ${color}`}>
              {healthScore.toFixed(0)}  {/* Оценка без знаков после запятой */}
            </span>
            <span className="text-xs text-slate-500">
              / 100  {/* Максимальная оценка */}
            </span>
          </div>
        </div>
        
        {/* 📈 ПРАВАЯ ЧАСТЬ - ДЕТАЛЬНЫЕ МЕТРИКИ */}
        <div className="flex-1 ml-8 space-y-4">
          {/* flex-1 = занимает оставшееся место */}
          {/* ml-8 = отступ слева от круга */}
          {/* space-y-4 = отступ между элементами 16px */}
          
          {/* 1️⃣ МЕТРИКА: WASTE RATIO (процент потерь) */}
          <div>
            {/* ЗАГОЛОВОК И ЗНАЧЕНИЕ В СТРОКУ */}
            <div className="flex justify-between mb-2">
              <span className="text-sm font-semibold text-slate-900">
                Waste Ratio
              </span>
              <span className={`font-bold ${color}`}>
                {wastePercentage.toFixed(1)}%
                {/* toFixed(1) = 1 знак после запятой: 10.5% */}
              </span>
            </div>
            
            {/* ПОЛОСКА-ПРОГРЕСС-БАР */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-full rounded-full transition-all`}
                style={{
                  width: `${Math.min(wastePercentage, 100)}%`,
                  // Math.min = не больше чем 100% (чтобы не выходила за границы)
                  
                  // Цвет полоски зависит от процента
                  backgroundColor: wastePercentage > 20 
                    ? '#dc2626'  // Красный
                    : wastePercentage > 10 
                    ? '#f59e0b'  // Оранжевый
                    : '#10b981'  // Зелёный
                }}
              />
            </div>
          </div>
          
          {/* 2️⃣ РЕКОМЕНДАЦИЯ (советы) */}
          <div className="text-sm text-slate-600">
            <p>💡 <span className="font-semibold">Recommendation:</span></p>
            <p className="mt-1">
              {wastePercentage > 20
                ? 'Delete unused resources immediately to reduce costs.'
                // Если очень плохо (>20%) - срочно удаляйте
                : wastePercentage > 10
                ? 'Consider removing low-utilization resources.'
                // Если плохо (10-20%) - рассмотрите удаление
                : 'Great job! Your infrastructure is well-optimized.'
                // Если хорошо (<10%) - поздравляем!
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 💡 КАК ИСПОЛЬЗОВАТЬ HealthScore

```typescript
// В App.tsx:
<HealthScore 
  totalSpend={data?.summary?.totalSpend || 0}
  totalWaste={data?.summary?.totalWaste || 0}
/>

// ПРИМЕРЫ РЕЗУЛЬТАТОВ:
// Пример 1: totalSpend=10000, totalWaste=500 (5% потерь)
// → waste%=5%, healthScore=100-25=75, цвет=ЗЕЛЁНЫЙ ✅

// Пример 2: totalSpend=10000, totalWaste=1500 (15% потерь)
// → waste%=15%, healthScore=100-75=25, цвет=ЖЁЛТЫЙ ⚠️

// Пример 3: totalSpend=10000, totalWaste=2500 (25% потерь)
// → waste%=25%, healthScore=100-125→0, цвет=КРАСНЫЙ 🔴
```

---

## <a name="создание-собственного"></a>🚀 СОЗДАНИЕ СОБСТВЕННОГО КОМПОНЕНТА

### Пример: Создаём компонент CostAlert

```typescript
// 1️⃣ НОВЫЙ ФАЙЛ: src/components/ui/CostAlert.tsx

import React from 'react';
import { AlertTriangle } from 'lucide-react';

// 2️⃣ INTERFACE - описываем параметры
interface CostAlertProps {
  // Серьёзность: high (красный), medium (жёлтый), low (синий)
  severity: 'high' | 'medium' | 'low';
  
  // Сообщение об ошибке
  message: string;
  
  // Можно сэкономить денег
  amount: number;
}

// 3️⃣ КОМПОНЕНТ
export const CostAlert = ({ severity, message, amount }: CostAlertProps) => {
  // 4️⃣ ЛОГИКА - определяем цвета в зависимости от severity
  const bgColor = {
    high: 'bg-red-50 border-red-200',
    medium: 'bg-amber-50 border-amber-200',
    low: 'bg-blue-50 border-blue-200'
  }[severity];

  const textColor = {
    high: 'text-red-600',
    medium: 'text-amber-600',
    low: 'text-blue-600'
  }[severity];

  // 5️⃣ JSX - рисуем компонент
  return (
    <div className={`
      ${bgColor}                 // Цветной фон в зависимости от severity
      border p-6 rounded-3xl     // Граница, отступ, углы
      flex items-start gap-4     // Расположение: иконка слева, текст справа
    `}>
      {/* ИКОНКА */}
      <AlertTriangle 
        className={`${textColor} flex-shrink-0`}  // Не сжимается, занимает место
        size={24}
      />
      
      {/* ТЕКСТ */}
      <div className="flex-1">  {/* flex-1 = занимает оставшееся место */}
        <h4 className={`${textColor} font-bold text-lg`}>
          {message}
        </h4>
        <p className="text-slate-600 text-sm mt-2">
          Potential savings: ${amount.toLocaleString('en-US', { 
            minimumFractionDigits: 2 
          })}
          {/* toLocaleString = красивый формат: 2500.50 */}
        </p>
      </div>
    </div>
  );
};
```

### Использование CostAlert:

```typescript
import { CostAlert } from '@/components/ui/CostAlert';

// В JSX:
<CostAlert 
  severity="high"
  message="Unused resources detected"
  amount={2500.50}
/>

<CostAlert 
  severity="medium"
  message="Underutilized instances"
  amount={1200}
/>

<CostAlert 
  severity="low"
  message="Storage optimization possible"
  amount={500}
/>
```

---

## <a name="tailwind"></a>🎨 TAILWIND CSS - Классы которые используются в проекте

### Размеры и отступы

```
p-6         = padding (внутренний отступ): 24px со всех сторон
p-3         = padding: 12px
p-8         = padding: 32px

mt-6        = margin-top (отступ сверху): 24px
mb-6        = margin-bottom (отступ снизу): 24px
ml-8        = margin-left (отступ слева): 32px

gap-2       = расстояние между элементами: 8px
gap-4       = расстояние: 16px
space-y-4   = вертикальное расстояние между дочками: 16px
space-y-1   = вертикальное расстояние: 4px

h-2         = высота: 8px
h-40        = высота: 160px

w-full      = ширина: 100%
w-40        = ширина: 160px
```

### Цвета

```
bg-white            = белый фон
bg-slate-900        = очень тёмный фон
bg-slate-50         = очень светлый фон
bg-emerald-50       = светло-зелёный фон
bg-red-50           = светло-красный фон
bg-indigo-50        = светло-синий фон

text-slate-900      = очень тёмный текст
text-slate-600      = серый текст
text-indigo-600     = синий текст
text-emerald-600    = зелёный текст
text-red-600        = красный текст

border border-gray-100  = граница, цвет: светло-серый
```

### Типография

```
text-xs         = очень маленький (0.75rem)
text-sm         = маленький (0.875rem)
text-lg         = средний (1.125rem)
text-3xl        = большой (1.875rem)
text-4xl        = очень большой (2.25rem)
text-5xl        = огромный (3rem)

font-bold       = жирный (вес 700)
font-black      = самый жирный (вес 900)
font-semibold   = полужирный (вес 600)

uppercase       = ВСЕ ЗАГЛАВНЫЕ
tracking-wider  = больше пространства между буквами
tracking-tight  = меньше пространства между буквами
```

### Позиционирование и макет

```
flex            = использовать flexbox
flex-col        = направление: столбец (вертикально)
flex-1          = занимает оставшееся место

justify-between = элементы в разные стороны (слева и справа)
justify-center  = элементы по центру
items-center    = вертикально центрировать

rounded-3xl     = скруглённые углы: 30px
rounded-full    = очень скруглённые (как таблетка)
rounded-2xl     = скруглённые углы: 16px

shadow-sm       = маленькая тень
shadow-xl       = большая тень
```

### Интерактивность

```
hover:scale-[1.02]      = при наведении: увеличить на 2%
hover:shadow-lg         = при наведении: большая тень
transition-all          = плавное изменение
duration-300            = скорость анимации: 300мс
duration-500            = скорость анимации: 500мс

disabled:opacity-50     = при disabled: полупрозрачный (50%)
active:scale-95         = при клике: уменьшить на 5%
```

### Градиенты

```
bg-gradient-to-r from-indigo-500 to-indigo-600
  = Градиент слева направо: от синего к тёмно-синему

bg-gradient-to-b from-color to-color
  = Градиент сверху вниз
```

---

## <a name="иконки"></a>🎁 LUCIDE REACT ИКОНКИ

### Импорт иконок:

```typescript
import { 
  DollarSign,         // Монета/деньги ($)
  Server,             // Сервер
  AlertTriangle,      // Предупреждение (треугольник)
  AlertCircle,        // Предупреждение (круг)
  CheckCircle,        // Успешно (галочка в круге)
  TrendingUp,         // Рост графика
  BarChart,           // Столбцовая диаграмма
  LineChart,          // Линейная диаграмма
  HardDrive,          // Жёсткий диск
  Zap,                // Молния (электричество)
  Shield,             // Щит (безопасность)
  RefreshCcw,         // Обновить (стрелочка)
  Clock,              // Часы
  Users,              // Люди
  Lock                // Замок
} from 'lucide-react';

// Использование:
<DollarSign size={20} />      // Размер 20px
<Server />                     // Размер по умолчанию (24px)
<AlertTriangle className="text-red-600" />  // С цветом
```

### Все доступные иконки:
https://lucide.dev/

Просто ищите там нужную иконку и импортируйте её!

---

## 📝 ЧЕК-ЛИСТ: Создание нового компонента

- [ ] Создан файл в `src/components/ui/NameComponent.tsx`
- [ ] Написан interface с prop types
- [ ] Компонент экспортируется с `export const`
- [ ] Основной контейнер: `bg-white p-6 rounded-3xl shadow-sm border border-gray-100`
- [ ] Используются только `className` (не inline `style`)
- [ ] Если есть массив данных - используется `.map()`
- [ ] Все элементы .map() имеют `key` props
- [ ] Тексты используют правильные Tailwind классы для цветов
- [ ] Иконки импортированы из `lucide-react`
- [ ] Компонент протестирован в App.tsx
- [ ] Переиспользуется в нескольких местах

---

## 🎓 Полезные паттерны

### Условное отображение элемента

```typescript
{/* Показать только если isActive === true */}
{isActive && <div>Content</div>}

{/* Тернарный оператор */}
{isActive ? <div>Active</div> : <div>Inactive</div>}
```

### Циклы

```typescript
{/* Простой цикл */}
{items.map((item, idx) => (
  <div key={idx}>{item.name}</div>
))}

{/* С деструктуризацией */}
{items.map(({ id, name }) => (
  <div key={id}>{name}</div>
))}
```

### Условные классы

```typescript
{/* Если condition true → класс "red", иначе → класс "blue" */}
<div className={condition ? 'bg-red-500' : 'bg-blue-500'}>

{/* Несколько условий */}
<div className={`
  ${isMain ? 'bg-dark text-white' : 'bg-light text-black'}
  ${isActive ? 'border-2' : 'border-1'}
  p-6 rounded-3xl
`}>
```

### Форматирование чисел

```typescript
{/* Форматирует число до 2 знаков после запятой */}
{value.toFixed(2)}  // 45.5 → "45.50"

{/* Красивый формат с разделителями */}
{amount.toLocaleString('en-US')}  // 2500 → "2,500"
{amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}  // "2,500.00"
```

### Обработка undefined/null

```typescript
{/* Если data undefined, используй '0.00' */}
${data?.summary?.totalSpend?.toFixed(2) || '0.00'}

{/* Optional chaining (?) - если нет property, вернёт undefined, не упадёт */}
data?.resources?.length
```

---

## 🔗 Полезные ссылки

- **Tailwind CSS документация:** https://tailwindcss.com/docs
- **Lucide React иконки:** https://lucide.dev
- **React документация:** https://react.dev
- **TypeScript Handbook:** https://www.typescriptlang.org/docs

---

**Удачи в создании компонентов! 🚀**
