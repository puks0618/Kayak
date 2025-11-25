import React, { useState } from 'react';

const SocialLoginModal = ({ isOpen, onClose, onLogin }) => {
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [error, setError] = useState('');
    const [showFakePopup, setShowFakePopup] = useState(false);
    const [popupProvider, setPopupProvider] = useState(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setShowEmailForm(false);
        setEmail('');
        setPassword('');
        setSelectedProvider(null);
        setError('');
        onClose();
    };

    const handleSocialClick = (provider) => {
        setPopupProvider(provider);
        setShowFakePopup(true);
    };

    const handleFakePopupLogin = () => {
        setShowFakePopup(false);
        // Simulate successful login
        onLogin(`user@${popupProvider}.com`, 'password123', popupProvider);
    };

    const handleEmailClick = () => {
        setSelectedProvider('email');
        setShowEmailForm(true);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Pass email, password, and provider to parent for authentication
            await onLogin(email, password, selectedProvider);
            // If successful, parent will handle navigation and modal closing
        } catch (err) {
            // Display error from parent
            setError(err.message || 'Authentication failed. Please try again.');
            setIsLoading(false);
        }
    };

    const getProviderName = () => {
        if (selectedProvider === 'google') return 'Google';
        if (selectedProvider === 'facebook') return 'Facebook';
        return 'Email';
    };

    const getButtonColor = () => {
        if (selectedProvider === 'google') return 'bg-[#1a73e8] hover:bg-[#1557b0]';
        if (selectedProvider === 'facebook') return 'bg-[#1877F2] hover:bg-[#166fe5]';
        return 'bg-[#ff690f] hover:bg-[#e05d0d]';
    };

    return (
        <>
            {/* Simulated OAuth Popup Window */}
            {showFakePopup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10000,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}>
                    <div style={{
                        width: '500px',
                        height: '600px',
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'popIn 0.2s ease-out'
                    }}>
                        {/* Fake Browser Toolbar */}
                        <div style={{
                            backgroundColor: '#f3f4f6',
                            padding: '8px 12px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444', cursor: 'pointer' }} onClick={() => setShowFakePopup(false)} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                            </div>
                            <div style={{
                                flex: 1,
                                backgroundColor: 'white',
                                borderRadius: '4px',
                                padding: '4px 12px',
                                fontSize: '12px',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                textAlign: 'center'
                            }}>
                                <span style={{ color: '#10b981' }}>🔒</span> accounts.{popupProvider}.com/signin/oauth
                            </div>
                        </div>

                        {/* Provider Content */}
                        <div style={{
                            flex: 1,
                            padding: '40px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center'
                        }}>
                            <div style={{ marginBottom: '24px' }}>
                                {popupProvider === 'google' ? (
                                    <svg width="48" height="48" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                                ) : (
                                    <svg width="48" height="48" viewBox="0 0 24 24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                                )}
                            </div>

                            <h2 style={{ fontSize: '24px', fontWeight: '500', color: '#202124', marginBottom: '8px' }}>
                                Sign in with {popupProvider === 'google' ? 'Google' : 'Facebook'}
                            </h2>
                            <p style={{ color: '#5f6368', marginBottom: '32px', lineHeight: '1.5' }}>
                                Kayak asks for access to your name, email address, and profile picture.
                            </p>

                            <button
                                onClick={handleFakePopupLogin}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    backgroundColor: popupProvider === 'google' ? '#4285F4' : '#1877F2',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                                onMouseOut={(e) => e.target.style.opacity = '1'}
                            >
                                Continue as User
                            </button>

                            <div style={{ marginTop: '32px', fontSize: '12px', color: '#5f6368' }}>
                                To continue, {popupProvider === 'google' ? 'Google' : 'Facebook'} will share your name, email address, and profile picture with Kayak.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                }}
                onClick={handleClose}
            >
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        width: '100%',
                        maxWidth: '28rem',
                        margin: '0 1rem',
                        padding: '2rem',
                        position: 'relative',
                        animation: 'slideUp 0.3s ease-out',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#9ca3af',
                            padding: '0.5rem',
                        }}
                    >
                        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {!showEmailForm ? (
                        /* Initial Sign-in Options */
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', fontFamily: 'Georgia, serif' }}>
                                    Sign in to Kayak
                                </h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* Google Button */}
                                <button
                                    type="button"
                                    onClick={() => handleSocialClick('google')}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: 'white',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '24px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        color: '#111827',
                                        fontWeight: '500',
                                        fontSize: '1rem',
                                        fontFamily: 'Arial, sans-serif'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign in with Google
                                </button>

                                {/* Facebook Button */}
                                <button
                                    type="button"
                                    onClick={() => handleSocialClick('facebook')}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: 'white',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '24px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        color: '#111827',
                                        fontWeight: '500',
                                        fontSize: '1rem',
                                        fontFamily: 'Arial, sans-serif'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    <svg style={{ width: '20px', height: '20px', color: '#1877F2' }} viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    Sign in with Facebook
                                </button>
                            </div>

                            {/* Divider */}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1.5rem 0' }}>
                                <div style={{ position: 'absolute', left: 0, right: 0, height: '1px', backgroundColor: '#e5e7eb' }}></div>
                                <span style={{ position: 'relative', backgroundColor: 'white', padding: '0 1rem', fontSize: '0.875rem', color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>or</span>
                            </div>

                            {/* Email Button */}
                            <button
                                type="button"
                                onClick={handleEmailClick}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '24px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                    color: '#111827',
                                    fontWeight: '500',
                                    fontSize: '1rem',
                                    fontFamily: 'Arial, sans-serif'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            >
                                <span style={{ fontWeight: '500' }}>Sign in with Email</span>
                            </button>
                        </>
                    ) : (
                        /* Email/Password Form */
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                    {selectedProvider === 'google' && (
                                        <svg style={{ width: '80px', height: '80px' }} viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                    )}
                                    {selectedProvider === 'facebook' && (
                                        <svg style={{ width: '80px', height: '80px', color: '#1877F2' }} viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                        </svg>
                                    )}
                                    {selectedProvider === 'email' && (
                                        <svg style={{ width: '80px', height: '80px', color: '#ff690f' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    )}
                                </div>
                                <h3 style={{ fontSize: '1.75rem', fontWeight: '400', color: '#202124', marginBottom: '0.75rem', fontFamily: 'Arial, sans-serif' }}>Sign in</h3>
                                <p style={{ fontSize: '1rem', color: '#5f6368' }}>to continue to <span style={{ fontWeight: '600', color: '#ff690f' }}>KAYAK</span></p>
                                {error && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem 1rem',
                                        backgroundColor: '#fef2f2',
                                        border: '1px solid #fecaca',
                                        borderRadius: '4px',
                                        color: '#dc2626',
                                        fontSize: '0.875rem',
                                        fontFamily: 'Arial, sans-serif'
                                    }}>
                                        {error}
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: '#202124',
                                        marginBottom: '0.75rem',
                                        fontFamily: 'Arial, sans-serif'
                                    }}>
                                        {selectedProvider === 'email' ? 'Email address' : 'Enter mobile number or email'}
                                    </label>
                                    <input
                                        type="text"
                                        style={{
                                            width: '100%',
                                            padding: '1rem 1.25rem',
                                            backgroundColor: 'white',
                                            border: '1px solid #dadce0',
                                            borderRadius: '4px',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            fontFamily: 'Arial, sans-serif',
                                            color: '#202124',
                                            boxSizing: 'border-box',
                                        }}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#1a73e8';
                                            e.target.style.borderWidth = '2px';
                                            e.target.style.padding = 'calc(1rem - 1px) calc(1.25rem - 1px)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#dadce0';
                                            e.target.style.borderWidth = '1px';
                                            e.target.style.padding = '1rem 1.25rem';
                                        }}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: '#202124',
                                        marginBottom: '0.75rem',
                                        fontFamily: 'Arial, sans-serif'
                                    }}>
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        style={{
                                            width: '100%',
                                            padding: '1rem 1.25rem',
                                            backgroundColor: 'white',
                                            border: '1px solid #dadce0',
                                            borderRadius: '4px',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            fontFamily: 'Arial, sans-serif',
                                            color: '#202124',
                                            boxSizing: 'border-box',
                                        }}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#1a73e8';
                                            e.target.style.borderWidth = '2px';
                                            e.target.style.padding = 'calc(1rem - 1px) calc(1.25rem - 1px)';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#dadce0';
                                            e.target.style.borderWidth = '1px';
                                            e.target.style.padding = '1rem 1.25rem';
                                        }}
                                    />
                                </div>

                                <div style={{ paddingTop: '1rem' }}>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 1.5rem',
                                            borderRadius: '24px',
                                            fontWeight: '500',
                                            fontSize: '1rem',
                                            color: 'white',
                                            backgroundColor: selectedProvider === 'google' ? '#1a73e8' : selectedProvider === 'facebook' ? '#1877F2' : '#ff690f',
                                            border: 'none',
                                            cursor: isLoading ? 'not-allowed' : 'pointer',
                                            opacity: isLoading ? 0.7 : 1,
                                            boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
                                            transition: 'all 0.2s',
                                            fontFamily: 'Arial, sans-serif',
                                            letterSpacing: '0.25px',
                                        }}
                                        onMouseOver={(e) => {
                                            if (!isLoading) {
                                                e.target.style.boxShadow = '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)';
                                        }}
                                    >
                                        {isLoading ? 'Signing in...' : 'Continue'}
                                    </button>
                                </div>
                            </form>

                            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                <button
                                    onClick={() => setShowEmailForm(false)}
                                    style={{
                                        fontSize: '0.9rem',
                                        color: '#ff690f',
                                        fontWeight: '500',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        fontFamily: 'Arial, sans-serif',
                                    }}
                                    onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                                    onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                                >
                                    ← Back to sign-in options
                                </button>
                            </div>

                            <div style={{ marginTop: '1.5rem', textAlign: 'center', paddingTop: '1.5rem', borderTop: '1px solid #e8eaed' }}>
                                <p style={{ fontSize: '0.75rem', color: '#5f6368', lineHeight: '1.5', fontFamily: 'Arial, sans-serif' }}>
                                    By continuing, you agree to {getProviderName()}'s Terms of Service and Privacy Policy
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
            </div>
        </>
    );
};

export default SocialLoginModal;
