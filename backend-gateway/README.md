# Flash Sale & Real-time Inventory Engine API Gateway

## Prerequisites
- Docker and Docker Compose
- Node.js 18+
- npm or yarn

## Setup

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
cd backend-gateway
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

### 4. Start Development Server
```bash
npm run start:dev
```

## API Endpoints

### Health Check
- `GET /health` - Check PostgreSQL and Redis connection status

### Flash Sale
- `POST /flash-sale/checkout` - Process a flash sale order
- `GET /flash-sale/products` - Get all products for the authenticated tenant

## Authentication
All endpoints require API key authentication via:
- `Authorization: Bearer <api_key>` header
- `X-API-Key: <api_key>` header

## Database Schema
The schema is automatically initialized on PostgreSQL startup via `schema.sql`.
