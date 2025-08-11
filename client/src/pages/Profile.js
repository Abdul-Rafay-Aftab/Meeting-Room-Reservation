import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  User,
  Mail,
  Building,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Save,
  Key
} from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
    watch
  } = useForm();

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name,
        department: user.department || ''
      });
      fetchUserStatistics();
    }
  }, [user, resetProfile]);

  const fetchUserStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/statistics');
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      toast.error('Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (data) => {
    try {
      const result = await updateProfile(data);
      if (result.success) {
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handlePasswordChange = async (data) => {
    try {
      const result = await changePassword(data.currentPassword, data.newPassword);
      if (result.success) {
        resetPassword();
        setShowPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      }
    } catch (error) {
      console.error('Error changing password:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Change Password
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'statistics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Statistics
          </button>
        </nav>
      </div>

      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
          <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder="Enter your full name"
                    {...registerProfile('name', {
                      required: 'Name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                  />
                </div>
                {profileErrors.name && (
                  <p className="form-error">{profileErrors.name.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="input pl-10 bg-gray-50"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="form-label">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="input pl-10"
                    placeholder="Enter your department"
                    {...registerProfile('department')}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Role</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="input pl-10 bg-gray-50"
                    value={user?.role === 'admin' ? 'Administrator' : 'User'}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
          <form onSubmit={handlePasswordSubmit(handlePasswordChange)} className="space-y-6">
            <div>
              <label className="form-label">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Enter your current password"
                  {...registerPassword('currentPassword', {
                    required: 'Current password is required'
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="form-error">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Enter your new password"
                  {...registerPassword('newPassword', {
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordErrors.newPassword && (
                <p className="form-error">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="input pl-10 pr-10"
                  placeholder="Confirm your new password"
                  {...registerPassword('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === newPassword || 'Passwords do not match'
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {passwordErrors.confirmPassword && (
                <p className="form-error">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn btn-primary flex items-center"
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reservations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics?.totalReservations || 0}
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
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics?.confirmedReservations || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics?.cancelledReservations || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics?.totalHours ? parseFloat(statistics.totalHours).toFixed(1) : '0'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Most Used Room */}
          {statistics?.mostUsedRoom && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Used Room</h3>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Building className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {statistics.mostUsedRoom.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {statistics.mostUsedRoom.usage_count} bookings
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Account Information */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Member Since</span>
                <p className="text-sm text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Account Type</span>
                <p className="text-sm text-gray-900">
                  {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 