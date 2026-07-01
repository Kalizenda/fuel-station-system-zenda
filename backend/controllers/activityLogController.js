const ActivityLog = require('../models/ActivityLog');

// Helper function to log activity
exports.logActivity = async (action, description, userId, userName, additionalData = {}) => {
  try {
    const logData = {
      action,
      description,
      userId,
      userName,
      ...additionalData
    };
    
    await ActivityLog.create(logData);
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
};

// Get all activity logs
exports.getActivityLogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      startDate, 
      endDate, 
      userId,
      entityType 
    } = req.query;
    
    const query = { isDeleted: false };
    
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (entityType) query.entityType = entityType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (page - 1) * limit;
    
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'fullName email')
      .populate('deletedBy', 'fullName email');
    
    const total = await ActivityLog.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: logs,
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

// Get activity log by ID
exports.getActivityLogById = async (req, res) => {
  try {
    const log = await ActivityLog.findOne({ 
      _id: req.params.id, 
      isDeleted: false 
    }).populate('userId', 'fullName email')
     .populate('deletedBy', 'fullName email');
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'Activity log not found' });
    }
    
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get activity statistics
exports.getActivityStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    
    const matchQuery = { isDeleted: false };
    if (Object.keys(dateFilter).length > 0) {
      matchQuery.timestamp = dateFilter;
    }
    
    const actionStats = await ActivityLog.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const userStats = await ActivityLog.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$userId', userName: { $first: '$userName' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const totalActivities = await ActivityLog.countDocuments(matchQuery);
    
    res.status(200).json({
      success: true,
      data: {
        totalActivities,
        actionStats,
        topUsers: userStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete activity log (admin only with reason)
exports.deleteActivityLog = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Deletion reason is required' });
    }
    
    const log = await ActivityLog.findByIdAndUpdate(
      req.params.id,
      {
        isDeleted: true,
        deletedBy: req.user._id,
        deletedAt: new Date(),
        deletionReason: reason
      },
      { new: true }
    );
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'Activity log not found' });
    }
    
    // Log the deletion activity
    await exports.logActivity(
      'DATA_DELETE',
      `Deleted activity log: ${log._id} - ${log.description}`,
      req.user._id,
      req.user.fullName,
      {
        entityType: 'ACTIVITY_LOG',
        entityId: log._id,
        entityName: log.description,
        deletionReason: reason
      }
    );
    
    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Bulk delete activity logs (admin only)
exports.bulkDeleteActivityLogs = async (req, res) => {
  try {
    const { ids, reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Deletion reason is required' });
    }
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Valid IDs array is required' });
    }
    
    const result = await ActivityLog.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      {
        isDeleted: true,
        deletedBy: req.user._id,
        deletedAt: new Date(),
        deletionReason: reason
      }
    );
    
    // Log the bulk deletion activity
    await exports.logActivity(
      'DATA_DELETE',
      `Bulk deleted ${result.modifiedCount} activity logs`,
      req.user._id,
      req.user.fullName,
      {
        entityType: 'ACTIVITY_LOG',
        deletionReason: reason,
        count: result.modifiedCount
      }
    );
    
    res.status(200).json({ 
      success: true, 
      data: { 
        modifiedCount: result.modifiedCount,
        message: `Successfully deleted ${result.modifiedCount} activity logs`
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
