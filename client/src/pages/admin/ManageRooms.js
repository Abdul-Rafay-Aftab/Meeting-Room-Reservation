import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  Building,
  Plus,
  Edit,
  Trash2,
  Search,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const ManageRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/rooms');
      setRooms(response.data.rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (data) => {
    try {
      await api.post('/api/admin/rooms', data);
      toast.success('Room created successfully');
      setShowAddModal(false);
      reset();
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    }
  };

  const handleEditRoom = async (data) => {
    try {
      await api.put(`/api/admin/rooms/${selectedRoom.id}`, data);
      toast.success('Room updated successfully');
      setShowEditModal(false);
      setSelectedRoom(null);
      reset();
      fetchRooms();
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error('Failed to update room');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/api/admin/rooms/${roomId}`);
      toast.success('Room deleted successfully');
      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Failed to delete room');
    }
  };

  const openEditModal = (room) => {
    setSelectedRoom(room);
    reset({
      name: room.name,
      location: room.location,
      capacity: room.capacity,
      availableFrom: room.available_from,
      availableTo: room.available_to,
      isActive: room.is_active
    });
    setShowEditModal(true);
  };

  const openAddModal = () => {
    reset({
      name: '',
      location: '',
      capacity: 10,
      availableFrom: '09:00:00',
      availableTo: '17:00:00',
      isActive: true
    });
    setShowAddModal(true);
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && room.is_active) ||
                         (statusFilter === 'inactive' && !room.is_active);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Rooms</h1>
          <p className="text-gray-600">View and manage meeting rooms</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Room
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Search Rooms</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input pl-10"
                placeholder="Search by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Filter by Status</label>
            <select
              className="input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Rooms</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <div key={room.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Building className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    {room.location || 'No location specified'}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {room.is_active ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-2" />
                <span>Capacity: {room.capacity} people</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>Available: {room.available_from} - {room.available_to}</span>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => openEditModal(room)}
                className="flex-1 btn btn-secondary flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteRoom(room.id)}
                className="flex-1 btn btn-danger flex items-center justify-center"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {rooms.length === 0 
              ? "No rooms have been created yet." 
              : "Try adjusting your search or filter criteria."
            }
          </p>
          {rooms.length === 0 && (
            <div className="mt-6">
              <button
                onClick={openAddModal}
                className="btn btn-primary"
              >
                Create Your First Room
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Room</h3>
              <form onSubmit={handleSubmit(handleAddRoom)} className="space-y-4">
                <div>
                  <label className="form-label">Room Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter room name"
                    {...register('name', { required: 'Room name is required' })}
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter room location"
                    {...register('location')}
                  />
                </div>

                <div>
                  <label className="form-label">Capacity</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    {...register('capacity', { 
                      required: 'Capacity is required',
                      min: { value: 1, message: 'Capacity must be at least 1' }
                    })}
                  />
                  {errors.capacity && (
                    <p className="form-error">{errors.capacity.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Available From</label>
                    <input
                      type="time"
                      className="input"
                      {...register('availableFrom', { required: 'Start time is required' })}
                    />
                    {errors.availableFrom && (
                      <p className="form-error">{errors.availableFrom.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Available To</label>
                    <input
                      type="time"
                      className="input"
                      {...register('availableTo', { required: 'End time is required' })}
                    />
                    {errors.availableTo && (
                      <p className="form-error">{errors.availableTo.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('isActive')}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (available for booking)
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                  >
                    Create Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
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

      {/* Edit Room Modal */}
      {showEditModal && selectedRoom && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Room</h3>
              <form onSubmit={handleSubmit(handleEditRoom)} className="space-y-4">
                <div>
                  <label className="form-label">Room Name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter room name"
                    {...register('name', { required: 'Room name is required' })}
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter room location"
                    {...register('location')}
                  />
                </div>

                <div>
                  <label className="form-label">Capacity</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    {...register('capacity', { 
                      required: 'Capacity is required',
                      min: { value: 1, message: 'Capacity must be at least 1' }
                    })}
                  />
                  {errors.capacity && (
                    <p className="form-error">{errors.capacity.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Available From</label>
                    <input
                      type="time"
                      className="input"
                      {...register('availableFrom', { required: 'Start time is required' })}
                    />
                    {errors.availableFrom && (
                      <p className="form-error">{errors.availableFrom.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Available To</label>
                    <input
                      type="time"
                      className="input"
                      {...register('availableTo', { required: 'End time is required' })}
                    />
                    {errors.availableTo && (
                      <p className="form-error">{errors.availableTo.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    {...register('isActive')}
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                    Active (available for booking)
                  </label>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="btn btn-primary flex-1"
                  >
                    Update Room
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedRoom(null);
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
    </div>
  );
};

export default ManageRooms; 