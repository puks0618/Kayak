import React, { useState, useEffect } from 'react';
import Button from '../components/shared/Button';
import CarsTable from '../components/cars/CarsTable';
import CarFormModal from '../components/cars/CarFormModal';
import DeleteConfirmModal from '../components/cars/DeleteConfirmModal';
import CarsFilter from '../components/cars/CarsFilter';
import { getCars, createCar, updateCar, deleteCar } from '../services/carsApi';
import './CarsManagement.css';

const CarsManagement = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ search: '', location: '', type: '' });
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async (filterParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCars(filterParams);
      setCars(data.cars || []);
    } catch (err) {
      setError('Failed to load cars');
      console.error('Error fetching cars:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = () => {
    setSelectedCar(null);
    setIsFormModalOpen(true);
  };

  const handleEditCar = (car) => {
    setSelectedCar(car);
    setIsFormModalOpen(true);
  };

  const handleDeleteCar = (car) => {
    setSelectedCar(car);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (carData) => {
    try {
      setFormLoading(true);
      if (selectedCar) {
        await updateCar(selectedCar.id, carData);
      } else {
        await createCar(carData);
      }
      await fetchCars(filters);
      setIsFormModalOpen(false);
      setSelectedCar(null);
    } catch (err) {
      alert('Failed to save car: ' + (err.response?.data?.error || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCar) return;
    try {
      setFormLoading(true);
      await deleteCar(selectedCar.id);
      await fetchCars(filters);
      setIsDeleteModalOpen(false);
      setSelectedCar(null);
    } catch (err) {
      alert('Failed to delete car: ' + (err.response?.data?.error || err.message));
    } finally {
      setFormLoading(false);
    }
  };

  const handleSearch = () => {
    fetchCars(filters);
  };

  const handleResetFilters = () => {
    setFilters({ search: '', location: '', type: '' });
    fetchCars();
  };

  return (
    <div className="cars-management">
      <div className="page-header">
        <div>
          <h1>Cars Management</h1>
          <p className="page-subtitle">Manage car rental inventory</p>
        </div>
        <Button variant="primary" onClick={handleAddCar}>
          🚗 Add Car
        </Button>
      </div>

      <CarsFilter
        filters={filters}
        onFilterChange={setFilters}
        onSearch={handleSearch}
        onReset={handleResetFilters}
      />

      {error && <div className="error-message">{error}</div>}

      <CarsTable
        cars={cars}
        onEdit={handleEditCar}
        onDelete={handleDeleteCar}
        loading={loading}
      />

      <CarFormModal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setSelectedCar(null); }}
        onSubmit={handleFormSubmit}
        car={selectedCar}
        loading={formLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setSelectedCar(null); }}
        onConfirm={handleDeleteConfirm}
        car={selectedCar}
        loading={formLoading}
      />
    </div>
  );
};

export default CarsManagement;
