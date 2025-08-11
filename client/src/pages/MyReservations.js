import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye
} from 'lucide-react';

const MyReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/reservations/my-reservations');
      setReservations(response.data.reservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await api.delete(`/api/reservations/${id}`);
      toast.success('Reservation cancelled successfully');
      fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Failed to cancel reservation');
    }
  };

  const handleEditReservation = async (data) => {
    try {
      await api.put(`/api/reservations/${selectedReservation.id}`, data);
      toast.success('Reservation updated successfully');
      setShowEditModal(false);
      setSelectedReservation(null);
      reset();
      fetchReservations();
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error('Failed to update reservation');
    }
  };

  const openEditModal = (reservation) => {
    setSelectedReservation(reservation);
    reset({
      startTime: reservation.start_time.slice(0, 16),
      endTime: reservation.end_time.slice(0, 16),
      purpose: reservation.purpose,
      department: reservation.department
    });
    setShowEditModal(true);
  };

  const openViewModal = (reservation) => {
    setSelectedReservation(reservation);
    setShowViewModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' }
    };

    const config = statusConfig[status] || statusConfig.confirmed;
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const filteredReservations = reservations.filter(reservation => {
    const now = new Date();
    const startTime = new Date(reservation.start_time);
    
    switch (filter) {
      case 'upcoming':
        return startTime > now && reservation.status === 'confirmed';
      case 'past':
        return startTime < now;
      case 'cancelled':
        return reservation.status === 'cancelled';
      default:
        return true;
    }
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reservations</h1>
          <p className="text-gray-600">Manage your meeting room bookings</p>
        </div>
        <button
          onClick={() => window.location.href = '/book'}
          className="btn btn-primary"
        >
          Book New Room
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'all' 
              ? 'bg-primary-100 text-primary-800' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'upcoming' 
              ? 'bg-primary-100 text-primary-800' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'past' 
              ? 'bg-primary-100 text-primary-800' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Past
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            filter === 'cancelled' 
              ? 'bg-primary-100 text-primary-800' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cancelled
        </button>
      </div>

      {/* Reservations List */}
      <div className="space-y-4">
        {filteredReservations.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reservations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'all' 
                ? "You haven't made any reservations yet." 
                : `No ${filter} reservations found.`
              }
            </p>
            {filter === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/book'}
                  className="btn btn-primary"
                >
                  Book Your First Room
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredReservations.map((reservation) => (
            <div key={reservation.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {reservation.room_name}
                    </h3>
                    {getStatusBadge(reservation.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDate(reservation.start_time)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {reservation.location}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Purpose:</span> {reservation.purpose}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => openViewModal(reservation)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                    title="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  
                  {reservation.status === 'confirmed' && new Date(reservation.start_time) > new Date() && (
                    <>
                      <button
                        onClick={() => openEditModal(reservation)}
                        className="p-2 text-blue-400 hover:text-blue-600"
                        title="Edit reservation"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleCancelReservation(reservation.id)}
                        className="p-2 text-red-400 hover:text-red-600"
                        title="Cancel reservation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedReservation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Reservation</h3>
              <form onSubmit={handleSubmit(handleEditReservation)} className="space-y-4">
                <div>
                  <label className="form-label">Start Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    {...register('startTime', { required: 'Start time is required' })}
                  />
                  {errors.startTime && (
                    <p className="form-error">{errors.startTime.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">End Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    {...register('endTime', { required: 'End time is required' })}
                  />
                  {errors.endTime && (
                    <p className="form-error">{errors.endTime.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">Purpose</label>
                  <textarea
                    className="input"
                    rows="3"
                    {...register('purpose', { required: 'Purpose is required' })}
                  />
                  {errors.purpose && (
                    <p className="form-error">{errors.purpose.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="input"
                    {...register('department')}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                  >
                    Update Reservation
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedReservation(null);
                      reset();
                    }}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedReservation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Reservation Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500">Room:</span>
                  <p className="text-sm text-gray-900">{selectedReservation.room_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Location:</span>
                  <p className="text-sm text-gray-900">{selectedReservation.location}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Date:</span>
                  <p className="text-sm text-gray-900">{formatDate(selectedReservation.start_time)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Time:</span>
                  <p className="text-sm text-gray-900">
                    {formatTime(selectedReservation.start_time)} - {formatTime(selectedReservation.end_time)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Purpose:</span>
                  <p className="text-sm text-gray-900">{selectedReservation.purpose}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Department:</span>
                  <p className="text-sm text-gray-900">{selectedReservation.department || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <div className="mt-1">{getStatusBadge(selectedReservation.status)}</div>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedReservation(null);
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

export default MyReservations; 