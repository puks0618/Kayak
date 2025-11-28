import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Gateway URL
    headers: {
        'Content-Type': 'application/json',
    },
});

export const searchFlights = (params) => api.get('/flights', { params });
export const searchHotels = (params) => api.get('/hotels', { params });
export const searchCars = (params) => api.get('/cars', { params });
export const getDeals = () => api.get('/ai/deals');
export const sendChatQuery = (query) => api.post('/ai/concierge/query', { query });
// Mock fallback for development when backend is down
const mockLogin = async (credentials) => {
    console.warn('Backend unreachable. Using mock login.');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay

    // Mock user based on credentials
    return {
        data: {
            user: {
                id: 'mock-user-id',
                email: credentials.email,
                firstName: 'Mock',
                lastName: 'User',
                role: 'user'
            },
            token: 'mock-jwt-token'
        }
    };
};

const mockRegister = async (userData) => {
    console.warn('Backend unreachable. Using mock registration.');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        data: {
            user: {
                id: 'mock-user-id',
                email: userData.email,
                firstName: userData.firstName || 'Mock',
                lastName: userData.lastName || 'User',
                role: 'user'
            },
            token: 'mock-jwt-token'
        }
    };
};

export const login = async (credentials) => {
    try {
        return await api.post('/auth/login', credentials);
    } catch (error) {
        console.error('Login API Error:', error.code, error.message);
        // Fallback if network error or server unreachable (no response)
        if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
            return mockLogin(credentials);
        }
        throw error;
    }
};

export const register = async (userData) => {
    try {
        return await api.post('/auth/register', userData);
    } catch (error) {
        console.error('Register API Error:', error.code, error.message);
        // Fallback if network error or server unreachable (no response)
        if (!error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
            return mockRegister(userData);
        }
        throw error;
    }
};

export default api;
