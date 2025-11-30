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

// Billing API - Direct connection to billing backend (port 4000)
const billingApi = axios.create({
    baseURL: 'http://localhost:4000',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const billingService = {
    /**
     * Get all bills with optional filters
     */
    getAll: async (filters) => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.userId) params.append('userId', filters.userId);
        if (filters?.bookingType) params.append('bookingType', filters.bookingType);
        if (filters?.from) params.append('from', filters.from);
        if (filters?.to) params.append('to', filters.to);

        const response = await billingApi.get(`/api/billing?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single bill by billing_id
     */
    getById: async (id) => {
        const response = await billingApi.get(`/api/billing/${id}`);
        return response.data;
    },

    /**
     * Create a new bill
     */
    create: async (data) => {
        const response = await billingApi.post('/api/billing', data);
        return response.data;
    },

    /**
     * Delete a bill
     */
    delete: async (id) => {
        const response = await billingApi.delete(`/api/billing/${id}`);
        return response.data;
    },

    /**
     * Get invoice PDF for a bill
     */
    getInvoicePdf: async (id) => {
        const response = await billingApi.get(`/api/billing/${id}/invoice`, {
            responseType: 'blob'
        });
        return response.data;
    }
};

export default api;
