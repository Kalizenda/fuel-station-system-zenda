const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/deliveries', require('./routes/deliveryRoutes'));
app.use('/api/sales', require('./routes/saleRoutes'));
app.use('/api/finance', require('./routes/financialRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/tanks', require('./routes/tankMonitoringRoutes'));
app.use('/api/prices', require('./routes/priceRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/maintenance', require('./routes/pumpMaintenanceRoutes'));
app.use('/api/reconciliation', require('./routes/cashReconciliationRoutes'));
app.use('/api/pumps', require('./routes/pumpAssignmentRoutes'));
app.use('/api/activity-logs', require('./routes/activityLogRoutes'));
app.use('/api/profit-loss', require('./routes/profitLossAnalyticsRoutes'));
app.use('/api/comprehensive-reports', require('./routes/comprehensiveReportsRoutes'));
app.use('/api/data-management', require('./routes/adminDataManagementRoutes'));

app.get('/', (req, res) => res.json({ success: true, message: 'FuelTrack NG API running' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));