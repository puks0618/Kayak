# Billing Service

The Billing Service manages billing records, invoices, and payment tracking for the Kayak application.

## Features

- Create and manage billing records
- Generate PDF invoices
- Track payment status (PENDING, PAID, OVERDUE)
- Support for multiple booking types (FLIGHT, HOTEL, CAR)
- MySQL for structured billing data storage
- MongoDB for invoice document storage

## Running Locally (Standalone)

1. Navigate to the billing service directory:
```bash
cd kayak-microservices/services/billing-service
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
PORT=4000
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=kayak_billing
MONGODB_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5176
```

4. Run in development mode:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## Running with Docker Compose

The billing service is configured to run as part of the complete Kayak microservices stack.

1. Navigate to the docker directory:
```bash
cd kayak-microservices/infrastructure/docker
```

2. Start all services including billing:
```bash
docker-compose up --build
```

The billing service will be available at:
- Inside Docker network: `http://billing-service:4000`
- From host machine: `http://localhost:4000`

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Billing Records
- `GET /api/billing` - Get all billing records (with optional filters)
- `GET /api/billing/:id` - Get single billing record
- `POST /api/billing` - Create new billing record
- `DELETE /api/billing/:id` - Delete billing record

### Invoices
- `GET /api/billing/:id/invoice` - Download PDF invoice

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Service port | 4000 |
| MYSQL_HOST | MySQL hostname | localhost |
| MYSQL_PORT | MySQL port | 3306 |
| MYSQL_USER | MySQL username | root |
| MYSQL_PASSWORD | MySQL password | - |
| MYSQL_DATABASE | Database name | kayak_billing |
| MONGODB_URI | MongoDB connection string | - |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |

## Database Schema

### MySQL (bills table)
- billing_id (PRIMARY KEY)
- user_id
- booking_type (FLIGHT, HOTEL, CAR)
- booking_id
- total_amount
- payment_method
- transaction_status (PENDING, PAID, OVERDUE)
- invoice_number
- invoice_details (JSON)
- billing_date
- created_at
- updated_at

### MongoDB (InvoiceDocuments collection)
- Stores detailed invoice documents with line items

## Dependencies

- express - Web framework
- mysql2 - MySQL client
- mongoose - MongoDB ODM
- pdfkit - PDF generation
- cors - CORS middleware
- dotenv - Environment configuration
- uuid - Unique ID generation

## Docker Configuration

The service uses:
- Node 18 Alpine base image
- TypeScript compilation during build
- Health checks every 30 seconds
- Port 4000 exposed
- Depends on mysql and mongodb services

## Integration with Web Client

The web client connects to the billing service at `http://localhost:4000` when running locally. When both are running in Docker, the web client should be configured to access billing through the API gateway.

For development, the web client's `api.js` has a `billingApi` instance configured for direct connection to port 4000.
