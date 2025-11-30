# Database Design and Schema

## Database Choice Justification

We use a polyglot persistence architecture, leveraging both MySQL and MongoDB to play to their respective strengths.

### MySQL (Relational Database)
We use MySQL for data that requires:
*   **ACID Compliance**: Strict consistency is crucial for financial transactions and user data.
*   **Structured Data**: Entities with well-defined schemas and relationships.
*   **Complex Joins**: Reporting and data integrity often require joining tables.

**Use Cases:**
*   **Users**: Identity management, profiles, and authentication credentials.
*   **Listings (Core)**: Flights, Hotels, and Cars have structured attributes (price, location, dates) that are queried with complex filters.
*   **Bookings**: Transactional data linking users to listings with status tracking.
*   **Billing**: Financial records, invoices, and payments requiring strict consistency.

### MongoDB (NoSQL Document Database)
We use MongoDB for data that requires:
*   **Flexibility**: Schemas that may evolve or vary significantly between records.
*   **High Volume/Write Throughput**: Logging and analytics generate massive amounts of data.
*   **Hierarchical/Nested Data**: Reviews and rich media metadata are naturally document-oriented.

**Use Cases:**
*   **Reviews**: User-generated content with varying lengths and metadata.
*   **Images**: Metadata for media assets associated with listings.
*   **Logs**: High-volume application logs (capped collections).
*   **Analytics**: Aggregated metrics and flexible reporting data.

---

## Schema Design

### MySQL Schemas

#### 1. Users Service (`kayak_users`)
**Table: `users`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(36) | Primary Key (UUID) |
| `email` | VARCHAR(255) | Unique, Indexed |
| `password_hash` | VARCHAR(255) | Hashed password |
| `first_name` | VARCHAR(255) | |
| `last_name` | VARCHAR(255) | |
| `ssn` | VARCHAR(11) | Unique, Indexed (PII) |
| `address` | VARCHAR(255) | |
| `city` | VARCHAR(100) | |
| `state` | CHAR(2) | |
| `zip_code` | VARCHAR(10) | |
| `phone` | VARCHAR(20) | |

#### 2. Listings Service (`kayak_listings`)
**Table: `hotels`**
| Column | Type | Indexes |
|--------|------|---------|
| `id` | VARCHAR(36) | PK |
| `name` | VARCHAR(255) | |
| `city` | VARCHAR(100) | Indexed (with state) |
| `price_per_night` | DECIMAL(10,2) | Indexed |
| `rating` | DECIMAL(3,2) | Indexed |
| `amenities` | JSON | Flexible attributes |

**Table: `flights`**
| Column | Type | Indexes |
|--------|------|---------|
| `id` | VARCHAR(36) | PK |
| `departure_airport`| VARCHAR(10) | Indexed (Composite) |
| `arrival_airport` | VARCHAR(10) | Indexed (Composite) |
| `departure_time` | DATETIME | Indexed |
| `price` | DECIMAL(10,2) | Indexed |

**Table: `cars`**
| Column | Type | Indexes |
|--------|------|---------|
| `id` | VARCHAR(36) | PK |
| `location` | VARCHAR(255) | Indexed |
| `type` | ENUM | Indexed |
| `daily_rental_price`| DECIMAL(10,2) | Indexed |

#### 3. Booking Service (`kayak_bookings`)
**Table: `bookings`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(36) | PK |
| `user_id` | VARCHAR(36) | Indexed |
| `listing_id` | VARCHAR(36) | Indexed |
| `status` | ENUM | 'pending', 'confirmed', etc. |
| `total_amount` | DECIMAL(10,2) | |

**Table: `billing`**
| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(36) | PK |
| `booking_id` | VARCHAR(36) | FK to bookings |
| `amount` | DECIMAL(10,2) | |
| `status` | ENUM | 'paid', 'pending', etc. |
| `invoice_details` | JSON | Snapshot of bill items |

---

### MongoDB Schemas

#### 1. Listings Service (`kayak_listings` DB)
**Collection: `reviews`**
```json
{
  "_id": "ObjectId",
  "listing_id": "String (Indexed)",
  "user_id": "String (Indexed)",
  "rating": "Number (1-5)",
  "comment": "String",
  "created_at": "Date (Indexed)"
}
```

**Collection: `images`**
```json
{
  "_id": "ObjectId",
  "listing_id": "String (Indexed)",
  "url": "String",
  "caption": "String"
}
```

#### 2. Analytics Service (`kayak_analytics` DB)
**Collection: `analytics`**
```json
{
  "_id": "ObjectId",
  "date": "Date (Indexed)",
  "type": "String (Indexed)",
  "metrics": {
    "revenue": "Number",
    "bookings": "Number"
  }
}
```

#### 3. Logging (`kayak_logs` DB)
**Collection: `application_logs`**
*   **Type**: Capped Collection (Fixed size: 100MB)
*   **Indexes**: `service`, `level`, `timestamp`
```json
{
  "service": "String",
  "level": "String",
  "message": "String",
  "timestamp": "Date"
}
```
