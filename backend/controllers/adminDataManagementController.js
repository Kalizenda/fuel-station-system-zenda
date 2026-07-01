const ActivityLog = require('../models/ActivityLog');
const ProfitLoss = require('../models/ProfitLoss');
const DailySummary = require('../models/DailySummary');
const Sale = require('../models/Sale');
const FuelDelivery = require('../models/FuelDelivery');
const Expense = require('../models/Expense');
const { logActivity } = require('./activityLogController');

// Get data management dashboard statistics
exports.getDataManagementStats = async (req, res) => {
  try {
    const stats = {
      activityLogs: await ActivityLog.countDocuments({ isDeleted: false }),
      profitLossRecords: await ProfitLoss.countDocuments({ isDeleted: false }),
      dailySummaries: await DailySummary.countDocuments({ isDeleted: false }),
      sales: await Sale.countDocuments(),
      deliveries: await FuelDelivery.countDocuments(),
      expenses: await Expense.countDocuments(),
      lockedRecords: await ProfitLoss.countDocuments({ isLocked: true, isDeleted: false }),
      deletedRecords: await ActivityLog.countDocuments({ isDeleted: true })
    };
    
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all data with advanced filtering
exports.getAllData = async (req, res) => {
  try {
    const { 
      dataType, 
      page = 1, 
      limit = 50, 
      startDate, 
      endDate, 
      isDeleted = false,
      isLocked 
    } = req.query;
    
    if (!dataType) {
      return res.status(400).json({ success: false, message: 'Data type is required' });
    }
    
    const query = {};
    
    // Only add isDeleted filter if the model supports it
    const modelsWithSoftDelete = ['activityLogs', 'profitLoss', 'dailySummaries'];
    if (modelsWithSoftDelete.includes(dataType)) {
      if (isDeleted === 'true') query.isDeleted = true;
      else if (isDeleted === 'false') query.isDeleted = false;
    }
    
    // Only add isLocked filter if the model supports it
    const modelsWithLock = ['profitLoss', 'dailySummaries'];
    if (modelsWithLock.includes(dataType)) {
      if (isLocked === 'true') query.isLocked = true;
      else if (isLocked === 'false') query.isLocked = false;
    }
    
    if (startDate || endDate) {
      const dateField = dataType === 'activityLogs' ? 'timestamp' : 'date';
      query[dateField] = {};
      if (startDate) query[dateField].$gte = new Date(startDate);
      if (endDate) query[dateField].$lte = new Date(endDate);
    }
    
    let Model;
    let populateFields = [];
    
    switch (dataType) {
      case 'activityLogs':
        Model = ActivityLog;
        populateFields = ['userId', 'deletedBy'];
        break;
      case 'profitLoss':
        Model = ProfitLoss;
        populateFields = ['recordedBy', 'verifiedBy', 'deletedBy', 'lockedBy'];
        break;
      case 'dailySummaries':
        Model = DailySummary;
        populateFields = ['recordedBy', 'verifiedBy', 'deletedBy', 'lockedBy'];
        break;
      case 'sales':
        Model = Sale;
        populateFields = ['pump', 'product', 'tank', 'attendant'];
        break;
      case 'deliveries':
        Model = FuelDelivery;
        populateFields = ['product', 'tank', 'supplier'];
        break;
      case 'expenses':
        Model = Expense;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid data type' });
    }
    
    const skip = (page - 1) * limit;
    
    let queryBuilder = Model.find(query).sort({ _id: -1 }).skip(skip).limit(parseInt(limit));
    
    populateFields.forEach(field => {
      queryBuilder = queryBuilder.populate(field);
    });
    
    const data = await queryBuilder;
    const total = await Model.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete data with reason
exports.softDeleteData = async (req, res) => {
  try {
    const { dataType, ids, reason } = req.body;
    
    if (!dataType || !ids || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data type, IDs, and reason are required' 
      });
    }
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid IDs array is required' });
    }
    
    let Model;
    
    switch (dataType) {
      case 'activityLogs':
        Model = ActivityLog;
        break;
      case 'profitLoss':
        Model = ProfitLoss;
        break;
      case 'dailySummaries':
        Model = DailySummary;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid data type' });
    }
    
    const result = await Model.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      {
        isDeleted: true,
        deletedBy: req.user._id,
        deletedAt: new Date(),
        deletionReason: reason
      }
    );
    
    // Log the deletion activity
    await logActivity(
      'DATA_DELETE',
      `Bulk deleted ${result.modifiedCount} records from ${dataType}`,
      req.user._id,
      req.user.fullName,
      {
        entityType: dataType.toUpperCase(),
        deletionReason: reason,
        count: result.modifiedCount
      }
    );
    
    res.status(200).json({ 
      success: true, 
      data: { 
        modifiedCount: result.modifiedCount,
        message: `Successfully deleted ${result.modifiedCount} records`
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Restore soft-deleted data
exports.restoreData = async (req, res) => {
  try {
    const { dataType, ids } = req.body;
    
    if (!dataType || !ids) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data type and IDs are required' 
      });
    }
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid IDs array is required' });
    }
    
    let Model;
    
    switch (dataType) {
      case 'activityLogs':
        Model = ActivityLog;
        break;
      case 'profitLoss':
        Model = ProfitLoss;
        break;
      case 'dailySummaries':
        Model = DailySummary;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid data type' });
    }
    
    const result = await Model.updateMany(
      { _id: { $in: ids }, isDeleted: true },
      {
        isDeleted: false,
        deletedBy: null,
        deletedAt: null,
        deletionReason: null
      }
    );
    
    // Log the restoration activity
    await logActivity(
      'DATA_RESTORE',
      `Restored ${result.modifiedCount} records from ${dataType}`,
      req.user._id,
      req.user.fullName,
      {
        entityType: dataType.toUpperCase(),
        count: result.modifiedCount
      }
    );
    
    res.status(200).json({ 
      success: true, 
      data: { 
        modifiedCount: result.modifiedCount,
        message: `Successfully restored ${result.modifiedCount} records`
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Permanently delete data (admin only)
exports.permanentDeleteData = async (req, res) => {
  try {
    const { dataType, ids, confirmation } = req.body;
    
    if (!dataType || !ids || !confirmation) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data type, IDs, and confirmation are required' 
      });
    }
    
    if (confirmation !== 'PERMANENT_DELETE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid confirmation. Use "PERMANENT_DELETE"' 
      });
    }
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid IDs array is required' });
    }
    
    let Model;
    
    switch (dataType) {
      case 'activityLogs':
        Model = ActivityLog;
        break;
      case 'profitLoss':
        Model = ProfitLoss;
        break;
      case 'dailySummaries':
        Model = DailySummary;
        break;
      case 'sales':
        Model = Sale;
        break;
      case 'deliveries':
        Model = FuelDelivery;
        break;
      case 'expenses':
        Model = Expense;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid data type' });
    }
    
    const result = await Model.deleteMany({ _id: { $in: ids } });
    
    // Log the permanent deletion activity
    await logActivity(
      'PERMANENT_DELETE',
      `Permanently deleted ${result.deletedCount} records from ${dataType}`,
      req.user._id,
      req.user.fullName,
      {
        entityType: dataType.toUpperCase(),
        count: result.deletedCount
      }
    );
    
    res.status(200).json({ 
      success: true, 
      data: { 
        deletedCount: result.deletedCount,
        message: `Permanently deleted ${result.deletedCount} records`
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Lock data records
exports.lockData = async (req, res) => {
  try {
    const { dataType, ids, reason } = req.body;
    
    if (!dataType || !ids || !reason) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data type, IDs, and reason are required' 
      });
    }
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid IDs array is required' });
    }
    
    let Model;
    
    switch (dataType) {
      case 'profitLoss':
        Model = ProfitLoss;
        break;
      case 'dailySummaries':
        Model = DailySummary;
        break;
      default:
        return res.status(400).json({ success: false, message: 'This data type cannot be locked' });
    }
    
    const result = await Model.updateMany(
      { _id: { $in: ids }, isLocked: false },
      {
        isLocked: true,
        lockedBy: req.user._id,
        lockedAt: new Date(),
        lockReason: reason
      }
    );
    
    // Log the locking activity
    await logActivity(
      'DATA_LOCK',
      `Locked ${result.modifiedCount} records from ${dataType}`,
      req.user._id,
      req.user.fullName,
      {
        entityType: dataType.toUpperCase(),
        lockReason: reason,
        count: result.modifiedCount
      }
    );
    
    res.status(200).json({ 
      success: true, 
      data: { 
        modifiedCount: result.modifiedCount,
        message: `Successfully locked ${result.modifiedCount} records`
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Unlock data records
exports.unlockData = async (req, res) => {
  try {
    const { dataType, ids } = req.body;
    
    if (!dataType || !ids) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data type and IDs are required' 
      });
    }
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid IDs array is required' });
    }
    
    let Model;
    
    switch (dataType) {
      case 'profitLoss':
        Model = ProfitLoss;
        break;
      case 'dailySummaries':
        Model = DailySummary;
        break;
      default:
        return res.status(400).json({ success: false, message: 'This data type cannot be unlocked' });
    }
    
    const result = await Model.updateMany(
      { _id: { $in: ids }, isLocked: true },
      {
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        lockReason: null
      }
    );
    
    // Log the unlocking activity
    await logActivity(
      'DATA_UNLOCK',
      `Unlocked ${result.modifiedCount} records from ${dataType}`,
      req.user._id,
      req.user.fullName,
      {
        entityType: dataType.toUpperCase(),
        count: result.modifiedCount
      }
    );
    
    res.status(200).json({ 
      success: true, 
      data: { 
        modifiedCount: result.modifiedCount,
        message: `Successfully unlocked ${result.modifiedCount} records`
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export data
exports.exportData = async (req, res) => {
  try {
    const { dataType, startDate, endDate, format = 'json' } = req.query;
    
    if (!dataType) {
      return res.status(400).json({ success: false, message: 'Data type is required' });
    }
    
    let Model;
    let fileName;
    
    switch (dataType) {
      case 'activityLogs':
        Model = ActivityLog;
        fileName = 'activity-logs';
        break;
      case 'profitLoss':
        Model = ProfitLoss;
        fileName = 'profit-loss';
        break;
      case 'dailySummaries':
        Model = DailySummary;
        fileName = 'daily-summaries';
        break;
      case 'sales':
        Model = Sale;
        fileName = 'sales';
        break;
      case 'deliveries':
        Model = Delivery;
        fileName = 'deliveries';
        break;
      case 'expenses':
        Model = Expense;
        fileName = 'expenses';
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid data type' });
    }
    
    const query = { isDeleted: false };
    
    if (startDate || endDate) {
      const dateField = dataType === 'activityLogs' ? 'timestamp' : 'date';
      query[dateField] = {};
      if (startDate) query[dateField].$gte = new Date(startDate);
      if (endDate) query[dateField].$lte = new Date(endDate);
    }
    
    const data = await Model.find(query).sort({ _id: -1 }).limit(10000);
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}-${new Date().toISOString().split('T')[0]}.json"`);
      res.send(JSON.stringify(data, null, 2));
    } else if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(data[0]?._doc || data[0] || {}).filter(key => key !== '_id' && key !== '__v');
      const csvRows = data.map(item => {
        const obj = item._doc || item;
        return headers.map(header => {
          let value = obj[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return value;
        });
      });
      
      const csvContent = [headers, ...csvRows].map(row => row.join(',')).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      res.status(200).json({ success: true, data });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
