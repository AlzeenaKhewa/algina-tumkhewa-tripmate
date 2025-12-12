# Backend Setup & Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Database Setup](#database-setup)
5. [Running the Server](#running-the-server)
6. [API Documentation](#api-documentation)
7. [Testing](#testing)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher) - [Download](https://nodejs.org)
- **npm** (comes with Node.js)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org)
- **Git** (optional)

Verify installation:
```bash
node --version
npm --version
psql --version
```

---

## Installation

### Step 1: Navigate to Backend Folder
```bash
cd Backend
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all required packages listed in `package.json`:
- express (Web framework)
- prisma (ORM)
- postgresql (Database driver)
- bcryptjs (Password hashing)
- jsonwebtoken (JWT authentication)
- cors (Cross-origin requests)
- helmet (Security headers)
- morgan (HTTP logging)
- dotenv (Environment variables)

---

## Configuration

### Step 1: Create Environment File
An `.env` file should already exist in the Backend folder. Update it with your PostgreSQL credentials:

```env
# PostgreSQL Database Connection
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/trimate_db"

# Environment
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=24h

# Server Port
PORT=5000

# API Configuration
API_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_PATH=./uploads

# Gemini API (optional)
GEMINI_API_KEY=your_key_here
```

### Step 2: Configure PostgreSQL
1. Open PostgreSQL command line (psql) or use pgAdmin
2. Create a new database:
```sql
CREATE DATABASE trimate_db;
```

3. Verify the connection string in `.env`:
   - `postgresql://username:password@localhost:5432/trimate_db`

---

## Database Setup

### Step 1: Initialize Prisma Schema
The schema is already created at `prisma/schema.prisma`. It includes:
- **Users** - User accounts with authentication
- **Roles** - User roles (ADMIN, USER, MODERATOR)
- **UserProfile** - Extended user information
- **Posts** - Blog/content posts
- **Comments** - Comments on posts
- **AuditLog** - System audit trail

### Step 2: Run Migrations
Create and apply migrations to your database:

```bash
npm run prisma:migrate
```

You'll be prompted to name the migration. Example: `initial_setup`

This command will:
- Create migration files
- Apply migrations to the database
- Generate Prisma Client

### Step 3: Seed Initial Data (Optional)
Populate the database with sample data:

```bash
npm run prisma:seed
```

This creates:
- 3 Roles (ADMIN, USER, MODERATOR)
- 3 Sample Users (admin, john, jane)
- 3 Sample Posts
- 2 Sample Comments

**Sample Credentials:**
- Email: `admin@trimate.com` | Password: `Admin@123`
- Email: `john@trimate.com` | Password: `Pass@123`
- Email: `jane@trimate.com` | Password: `Pass@123`

### Step 4: View Database (Optional)
Open Prisma Studio to visually manage your data:

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555`

---

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

Expected output:
```
🚀 Server running on port 5000
✅ Database connected successfully
📝 Environment: development
🌐 API URL: http://localhost:5000
```

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Health Check
```
GET /health
```

### User Endpoints

#### Register User
```
POST /users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Pass@123",
  "firstName": "John",
  "lastName": "Doe",
  "roleId": 2
}

Response (201):
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": { "id": 2, "name": "USER" }
  }
}
```

#### Login
```
POST /users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Pass@123"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": { "id": 2, "name": "USER" }
  }
}
```

#### Get All Users
```
GET /users?page=1&limit=10&search=john
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

#### Get User by ID
```
GET /users/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "role": {...},
    "profile": {...},
    "posts": [...]
  }
}
```

#### Update User
```
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1234567890"
}

Response (200):
{
  "success": true,
  "message": "User updated successfully",
  "data": {...}
}
```

#### Delete User
```
DELETE /users/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "User deleted successfully"
}
```

#### Change Password
```
PUT /users/:id/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass@123",
  "newPassword": "NewPass@123"
}

Response (200):
{
  "success": true,
  "message": "Password changed successfully"
}
```

### Post Endpoints

#### Create Post
```
POST /posts/user/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My First Post",
  "content": "This is the content of my post...",
  "excerpt": "Short excerpt",
  "published": true
}

Response (201):
{
  "success": true,
  "message": "Post created successfully",
  "data": {
    "id": 1,
    "title": "My First Post",
    "author": {...}
  }
}
```

#### Get All Posts
```
GET /posts?page=1&limit=10&published=true

Response (200):
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

#### Get Post by ID
```
GET /posts/:id

Response (200):
{
  "success": true,
  "data": {
    "id": 1,
    "title": "My First Post",
    "content": "...",
    "author": {...},
    "comments": [...]
  }
}
```

#### Update Post
```
PUT /posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "published": true
}

