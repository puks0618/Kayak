import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchForm = () => {
    const [type, setType] = useState('flights');
    const [origin, setOrigin] = useState('');
    const [destination, setDestination] = useState('');
    const [date, setDate] = useState('');
    const navigate = useNavigate();

    const handleSearch = (e) => {
        e.preventDefault();
        navigate(`/listings?type=${type}&origin=${origin}&destination=${destination}&date=${date}`);
    };

    const activeTabClass = "border-b-2 border-[#ff690f] text-gray-900 font-bold";
    const inactiveTabClass = "text-gray-500 hover:text-[#ff690f] font-medium";

    return (
        <div className="bg-white p-6 rounded-xl shadow-xl max-w-5xl mx-auto -mt-8 relative z-10">
            <div className="flex space-x-8 mb-6 border-b border-gray-200">
                <button
                    className={`pb-3 px-2 transition-colors ${type === 'flights' ? activeTabClass : inactiveTabClass}`}
                    onClick={() => setType('flights')}
                >
                    <span className="mr-2">✈️</span>Flights
                </button>
                <button
                    className={`pb-3 px-2 transition-colors ${type === 'hotels' ? activeTabClass : inactiveTabClass}`}
                    onClick={() => setType('hotels')}
                >
                    <span className="mr-2">🏨</span>Hotels
                </button>
                <button
                    className={`pb-3 px-2 transition-colors ${type === 'cars' ? activeTabClass : inactiveTabClass}`}
                    onClick={() => setType('cars')}
                >
                    <span className="mr-2">🚗</span>Cars
                </button>
            </div>

            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 bg-gray-100 p-2 rounded-lg">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">📍</span>
                        </div>
                        <input
                            type="text"
                            placeholder="From?"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff690f] font-medium text-gray-900 placeholder-gray-500"
                            value={origin}
                            onChange={(e) => setOrigin(e.target.value)}
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">📍</span>
                        </div>
                        <input
                            type="text"
                            placeholder="To?"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff690f] font-medium text-gray-900 placeholder-gray-500"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                        />
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-400">📅</span>
                        </div>
                        <input
                            type="date"
                            className="w-full pl-10 pr-4 py-3 bg-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-[#ff690f] font-medium text-gray-900"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    className="bg-[#ff690f] text-white font-bold py-3 px-8 rounded-lg hover:bg-[#e05d0d] transition shadow-md flex items-center justify-center"
                >
                    <span className="mr-2">🔍</span> Search
                </button>
            </form>
        </div>
    );
};

export default SearchForm;
