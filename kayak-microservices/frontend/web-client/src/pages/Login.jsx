import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import '../styles/Login.css';
import SocialLoginModal from '../components/SocialLoginModal';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [socialModalOpen, setSocialModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await login({ email, password });
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('token', response.data.token);

            // Success animation before navigation
            setTimeout(() => {
                navigate('/');
            }, 500);
        } catch (err) {
            console.error('Login failed:', err);
            const errorMessage = err.response?.data?.error || 'Invalid email or password. Please try again.';
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const handleSocialClick = () => {
        setSocialModalOpen(true);
    };

    const handleSocialLogin = async (email, password, provider) => {
        try {
            // Use the actual login API to authenticate
            const response = await login({ email, password });

            // Store user data with provider information
            const userData = {
                ...response.data.user,
                loginProvider: provider // Track which provider was used
            };

            localStorage.setItem('user', JSON.stringify(userData));
            setSocialModalOpen(false);

            // Navigate to home
            setTimeout(() => {
                navigate('/');
            }, 500);
        } catch (err) {
            console.error('Social login failed:', err);
            // Re-throw the error so the modal can display it
            throw new Error('Invalid email or password. Please try again.');
        }
    };

    return (
        <div className="login-container">
            <SocialLoginModal
                isOpen={socialModalOpen}
                onClose={() => setSocialModalOpen(false)}
                onLogin={handleSocialLogin}
            />
            {/* Left Side - Travel Imagery */}
            <div className="login-visual">
                <div className="visual-overlay">
                    <div className="visual-content">
                        <h1 className="visual-title">Explore the World</h1>
                        <p className="visual-subtitle">Find the best deals on flights, hotels, and car rentals</p>
                        <div className="feature-list">
                            <div className="feature-item">
                                <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Compare 100s of sites</span>
                            </div>
                            <div className="feature-item">
                                <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Best price guarantee</span>
                            </div>
                            <div className="feature-item">
                                <svg className="feature-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Free cancellation options</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="login-form-container">
                <div className="login-form-wrapper">
                    {/* Logo */}
                    <div className="login-header">
                        <h1 className="kayak-logo" onClick={() => navigate('/')}>
                            KAYAK
                        </h1>
                    </div>

                    {/* Welcome Text */}
                    <div className="welcome-section">
                        <h2 className="welcome-title">Welcome back</h2>
                        <p className="welcome-subtitle">Sign in to continue your journey</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="error-alert">
                            <svg className="error-icon" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email" className="form-label">
                                Email address
                            </label>
                            <div className="input-wrapper">
                                <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="label-row">
                                <label htmlFor="password" className="form-label">
                                    Password
                                </label>
                                <a href="/forgot-password" className="forgot-link">
                                    Forgot password?
                                </a>
                            </div>
                            <div className="input-wrapper">
                                <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`submit-button ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="spinner" viewBox="0 0 24 24">
                                        <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <svg className="button-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="divider">
                        <span className="divider-text">or continue with</span>
                    </div>

                    {/* Social Login */}
                    <div className="social-login">
                        <button type="button" className="social-button" onClick={() => setSocialModalOpen(true)}>
                            <svg className="social-icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button type="button" className="social-button" onClick={() => setSocialModalOpen(true)}>
                            <svg className="social-icon" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Facebook
                        </button>
                    </div>

                    {/* Sign Up Link */}
                    <div className="signup-section">
                        <p className="signup-text">
                            Don't have an account?{' '}
                            <a href="/signup" className="signup-link">
                                Sign up for free
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
