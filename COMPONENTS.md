# COMPONENTS.md - Frontend Components Reference

## React Components Overview

AWS Optimizer frontend consists of reusable React components organized by responsibility.

---

## Page Components

These are top-level page components that correspond to routes in the application.

### 1. **LoginPage** (`pages/LoginPage.tsx`)

**Purpose:** User authentication interface

**Props:** None

**Features:**
- Email and password input fields
- Form validation
- Login error handling
- Link to registration page
- Password "show/hide" toggle

**State:**
```typescript
- email: string
- password: string
- error: string | null
- loading: boolean
```

**API Calls:**
- `POST /api/auth/login`

**Output:**
- Redirects to dashboard on success
- Displays error message on failure

---

### 2. **RegisterPage** (`pages/RegisterPage.tsx`)

**Purpose:** New user registration

**Props:** None

**Features:**
- Email validation (format check)
- Password strength validation
- Confirm password field
- First/Last name inputs
- Terms of service checkbox

**Validation Rules:**
- Email: Valid format
- Password: Min 8 chars, uppercase, lowercase, number, special char
- Names: Non-empty, max 50 chars

**API Calls:**
- `POST /api/auth/register`

**Output:**
- Redirect to login on success
- Display validation errors

---

### 3. **NewDashboard** (`pages/NewDashboard.tsx`)

**Purpose:** Main dashboard showing cost and resource overview

**Structure:**
```
NewDashboard
├── DashboardMetrics (4 stat cards)
│   ├── StatCard: Total Spend
│   ├── StatCard: Total Waste
│   ├── StatCard: Resources Count
│   └── StatCard: Wasted Resources
├── CostTrend (Line chart)
│   └── Time period selector (12h, 24h, 7d, 30d)
└── Spend by Service (Pie/Bar chart)
```

**Key Metrics Displayed:**
- Total monthly spend ($)
- Monthly waste ($)
- Resource count (number)
- Wasted resources (number)
- Cost trends (graph)
- Service breakdown (chart)

**API Integration:**
- Fetches AWS scan data on component mount
- Displays alert notifications
- Real-time cost calculations

---

### 4. **NewResourcesPage** (`pages/NewResourcesPage.tsx`)

**Purpose:** Detailed resource inventory with filtering

**Components:**
- Search bar (by resource ID, type, tags)
- Filter buttons (All, EC2, EBS, IP)
- Resources table with pagination
- Resource detail modal

**Table Columns:**
| Column | Type | Description |
|--------|------|-------------|
| Resource ID | string | AWS resource ID |
| Type | string | EC2, EBS, ElasticIP |
| Size | string | Instance type, volume size |
| Cost | string | Monthly estimated cost |
| Actions | button | Delete, details, tag |

**Features:**
- Search & filter
- Sort by column
- Bulk actions
- Resource details view
- Cost estimation

---

### 5. **SecurityPage** (`pages/SecurityPage.tsx`)

**Purpose:** Security alerts and compliance dashboard

**Components:**
- SecurityAlertsTable (findings list)
- Severity filter (Critical, High, Medium, Low)
- Category filter (CSPM, FinOps, Compliance)
- Alert detail modal
- Remediation guidance

**Features:**
- Real-time alert status
- Severity indicators
- Remediation recommendations
- Compliance framework mapping
- Alert history timeline

---

### 6. **SettingsPage** (`pages/SettingsPage.tsx`)

**Purpose:** User preferences and configuration

**Sections:**
1. **Profile Settings**
   - First/Last name
   - Email
   - Password change

2. **Preferences**
   - Theme (dark/light)
   - Notifications toggle
   - Auto-scan settings
   - Scan interval

3. **AI Settings**
   - Temperature (0.0 - 1.0)
   - Max tokens
   - System prompt

4. **Connected Services**
   - AWS credentials status
   - Groq API status

---

## Layout Components

These components provide the overall page structure and navigation.

### 7. **Header** (`components/Layout/Header.tsx`)

**Purpose:** Top navigation bar

**Props:**
```typescript
{
  currentPage: string,
  onPageChange: (page: string) => void,
  onLogout: () => void
}
```

**Features:**
- Logo/branding
- Navigation links
- User dropdown menu
- Search bar
- Logout button

**UI Elements:**
- Company logo
- Page title
- Breadcrumb navigation
- User profile dropdown
- Notification bell

---

### 8. **Sidebar** (`components/Layout/Sidebar.tsx`)

**Purpose:** Left navigation menu

**Props:**
```typescript
{
  currentPage: string,
  onPageChange: (page: string) => void
}
```

**Menu Items:**
- Dashboard (home icon)
- Resources (server icon)
- Security (shield icon)
- Settings (gear icon)
- Logout (exit icon)

**Features:**
- Active page highlighting
- Icon-based navigation
- Responsive collapse/expand

---

