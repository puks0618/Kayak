import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import './UsersTable.css';

const UsersTable = ({ users, onViewDetails, onEdit, onDelete, onToggleStatus }) => {
  const [sorting, setSorting] = React.useState([]);

  const columns = React.useMemo(
    () => [
      {
        accessorKey: 'first_name',
        header: 'First Name',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'last_name',
        header: 'Last Name',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'city',
        header: 'City',
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: 'state',
        header: 'State',
        cell: (info) => info.getValue(),
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
        header: 'Joined',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const user = row.original;
          const isActive = !user.deleted_at;
          
          return (
            <div className="action-buttons">
              <button
                className="btn-view"
                onClick={() => onViewDetails(user)}
                title="View Details"
              >
                View
              </button>
              <button
                className="btn-edit"
                onClick={() => onEdit(user)}
                title="Edit User"
              >
                Edit
              </button>
              <button
                className={`btn-toggle ${isActive ? 'deactivate' : 'activate'}`}
                onClick={() => onToggleStatus(user)}
                title={isActive ? 'Deactivate' : 'Activate'}
              >
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className="btn-delete"
                onClick={() => onDelete(user)}
                title="Delete User"
              >
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [onViewDetails, onEdit, onDelete, onToggleStatus]
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="users-table-container">
      <table className="users-table">
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
      {users.length === 0 && (
        <div className="no-data">No users found</div>
      )}
    </div>
  );
};

export default UsersTable;
