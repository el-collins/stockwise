# StockWise - Stock Management System

A comprehensive stock management system built with ASP.NET Core 8 and React, featuring JWT authentication, event-driven architecture, Redis caching, and real-time stock monitoring.

## 🚀 Features

### Core Features
- **🔐 Authentication & Authorization**: JWT-based authentication with user registration and login
- **📦 Product Management**: Full CRUD operations for products with stock tracking
- **🛒 Order Management**: Place orders with automatic stock validation and updates
- **⚡ Event-Driven Architecture**: RabbitMQ integration for real-time notifications
- **🚀 Redis Caching**: Fast product retrieval with intelligent cache invalidation
- **🔍 Background Tasks**: Automated low-stock monitoring and alerts
- **✅ Stock Validation**: Prevents overselling with real-time stock checks
- **👥 User Management**: User profiles, password changes, and role-based access

### Frontend Features
- **🎨 Modern React UI**: Beautiful, responsive interface built with React 19 and Tailwind CSS
- **📊 Interactive Dashboard**: Real-time statistics, charts, and low stock alerts
- **🔒 Protected Routes**: Route-level authentication with automatic redirects
- **📱 Mobile Responsive**: Optimized for desktop, tablet, and mobile devices
- **🔔 Real-time Notifications**: Toast notifications for user feedback
- **📈 Data Visualization**: Charts and graphs for inventory insights

### Technical Features
- **🔑 JWT Authentication**: Secure token-based authentication with refresh capabilities
- **🗄️ Entity Framework Core**: SQL Server database with migrations
- **🔄 AutoMapper**: Object-to-object mapping
- **📝 Serilog**: Structured logging with file and console outputs
- **✔️ FluentValidation**: Comprehensive input validation
- **📚 Swagger/OpenAPI**: Interactive API documentation
- **🌐 CORS**: Cross-origin resource sharing support
- **🎯 TypeScript**: Full type safety across the frontend
- **⚛️ React Query**: Intelligent data fetching and caching

## 📋 Prerequisites

### Backend
- .NET 8.0 SDK
- SQL Server (LocalDB or full instance)
- Redis Server
- RabbitMQ Server

### Frontend
- Node.js 18+ and npm
- Modern web browser

## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd StockWise
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd StockWise.API
dotnet restore
```

#### Configure Connection Strings
Update `appsettings.json` with your connection strings:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=StockWiseDb;Trusted_Connection=true;MultipleActiveResultSets=true",
    "Redis": "localhost:6379"
  },
  "JwtSettings": {
    "SecretKey": "StockWise_JWT_Secret_Key_2024_Very_Long_And_Secure_Key_For_Production_Use",
    "Issuer": "StockWise.API",
    "Audience": "StockWise.Client",
    "ExpirationInHours": 24
  },
  "RabbitMQ": {
    "HostName": "localhost",
    "Port": 5672,
    "UserName": "guest",
    "Password": "guest",
    "VirtualHost": "/"
  }
}
```

### 3. Frontend Setup

#### Install Dependencies
```bash
cd stockwise.client
npm install
```

#### Configure Environment
Create `.env` file:
```env
VITE_API_BASE_URL=https://localhost:5001/api
```

### 4. Start Required Services

#### Redis (using Docker)
```bash
docker run -d -p 6379:6379 redis:alpine
```

#### RabbitMQ (using Docker)
```bash
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

### 5. Run the Application

#### Start Backend API
```bash
cd StockWise.API
dotnet run
```

#### Start Frontend (in a new terminal)
```bash
cd stockwise.client
npm run dev
```

### 6. Access the Application

- **Frontend**: `http://localhost:5173`
- **Backend API**: `https://localhost:5127`
- **Swagger UI**: `http://localhost:5127/swagger`
- **RabbitMQ Management**: `http://localhost:15672` (guest/guest)

## 🔐 Default Credentials

The system includes pre-configured test accounts:

- **Admin User**: 
  - Username: `admin`
  - Password: `admin123`
  - Role: Admin

- **Demo User**: 
  - Username: `demo` 
  - Password: `demo123`
  - Role: User

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - User logout
- `POST /api/auth/validate-token` - Validate JWT token

### Products (🔒 Requires Authentication)
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `GET /api/products/sku/{sku}` - Get product by SKU
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product (soft delete)
- `PATCH /api/products/{id}/stock` - Update stock quantity
- `GET /api/products/low-stock` - Get low stock products

### Orders (🔒 Requires Authentication)
- `GET /api/orders` - Get all orders
- `GET /api/orders/{id}` - Get order by ID
- `GET /api/orders/number/{orderNumber}` - Get order by number
- `POST /api/orders` - Create new order
- `PATCH /api/orders/{id}/status` - Update order status
- `POST /api/orders/{id}/cancel` - Cancel order

## 🔄 Event-Driven Architecture

