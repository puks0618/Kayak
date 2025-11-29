# Kayak Billing System

A mini clone of Kayak focused on billing management, built with Node.js, Express, TypeScript, React, MySQL, and MongoDB Atlas.

## Tech Stack

### Backend
- **Node.js** + **Express** + **TypeScript**
- **MySQL** - Main billing records storage
- **MongoDB Atlas** - Invoice documents and logs storage

### Frontend
- **React** + **TypeScript**
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## Project Structure

```
kayak-packages/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # MySQL & MongoDB connections
│   │   ├── models/
│   │   │   ├── mysql/
│   │   │   │   └── BillingRecord.ts # MySQL billing record model
│   │   │   └── mongodb/
│   │   │       ├── InvoiceDocument.ts # MongoDB invoice model
│   │   │       └── Log.ts            # MongoDB log model
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts       # Error handling middleware
│   │   │   └── logger.ts             # Request/error logging
│   │   ├── routes/
│   │   │   ├── billing.ts            # Billing API routes
│   │   │   └── logs.ts               # Logs API routes
│   │   └── server.ts                 # Express server setup
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.tsx            # Main layout component
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx         # Dashboard page
│   │   │   ├── BillingList.tsx       # Billing records list
│   │   │   ├── BillingDetail.tsx     # Billing record details
│   │   │   └── CreateBilling.tsx     # Create billing record
│   │   ├── services/
│   │   │   └── api.ts                # API service layer
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the `backend` folder with the following content:
   ```env
   PORT=3001
   NODE_ENV=development
   
   # MySQL Configuration
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DATABASE=kayak_billing
   
   # MongoDB Atlas Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kayak_billing?retryWrites=true&w=majority
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:3000
   ```
   
   **To get your MongoDB Atlas connection string:**
   1. Go to your MongoDB Atlas dashboard
   2. Click "Connect" on your cluster (e.g., "Cluster1")
   3. Select "Drivers" or "Connect your application"
   4. Choose "Node.js" and copy the connection string
   5. Replace `<username>` and `<password>` with your database user credentials
   6. Add `/kayak_billing` before the `?` in the connection string (e.g., `...mongodb.net/kayak_billing?retryWrites...`)
   7. If you don't have a database user, go to "Database Access" → "Add New Database User" to create one
   8. Make sure your IP address is whitelisted in "Network Access" (your current IP should already be added)

4. **Create MySQL database:**
   ```sql
   CREATE DATABASE kayak_billing;
   ```
   (The tables will be created automatically on first run)

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   The server will start on `http://localhost:3001`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables (optional):**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` if you need to change the API URL:
   ```env
   VITE_API_URL=http://localhost:3001
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The frontend will start on `http://localhost:3000`

## API Endpoints

### Billing Records

- `GET /api/billing` - Get all billing records (with optional filters: `customer_id`, `status`, `limit`, `offset`)
- `GET /api/billing/:id` - Get billing record by ID
- `POST /api/billing` - Create new billing record
- `PUT /api/billing/:id` - Update billing record
- `DELETE /api/billing/:id` - Delete billing record
- `POST /api/billing/:id/invoice` - Create invoice document for billing record
- `GET /api/billing/:id/invoice` - Get invoice document for billing record

### Logs

- `GET /api/logs` - Get logs (with optional filters: `level`, `service`, `billing_record_id`, `customer_id`, `limit`)
- `POST /api/logs` - Create log entry

### Health Check

- `GET /health` - Server health check

## Database Schema

### MySQL - billing_records

```sql
CREATE TABLE billing_records (
  id VARCHAR(36) PRIMARY KEY,
  customer_id VARCHAR(100) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
  due_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### MongoDB Collections

**InvoiceDocument:**
- Stores detailed invoice information with line items
- Linked to billing records via `billing_record_id`

**Log:**
- Stores application logs
- Auto-expires after 90 days (TTL index)

## Features

- ✅ Full CRUD operations for billing records
- ✅ Invoice document management (MongoDB)
- ✅ Request and error logging (MongoDB)
- ✅ Dashboard with statistics
- ✅ Filter and search billing records
- ✅ Responsive UI with Tailwind CSS
- ✅ TypeScript for type safety
- ✅ Environment variable configuration

## Development

### Backend Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Frontend Scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `MYSQL_HOST` | MySQL host | `localhost` |
| `MYSQL_PORT` | MySQL port | `3306` |
| `MYSQL_USER` | MySQL username | `root` |
| `MYSQL_PASSWORD` | MySQL password | - |
| `MYSQL_DATABASE` | MySQL database name | `kayak_billing` |
| `MONGODB_URI` | MongoDB connection string | - |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3001` |

## Notes

- The MySQL tables are automatically created on first server start
- MongoDB collections are created automatically when first document is inserted
- Logs in MongoDB have a TTL index that auto-deletes entries after 90 days
- All API responses follow a consistent format: `{ success: boolean, data: any, ... }`

## License

ISC

