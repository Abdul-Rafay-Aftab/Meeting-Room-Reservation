import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Activity,
  Search,
  Filter,
  Calendar,
  User,
  Building,
  Clock,
  Eye
} from 'lucide-react';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/logs?limit=100');
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const openDetailsModal = (log) => {
    setSelectedLog(log);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'user_registered':
        return <User className="h-4 w-4 text-blue-500" />;
      case 'user_login':
        return <User className="h-4 w-4 text-green-500" />;
      case 'reservation_created':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'reservation_cancelled':
        return <Calendar className="h-4 w-4 text-red-500" />;
      case 'reservation_updated':
        return <Calendar className="h-4 w-4 text-yellow-500" />;
      case 'room_created':
        return <Building className="h-4 w-4 text-purple-500" />;
      case 'room_updated':
        return <Building className="h-4 w-4 text-blue-500" />;
      case 'room_deleted':
        return <Building className="h-4 w-4 text-red-500" />;
      case 'user_role_updated':
        return <User className="h-4 w-4 text-orange-500" />;
      case 'password_changed':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'profile_updated':
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionLabel = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEntityTypeLabel = (entityType) => {
    if (!entityType) return 'System';
    return entityType.charAt(0).toUpperCase() + entityType.slice(1);
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.actor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getActionLabel(log.action).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntityType = entityTypeFilter === 'all' || log.entity_type === entityTypeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastMonth = new Date(today);
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      switch (dateFilter) {
        case 'today':
          matchesDate = logDate >= today;
          break;
        case 'yesterday':
          matchesDate = logDate >= yesterday && logDate < today;
          break;
        case 'lastWeek':
          matchesDate = logDate >= lastWeek;
          break;
        case 'lastMonth':
          matchesDate = logDate >= lastMonth;
          break;
      }
    }
    
    return matchesSearch && matchesAction && matchesEntityType && matchesDate;
  });

  const getActions = () => {
    const actions = [...new Set(logs.map(log => log.action))];
    return actions.sort();
  };

  const getEntityTypes = () => {
    const entityTypes = [...new Set(logs.map(log => log.entity_type).filter(Boolean))];
    return entityTypes.sort();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600">View system activity and audit trail</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Logs</p>
            <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Filter by Action</label>
            <select
              className="input"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">All Actions</option>
              {getActions().map(action => (
                <option key={action} value={action}>{getActionLabel(action)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Filter by Entity</label>
            <select
              className="input"
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
            >
              <option value="all">All Entities</option>
              {getEntityTypes().map(entityType => (
                <option key={entityType} value={entityType}>{getEntityTypeLabel(entityType)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Filter by Date</label>
            <select
              className="input"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="lastWeek">Last 7 Days</option>
              <option value="lastMonth">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="card">
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  {getActionIcon(log.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getActionLabel(log.action)}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {log.actor_name || 'System'}
                        {log.entity_type && (
                          <span> • {getEntityTypeLabel(log.entity_type)} #{log.entity_id}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {formatDate(log.timestamp)}
                      </span>
                      <button
                        onClick={() => openDetailsModal(log)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Details:</span> {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Log Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Log Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Action:</span>
                  <p className="text-sm text-gray-900">{getActionLabel(selectedLog.action)}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Actor:</span>
                  <p className="text-sm text-gray-900">{selectedLog.actor_name || 'System'}</p>
                </div>
                
                {selectedLog.entity_type && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Entity Type:</span>
                    <p className="text-sm text-gray-900">{getEntityTypeLabel(selectedLog.entity_type)}</p>
                  </div>
                )}
                
                {selectedLog.entity_id && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Entity ID:</span>
                    <p className="text-sm text-gray-900">{selectedLog.entity_id}</p>
                  </div>
                )}
                
                <div>
                  <span className="text-sm font-medium text-gray-500">Timestamp:</span>
                  <p className="text-sm text-gray-900">{formatDate(selectedLog.timestamp)}</p>
                </div>
                
                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Details:</span>
                    <pre className="text-xs text-gray-900 bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedLog(null);
                  }}
                  className="btn btn-secondary w-full"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogs; 