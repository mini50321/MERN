# Mavy Backend API

Backend API for Mavy Healthcare Platform built with Node.js, Express, TypeScript, and MongoDB.

**Location:** This is the backend directory. The frontend is in the `../frontend/` directory.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
   - MongoDB connection string
   - JWT secret
   - API keys for external services

4. Run in development mode:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── config/       # Configuration files (database, etc.)
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Custom middleware
│   ├── models/       # MongoDB models
│   ├── routes/       # API routes
│   ├── utils/        # Utility functions
│   └── server.ts     # Entry point
├── dist/             # Compiled JavaScript (generated)
└── package.json
```

## API Endpoints

Health check: `GET /health`

More endpoints will be added as development progresses.