### 9. **DashboardSidebar** (`components/Layout/DashboardSidebar.tsx`)

**Purpose:** Right sidebar with action buttons and AI advisor card

**Props:**
```typescript
{
  onAIModalStateChange: (isOpen: boolean) => void
}
```

**Sections:**
1. **Action Buttons**
   - Rescan (refresh AWS data)
   - Logs (view audit logs)
   - Export (download report)

2. **AI Advisor Card**
   - Status indicator
   - Quick prompt examples
   - Open fullscreen button

**Features:**
- Real-time status updates
- Loading indicators
- Hover tooltips

---

## UI Components

Reusable visual components for building interfaces.

### 10. **StatCard** (`components/ui/StatCard.tsx`)

**Purpose:** Display a single metric with trend

**Props:**
```typescript
{
  title: string,
  value: string | number,
  trend?: number,        // Percentage change
  icon?: React.ReactNode,
  color?: string,        // Tailwind color class
  onClick?: () => void
}
```

**Display:**
```
┌─────────────────────┐
│ Total Spend    📊    │
│ $2,450.75           │
│ ↑ 15.3% vs last mo  │
└─────────────────────┘
```

**Features:**
- Trend indicator (up/down arrow)
- Color-coded background
- Icon display
- Click handler (optional)

---

### 11. **DashboardMetrics** (`components/ui/DashboardMetrics.tsx`)

**Purpose:** Grid layout of 4 metric cards

**Props:**
```typescript
{
  metrics: {
    totalSpend: number,
    totalWaste: number,
    resourceCount: number,
    wastedResources: number
  },
  onMetricClick: (metric: string) => void
}
```

**Layout:**
```
┌────────┬────────┬────────┬────────┐
│Spend   │Waste   │Resources│Wasted  │
│$2,450  │$450    │15       │3       │
└────────┴────────┴────────┴────────┘
```

---

### 12. **Chart** (`components/ui/Chart.tsx`)

**Purpose:** Generic wrapper for chart components

**Props:**
```typescript
{
  type: 'line' | 'bar' | 'pie',
  data: any[],
  title?: string,
  height?: number,
  options?: ChartOptions
}
```

**Supported Charts:**
- Line charts (cost trends)
- Bar charts (service breakdown)
- Pie charts (resource distribution)

---

### 13. **CostTrend** (`components/ui/CostTrend.tsx`)

**Purpose:** Time-series cost visualization

**Props:**
```typescript
{
  period: '12h' | '24h' | '7d' | '30d',
  onPeriodChange: (period: string) => void,
  data?: CostDataPoint[]
}
```

**Features:**
- Multiple time periods
- Trend line
- Cost reduction indicator
- Interactive tooltip

**Data Format:**
```typescript
{
  date: string,
  spend: number,
  waste: number,
  savings: number
}
```

---

### 14. **ResourcesTable** (`components/ui/ResourcesTable.tsx`)

**Purpose:** Paginated table of AWS resources

**Props:**
```typescript
{
  resources: Resource[],
  onResourceSelect: (resource: Resource) => void,
  onDelete: (resourceId: string) => void,
  filterType?: 'all' | 'EC2' | 'EBS' | 'IP'
}
```

**Features:**
- Pagination (20 items per page)
- Sorting by column
- Row selection
- Bulk actions
- Resource detail view

**Columns:**
- Resource ID (searchable)
- Type (EC2, EBS, EIP)
- Size (instance type, volume size)
- Cost ($)
- Actions (delete, details)

---

### 15. **SecurityAlertsTable** (`components/ui/SecurityAlertsTable.tsx`)

**Purpose:** Display security findings and alerts

**Props:**
```typescript
{
  alerts: SecurityAlert[],
  onAlertSelect: (alert: SecurityAlert) => void,
  onResolve: (alertId: string) => void,
  filters?: {
    severity?: string,
    category?: string
  }
}
```

**Features:**
- Severity color coding
- Category filtering
- Search functionality
- Mark as resolved
- Remediation guidance

> **⚠️ [INCOMPLETE] Функции snooze и acknowledge НЕ реализованы в этом компоненте, хотя callback `onResolve` присутствует в Props. Полная история изменений статуса алертов также не поддерживается.**

**Alert Severity:**
- 🔴 Critical (red)
- 🟠 High (orange)
- 🟡 Medium (yellow)
- 🔵 Low (blue)

---

### 16. **HealthScore** (`components/ui/HealthScore.tsx`)

**Purpose:** Overall infrastructure health indicator

**Props:**
```typescript
{
  score: number,        // 0-100
  resources: number,
  alerts: number,
  trend?: number
}
```

**Display:**
```
Infrastructure Health: 72%
├── Resources: 15
├── Alerts: 8 (↑ from 6)
└── Recommendation: Resolve 2 critical security alerts
```

---

### 17. **SecurityMetrics** (`components/ui/SecurityMetrics.tsx`)

