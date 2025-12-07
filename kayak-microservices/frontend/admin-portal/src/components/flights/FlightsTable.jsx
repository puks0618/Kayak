/**
 * Flights Table Component
 * Display flights with actions using TanStack Table
 */

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import Button from '../shared/Button';
import './FlightsTable.css';

const FlightsTable = ({ flights = [], onEdit, onDelete, loading = false }) => {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'flight_code',
        header: 'Flight #',
        cell: (info) => (
          <span className="flight-code">{info.getValue()}</span>
        ),
      },
      {
        accessorKey: 'airline',
        header: 'Airline',
      },
      {
        accessorKey: 'route',
        header: 'Route',
        cell: (info) => {
          const flight = info.row.original;
          return (
            <span className="flight-route">
              {flight.departure_airport} → {flight.arrival_airport}
            </span>
          );
        },
      },
      {
        accessorKey: 'departure_time',
        header: 'Departure',
        cell: (info) => formatDateTime(info.getValue()),
      },
      {
        accessorKey: 'arrival_time',
        header: 'Arrival',
        cell: (info) => formatDateTime(info.getValue()),
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: (info) => formatCurrency(info.getValue()),
      },
      {
        accessorKey: 'seats',
        header: 'Seats',
        cell: (info) => {
          const flight = info.row.original;
          return `${flight.available_seats || flight.total_seats}/${flight.total_seats}`;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const flight = info.row.original;
          return (
            <div className="table-actions">
              <Button
                size="small"
                variant="ghost"
                onClick={() => onEdit(flight)}
                title="Edit flight"
              >
                ✏️
              </Button>
              <Button
                size="small"
                variant="ghost"
                onClick={() => onDelete(flight)}
                title="Delete flight"
              >
                🗑️
              </Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({
    data: flights,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="flights-table-container">
        <div className="table-skeleton">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-row"></div>
          ))}
        </div>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="flights-table-container">
        <div className="empty-state">
          <p>No flights found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flights-table-container">
      <table className="flights-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className={header.column.getCanSort() ? 'sortable' : ''}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getIsSorted() && (
                    <span className="sort-indicator">
                      {header.column.getIsSorted() === 'asc' ? ' ▲' : ' ▼'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Helper functions
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    return 'Invalid Date';
  }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount || 0);
};

export default FlightsTable;
