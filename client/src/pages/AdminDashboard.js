import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Users,
  Calendar,
  Building,
  BarChart3,
  Clock,
  TrendingUp,
  Activity,
  Settings
} from 'lucide-react';

const AdminDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [recentReservations, setRecentReservations] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, reservationsRes, logsRes] = await Promise.all([
        api.get('/api/admin/statistics'),
        api.get('/api/admin/reservations?limit=5'),
        api.get('/api/admin/logs?limit=10')
      ]);

      setStatistics(statsRes.data.statistics);
      setRecentReservations(reservationsRes.data.reservations);
      setRecentLogs(logsRes.data.logs);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'user_registered':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'reservation_created':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'reservation_cancelled':
        return <Calendar className="h-4 w-4 text-red-500" />;
      case 'room_created':
        return <Building className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">System overview and management</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/users"
            className="btn btn-primary flex items-center"
          >
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </Link>
          <Link
            to="/admin/rooms"
            className="btn btn-secondary flex items-center"
          >
            <Building className="h-4 w-4 mr-2" />
            Manage Rooms
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Reservations</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.confirmedReservations || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Rooms</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.totalRooms || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics?.totalReservations || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Room Utilization */}
      {statistics?.roomUtilization && statistics.roomUtilization.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Room Utilization</h3>
          <div className="space-y-3">
            {statistics.roomUtilization.slice(0, 5).map((room, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Building className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">{room.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">
                    {room.reservation_count} bookings
                  </span>
                  <span className="text-sm text-gray-500">
                    {parseFloat(room.total_hours).toFixed(1)} hours
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reservations</h3>
            <Link
              to="/admin/reservations"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentReservations.map((reservation) => (
              <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {reservation.user_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reservation.room_name} • {formatDate(reservation.start_time)}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  reservation.status === 'confirmed' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {reservation.status}
                </span>
              </div>
            ))}
            {recentReservations.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent reservations
              </p>
            )}
          </div>
        </div>

        {/* System Logs */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Link
              to="/admin/logs"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                {getActionIcon(log.action)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {log.actor_name || 'System'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {log.action.replace(/_/g, ' ')} • {formatDate(log.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {recentLogs.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/rooms/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Building className="h-5 w-5 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Add New Room</p>
              <p className="text-sm text-gray-500">Create a new meeting room</p>
            </div>
          </Link>
          
          <Link
            to="/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-5 w-5 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Manage Users</p>
              <p className="text-sm text-gray-500">View and edit user accounts</p>
            </div>
          </Link>
          
          <Link
            to="/admin/logs"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="h-5 w-5 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">System Logs</p>
              <p className="text-sm text-gray-500">View system activity logs</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 