Response (200):
{
  "success": true,
  "message": "Post updated successfully",
  "data": {...}
}
```

#### Delete Post
```
DELETE /posts/:id
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Post deleted successfully"
}
```

#### Get User Posts
```
GET /posts/user/:userId?page=1&limit=10

Response (200):
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

---

## Testing

### Using Postman
1. Import the API endpoints to Postman
2. Use the health check endpoint first: `GET http://localhost:5000/api/health`
3. Register a new user
4. Use the token from login in the `Authorization: Bearer <token>` header
5. Test other endpoints

### Using cURL

#### Health Check
```bash
curl http://localhost:5000/api/health
```

#### Register User
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Pass@123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Pass@123"
  }'
```

---

## Best Practices

### 1. Security
- ✅ Always use HTTPS in production
- ✅ Store sensitive data in `.env` (never commit)
- ✅ Use strong JWT secrets (minimum 32 characters)
- ✅ Hash passwords with bcryptjs
- ✅ Validate all user inputs
- ✅ Use helmet for security headers
- ✅ Enable CORS only for trusted origins

### 2. Error Handling
- ✅ All errors are caught by error handler middleware
- ✅ Use consistent error response format
- ✅ Log errors appropriately
- ✅ Return meaningful error messages

### 3. Database
- ✅ Use Prisma transactions for multi-step operations
- ✅ Index frequently queried fields
- ✅ Use pagination for large datasets
- ✅ Soft delete for audit trails (optional)

### 4. Performance
- ✅ Use connection pooling (Prisma default)
- ✅ Implement caching for frequently accessed data
- ✅ Use pagination to limit results
- ✅ Select only needed fields in queries

### 5. Code Quality
- ✅ Use async/await for better readability
- ✅ Validate inputs before processing
- ✅ Use try-catch or asyncHandler
- ✅ Keep controllers lean (use services if needed)
- ✅ DRY principle - avoid code repetition

### 6. Environment Management
```env
# Development
NODE_ENV=development
JWT_SECRET=dev_secret_key

# Production (in .env.production)
NODE_ENV=production
JWT_SECRET=prod_secret_key_at_least_32_chars
```

---

## Troubleshooting

### Issue: "Cannot find module 'prisma'"
**Solution:**
```bash
npm install
npm run prisma:migrate
```

### Issue: "P1000: Can't reach database server"
**Solution:**
1. Verify PostgreSQL is running:
   - Windows: Open Services and check PostgreSQL
   - Mac: `brew services list` and start if needed
2. Check DATABASE_URL in `.env`
3. Verify credentials and database exists

### Issue: "Unexpected token 'export'"
**Solution:** The package.json needs `"type": "module"`. Already added, but if issue persists:
```bash
# Ensure this line is in package.json:
"type": "module"
```

### Issue: "Port 5000 already in use"
**Solution:**
- Change PORT in `.env` to another port (e.g., 5001)
- Or kill the process using port 5000:
  ```bash
  # Windows (PowerShell):
  Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
  ```

### Issue: "JWT token expired"
**Solution:** Login again to get a new token. Change JWT_EXPIRE in `.env` if needed.

### Issue: Cannot write to database
**Solution:**
1. Check user permissions: `ALTER DATABASE trimate_db OWNER TO postgres;`
2. Verify the migration folder permissions
3. Try reset (⚠️ deletes data): `npm run prisma:reset`

---

## File Structure Reference

```
Backend/
├── .env                          # Environment variables
├── server.js                     # Main Express application
├── package.json                  # Project dependencies & scripts
├── prisma/
│   ├── schema.prisma            # Database schema definition
│   ├── seed.js                  # Initial data seeding
│   └── migrations/              # Database migration history
├── src/
│   ├── config/
│   │   └── database.js          # Prisma client configuration
│   ├── controllers/
│   │   ├── userController.js    # User CRUD operations
│   │   └── postController.js    # Post CRUD operations
│   ├── middleware/
│   │   ├── errorHandler.js      # Error handling & async wrapper
│   │   └── validation.js        # Input validation
│   ├── routes/
│   │   ├── userRoutes.js        # User endpoints
│   │   └── postRoutes.js        # Post endpoints
│   └── utils/
│       └── helpers.js           # Utility functions
└── uploads/                      # File uploads directory
```

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env` with PostgreSQL credentials
3. ✅ Run migrations: `npm run prisma:migrate`
4. ✅ Seed data: `npm run prisma:seed`
5. ✅ Start server: `npm run dev`
6. ✅ Test endpoints with Postman or cURL

---

## Support & Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Introduction](https://jwt.io/introduction)
- [bcryptjs NPM](https://www.npmjs.com/package/bcryptjs)

---

**Last Updated:** December 7, 2024
**Version:** 1.0.0
