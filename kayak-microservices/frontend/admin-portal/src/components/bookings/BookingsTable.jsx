/**
 * Bookings Table Component
 * Display bookings with actions using TanStack Table
 */

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import Button from '../shared/Button';
import './BookingsTable.css';

const BookingsTable = ({ bookings = [], onView, onUpdateStatus, onCancel, loading = false }) => {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'Booking ID',
        cell: (info) => (
          <span className="booking-id" title={info.getValue()}>
            {info.getValue().substring(0, 8)}...
          </span>
        ),
      },
      {
        accessorKey: 'user_id',
        header: 'User ID',
        cell: (info) => (
          <span className="user-id" title={info.getValue()}>
            {info.getValue().substring(0, 8)}...
          </span>
        ),
      },
      {
        accessorKey: 'listing_type',
        header: 'Type',
        cell: (info) => (
          <span className={`listing-type type-${info.getValue()}`}>
            {info.getValue().toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => (
          <span className={`status-badge status-${info.getValue()}`}>
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'travel_date',
        header: 'Travel Date',
        cell: (info) => formatDate(info.getValue()),
      },
      {
        accessorKey: 'booking_date',
        header: 'Booked On',
        cell: (info) => formatDateTime(info.getValue()),
      },
      {
        accessorKey: 'total_amount',
        header: 'Amount',
        cell: (info) => formatCurrency(info.getValue()),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const booking = info.row.original;
          return (
            <div className="table-actions">
              <Button
                size="small"
                variant="ghost"
                onClick={() => onView(booking)}
                title="View details"
              >
                👁️ View
              </Button>
              {booking.status === 'pending' && (
                <>
                  <Button
                    size="small"
                    variant="success"
                    onClick={() => onUpdateStatus(booking, 'confirmed')}
                    title="Confirm booking"
                  >
                    ✓ Confirm
                  </Button>
                  <Button
                    size="small"
                    variant="danger"
                    onClick={() => onCancel(booking)}
                    title="Cancel booking"
                  >
                    ✗ Cancel
                  </Button>
                </>
              )}
              {booking.status === 'confirmed' && (
                <Button
                  size="small"
                  variant="warning"
                  onClick={() => onUpdateStatus(booking, 'completed')}
                  title="Mark as completed"
                >
                  ✓ Complete
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onView, onUpdateStatus, onCancel]
  );

  const table = useReactTable({
    data: bookings,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="bookings-table-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bookings-table-container">
        <div className="empty-state">
          <p>📋 No bookings found</p>
          <p className="empty-state-subtitle">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookings-table-container">
      <div className="table-wrapper">
        <table className="bookings-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort() ? 'sortable' : ''
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted()
                          ? header.column.getIsSorted() === 'desc'
                            ? ' 🔽'
                            : ' 🔼'
                          : ''}
                      </div>
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
    </div>
  );
};

// Helper functions
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default BookingsTable;
