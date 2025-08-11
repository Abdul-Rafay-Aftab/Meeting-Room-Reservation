import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Plus, 
  TrendingUp,
  BookOpen,
  CheckCircle,
  XCircle
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, reservationsResponse] = await Promise.all([
        api.get('/api/users/statistics'),
        api.get('/api/users/upcoming-reservations?limit=5')
      ]);

      setStats(statsResponse.data.statistics);
      setUpcomingReservations(reservationsResponse.data.reservations);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner className="h-64" />;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening with your meeting room reservations.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/book"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Book a Room
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Reservations</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalReservations || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Confirmed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.confirmedReservations || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalHours?.toFixed(1) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Most Used Room</p>
              <p className="text-lg font-semibold text-gray-900">
                {stats?.mostUsedRoom?.name || 'None'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Reservations */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Reservations</h2>
          <Link
            to="/reservations"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            View all
          </Link>
        </div>

        {upcomingReservations.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming reservations</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by booking a meeting room.
            </p>
            <div className="mt-6">
              <Link
                to="/book"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Book a Room
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {upcomingReservations.map((reservation) => (
                <li key={reservation.id} className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {reservation.room_name}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {reservation.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(reservation.start_time), 'MMM dd, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(reservation.start_time), 'HH:mm')} - {format(new Date(reservation.end_time), 'HH:mm')}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reservation.status)}`}>
                        {getStatusIcon(reservation.status)}
                        <span className="ml-1">{reservation.status}</span>
                      </span>
                    </div>
                  </div>
                  {reservation.purpose && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Purpose:</span> {reservation.purpose}
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/book"
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Plus className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Book a Room</h3>
              <p className="text-sm text-gray-500">
                Reserve a meeting room for your next meeting
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/reservations"
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">My Reservations</h3>
              <p className="text-sm text-gray-500">
                View and manage your existing reservations
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/profile"
          className="card hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Profile</h3>
              <p className="text-sm text-gray-500">
                Update your profile and account settings
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard; 