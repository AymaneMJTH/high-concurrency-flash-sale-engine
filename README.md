# High-Concurrency Flash Sale Engine & Real-Time Monitoring Dashboard

A production-grade flash sale system engineered to handle massive concurrent traffic while preventing overselling through distributed locking and event-driven architecture.

## Overview

This system demonstrates advanced backend engineering patterns for high-concurrency scenarios, featuring:

- **Overselling Prevention**: Redis-based atomic locking with Lua scripts ensures stock accuracy under heavy load
- **Event-Driven Architecture**: RabbitMQ decouples order processing from checkout for scalability
- **Real-Time Monitoring**: React dashboard with live health metrics and stress testing capabilities
- **Idempotency Handling**: Prevents duplicate orders through Redis-based idempotency keys
- **Flexible Identifiers**: Supports both UUID and string-based product/tenant identifiers

## Architecture & Tech Stack

### Backend Gateway (NestJS)
- **Framework**: NestJS with TypeScript
- **Microservices**: RabbitMQ for event-driven order processing
- **Caching**: Redis with atomic Lua scripts for stock decrement operations
- **Database**: PostgreSQL with TypeORM for persistent storage
- **Validation**: Class-validator for DTO validation

### Dashboard (React)
- **Framework**: React with Vite
- **Styling**: TailwindCSS for modern UI
- **Icons**: Lucide React
- **Real-Time Updates**: Polling-based health and order monitoring

### Infrastructure
- **Docker Compose**: Orchestrates PostgreSQL, Redis, and RabbitMQ
- **Load Testing**: Node.js script for concurrent request simulation

## Core Engineering Highlights

### 1. Overselling Prevention
The system uses Redis atomic operations with Lua scripts to ensure stock decrements are atomic, preventing race conditions during high-concurrency scenarios:

```lua
local stockKey = KEYS[1]
local quantity = tonumber(ARGV[1])
local currentStock = tonumber(redis.call('GET', stockKey) or '0')

if currentStock < quantity then
  return {0, currentStock}
end

local newStock = redis.call('DECRBY', stockKey, quantity)
return {1, newStock}
```

### 2. Event-Driven Architecture
Orders are processed asynchronously through RabbitMQ, decoupling the checkout API from database persistence:

- Checkout endpoint immediately returns order confirmation
- Order consumer service persists orders to PostgreSQL
- Failed messages are re-queued for retry
- Inventory logs track all stock changes

### 3. Idempotency Handling
Each order request includes an idempotency key stored in Redis with a 1-hour TTL, preventing duplicate order submissions while allowing legitimate retries.

### 4. Flexible Identifier Support
The system supports both UUID and string-based identifiers for products, tenants, and orders, providing flexibility for different integration scenarios.

## Quick Start Guide

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm

### Using Docker Compose (Recommended)

1. **Start Infrastructure Services**
   ```bash
   docker-compose up -d
   ```

   This starts:
   - PostgreSQL on port 5433
   - Redis on port 6379
   - RabbitMQ on port 5672

2. **Initialize Database**
   ```bash
   # Apply the schema to PostgreSQL
   psql -h localhost -p 5433 -U flashsale_user -d flashsale_db -f schema.sql
   ```

3. **Configure Environment Variables**
   ```bash
   cd backend-gateway
   cp .env.example .env
   # Edit .env with your configuration if needed
   ```

4. **Start Backend Gateway**
   ```bash
   cd backend-gateway
   npm install
   npm run start:dev
   ```

5. **Start Dashboard**
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```

6. **Access the Application**
   - Dashboard: http://localhost:5173
   - API Gateway: http://localhost:3000
   - Health Check: http://localhost:3000/health

### Load Testing

Run the stress test to verify overselling prevention:

```bash
node load-test.js
```

This simulates 100 concurrent requests in batches of 20, demonstrating the system's ability to handle high concurrency while maintaining stock accuracy.

## API Endpoints

### Flash Sale API

- `POST /flash-sale/checkout` - Create an order
- `GET /flash-sale/status/:productId` - Get product status and health metrics
- `POST /flash-sale/restock` - Restock product inventory
- `GET /flash-sale/orders` - Get recent orders (last 50)

### Health API

- `GET /health` - System health check (PostgreSQL, Redis, RabbitMQ)

## Project Structure

```
flash-sale-engine/
├── backend-gateway/          # NestJS API Gateway
│   ├── src/
│   │   ├── auth/            # Authentication & tenant management
│   │   ├── flash-sale/      # Core flash sale logic
│   │   │   ├── entities/    # TypeORM entities
│   │   │   ├── dto/         # Data transfer objects
│   │   │   └── order-consumer.service.ts
│   │   └── health/          # Health check endpoints
│   └── .env.example
├── dashboard/               # React monitoring dashboard
│   └── src/
│       └── components/      # UI components
├── docker-compose.yml       # Infrastructure orchestration
├── schema.sql              # Database schema
└── load-test.js            # Load testing script
```

## Environment Variables

See `backend-gateway/.env.example` for the complete list:

- `PORT` - Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` - PostgreSQL configuration
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `RABBITMQ_URL` - RabbitMQ connection URL
- `ADMIN_API_KEY` - Dashboard authentication key

## Author

**Aymane MJTH**

[GitHub Profile](https://github.com/AymaneMJTH)

---

Built with ❤️ for demonstrating high-concurrency system design patterns.
