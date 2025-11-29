import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import './ListingsTable.css';

const ListingsTable = ({ listings, onViewDetails, onDelete, onToggleStatus }) => {
  const [sorting, setSorting] = React.useState([]);

  const columns = React.useMemo(
    () => [
      {
        accessorKey: 'listing_type',
        header: 'Type',
        cell: (info) => (
          <span className={`type-badge ${info.getValue()}`}>
            {info.getValue().toUpperCase()}
          </span>
        ),
      },
      {
        id: 'name',
        header: 'Name/Code',
        cell: ({ row }) => {
          const listing = row.original;
          if (listing.listing_type === 'flight') {
            return `${listing.flight_code || ''} - ${listing.airline || ''}`;
          } else if (listing.listing_type === 'hotel') {
            return listing.name || '';
          } else if (listing.listing_type === 'car') {
            return `${listing.brand || ''} ${listing.model || ''}`;
          }
          return '';
        },
      },
      {
        id: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const listing = row.original;
          if (listing.listing_type === 'flight') {
            return `${listing.departure_airport || ''} → ${listing.arrival_airport || ''}`;
          } else if (listing.listing_type === 'hotel') {
            return `${listing.city || ''}, ${listing.state || ''}`;
          } else if (listing.listing_type === 'car') {
            return listing.location || '';
          }
          return '';
        },
      },
      {
        id: 'price',
        header: 'Price',
        cell: ({ row }) => {
          const listing = row.original;
          const price = listing.price || listing.price_per_night || listing.daily_rental_price;
          return price ? `$${parseFloat(price).toFixed(2)}` : 'N/A';
        },
      },
      {
        accessorKey: 'deleted_at',
        header: 'Status',
        cell: (info) => {
          const isActive = !info.getValue();
          return (
            <span className={`status-badge ${isActive ? 'active' : 'inactive'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: (info) => info.getValue() ? new Date(info.getValue()).toLocaleDateString() : 'N/A',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const listing = row.original;
          const isActive = !listing.deleted_at;
          
          return (
            <div className="action-buttons">
              <button
                className="btn-view"
                onClick={() => onViewDetails(listing)}
                title="View Details"
              >
                View
              </button>
              <button
                className={`btn-toggle ${isActive ? 'deactivate' : 'activate'}`}
                onClick={() => onToggleStatus(listing)}
                title={isActive ? 'Deactivate' : 'Activate'}
              >
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className="btn-delete"
                onClick={() => onDelete(listing)}
                title="Delete Listing"
              >
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [onViewDetails, onDelete, onToggleStatus]
  );

  const table = useReactTable({
    data: listings,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="listings-table-container">
      <table className="listings-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className={header.column.getCanSort() ? 'sortable' : ''}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() && (
                    <span className="sort-indicator">
                      {header.column.getIsSorted() === 'asc' ? ' ↑' : ' ↓'}
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
      {listings.length === 0 && (
        <div className="no-data">No listings found</div>
      )}
    </div>
  );
};

export default ListingsTable;
