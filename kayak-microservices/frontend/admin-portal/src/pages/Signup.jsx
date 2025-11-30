import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all fields');
      return;
    }

    const strongPasswordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!strongPasswordPattern.test(formData.password)) {
      setError('Password must be at least 8 characters and include at least one number');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(formData);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Signup failed:', err);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">KAYAK</h1>
          <h2 className="auth-title">Admin Registration Unavailable</h2>
          <p className="auth-subtitle">Admin accounts cannot be created through signup</p>
        </div>

        <div style={{ padding: '20px', textAlign: 'center' }}>
          <div style={{ 
            backgroundColor: '#FEF3C7', 
            border: '1px solid #F59E0B', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '20px' 
          }}>
            <svg style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: '#F59E0B' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p style={{ color: '#92400E', fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              Admin accounts are created by system administrators only.
            </p>
            <p style={{ color: '#78350F', fontSize: '14px' }}>
              If you need admin access, please contact your system administrator.
            </p>
          </div>

          <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
            <p style={{ fontWeight: '600', marginBottom: '12px', color: '#374151' }}>Looking for something else?</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="auth-button" style={{ flex: '0 0 auto', padding: '8px 16px' }}>
                Admin Login
              </Link>
              <a href="http://localhost:5175/signup" className="auth-button" style={{ flex: '0 0 auto', padding: '8px 16px', backgroundColor: '#6366F1' }}>
                Sign up as Traveller
              </a>
              <a href="http://localhost:5175/signup" className="auth-button" style={{ flex: '0 0 auto', padding: '8px 16px', backgroundColor: '#10B981' }}>
                Sign up as Owner
              </a>
            </div>
          </div>
        </div>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
