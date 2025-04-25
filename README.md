# Content Agent API

A powerful API service for managing content generation, image processing, and vector-based search capabilities.

## Features

- Content generation using OpenAI's API
- Image processing and storage
- Vector-based similarity search using pgvector
- Authentication using Clerk
- Content calendar management
- Organization-specific module access control

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- pgvector extension installed in PostgreSQL
- OpenAI API key
- Clerk API credentials

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd Content-agent-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Clerk
CLERK_SECRET_KEY=your_clerk_secret_key

# Server
PORT=3000
```

4. Install pgvector extension in your PostgreSQL database:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Project Structure

```
src/
├── controllers/     # Request handlers
├── entities/        # TypeORM entities
├── middleware/      # Express middleware
├── migrations/      # Database migrations
├── routes/          # API routes
├── services/        # Business logic
├── types/          # TypeScript type definitions
├── data-source.ts  # Database configuration
└── index.ts        # Application entry point
```

## API Endpoints

### Content Calendar
- `POST /api/content-calendar` - Create a new content calendar
- `GET /api/content-calendar/:id` - Get content calendar by ID
- `PUT /api/content-calendar/:id` - Update content calendar
- `DELETE /api/content-calendar/:id` - Delete content calendar

### Images
- `POST /api/images` - Upload and process images
- `GET /api/images/:id` - Get image by ID
- `GET /api/images/search` - Search images using vector similarity

### Modules
- `GET /api/modules` - Get available modules
- `GET /api/modules/:id` - Get module by ID
- `POST /api/modules/access` - Grant module access to organization

## Development

1. Start the development server:
```bash
npm run dev
```

2. Run database migrations:
```bash
npm run typeorm migration:run
```

3. Generate new migration:
```bash
npm run typeorm migration:generate -- -n MigrationName
```

## Testing

Run the test suite:
```bash
npm test
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team. 