import React, { useState } from 'react';
import './UserFormModal.css';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const UserFormModal = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    ssn: user?.ssn || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    
    if (!user) { // Only validate SSN for new users
      if (!formData.ssn.trim()) {
        newErrors.ssn = 'SSN is required';
      } else if (!/^\d{3}-\d{2}-\d{4}$/.test(formData.ssn)) {
        newErrors.ssn = 'Invalid SSN format (###-##-####)';
      }
    }

    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    
    if (!formData.zip_code.trim()) {
      newErrors.zip_code = 'Zip code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Invalid zip code format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Remove SSN from update payload (can't update SSN)
      const dataToSend = user ? { ...formData } : formData;
      if (user) delete dataToSend.ssn;
      
      onSave(dataToSend);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content user-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user ? 'Edit User' : 'Create New User'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="first_name">First Name *</label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className={errors.first_name ? 'error' : ''}
                />
                {errors.first_name && <span className="error-message">{errors.first_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="last_name">Last Name *</label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className={errors.last_name ? 'error' : ''}
                />
                {errors.last_name && <span className="error-message">{errors.last_name}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  disabled={!!user} // Can't change email for existing users
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? 'error' : ''}
                  placeholder="(555) 555-5555"
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="ssn">SSN *</label>
                <input
                  type="text"
                  id="ssn"
                  name="ssn"
                  value={formData.ssn}
                  onChange={handleChange}
                  className={errors.ssn ? 'error' : ''}
                  placeholder="###-##-####"
                  disabled={!!user} // Can't change SSN for existing users
                />
                {errors.ssn && <span className="error-message">{errors.ssn}</span>}
              </div>

              <div className="form-group full-width">
                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={errors.city ? 'error' : ''}
                />
                {errors.city && <span className="error-message">{errors.city}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="state">State *</label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={errors.state ? 'error' : ''}
                >
                  <option value="">Select State</option>
                  {US_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <span className="error-message">{errors.state}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="zip_code">Zip Code *</label>
                <input
                  type="text"
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  className={errors.zip_code ? 'error' : ''}
                  placeholder="12345"
                />
                {errors.zip_code && <span className="error-message">{errors.zip_code}</span>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {user ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
