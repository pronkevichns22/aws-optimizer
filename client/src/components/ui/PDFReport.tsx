// ============================================================================
// FILE: PDFReport.tsx
// LOCATION: client/src/components/ui/
// PURPOSE: Component for generating and downloading PDF reports of the analysis
// ============================================================================

import jsPDF from 'jspdf';
import { Download, FileText } from 'lucide-react';

// ========== Props for PDFReport component ==========
interface PDFReportProps {
  data?: any;
}

export const PDFReport = ({ data }: PDFReportProps) => {
  const generatePDF = () => {
    if (!data?.summary) {
      alert('No data available. Run an audit first!');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;

    // Заголовок
    doc.setFontSize(24);
    doc.setTextColor(30, 30, 30);
    doc.text('AWS Optimizer Report', margin, y);
    y += 12;

    // Дата
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, y);
    y += 15;

    // Сводка
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text('Executive Summary', margin, y);
    y += 10;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const summaryText = `This report provides an overview of your AWS infrastructure optimization. The analysis identifies unused resources and provides recommendations for cost reduction.`;
    doc.text(summaryText, margin, y, { maxWidth: pageWidth - 2 * margin });
    y += 20;

    // Основные метрики
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text('Key Metrics', margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const metrics = [
      ['Total Monthly Spend', `$${data.summary.totalSpend.toFixed(2)}`],
      ['Potential Savings', `$${data.summary.totalWaste.toFixed(2)}`],
      ['Waste Percentage', `${((data.summary.totalWaste / data.summary.totalSpend) * 100).toFixed(1)}%`],
      ['Active Servers', `${data.summary.serverCount}`],
      ['Total Volumes', `${data.summary.diskCount}`],
      ['Unused Resources', `${data.summary.wasteCount}`]
    ];

    metrics.forEach((metric, _i) => {
      doc.text(metric[0], margin, y);
      doc.text(metric[1], pageWidth - margin - 30, y, { align: 'right' });
      y += 7;
    });

    y += 10;

    // Рекомендации
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text('Recommendations', margin, y);
    y += 10;

    const recommendations = [
      'Delete unused EBS volumes to reduce storage costs',
      'Release unattached Elastic IPs to save on IP fees',
      'Review and optimize EC2 instance types for better performance',
      'Implement auto-scaling to handle variable workloads',
      'Set up cost allocation tags for better tracking'
    ];

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    recommendations.forEach((rec, i) => {
      doc.text(`${i + 1}. ${rec}`, margin + 5, y, { maxWidth: pageWidth - 2 * margin - 10 });
      y += 8;
    });

    y += 10;

    // Таблица ресурсов
    if (data.resources && data.resources.length > 0) {
      if (y + 30 > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }

      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text('Unused Resources', margin, y);
      y += 10;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);

      const tableData = data.resources.map((r: any) => [
        r.id.substring(0, 20),
        r.type,
        r.region || 'N/A',
        `$${r.cost.toFixed(2)}`
      ]);

      // Простая таблица
      doc.text('Resource ID', margin, y);
      doc.text('Type', margin + 70, y);
      doc.text('Region', margin + 100, y);
      doc.text('Cost', margin + 140, y);
      y += 7;

      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;

      tableData.slice(0, 10).forEach((row: any) => {
        doc.text(row[0], margin, y);
        doc.text(row[1], margin + 70, y);
        doc.text(row[2], margin + 100, y);
        doc.text(row[3], margin + 140, y);
        y += 6;
      });

      if (data.resources.length > 10) {
        doc.text(`... and ${data.resources.length - 10} more resources`, margin, y);
      }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('CloudOpti AWS Optimizer - Cost Optimization Report', margin, pageHeight - 10);

    // Сохранить PDF
    doc.save(`AWS-Optimizer-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
    >
      <FileText size={20} />
      <span>Download PDF Report</span>
      <Download size={16} />
    </button>
  );
};
