import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { format, addDays, startOfDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const RoomBooking = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomAvailability, setRoomAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm();

  const watchStartTime = watch('startTime');
  const watchEndTime = watch('endTime');

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchRoomAvailability();
    }
  }, [selectedDate]);

  const fetchRooms = async () => {
    try {
      const response = await api.get('/api/rooms?active=true');
      setRooms(response.data.rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomAvailability = async () => {
    try {
      const response = await api.get(`/api/rooms/availability/all?date=${selectedDate}`);
      console.log('Fetched availability data:', response.data);
      setRoomAvailability(response.data.rooms);
    } catch (error) {
      console.error('Error fetching room availability:', error);
    }
  };

  const checkAvailability = async (roomId, startTime, endTime) => {
    try {
      const response = await api.post(`/api/rooms/${roomId}/check-availability`, {
        startTime,
        endTime,
      });
      return response.data.isAvailable;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  const onSubmit = async (data) => {
    if (!selectedRoom) {
      toast.error('Please select a room');
      return;
    }

    setSubmitting(true);
    try {
      const startDateTime = `${selectedDate}T${data.startTime}`;
      const endDateTime = `${selectedDate}T${data.endTime}`;

      // Check availability one more time before booking
      const isAvailable = await checkAvailability(selectedRoom.id, startDateTime, endDateTime);
      if (!isAvailable) {
        toast.error('Room is no longer available for the selected time');
        return;
      }

      const reservationData = {
        roomId: selectedRoom.id,
        startTime: startDateTime,
        endTime: endDateTime,
        purpose: data.purpose,
        department: data.department,
      };

      await api.post('/api/reservations', reservationData);
      toast.success('Room booked successfully!');
      
      // Reset form
      setValue('startTime', '');
      setValue('endTime', '');
      setValue('purpose', '');
      setValue('department', '');
      setSelectedRoom(null);
      
      // Immediately update local state to show the new reservation
      const newReservation = {
        id: Date.now(), // Temporary ID for immediate UI update
        room_id: selectedRoom.id,
        start_time: startDateTime,
        end_time: endDateTime,
        title: data.purpose,
        description: data.department,
        user_name: 'You',
        status: 'confirmed'
      };
      
      setRoomAvailability(prev => prev.map(room => {
        if (room.id === selectedRoom.id) {
          return {
            ...room,
            reservations: [...(room.reservations || []), newReservation]
          };
        }
        return room;
      }));
      
      // Also refresh from server to ensure consistency
      setTimeout(() => {
        fetchRoomAvailability();
      }, 500);
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to book room';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const isTimeSlotAvailable = (roomId, startTime, endTime) => {
    const room = roomAvailability.find(r => r.id === roomId);
    if (!room || !room.reservations) return true;

    const requestedStart = new Date(`${selectedDate}T${startTime}`);
    const requestedEnd = new Date(`${selectedDate}T${endTime}`);

    // Debug logging
    console.log('Checking availability for:', { roomId, startTime, endTime, selectedDate });
    console.log('Room reservations:', room?.reservations);

    const hasConflict = room.reservations.some(reservation => {
      // Handle different time formats from server
      let reservationStart, reservationEnd;
      
      try {
        // Try to parse the time from the server response
        if (typeof reservation.start_time === 'string') {
          reservationStart = new Date(reservation.start_time);
        } else {
          reservationStart = new Date(reservation.start_time);
        }
        
        if (typeof reservation.end_time === 'string') {
          reservationEnd = new Date(reservation.end_time);
        } else {
          reservationEnd = new Date(reservation.end_time);
        }
        
        // Check if dates are valid
        if (isNaN(reservationStart.getTime()) || isNaN(reservationEnd.getTime())) {
          console.warn('Invalid reservation time format:', reservation);
          return false;
        }
      } catch (error) {
        console.error('Error parsing reservation time:', error, reservation);
        return false;
      }
      
      const conflict = (requestedStart < reservationEnd && requestedEnd > reservationStart);
      if (conflict) {
        console.log('Conflict found:', { 
          reservation, 
          requestedStart, 
          requestedEnd, 
          reservationStart, 
          reservationEnd,
          requestedStartISO: requestedStart.toISOString(),
          requestedEndISO: requestedEnd.toISOString(),
          reservationStartISO: reservationStart.toISOString(),
          reservationEndISO: reservationEnd.toISOString()
        });
      }
      return conflict;
    });

    return !hasConflict;
  };

  const getAvailableTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 16; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  if (loading) {
    return <LoadingSpinner className="h-64" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Book a Meeting Room</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select a room, date, and time for your meeting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Selection */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select a Room</h2>
          
          {/* Date Selection */}
          <div className="mb-4">
            <label className="form-label">Date</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="input flex-1"
              />
              <button
                type="button"
                onClick={fetchRoomAvailability}
                className="btn btn-secondary px-3"
                title="Refresh availability"
              >
                🔄
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {rooms.map((room) => {
              const isSelected = selectedRoom?.id === room.id;
              const roomData = roomAvailability.find(r => r.id === room.id);
              const hasReservations = roomData?.reservations?.length > 0;

              return (
                <div
                  key={room.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedRoom(room)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{room.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {room.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Users className="h-4 w-4 mr-1" />
                        Capacity: {room.capacity} people
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {room.available_from} - {room.available_to}
                      </div>
                      {hasReservations && (
                        <div className="text-xs text-orange-600 mt-1">
                          {roomData.reservations.length} booking(s) today
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking Form */}
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Booking Details</h2>
          
          {selectedRoom ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="form-label">Start Time</label>
                <select
                  {...register('startTime', { required: 'Start time is required' })}
                  className={`input ${errors.startTime ? 'border-red-500' : ''}`}
                >
                  <option value="">Select start time</option>
                  {getAvailableTimeSlots().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                {errors.startTime && (
                  <p className="form-error">{errors.startTime.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">End Time</label>
                <select
                  {...register('endTime', { required: 'End time is required' })}
                  className={`input ${errors.endTime ? 'border-red-500' : ''}`}
                >
                  <option value="">Select end time</option>
                  {getAvailableTimeSlots().map((time) => {
                    if (watchStartTime && time <= watchStartTime) return null;
                    return (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    );
                  })}
                </select>
                {errors.endTime && (
                  <p className="form-error">{errors.endTime.message}</p>
                )}
              </div>

              {watchStartTime && watchEndTime && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-sm">
                    {isTimeSlotAvailable(selectedRoom.id, watchStartTime, watchEndTime) ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-green-600">Time slot is available</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-red-600 mr-2" />
                        <span className="text-red-600">Time slot is not available</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="form-label">Purpose</label>
                <textarea
                  {...register('purpose', { required: 'Purpose is required' })}
                  rows={3}
                  className={`input ${errors.purpose ? 'border-red-500' : ''}`}
                  placeholder="Describe the purpose of your meeting"
                />
                {errors.purpose && (
                  <p className="form-error">{errors.purpose.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Department (Optional)</label>
                <input
                  type="text"
                  {...register('department')}
                  className="input"
                  placeholder="Your department"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !watchStartTime || !watchEndTime || !isTimeSlotAvailable(selectedRoom.id, watchStartTime, watchEndTime)}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Booking...
                  </div>
                ) : (
                  'Book Room'
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No room selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a room from the list to proceed with booking.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Room Availability Overview */}
      {selectedDate && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Room Availability for {format(new Date(selectedDate), 'MMMM dd, yyyy')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomAvailability.map((room) => (
              <div key={room.id} className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900">{room.name}</h3>
                <p className="text-sm text-gray-500">{room.location}</p>
                <div className="mt-2">
                  {room.reservations && room.reservations.length > 0 ? (
                    <div className="space-y-1">
                      {room.reservations.map((reservation, index) => (
                        <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                          <div className="font-medium">{reservation.user_name}</div>
                          <div className="text-gray-600">
                            {format(new Date(reservation.start_time), 'HH:mm')} - {format(new Date(reservation.end_time), 'HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      No bookings today
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomBooking; 