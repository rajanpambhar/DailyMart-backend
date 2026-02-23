# DailyMart Backend API

Modern Node.js + NestJS backend

## 🚀 Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **Validation**: class-validator
- **Security**: Helmet, CORS, Rate limiting

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── main.ts            # Entry point
│   ├── app.module.ts      # Root module
│   ├── prisma/            # Database service
│   └── modules/
│       ├── auth/          # Authentication (JWT)
│       ├── users/         # User management
│       ├── categories/    # Product categories
│       ├── products/      # Product CRUD
│       ├── cart/          # Cart validation
│       └── orders/        # Order management
```

## 🔧 Setup Instructions

### Prerequisites

1. Node.js 20+ installed
2. PostgreSQL database running
3. npm or yarn

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings (database URL, JWT secrets, etc.)
```

### Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed
```

### Running the Server

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001/api`

## 📚 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/profile` | Get profile | User |
| PUT | `/api/users/profile` | Update profile | User |
| PATCH | `/api/users/password` | Change password | User |
| PATCH | `/api/users/:id/toggle-role` | Toggle user role | Admin |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Categories

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/categories` | List categories | Public |
| GET | `/api/categories/:slug` | Get category | Public |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |

### Products

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/products` | List products | Public |
| GET | `/api/products/best-selling` | Best sellers | Public |
| GET | `/api/products/category/:slug` | By category | Public |
| GET | `/api/products/:id` | Get product | Public |
| POST | `/api/products` | Create product | Admin |
| PUT | `/api/products/:id` | Update product | Admin |
| DELETE | `/api/products/:id` | Delete product | Admin |

### Cart

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/cart/validate` | Validate cart | User |
| POST | `/api/cart/check-stock` | Check stock | User |

### Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/orders` | Create order | User |
| GET | `/api/orders` | List all orders | Admin |
| GET | `/api/orders/my-orders` | User's orders | User |
| GET | `/api/orders/statistics` | Order stats | Admin |
| GET | `/api/orders/:id` | Order details | User/Admin |
| PATCH | `/api/orders/:id/payment-status` | Update payment | Admin |
| PATCH | `/api/orders/:id/delivery-status` | Update delivery | Admin |
| POST | `/api/orders/:id/cancel` | Cancel order | User/Admin |

## 🔐 Security Features

- **JWT Authentication**: Access + Refresh token pattern
- **Password Hashing**: bcrypt with configurable salt rounds
- **Rate Limiting**: Configurable throttling per IP
- **Input Validation**: class-validator on all DTOs
- **SQL Injection Protection**: Prisma parameterized queries
- **XSS Protection**: Helmet security headers
- **CORS**: Configurable origin restrictions


## 🛠️ Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/dailymart_db"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# App
NODE_ENV="development"
PORT=3001
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Security
BCRYPT_SALT_ROUNDS=12
```
