const Expense = require('../models/Expense');
const { logActivity } = require('./activityLogController');

exports.addExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, recordedBy: req.user.id });
    
    // Log activity
    await logActivity(
      'EXPENSE',
      `Recorded expense: ${expense.description || 'N/A'} for ₦${expense.amount.toFixed(2)}`,
      req.user._id,
      req.user.fullName,
      {
        entityType: 'EXPENSE',
        entityId: expense._id,
        entityName: expense.description || 'Expense',
        details: {
          category: expense.category,
          amount: expense.amount,
          description: expense.description
        }
      }
    );
    
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort('-date');
    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};