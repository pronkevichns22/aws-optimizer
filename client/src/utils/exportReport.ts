// exportUtils.ts (или как называется твой файл)

interface ExportResource {
  id: string;
  type: string;
  size?: string | number;
  cost: number | string;
  status?: string;
  region?: string; // Добавил region, так как он используется в таблице
}

interface ExportSummary {
  totalSpend: number;
  totalWaste: number;
  wasteCount: number;
  totalResources: number;
}

interface ExportOptions {
  title: string;
  resources: ExportResource[];
  filename: string;
  summary?: ExportSummary; // Добавляем summary!
}

const getResourceColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    'EC2': '#B548FF',
    'EBS': '#1A85FF', // Заменил на синий, чтобы отличалось от Snapshot
    'IP': '#FF9F43',
    'RDS': '#FF9F43',
    'S3': '#00D084',
    'SNAPSHOT': '#14B8A6'
  };
  return colors[type] || '#479DFF';
};

const getCostByType = (resources: ExportResource[]): { [key: string]: number } => {
  const costByType: { [key: string]: number } = {};
  resources.forEach((r) => {
    const cost = typeof r.cost === 'string' ? parseFloat(r.cost.replace(/[^0-9.]/g, '')) : (r.cost || 0);
    costByType[r.type] = (costByType[r.type] || 0) + cost;
  });
  return costByType;
};

const getStatusBreakdown = (resources: ExportResource[]): { [key: string]: number } => {
  const statusBreakdown: { [key: string]: number } = {};
  resources.forEach((r) => {
    statusBreakdown[r.status || 'Unknown'] = (statusBreakdown[r.status || 'Unknown'] || 0) + 1;
  });
  return statusBreakdown;
};