**Purpose:** Security posture summary

**Metrics Displayed:**
- CSPM Score (compliance %)
- Critical findings count
- High findings count
- Compliance frameworks coverage

---

### 18. **LiveThreatLog** (`components/ui/LiveThreatLog.tsx`)

**Purpose:** Real-time security event timeline

**Features:**
- Latest security events
- Event severity indicators
- Timestamp
- Resource information
- Drill-down to details

---

### 19. **PDFReport** (`components/ui/PDFReport.tsx`)

**Purpose:** Generate and export PDF report

**Props:**
```typescript
{
  reportType: 'executive' | 'detailed' | 'compliance',
  includeCharts: boolean,
  dateRange: { start: Date, end: Date }
}
```

**Report Sections:**
- Executive summary
- Cost analysis
- Security findings
- Recommendations
- Resource inventory
- Compliance status

---

### 20. **SummaryCard** (`components/ui/SummaryCard.tsx`)

**Purpose:** Compact information card

**Props:**
```typescript
{
  title: string,
  items: Array<{
    label: string,
    value: string | number,
    icon?: React.ReactNode
  }>,
  color?: string
}
```

---

## AI Components

### 21. **AIAdvisor** (`components/AIAdvisor.tsx`)

**Purpose:** Embedded AI chat widget for dashboard sidebar

**Props:**
```typescript
{
  resourceCount?: number,
  totalCost?: number,
  alerts?: any[],
  onOpenFullscreen?: () => void
}
```

**Features:**
- Chat input field
- Message display
- Loading indicator
- Quick prompt suggestions
- Fullscreen button

**UI Layout:**
```
┌─────────────────────────┐
│ CloudOpti AI            │
│ POWERED BY GROQ         │
├─────────────────────────┤
│ Ask about infrastructure│
│                         │
│ [Message Input]     [→] │
└─────────────────────────┘
```

---

### 22. **AIAdvisorModal** (`components/AIAdvisorModal.tsx`)

**Purpose:** Fullscreen AI advisor interface

**Props:**
```typescript
{
  isOpen: boolean,
  onClose: () => void,
  alerts?: any[],
  resourceCount?: number,
  totalCost?: number,
  infrastructureContext?: string
}
```

**Features:**
- Full-screen modal
- Chat sidebar with history
- Main chat area
- Message input with send button
- Close button (Esc key)
- Persistent chat history

**Modal Layout:**
```
┌──────────────────────────────────────┐
│ ✕                  CloudOpti AI      │
├────────────────────────────────────┤
│ Sidebar    │          Chat Area     │
│            │                        │
│ New Chat   │ [Messages]             │
│ ────────   │                        │
│ Chat 1     │ [Input + Send]         │
│ Chat 2     │                        │
│ Chat 3     │                        │
└────────────────────────────────────┘
```

---

## Context Components

### 23. **AWSContext** (`context/AWSContext.tsx`)

**Purpose:** Global state management for AWS data

**Provided State:**
```typescript
{
  resources: {
    ec2Instances: Instance[],
    ebsVolumes: Volume[],
    elasticIps: Address[],
    securityGroups: SecurityGroup[],
    iamUsers: User[]
  },
  alerts: SecurityAlert[],
  metrics: {
    totalSpend: number,
    totalWaste: number,
    resourceCount: number
  },
  user: {
    id: string,
    email: string,
    name: string
  },
  loading: boolean,
  error: string | null
}
```

**Provided Methods:**
- `scanAWS()` - Trigger infrastructure scan
- `fetchAlerts()` - Load security alerts
- `updatePreferences()` - Save user settings
- `logout()` - Clear session

---

## Component Hierarchy

```
App
├── LoginPage
├── RegisterPage
└── DashboardLayout
    ├── Header
    ├── Sidebar
    ├── DashboardSidebar
    │   └── AIAdvisor
    │       └── AIAdvisorModal
    └── Pages
        ├── NewDashboard
        │   ├── DashboardMetrics
        │   │   └── StatCard (x4)
        │   ├── CostTrend
        │   └── Chart
        ├── NewResourcesPage
        │   └── ResourcesTable
        ├── SecurityPage
        │   └── SecurityAlertsTable
        └── SettingsPage
```

---

## Styling & Design System

### Color Palette (Tailwind)
- **Primary:** Indigo (600-800)
- **Success:** Green (500-600)
- **Warning:** Amber (500-600)
- **Danger:** Rose/Red (500-600)
- **Background:** Slate/Gray (900-950)
- **Text:** White (for dark mode)

### Spacing Units
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

### Typography
- **Font:** Albert Sans, Roboto fallback
- **Headings:** Bold (700)
- **Body:** Regular (400)
- **UI Controls:** Medium (500)

---

**Last Updated:** May 12, 2026  
**Component Count:** 23  
**React Version:** 18+
