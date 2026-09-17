import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export class ReportGenerator {
  constructor() {
    this.defaultOptions = {
      fontSize: 12,
      font: 'helvetica',
      margins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
    };
  }

  // Generate PDF report
  async generatePDF(data, options = {}) {
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.format || 'a4',
    });

    const config = { ...this.defaultOptions, ...options };
    let yPosition = config.margins.top;

    // Add title
    if (options.title) {
      pdf.setFontSize(config.fontSize + 4);
      pdf.setFont(config.font, 'bold');
      pdf.text(options.title, config.margins.left, yPosition);
      yPosition += 15;
    }

    // Add subtitle/date
    if (options.subtitle) {
      pdf.setFontSize(config.fontSize - 2);
      pdf.setFont(config.font, 'normal');
      pdf.text(options.subtitle, config.margins.left, yPosition);
      yPosition += 10;
    }

    // Add table headers
    if (options.headers && data.length > 0) {
      pdf.setFontSize(config.fontSize);
      pdf.setFont(config.font, 'bold');
      
      const headers = options.headers;
      const columnWidth = (pdf.internal.pageSize.width - config.margins.left - config.margins.right) / headers.length;
      
      headers.forEach((header, index) => {
        const x = config.margins.left + (index * columnWidth);
        pdf.text(header, x, yPosition);
      });
      
      yPosition += 10;
      
      // Add line after headers
      pdf.line(config.margins.left, yPosition, pdf.internal.pageSize.width - config.margins.right, yPosition);
      yPosition += 5;
    }

    // Add data rows
    if (data.length > 0) {
      pdf.setFontSize(config.fontSize - 2);
      pdf.setFont(config.font, 'normal');
      
      const headers = options.headers || Object.keys(data[0]);
      const columnWidth = (pdf.internal.pageSize.width - config.margins.left - config.margins.right) / headers.length;
      
      data.forEach((row, rowIndex) => {
        // Check if we need a new page
        if (yPosition > pdf.internal.pageSize.height - config.margins.bottom - 20) {
          pdf.addPage();
          yPosition = config.margins.top;
        }
        
        headers.forEach((header, colIndex) => {
          const x = config.margins.left + (colIndex * columnWidth);
          const value = row[header] || '';
          const text = typeof value === 'string' ? value : String(value);
          
          // Truncate text if too long
          const maxWidth = columnWidth - 5;
          const truncatedText = this.truncateText(pdf, text, maxWidth);
          
          pdf.text(truncatedText, x, yPosition);
        });
        
        yPosition += 8;
      });
    }

    // Add footer
    if (options.footer) {
      const footerY = pdf.internal.pageSize.height - config.margins.bottom;
      pdf.setFontSize(config.fontSize - 4);
      pdf.setFont(config.font, 'italic');
      pdf.text(options.footer, config.margins.left, footerY);
    }

    return pdf;
  }

  // Generate Excel report
  generateExcel(data, options = {}) {
    const wb = XLSX.utils.book_new();
    const wsName = options.sheetName || 'Report';
    
    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(data, {
      header: options.headers || Object.keys(data[0] || {}),
      skipHeader: !options.headers,
    });

    // Set column widths
    if (options.columnWidths) {
      ws['!cols'] = options.columnWidths.map(width => ({ width }));
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, wsName);

    // Add additional sheets if provided
    if (options.additionalSheets) {
      options.additionalSheets.forEach(sheet => {
        const additionalWs = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(wb, additionalWs, sheet.name);
      });
    }

    return wb;
  }

  // Generate CSV report
  generateCSV(data, options = {}) {
    const headers = options.headers || Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          const stringValue = typeof value === 'string' ? value : String(value);
          // Escape commas and quotes
          return stringValue.includes(',') || stringValue.includes('"')
            ? `"${stringValue.replace(/"/g, '""')}"`
            : stringValue;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }

  // Generate inventory report
  async generateInventoryReport(stockData, options = {}) {
    const reportData = stockData.map(item => ({
      'Product Code': item.code || '',
      'Product Name': item.name || '',
      'Category': item.category || '',
      'Current Stock': item.quantity || item.currentStock || 0,
      'Min Stock': item.minStockLevel || 0,
      'Max Stock': item.maxStockLevel || 0,
      'Reorder Point': item.reorderPoint || 0,
      'Unit Cost': item.costPrice || 0,
      'Total Value': (item.quantity || item.currentStock || 0) * (item.costPrice || 0),
      'Status': this.getStockStatus(item),
      'Last Updated': item.lastUpdated || item.updatedAt || '',
    }));

    const reportOptions = {
      title: 'Inventory Report',
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      headers: ['Product Code', 'Product Name', 'Category', 'Current Stock', 'Min Stock', 'Max Stock', 'Reorder Point', 'Unit Cost', 'Total Value', 'Status', 'Last Updated'],
      ...options,
    };

    return {
      pdf: await this.generatePDF(reportData, reportOptions),
      excel: this.generateExcel(reportData, { sheetName: 'Inventory', ...options }),
      csv: this.generateCSV(reportData, reportOptions),
    };
  }

  // Generate sales report
  async generateSalesReport(salesData, options = {}) {
    const reportData = salesData.map(item => ({
      'Receipt Number': item.receiptNumber || '',
      'Date': item.date || item.createdAt || '',
      'Customer': item.customerName || '',
      'Product': item.productName || '',
      'Quantity': item.quantity || 0,
      'Unit Price': item.unitPrice || 0,
      'Total Amount': item.totalAmount || 0,
      'Payment Method': item.paymentMethod || '',
      'Status': item.status || '',
    }));

    const reportOptions = {
      title: 'Sales Report',
      subtitle: `Period: ${options.startDate || 'N/A'} to ${options.endDate || 'N/A'}`,
      headers: ['Receipt Number', 'Date', 'Customer', 'Product', 'Quantity', 'Unit Price', 'Total Amount', 'Payment Method', 'Status'],
      ...options,
    };

    return {
      pdf: await this.generatePDF(reportData, reportOptions),
      excel: this.generateExcel(reportData, { sheetName: 'Sales', ...options }),
      csv: this.generateCSV(reportData, reportOptions),
    };
  }

  // Generate financial report
  async generateFinancialReport(data, options = {}) {
    const reportData = [
      {
        'Metric': 'Total Revenue',
        'Amount': data.totalRevenue || 0,
        'Period': options.period || 'N/A',
      },
      {
        'Metric': 'Total Cost',
        'Amount': data.totalCost || 0,
        'Period': options.period || 'N/A',
      },
      {
        'Metric': 'Gross Profit',
        'Amount': (data.totalRevenue || 0) - (data.totalCost || 0),
        'Period': options.period || 'N/A',
      },
      {
        'Metric': 'Total Transactions',
        'Amount': data.totalTransactions || 0,
        'Period': options.period || 'N/A',
      },
      {
        'Metric': 'Average Transaction Value',
        'Amount': data.totalRevenue ? (data.totalRevenue / (data.totalTransactions || 1)) : 0,
        'Period': options.period || 'N/A',
      },
    ];

    const reportOptions = {
      title: 'Financial Report',
      subtitle: `Period: ${options.period || 'N/A'}`,
      headers: ['Metric', 'Amount', 'Period'],
      ...options,
    };

    return {
      pdf: await this.generatePDF(reportData, reportOptions),
      excel: this.generateExcel(reportData, { sheetName: 'Financial', ...options }),
      csv: this.generateCSV(reportData, reportOptions),
    };
  }

  // Generate activity report
  async generateActivityReport(activityData, options = {}) {
    const reportData = activityData.map(item => ({
      'Date': item.createdAt || item.date || '',
      'User': item.userName || item.email || '',
      'Action': item.action || item.type || '',
      'Entity': item.entity || item.entityType || '',
      'Details': item.details || item.notes || '',
      'IP Address': item.ipAddress || '',
      'Status': item.status || 'completed',
    }));

    const reportOptions = {
      title: 'Activity Report',
      subtitle: `Generated on ${new Date().toLocaleDateString()}`,
      headers: ['Date', 'User', 'Action', 'Entity', 'Details', 'IP Address', 'Status'],
      ...options,
    };

    return {
      pdf: await this.generatePDF(reportData, reportOptions),
      excel: this.generateExcel(reportData, { sheetName: 'Activity', ...options }),
      csv: this.generateCSV(reportData, reportOptions),
    };
  }

  // Helper methods
  truncateText(pdf, text, maxWidth) {
    const textWidth = pdf.getTextWidth(text);
    if (textWidth <= maxWidth) {
      return text;
    }

    let truncated = text;
    while (pdf.getTextWidth(truncated + '...') > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }

    return truncated + '...';
  }

  getStockStatus(item) {
    const quantity = item.quantity || item.currentStock || 0;
    const minStock = item.minStockLevel || 0;

    if (quantity === 0) return 'Out of Stock';
    if (quantity <= minStock) return 'Low Stock';
    return 'In Stock';
  }

  // Download file
  downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Download PDF
  async downloadPDF(data, options = {}) {
    const pdf = await this.generatePDF(data, options);
    const filename = options.filename || 'report.pdf';
    pdf.save(filename);
  }

  // Download Excel
  downloadExcel(data, options = {}) {
    const wb = this.generateExcel(data, options);
    const filename = options.filename || 'report.xlsx';
    XLSX.writeFile(wb, filename);
  }

  // Download CSV
  downloadCSV(data, options = {}) {
    const csv = this.generateCSV(data, options);
    const filename = options.filename || 'report.csv';
    this.downloadFile(csv, filename, 'text/csv');
  }
}

