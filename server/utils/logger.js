// In-memory logging system for development
// This stores logs in memory so they can be retrieved by the admin dashboard

// In-memory storage for logs
let logs = [];
let logId = 1;

const logAction = async (action, userId, userType, targetId, details = {}) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    id: logId++,
    action,
    userId,
    userType,
    targetId,
    details,
    timestamp
  };
  
  // Add to in-memory storage
  logs.unshift(logEntry); // Add to beginning for newest first
  
  // Keep only last 1000 logs to prevent memory issues
  if (logs.length > 1000) {
    logs = logs.slice(0, 1000);
  }
  
  // Also log to console for debugging
  console.log(`📝 LOG: ${action}`);
  console.log(`User ID: ${userId}, Type: ${userType}`);
  console.log(`Target ID: ${targetId}`);
  console.log(`Details:`, details);
  console.log(`Timestamp: ${timestamp}`);
  console.log('---');
  
  return logEntry;
};

const getLogs = async (filters = {}) => {
  let filteredLogs = [...logs];
  
  // Apply filters
  if (filters.action) {
    filteredLogs = filteredLogs.filter(log => 
      log.action.toLowerCase().includes(filters.action.toLowerCase())
    );
  }
  
  if (filters.entityType) {
    filteredLogs = filteredLogs.filter(log => 
      log.userType === filters.entityType
    );
  }
  
  if (filters.actorId) {
    filteredLogs = filteredLogs.filter(log => 
      log.userId == filters.actorId
    );
  }
  
  if (filters.startDate) {
    const startDate = new Date(filters.startDate);
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) >= startDate
    );
  }
  
  if (filters.endDate) {
    const endDate = new Date(filters.endDate);
    filteredLogs = filteredLogs.filter(log => 
      new Date(log.timestamp) <= endDate
    );
  }
  
  // Apply limit
  const limit = filters.limit || 100;
  filteredLogs = filteredLogs.slice(0, limit);
  
  return filteredLogs;
};

const clearLogs = async () => {
  logs = [];
  logId = 1;
  console.log('🗑️ LOGS: Cleared');
};

// Get log statistics
const getLogStats = async () => {
  const totalLogs = logs.length;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayLogs = logs.filter(log => new Date(log.timestamp) >= today);
  
  // Group by action type
  const actionCounts = {};
  logs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });
  
  // Get most recent actions
  const recentActions = logs.slice(0, 10);
  
  return {
    totalLogs,
    todayLogs: todayLogs.length,
    actionCounts,
    recentActions
  };
};

module.exports = {
  logAction,
  getLogs,
  clearLogs,
  getLogStats
}; 