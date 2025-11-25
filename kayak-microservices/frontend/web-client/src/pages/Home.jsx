import React, { useState, useEffect } from 'react';
import SearchForm from '../components/SearchForm';
import ChatWidget from '../components/ChatWidget';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };


    return (
        <div className="min-h-screen bg-[#f5f7f9]">
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-3xl font-black text-[#ff690f] tracking-tighter cursor-pointer" onClick={() => navigate('/')}>KAYAK</h1>
                        <nav className="hidden md:flex space-x-6 text-sm font-bold text-gray-700">
                            <a href="#" className="hover:text-[#ff690f] transition-colors">Flights</a>
                            <a href="#" className="hover:text-[#ff690f] transition-colors">Hotels</a>
                            <a href="#" className="hover:text-[#ff690f] transition-colors">Cars</a>
                            <a href="#" className="hover:text-[#ff690f] transition-colors">Packages</a>
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-[#ff690f] rounded-full flex items-center justify-center text-white font-bold">
                                    {(user.first_name || user.firstName || 'U')[0]?.toUpperCase()}
                                </div>
                                <button onClick={handleLogout} className="text-sm font-bold text-gray-700 hover:text-[#ff690f]">Logout</button>
                            </div>
                        ) : (
                            <a href="/login" className="text-sm font-bold text-gray-700 hover:text-[#ff690f]">Sign In</a>
                        )}
                    </div>
                </div>
            </header>

            <main>
                <div className="bg-gradient-to-r from-[#000000] to-[#2c3e50] pb-32 pt-16 px-4">
                    <div className="max-w-7xl mx-auto text-center text-white">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">Where do you want to go?</h2>
                        <p className="text-xl text-gray-300">Search hundreds of travel sites at once.</p>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4">
                    <SearchForm />

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer">
                            <div className="text-4xl mb-4">🏷️</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">Best Deals</h3>
                            <p className="text-gray-600 text-sm">Our AI automatically detects the lowest prices across thousands of sites.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer">
                            <div className="text-4xl mb-4">🤖</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">AI Concierge</h3>
                            <p className="text-gray-600 text-sm">Chat with our intelligent assistant to plan your perfect trip itinerary.</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer">
                            <div className="text-4xl mb-4">🔔</div>
                            <h3 className="text-xl font-bold mb-2 text-gray-900">Price Alerts</h3>
                            <p className="text-gray-600 text-sm">Track prices for your favorite destinations and book when they drop.</p>
                        </div>
                    </div>
                </div>
            </main>

            <ChatWidget />
        </div>
    );
};

export default Home;