// Report templates
export const reportTemplates = {
  inventory: {
    name: 'Inventory Report',
    description: 'Complete inventory status with stock levels',
    fields: ['code', 'name', 'category', 'quantity', 'minStockLevel', 'maxStockLevel', 'costPrice'],
  },
  lowStock: {
    name: 'Low Stock Report',
    description: 'Products with low stock levels',
    fields: ['code', 'name', 'category', 'quantity', 'minStockLevel', 'reorderPoint'],
  },
  sales: {
    name: 'Sales Report',
    description: 'Sales transactions and revenue',
    fields: ['receiptNumber', 'date', 'customerName', 'totalAmount', 'status'],
  },
  receipts: {
    name: 'Receipts Report',
    description: 'All receipt transactions',
    fields: ['receiptNumber', 'supplier', 'warehouse', 'totalAmount', 'status', 'receivedDate'],
  },
  deliveries: {
    name: 'Deliveries Report',
    description: 'All delivery transactions',
    fields: ['deliveryNumber', 'customerName', 'warehouse', 'totalAmount', 'status', 'deliveryDate'],
  },
  financial: {
    name: 'Financial Report',
    description: 'Financial summary and analysis',
    fields: ['totalRevenue', 'totalCost', 'grossProfit', 'totalTransactions'],
  },
  activity: {
    name: 'Activity Report',
    description: 'User activity and audit trail',
    fields: ['date', 'userName', 'action', 'entity', 'details'],
  },
};

export default ReportGenerator;
