import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit2,
  Save,
  X,
  Lock
} from 'lucide-react';
import { updateUser } from '../store/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function UserProfile() {
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
      });
    }
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const validateZipCode = (zip) => {
    if (!zip) return true; // Optional field
    // Accept: 12, 95123, 10293, 90086-1929
    // Reject: 1247 (4 digits), 1829A (letters), 37849-392 (wrong format), 2374-2384 (wrong format)
    const zipPattern = /^(\d{2}|\d{5})(-\d{4})?$/;
    return zipPattern.test(zip);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Optional field
    const phonePattern = /^\d{10}$/;
    return phonePattern.test(phone.replace(/\D/g, '')); // Remove non-digits and check
  };

  const validateState = (state) => {
    if (!state) return true; // Optional field
    const validStates = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
      'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
      'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
      'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
      'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
      'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
      'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
      'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
      'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
      'WI': 'Wisconsin', 'WY': 'Wyoming'
    };
    
    const upperState = state.toUpperCase();
    // Check if it's a valid abbreviation
    if (validStates[upperState]) return true;
    
    // Check if it's a valid full state name (case insensitive)
    const fullNames = Object.values(validStates).map(s => s.toLowerCase());
    return fullNames.includes(state.toLowerCase());
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Format phone number to digits only
    if (name === 'phone') {
      processedValue = value.replace(/\D/g, '').slice(0, 10);
    }

    // Format state to uppercase
    if (name === 'state') {
      processedValue = value.toUpperCase().slice(0, 2);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    // Clear messages when user types
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError('First name, last name, and email are required');
        setIsSaving(false);
        return;
      }

      // Validate phone number
      if (formData.phone && !validatePhone(formData.phone)) {
        setError('Phone number must be exactly 10 digits');
        setIsSaving(false);
        return;
      }

      // Validate state
      if (formData.state && !validateState(formData.state)) {
        setError('Please enter a valid US state abbreviation (e.g., CA, NY, TX)');
        setIsSaving(false);
        return;
      }

      // Validate zip code
      if (formData.zipCode && !validateZipCode(formData.zipCode)) {
        setError('Invalid zip code. Valid formats: 12, 95123, or 12345-6789');
        setIsSaving(false);
        return;
      }

      // Update local storage and Redux directly (simulate API update)
      const updatedUser = {
        ...user,
        ...formData
      };
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Update Redux store
      dispatch(updateUser(updatedUser));
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original user data
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || '',
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const getInitials = () => {
    const first = formData.firstName?.charAt(0) || user.firstName?.charAt(0) || '';
    const last = formData.lastName?.charAt(0) || user.lastName?.charAt(0) || '';
    const initials = (first + last).toUpperCase();
    return initials || user.email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Your Profile</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your personal information</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200">{success}</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Profile Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#FF690F] flex items-center justify-center text-white text-3xl font-bold">
                  {getInitials()}
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-700 rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Camera className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formData.firstName || formData.lastName 
                    ? `${formData.firstName} ${formData.lastName}`.trim()
                    : user.email}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {formData.email}
                </p>
              </div>

              {/* Edit/Save Buttons */}
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#FF690F] text-white rounded-lg hover:bg-[#d6570c] transition-colors flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address
              </h3>
              <div className="space-y-4">
                {/* Street Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="123 Main St"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="San Francisco"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="CA"
                      maxLength="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white uppercase"
                    />
                  </div>

                  {/* ZIP Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleChange}
                      disabled={!isEditing}
                      placeholder="94102"
                      maxLength="10"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-[#FF690F] focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security
              </h3>
              <button
                type="button"
                onClick={() => navigate('/change-password')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
