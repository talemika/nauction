import React, { useState, useEffect } from 'react';
import { User, Edit2, Save, X, Wallet, MapPin, Phone, Mail } from 'lucide-react';
import { api } from '../lib/api';
import { useCurrency } from '../hooks/useCurrency';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { formatPrice } = useCurrency();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/profile');
      setUser(response.data);
      setFormData({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        phone: response.data.phone || '',
        address: {
          street: response.data.address?.street || '',
          city: response.data.address?.city || '',
          state: response.data.address?.state || '',
          zipCode: response.data.address?.zipCode || '',
          country: response.data.address?.country || ''
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      
      const response = await api.put('/users/profile', formData);
      setUser(response.data);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    // Reset form data to original values
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      address: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        state: user?.address?.state || '',
        zipCode: user?.address?.zipCode || '',
        country: user?.address?.country || ''
      }
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {user?.firstName || user?.lastName 
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : user?.username
                  }
                </h1>
                <p className="text-blue-100">{user?.email}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <Wallet className="w-5 h-5" />
                <span className="text-sm">Account Balance</span>
              </div>
              <div className="text-3xl font-bold">
                {formatPrice(user?.balance || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold text-gray-800">Profile Information</h2>
            
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Profile Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{user?.username}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{user?.email}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your first name"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {user?.firstName || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your last name"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {user?.lastName || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{user?.phone || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800 border-b pb-2 flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Address Information</span>
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter street address"
                  />
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    {user?.address?.street || 'Not provided'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="City"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {user?.address?.city || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="State"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {user?.address?.state || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address.zipCode}
                      onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="ZIP Code"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {user?.address?.zipCode || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address.country}
                      onChange={(e) => handleInputChange('address.country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Country"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {user?.address?.country || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Stats */}
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Account Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Member Since</div>
                <div className="text-lg font-semibold text-blue-800">
                  {new Date(user?.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Account Balance</div>
                <div className="text-lg font-semibold text-green-800">
                  {formatPrice(user?.balance || 0)}
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Account Type</div>
                <div className="text-lg font-semibold text-purple-800 capitalize">
                  {user?.role}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

