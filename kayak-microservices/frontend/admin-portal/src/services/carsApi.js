/**
 * Cars API Service
 */

import api from './api';

export const getCars = async (params = {}) => {
  try {
    const response = await api.get('/admin/cars', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching cars:', error);
    throw error;
  }
};

export const getCarById = async (id) => {
  const response = await api.get(`/admin/cars/${id}`);
  return response.data;
};

export const createCar = async (carData) => {
  const response = await api.post('/admin/cars', carData);
  return response.data;
};

export const updateCar = async (id, carData) => {
  const response = await api.put(`/admin/cars/${id}`, carData);
  return response.data;
};

export const deleteCar = async (id) => {
  const response = await api.delete(`/admin/cars/${id}`);
  return response.data;
};

export default { getCars, getCarById, createCar, updateCar, deleteCar };
