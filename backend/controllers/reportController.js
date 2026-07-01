const Sale = require('../models/Sale');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

exports.getSalesReport = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const sales = await Sale.find({ date: { $gte: start } }).populate('pump product attendant');
    const summary = await Sale.aggregate([
      { $match: { date: { $gte: start } } },
      { $group: { _id: null, totalLitres: { $sum: '$litresSold' }, totalRevenue: { $sum: '$totalRevenue' }, totalTransactions: { $sum: 1 } } }
    ]);
    res.status(200).json({ success: true, data: { sales, summary: summary[0] || { totalLitres: 0, totalRevenue: 0, totalTransactions: 0 } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportSalesPDF = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const sales = await Sale.find({ date: { $gte: start } }).populate('pump product attendant');

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    doc.pipe(res);

    doc.fontSize(20).text('FUELTRACK NG', { align: 'center' });
    doc.fontSize(14).text('Sales Report', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Date', 50, 150).text('Pump', 150, 150).text('Product', 250, 150).text('Litres', 350, 150).text('Revenue', 450, 150);
    doc.moveTo(50, 165).lineTo(550, 165).stroke();

    doc.font('Helvetica');
    let y = 180;
    sales.forEach(sale => {
      if (y > 750) { doc.addPage(); y = 50; }
      doc.text(sale.date.toLocaleDateString(), 50, y);
      doc.text(sale.pump?.pumpNumber || 'N/A', 150, y);
      doc.text(sale.product?.name || 'N/A', 250, y);
      doc.text(sale.litresSold.toFixed(2), 350, y);
      doc.text(`₦${sale.totalRevenue.toLocaleString()}`, 450, y);
      y += 20;
    });
    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportSalesExcel = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const sales = await Sale.find({ date: { $gte: start } }).populate('pump product attendant');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales');
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Pump', key: 'pump', width: 12 },
      { header: 'Product', key: 'product', width: 15 },
      { header: 'Litres', key: 'litres', width: 12 },
      { header: 'Revenue', key: 'revenue', width: 15 }
    ];

    sales.forEach(sale => {
      worksheet.addRow({ date: sale.date.toLocaleDateString(), pump: sale.pump?.pumpNumber, product: sale.product?.name, litres: sale.litresSold, revenue: sale.totalRevenue });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportSalesCSV = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const sales = await Sale.find({ date: { $gte: start } }).populate('pump product attendant');
    const csv = sales.map(s => `${s.date.toLocaleDateString()},${s.pump?.pumpNumber},${s.product?.name},${s.litresSold},${s.totalRevenue}`).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
    res.send('Date,Pump,Product,Litres,Revenue\n' + csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};