# TypeScript JWT Authentication Integration Guide for ActiesSeoAPI

## Project Overview

This guide will help you integrate JWT authentication and role-based access control into your existing TypeScript Express project. The implementation is specifically tailored to your ActiesSeoAPI project structure and technology stack.

## Integration Steps

### 1. Install Required Dependencies

First, add the necessary packages to your project:

```bash
npm install jsonwebtoken bcrypt
npm install --save-dev @types/jsonwebtoken @types/bcrypt
```

### 2. Create User Entity

Create a User model in your entities folder:

```typescript
// src/entities/User.ts
export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'manager';
  created_at?: Date;
}

export interface UserDTO {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: Date;
}
```

### 3. Create User Table in MySQL

Run this SQL query to create the users table:

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin', 'manager') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Update Database Service for User Management

Extend your existing database service to handle user operations:

```typescript
// src/services/databaseService.ts
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { User, UserDTO } from '../entities/User';

// Assuming you already have a connection pool setup in your service
// Add these methods to your existing database service

export const userService = {
  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  // Find user by ID
  async findById(id: number): Promise<UserDTO | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
        [id]
      );
      
      const users = rows as UserDTO[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  },

  // Create new user
  async create(user: User): Promise<UserDTO> {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        [user.username, user.email, hashedPassword, user.role || 'user']
      );
      
      const insertResult = result as mysql.ResultSetHeader;
      
      return {
        id: insertResult.insertId,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        created_at: new Date()
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Verify password
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },
  
  // Get all users (for admin purposes)
  async getAllUsers(): Promise<UserDTO[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, email, role, created_at FROM users'
      );
      
      return rows as UserDTO[];
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }
};
```

### 5. Create Authentication Service

Create a new service for JWT creation and validation:

```typescript
// src/services/authService.ts
import jwt from 'jsonwebtoken';
import { UserDTO } from '../entities/User';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';

export const authService = {
  // Generate JWT token
  generateToken(user: UserDTO): string {
    return jwt.sign(
      { 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        } 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  },
  
  // Verify JWT token
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw error;
    }
  }
};
```

### 6. Create Authentication Middleware

Create middleware for JWT verification and role-based access control:

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
    }
  }
}

// Authentication middleware
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No valid token provided.'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = authService.verifyToken(token);
    
    // Add user data to request
    req.user = decoded.user;
    
    next();
  } catch (error: any) {
    console.error('Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    next();
  };
};
```

### 7. Create Auth Controller

Create a controller for authentication operations:

```typescript
// src/controllers/authController.ts
import { Request, Response } from 'express';
import { userService } from '../services/databaseService';
import { authService } from '../services/authService';
import { User } from '../entities/User';

export const authController = {
  // Register new user
  async register(req: Request, res: Response) {
    try {
      const { username, email, password, role } = req.body;
      
      // Check if user already exists
      const existingUser = await userService.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      // Create new user
      const newUser: User = {
        username,
        email,
        password,
        role: role || 'user'
      };
      
      const createdUser = await userService.create(newUser);
      
      // Generate JWT token
      const token = authService.generateToken(createdUser);
      
      // Return user data and token
      res.status(201).json({
        success: true,
        user: createdUser,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration'
      });
    }
  },
  
  // Login user
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await userService.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Verify password
      const isPasswordValid = await userService.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Create user DTO (without password)
      const userDTO = {
        id: user.id!,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at || new Date()
      };
      
      // Generate JWT token
      const token = authService.generateToken(userDTO);
      
      // Return user data and token
      res.json({
        success: true,
        user: userDTO,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login'
      });
    }
  },
  
  // Get current user
  async getCurrentUser(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }
      
      const user = await userService.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
};
```

### 8. Create Auth Routes

Set up the authentication routes:

```typescript
// src/routes/authRoutes.ts
import express from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Register endpoint
router.post('/register', authController.register);

// Login endpoint
router.post('/login', authController.login);

// Get current user (protected route)
router.get('/user', authenticate, authController.getCurrentUser);

export default router;
```

### 9. Update Main Routes File

Update your main routes file to include the new auth routes:

```typescript
// src/routes/index.ts
import express from 'express';
import authRoutes from './authRoutes';
// Import your existing routes

const router = express.Router();

// Auth routes
router.use('/auth', authRoutes);

// Your existing routes
// router.use('/content', contentRoutes);
// etc.

export default router;
```

### 10. Update Environment Variables

Add JWT configuration to your `.env` file:

```
# Add these to your existing .env file
JWT_SECRET=your_secure_secret_key_here
JWT_EXPIRES_IN=2h
```

### 11. Protecting Existing Routes

To protect your existing routes, update them to use the authenticate middleware:

```typescript
// Example of protecting an existing route in your content routes file
import { authenticate, authorize } from '../middleware/auth';

// Public route - no authentication needed
router.get('/public-endpoint', contentGeneratorController.getPublicContent);

// Protected route - requires authentication
router.get('/protected-endpoint', authenticate, contentGeneratorController.getProtectedContent);

// Admin-only route
router.post('/admin-endpoint', authenticate, authorize(['admin']), contentGeneratorController.adminFunction);
```

## Testing the Authentication

After implementing these changes, you can test your authentication system:

### Registration

```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "role": "user"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### Get Current User (Protected Route)

```http
GET /api/auth/user
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
