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
          <h2 className="auth-title">Create Owner Account</h2>
          <p className="auth-subtitle">Start managing your travel listings</p>
        </div>

        {error && (
          <div className="auth-error">
            <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="form-input"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="form-input"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              placeholder="At least 8 characters, include a number"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
            <p className="form-hint">
              Use at least 8 characters and include at least one number
            </p>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Looking to book travel?{' '}
            <a href="http://localhost:5175/signup" className="auth-link">
              Traveller Signup
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
