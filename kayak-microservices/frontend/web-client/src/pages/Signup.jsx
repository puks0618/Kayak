import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import SocialLoginModal from '../components/SocialLoginModal';

const Signup = () => {
    const [step, setStep] = useState('userType'); // 'userType' or 'form'
    const [userType, setUserType] = useState(''); // 'traveller' or 'owner'
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: ''
    });
    const [error, setError] = useState('');
    const [socialModalOpen, setSocialModalOpen] = useState(false);
    const navigate = useNavigate();
    const { register: authRegister, login: authLogin } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUserTypeSelection = (type) => {
        setUserType(type);
        setStep('form');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Validate inputs
        if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
            setError('Please fill in all fields');
            return;
        }

        // Password strength: at least 8 chars, includes a number
        const strongPasswordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
        if (!strongPasswordPattern.test(formData.password)) {
            setError('Password must be at least 8 characters and include at least one number.');
            return;
        }
        
        try {
            // Include the selected user type in the registration data
            const registrationData = {
                ...formData,
                role: userType
            };
            const result = await authRegister(registrationData);
            
            if (result.success) {
                // Check if user should be redirected to a different portal
                if (result.redirectUrl) {
                    // Owner/Admin - redirect to admin portal
                    window.location.href = result.redirectUrl;
                } else {
                    // Traveller - navigate to home on web-client
                    setTimeout(() => {
                        navigate('/');
                    }, 500);
                }
            } else {
                // Registration failed with a known reason
                const baseMessage = result.error || 'Registration failed.';
                const guidance =
                    baseMessage.includes('already exists') || baseMessage.includes('already registered')
                        ? 'Try signing in instead using that email.'
                        : 'Please fix the issue above and submit the form again.';
                setError(`${baseMessage} ${guidance}`);
            }
        } catch (err) {
            console.error('Signup failed:', err);
            setError('Something went wrong while creating your account. Please check your connection and try again.');
        }
    };

    const handleSocialClick = () => {
        setSocialModalOpen(true);
    };

    const handleSocialLogin = async (email, password, provider) => {
        try {
            // 1. Attempt to register the user first
            // We use placeholder names since the modal only provides email/password
            try {
                await register({
                    email,
                    password,
                    firstName: 'Social',
                    lastName: 'User'
                });
            } catch (regError) {
                // If registration fails (e.g. user already exists), we continue to login
                console.log('Registration skipped or failed, attempting login:', regError.message);
            }

            // 2. Log the user in
            const response = await login({ email, password });

            // Store user data with provider information
            const userData = {
                ...response.data.user,
                loginProvider: provider
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
            throw new Error('Authentication failed. Please check your credentials.');
        }
    };

    // User Type Selection Step
    if (step === 'userType') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f7f9]">
                <div className="w-full max-w-2xl bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black text-[#ff690f] mb-4 tracking-tighter cursor-pointer" onClick={() => navigate('/')}>KAYAK</h1>
                        <h2 className="text-2xl font-bold text-gray-900">Join KAYAK</h2>
                        <p className="text-gray-500 mt-2">Choose how you want to use KAYAK</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Traveller Option */}
                        <button
                            onClick={() => handleUserTypeSelection('traveller')}
                            className="group relative p-8 border-2 border-gray-200 rounded-xl hover:border-[#ff690f] hover:shadow-lg transition-all duration-200 text-left bg-white"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Traveller</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    Search and book flights, hotels, and rental cars
                                </p>
                                <ul className="text-left text-sm text-gray-600 space-y-2">
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Book travel deals</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Manage your trips</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Save favorite destinations</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="inline-flex items-center px-4 py-2 bg-[#ff690f] text-white text-sm font-semibold rounded-full">
                                    Continue →
                                </span>
                            </div>
                        </button>

                        {/* Owner Option */}
                        <button
                            onClick={() => handleUserTypeSelection('owner')}
                            className="group relative p-8 border-2 border-gray-200 rounded-xl hover:border-[#ff690f] hover:shadow-lg transition-all duration-200 text-left bg-white"
                        >
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                                    <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Owner</h3>
                                <p className="text-gray-600 text-sm mb-4">
                                    List and manage your properties or services
                                </p>
                                <ul className="text-left text-sm text-gray-600 space-y-2">
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Manage listings</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Track bookings</span>
                                    </li>
                                    <li className="flex items-start">
                                        <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>View analytics</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="inline-flex items-center px-4 py-2 bg-[#ff690f] text-white text-sm font-semibold rounded-full">
                                    Continue →
                                </span>
                            </div>
                        </button>
                    </div>

                    <div className="mt-8 text-center border-t pt-6">
                        <p className="text-gray-600 text-sm">
                            Already have an account?{' '}
                            <a href="/login" className="text-[#ff690f] font-bold hover:underline">
                                Sign in
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Registration Form Step
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f5f7f9]">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-gray-200">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-[#ff690f] mb-4 tracking-tighter cursor-pointer" onClick={() => navigate('/')}>KAYAK</h1>
                    <h2 className="text-xl font-bold text-gray-900">Create {userType === 'owner' ? 'Owner' : 'Traveller'} Account</h2>
                    <p className="text-gray-500 mt-2 text-sm">
                        {userType === 'owner' ? 'Manage your listings and bookings' : 'Save on your next trip'}
                    </p>
                    <button
                        onClick={() => setStep('userType')}
                        className="mt-2 text-sm text-[#ff690f] hover:underline font-medium"
                    >
                        ← Change account type
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 text-sm" role="alert">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase" htmlFor="firstName">
                                First Name
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded focus:bg-white focus:border-[#ff690f] focus:outline-none transition-colors font-medium"
                                placeholder="First name"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase" htmlFor="lastName">
                                Last Name
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded focus:bg-white focus:border-[#ff690f] focus:outline-none transition-colors font-medium"
                                placeholder="Last name"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded focus:bg-white focus:border-[#ff690f] focus:outline-none transition-colors font-medium"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded focus:bg-white focus:border-[#ff690f] focus:outline-none transition-colors font-medium"
                            placeholder="At least 8 characters, include a number"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Use at least 8 characters and include at least one number.
                        </p>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#ff690f] text-white font-bold py-3 px-4 rounded hover:bg-[#e05d0d] transition duration-200 shadow-sm text-sm"
                    >
                        Create Account
                    </button>
                </form>

                <div className="relative flex items-center justify-center my-6">
                    <div className="absolute inset-x-0 h-px bg-gray-200"></div>
                    <span className="relative bg-white px-4 text-sm text-gray-500 font-medium">or continue with</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                        type="button"
                        onClick={handleSocialClick}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span className="text-sm font-bold text-gray-700">Google</span>
                    </button>
                    <button
                        type="button"
                        onClick={handleSocialClick}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
                    >
                        <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span className="text-sm font-bold text-gray-700">Facebook</span>
                    </button>
                </div>

                <div className="mt-8 text-center border-t pt-6">
                    <p className="text-gray-600 text-sm">
                        Already have an account?{' '}
                        <a href="/login" className="text-[#ff690f] font-bold hover:underline">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