The system publishes events to RabbitMQ for various operations:

### Stock Events
- **stock.updated**: Published when stock quantity changes
- **stock.low**: Published when stock falls below threshold

### Order Events
- **order.placed**: Published when an order is successfully created
- **order.cancelled**: Published when an order is cancelled

### Alert Events
- **stock.low**: Low stock alerts for monitoring systems

## 💾 Caching Strategy

Redis caching is implemented for:
- Individual products (`product:{id}`)
- All products list (`products:all`)
- Cache invalidation on stock updates
- 30-minute expiration for product data

## 🔍 Background Services

### Low Stock Monitoring Service
- Runs every 30 minutes
- Checks for products below low stock threshold
- Publishes alerts to RabbitMQ
- Logs warnings for low stock items

## 📊 Sample Data

The system includes seed data with sample products:
1. **Laptop** (LAP001) - $999.99, Stock: 50, Threshold: 10
2. **Wireless Mouse** (MOU001) - $29.99, Stock: 100, Threshold: 20
3. **Mechanical Keyboard** (KEY001) - $79.99, Stock: 5, Threshold: 10

## 🧪 Testing the System

### 1. Register a New User
```bash
curl -X POST "https://localhost:5001/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### 2. Login
```bash
curl -X POST "https://localhost:5001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 3. Create a Product (with Bearer token)
```bash
curl -X POST "https://localhost:5001/api/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Gaming Monitor",
    "description": "27-inch 4K gaming monitor",
    "sku": "MON001",
    "price": 299.99,
    "stockQuantity": 25,
    "lowStockThreshold": 5,
    "category": "Electronics"
  }'
```

### 4. Place an Order (with Bearer token)
```bash
curl -X POST "https://localhost:5001/api/orders" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "orderItems": [
      {
        "productId": 1,
        "quantity": 2
      }
    ]
  }'
```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Data Layer    │
│   (React)       │    │   (.NET Core)   │    │                 │
│                 │    │                 │    │                 │
│ • Auth Pages    │───▶│ • Auth APIs     │───▶│ • SQL Server    │
│ • Dashboard     │    │ • Product APIs  │    │ • Entity Framework
│ • Products      │    │ • Order APIs    │    │ • User Management
│ • Orders        │    │ • JWT Auth      │    └─────────────────┘
│ • Protected     │    │ • Validation    │
│   Routes        │    │ • AutoMapper    │    ┌─────────────────┐
└─────────────────┘    └─────────────────┘    │   External      │
                              │                │   Services      │
                              ▼                │                 │
                    ┌─────────────────┐        │ • Redis Cache   │
                    │   Background    │        │ • RabbitMQ      │
                    │   Services      │        │ • JWT Tokens    │
                    │                 │        └─────────────────┘
                    │ • Stock Monitor │
                    │ • Event Handlers│
                    └─────────────────┘
```

## 🔒 Security Features

### JWT Authentication
- Secure token-based authentication
- 24-hour token expiration
- Automatic token validation
- Protected API endpoints

### Password Security
- BCrypt password hashing
- Password strength validation
- Secure password reset functionality

### Route Protection
- Frontend route guards
- Backend authorization middleware
- Role-based access control

## 🔧 Configuration

### Environment Variables
You can override configuration using environment variables:

**Backend:**
- `ConnectionStrings__DefaultConnection`
- `ConnectionStrings__Redis`
- `JwtSettings__SecretKey`
- `JwtSettings__Issuer`
- `JwtSettings__Audience`
- `RabbitMQ__HostName`
- `RabbitMQ__Port`
- `RabbitMQ__UserName`
- `RabbitMQ__Password`

**Frontend:**
- `VITE_API_BASE_URL`

### Logging
Logs are written to:
- Console (for development)
- Files in `logs/` directory (daily rolling)

## 🚀 Production Deployment

For production deployment:

### Backend
1. Update connection strings for production databases
2. Configure secure JWT secret keys
3. Set up Redis cluster for high availability
4. Configure RabbitMQ cluster
5. Enable HTTPS with proper certificates
6. Configure proper CORS policies
7. Set up monitoring and alerting

### Frontend
1. Build the React application (`npm run build`)
2. Deploy to a web server (Nginx, Apache, etc.)
3. Configure environment variables
4. Set up HTTPS
5. Configure caching headers

## 📱 Frontend Features

### Pages
- **🔐 Login/Register**: Beautiful authentication forms with validation
- **📊 Dashboard**: Real-time statistics and charts
- **📦 Products**: Product management with search and filtering
- **🛒 Orders**: Order management and tracking

### Components
- **🎨 Modern UI**: Clean, professional design
- **📱 Responsive**: Mobile-first responsive design
- **🔔 Notifications**: Toast notifications for user feedback
- **📈 Charts**: Interactive data visualization
- **🔍 Search**: Real-time search and filtering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License. 