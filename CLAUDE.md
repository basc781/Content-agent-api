# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment Setup

To set up the project environment:

```bash
# Install dependencies
npm install

# Create necessary .env file with the following variables:
# DATABASE_URL=postgresql://username:password@localhost:5432/database_name
# OPENAI_API_KEY=your_openai_api_key
# GEMINI_API_KEY=your_gemini_api_key (optional)
# CLERK_SECRET_KEY=your_clerk_secret_key
# PORT=3000 (optional, defaults to 3000)
# R2_PUBLIC_URL=your_r2_public_url (for image storage)
# POSTGRES_USER=postgres
# POSTGRES_PASSWORD=your_password
# POSTGRES_DB=content-agent-db
# POSTGRES_HOST=localhost
# POSTGRES_PORT=5432
```

## Development Commands

```bash
# Start development server with hot-reload
npm run dev

# Build the project
npm run build

# Start production server
npm start

# Lint the code
npm run lint

# Fix linting issues
npm run lint:fix
```

## Docker and Database

You can use Docker to run a PostgreSQL database with pgvector:

```bash
# Start PostgreSQL with pgvector
docker-compose up -d
```

Ensure the pgvector extension is created in PostgreSQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Architecture Overview

### Core Components

1. **API Service**: Express-based REST API with TypeScript
2. **Authentication**: Uses Clerk for auth (can be bypassed in localhost environment)
3. **Database**: PostgreSQL with pgvector extension for vector-based similarity search
4. **AI Services**: Integration with OpenAI and Google Gemini for content generation

### Main Workflow

1. **Content Generation Pipeline**:
   - User submits form data for content generation
   - System routes the request to appropriate processors based on module type
   - Content is generated via AI services (primarily OpenAI)
   - Results are stored in the database and returned to the client

2. **Image Processing**:
   - Images can be uploaded, described, and embedded for vector search
   - Uses R2/S3 compatible storage for image files
   - Creates vector embeddings for similarity search

3. **Module System**:
   - Configurable content generation modules with organization-level access control
   - Each module has specific capabilities (web scraping, asset library, etc.)
   - Module-specific prompt templates customize AI behavior

### Key Files and Their Roles

- `src/index.ts`: Application entry point and server configuration
- `src/data-source.ts`: Database connection and entity configuration
- `src/controllers/`: Request handlers for different API endpoints
- `src/services/`: Business logic including AI generation services
- `src/processors/`: Pipeline processors for content generation
- `src/entities/`: TypeORM entity definitions for database tables
- `src/routes/`: API route definitions
- `src/middleware/`: Express middleware including authentication

### Notable Features

- **Vector Embeddings**: Used for semantic search of images and content
- **Content Calendar**: Manages content generation schedule
- **Organization Preferences**: Custom AI behavior per organization
- **Multi-Model Support**: Can use different AI models for different parts of the workflow
- **Translation Support**: Content can be automatically translated to multiple languages