import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchFlights, searchHotels, searchCars } from '../services/api';
import ChatWidget from '../components/ChatWidget';

const Listings = () => {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'flights';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const params = Object.fromEntries([...searchParams]);
                let response;

                if (type === 'flights') response = await searchFlights(params);
                else if (type === 'hotels') response = await searchHotels(params);
                else if (type === 'cars') response = await searchCars(params);

                // Mock data if API fails or returns empty (for demo)
                if (!response || !response.data || response.data.length === 0) {
                    setResults(getMockData(type));
                } else {
                    setResults(response.data);
                }
            } catch (error) {
                console.error('Search error:', error);
                setResults(getMockData(type));
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [searchParams, type]);

    const getMockData = (type) => {
        if (type === 'flights') return [
            { id: 1, airline: 'Delta', price: 350, duration: '2h 30m', departure: '10:00 AM', arrival: '12:30 PM' },
            { id: 2, airline: 'United', price: 320, duration: '2h 45m', departure: '11:00 AM', arrival: '1:45 PM' },
        ];
        if (type === 'hotels') return [
            { id: 1, name: 'Grand Hyatt', price: 250, rating: 4.5, location: 'Downtown' },
            { id: 2, name: 'Marriott', price: 180, rating: 4.2, location: 'City Center' },
        ];
        return [
            { id: 1, brand: 'Toyota', model: 'Camry', price: 50, type: 'Sedan' },
            { id: 2, brand: 'Ford', model: 'Explorer', price: 85, type: 'SUV' },
        ];
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-orange-500 cursor-pointer" onClick={() => window.location.href = '/'}>KAYAK</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8">
                <h2 className="text-2xl font-bold mb-6 capitalize">{type} Results</h2>

                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : (
                    <div className="space-y-4">
                        {results.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-lg shadow flex justify-between items-center hover:shadow-md transition">
                                <div>
                                    <h3 className="text-xl font-bold">
                                        {type === 'flights' ? item.airline : type === 'hotels' ? item.name : `${item.brand} ${item.model}`}
                                    </h3>
                                    <p className="text-gray-600">
                                        {type === 'flights' ? `${item.departure} - ${item.arrival}` : type === 'hotels' ? item.location : item.type}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">${item.price}</div>
                                    <button className="bg-orange-500 text-white px-6 py-2 rounded mt-2 hover:bg-orange-600">
                                        View Deal
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
            <ChatWidget />
        </div>
    );
};

export default Listings;
