/**
 * Flights Management Page
 */

import React, { useState, useEffect } from 'react';
import Button from '../components/shared/Button';
import FlightsTable from '../components/flights/FlightsTable';
import FlightFormModal from '../components/flights/FlightFormModal';
import DeleteConfirmModal from '../components/flights/DeleteConfirmModal';
import FlightsFilter from '../components/flights/FlightsFilter';
import { 
  getFlights, 
  createFlight, 
  updateFlight, 
  deleteFlight,
  getAirlines 
} from '../services/flightsApi';
import './FlightsManagement.css';

const FlightsManagement = () => {
  const [flights, setFlights] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    airline: '',
    origin: '',
    destination: ''
  });

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchFlights();
    fetchAirlines();
  }, []);

  const fetchFlights = async (filterParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFlights(filterParams);
      setFlights(data.flights || []);
    } catch (err) {
      console.error('Error fetching flights:', err);
      setError('Failed to load flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAirlines = async () => {
    try {
      const airlinesList = await getAirlines();
      setAirlines(airlinesList);
    } catch (err) {
      console.error('Error fetching airlines:', err);
    }
  };

  const handleAddFlight = () => {
    setSelectedFlight(null);
    setIsFormModalOpen(true);
  };

  const handleEditFlight = (flight) => {
    setSelectedFlight(flight);
    setIsFormModalOpen(true);
  };

  const handleDeleteFlight = (flight) => {
    setSelectedFlight(flight);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (flightData) => {
    try {
      setFormLoading(true);
      
      if (selectedFlight) {
        // Update existing flight
        await updateFlight(selectedFlight.id, flightData);
      } else {
        // Create new flight
        await createFlight(flightData);
      }

      // Refresh flights list
      await fetchFlights(filters);
      setIsFormModalOpen(false);
      setSelectedFlight(null);
    } catch (err) {
      console.error('Error saving flight:', err);
      alert('Failed to save flight. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFlight) return;

    try {
      setFormLoading(true);
      await deleteFlight(selectedFlight.id);
      
      // Refresh flights list
      await fetchFlights(filters);
      setIsDeleteModalOpen(false);
      setSelectedFlight(null);
    } catch (err) {
      console.error('Error deleting flight:', err);
      alert('Failed to delete flight. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    const filterParams = {};
    if (filters.airline) filterParams.airline = filters.airline;
    if (filters.origin) filterParams.origin = filters.origin.toUpperCase();
    if (filters.destination) filterParams.destination = filters.destination.toUpperCase();
    
    fetchFlights(filterParams);
  };

  const handleResetFilters = () => {
    setFilters({
      airline: '',
      origin: '',
      destination: ''
    });
    fetchFlights();
  };

  if (error && flights.length === 0) {
    return (
      <div className="flights-management">
        <div className="page-header">
          <div>
            <h1>Flights Management</h1>
            <p className="page-subtitle">Manage flight inventory and schedules</p>
          </div>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <Button onClick={() => fetchFlights()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flights-management">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Flights Management</h1>
          <p className="page-subtitle">Manage flight inventory and schedules</p>
        </div>
        <Button variant="primary" onClick={handleAddFlight}>
          ✈️ Add Flight
        </Button>
      </div>

      {/* Filters */}
      <FlightsFilter
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleResetFilters}
        airlines={airlines}
      />

      {/* Flights Table */}
      <FlightsTable
        flights={flights}
        onEdit={handleEditFlight}
        onDelete={handleDeleteFlight}
        loading={loading}
      />

      {/* Add/Edit Modal */}
      <FlightFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedFlight(null);
        }}
        onSubmit={handleFormSubmit}
        flight={selectedFlight}
        loading={formLoading}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedFlight(null);
        }}
        onConfirm={handleDeleteConfirm}
        flight={selectedFlight}
        loading={formLoading}
      />
    </div>
  );
};

export default FlightsManagement;
