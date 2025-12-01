import React, { useMemo } from 'react';
import { useReactTable, getCoreRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import Button from '../shared/Button';
import './CarsTable.css';

const CarsTable = ({ cars = [], onEdit, onDelete, loading = false }) => {
  const columns = useMemo(
    () => [
      { 
        accessorKey: 'company_name', 
        header: 'Company', 
        cell: (info) => <span className="company-name">{info.getValue()}</span> 
      },
      { 
        accessorKey: 'vehicle', 
        header: 'Vehicle', 
        cell: (info) => {
          const car = info.row.original;
          return `${car.brand} ${car.model} (${car.year})`;
        }
      },
      { 
        accessorKey: 'type', 
        header: 'Type', 
        cell: (info) => <span className="car-type">{info.getValue()}</span> 
      },
      { 
        accessorKey: 'location', 
        header: 'Location' 
      },
      { 
        accessorKey: 'transmission', 
        header: 'Transmission' 
      },
      { 
        accessorKey: 'seats', 
        header: 'Seats' 
      },
      { 
        accessorKey: 'daily_rental_price', 
        header: 'Daily Price', 
        cell: (info) => `$${parseFloat(info.getValue()).toFixed(2)}` 
      },
      {
        accessorKey: 'availability_status',
        header: 'Status',
        cell: (info) => (
          <span className={`status-badge ${info.getValue() ? 'available' : 'unavailable'}`}>
            {info.getValue() ? 'Available' : 'Unavailable'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const car = info.row.original;
          return (
            <div className="table-actions">
              <Button size="small" variant="ghost" onClick={() => onEdit(car)}>✏️</Button>
              <Button size="small" variant="ghost" onClick={() => onDelete(car)}>🗑️</Button>
            </div>
          );
        },
      },
    ],
    [onEdit, onDelete]
  );

  const table = useReactTable({ 
    data: cars, 
    columns, 
    getCoreRowModel: getCoreRowModel(), 
    getSortedRowModel: getSortedRowModel() 
  });

  if (loading) {
    return (
      <div className="table-skeleton">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="skeleton-row"></div>
        ))}
      </div>
    );
  }

  if (cars.length === 0) {
    return (
      <div className="empty-state">
        <p>No cars found. Add your first car!</p>
      </div>
    );
  }

  return (
    <div className="cars-table-container">
      <table className="cars-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
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

export default CarsTable;