const generateHTML = (options: ExportOptions): string => {
  const exportDate = new Date().toLocaleString();
  const costByType = getCostByType(options.resources);
  const statusBreakdown = getStatusBreakdown(options.resources);
  const totalCost = Object.values(costByType).reduce((a, b) => a + b, 0);

  // Используем переданное summary или считаем на лету
  const summary = options.summary || {
      totalSpend: totalCost,
      totalWaste: totalCost,
      wasteCount: options.resources.length,
      totalResources: options.resources.length
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@400;500;600;700;800;900&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Albert Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0B0C10;
            color: #E8EAED;
            padding: 60px 20px;
        }
        .wrapper {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 40px;
        }
        h1 {
            font-size: 36px;
            font-weight: 900;
            line-height: 1;
            letter-spacing: -0.5px;
            color: #FFFFFF;
            margin-bottom: 8px;
        }
        .header-meta {
            color: #818CA2;
            font-size: 13px;
            font-weight: 600;
        }
        .header-date {
            color: #818ca2;
            font-size: 12px;
            font-weight: 600;
            background: #181921;
            padding: 8px 16px;
            border-radius: 12px;
            border: 1px solid #242732;
        }

        /* Top KPI Cards */
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }
        .kpi-card {
            background: #13141b;
            border: 1px solid #242732;
            border-radius: 20px;
            padding: 24px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .kpi-title {
            color: #818ca2;
            font-size: 10px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        .kpi-value {
            font-size: 36px;
            font-weight: 900;
            margin-bottom: 8px;
            line-height: 1;
            color: #FFFFFF;
        }
        .kpi-value.red { color: #ef4444; }
        
        .section-title {
            font-size: 20px;
            font-weight: 900;
            color: #FFFFFF;
            margin: 40px 0 24px 0;
            line-height: 1.4;
        }
        .charts-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 24px;
            margin-bottom: 40px;
        }
        .chart-card {
            background: #181921;
            border: 1px solid #242732;
            border-radius: 20px;
            padding: 32px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .chart-title {
            font-size: 14px;
            font-weight: 700;
            color: #E8EAED;
            margin-bottom: 24px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .bar-item {
            margin-bottom: 20px;
        }
        .bar-label-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }
        .bar-label-text {
            color: #FFFFFF;
            font-weight: 600;
        }
        .bar-label-value {
            color: #818CA2;
            font-weight: 600;
        }
        .bar-background {
            height: 8px;
            background: #242732;
            border-radius: 4px;
            overflow: hidden;
        }
        .bar-fill {
            height: 100%;
            border-radius: 4px;
        }

        .table-section {
            background: #181921;
            border: 1px solid #242732;
            border-radius: 20px;
            padding: 32px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            padding: 16px 12px;
            text-align: left;
            font-size: 11px;
            font-weight: 900;
            color: #818CA2;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #242732;
        }
        td {
            padding: 16px 12px;
            font-size: 13px;
            color: #E8EAED;
            border-bottom: 1px solid #242732;
        }
        tbody tr:hover td {
            background: #1C1D25;
        }
        .resource-id {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 12px;
            color: #479DFF;
            padding: 4px 12px;
            background: #2F334B;
            border-radius: 99px;
            border: 1px solid rgba(71,157,255,0.4);
        }
        .type-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 99px;
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            border: 1px solid;
        }
        .cost-cell {
            font-weight: 700;
            color: #EF4444;
        }
        
        @media print {
            body { background: white; color: black; padding: 0; }
            .kpi-card, .chart-card, .table-section, .header-date { background: white; border: 1px solid #ddd; box-shadow: none; }
            h1, .kpi-value, .chart-title, .bar-label-text { color: black; }
            .bar-background { background: #eee; }
            th, td { border-bottom: 1px solid #eee; }
            .resource-id { background: #f0f0f0; color: #333; border: none; }
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header-content">
            <div>
                <h1>${options.title}</h1>
                <div class="header-meta">AWS Infrastructure Overview</div>
            </div>
            <div class="header-date">Generated: ${exportDate}</div>
        </div>

        <!-- NEW KPI CARDS SECTION -->
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-title">Total Spend</div>
                <div class="kpi-value">$${summary.totalSpend.toFixed(2)}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Total Waste</div>
                <div class="kpi-value red">$${summary.totalWaste.toFixed(2)}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Resources Count</div>
                <div class="kpi-value">${summary.totalResources}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-title">Wasted Resources</div>
                <div class="kpi-value red">${summary.wasteCount}</div>
            </div>
        </div>

        ${options.resources.length > 0 ? `
        <h2 class="section-title">Cost Analytics</h2>
        <div class="charts-grid">
            <div class="chart-card">
                <div class="chart-title">Cost by Resource Type</div>
                ${Object.entries(costByType)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([type, cost]) => {
                    const percentage = totalCost > 0 ? (((cost as number) / totalCost) * 100).toFixed(1) : '0.0';
                    const color = getResourceColor(type);
                    return `
                    <div class="bar-item">
                        <div class="bar-label-row">
                            <span class="bar-label-text">${type}</span>
                            <span class="bar-label-value">$${(cost as number).toFixed(2)} (${percentage}%)</span>
                        </div>
                        <div class="bar-background">
                            <div class="bar-fill" style="width: ${Math.max(Number(percentage), 2)}%; background: ${color};"></div>
                        </div>
                    </div>`;
                  })
                  .join('')}
            </div>
            <div class="chart-card">
                <div class="chart-title">Resources by Status</div>
                ${Object.entries(statusBreakdown)
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([status, count]) => {
                    const percentage = options.resources.length > 0 ? (((count as number) / options.resources.length) * 100).toFixed(1) : '0.0';
                    const color = status === 'available' || status === 'unused' ? '#EF4444' : '#10B981';
                    return `
                    <div class="bar-item">
                        <div class="bar-label-row">
                            <span class="bar-label-text" style="text-transform: uppercase">${status}</span>
                            <span class="bar-label-value">${count} items (${percentage}%)</span>
                        </div>
                        <div class="bar-background">
                            <div class="bar-fill" style="width: ${Math.max(Number(percentage), 2)}%; background: ${color};"></div>
                        </div>
                    </div>`;
                  })
                  .join('')}
            </div>
        </div>
        ` : ''}

        <h2 class="section-title">Detailed Resource Inventory</h2>
        <div class="table-section">
            <table>
                <thead>
                    <tr>
                        <th>Resource ID</th>
                        <th style="text-align: center">Type</th>
                        <th style="text-align: center">Region</th>
                        <th style="text-align: center">Status</th>
                        <th style="text-align: center">Size</th>
                        <th style="text-align: right">Monthly Cost</th>
                    </tr>
                </thead>
                <tbody>
                    ${options.resources.map((r) => {
                      const cost = typeof r.cost === 'string' ? r.cost.replace(/[^0-9.]/g, '') : (r.cost as number)?.toFixed(2) || '0.00';
                      const color = getResourceColor(r.type);
                      return `
                    <tr>
                        <td><span class="resource-id">${r.id}</span></td>
                        <td style="text-align: center"><span class="type-badge" style="background: ${color}22; color: ${color}; border-color: ${color}44;">${r.type}</span></td>
                        <td style="text-align: center; color: #818CA2;">${r.region || 'us-east-1'}</td>
                        <td style="text-align: center; color: #818CA2; text-transform: uppercase; font-size: 11px; font-weight: bold;">${r.status || 'N/A'}</td>
                        <td style="text-align: center; color: #818CA2;">${r.size ? r.size + ' GB' : '-'}</td>
                        <td style="text-align: right" class="${(r.status === 'available' || r.status === 'unused' || Number(cost) > 0) ? 'cost-cell' : ''}">
                            $${cost}
                        </td>
                    </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>`;
};

export const downloadReport = (options: ExportOptions): void => {
  const html = generateHTML(options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = options.filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};