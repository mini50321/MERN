# Mavy Healthcare Platform

A full-stack healthcare platform connecting patients with healthcare services and professionals.

## Project Structure

```
.
├── frontend/          # React + Vite frontend application
│   ├── src/          # Frontend source code
│   ├── package.json  # Frontend dependencies
│   └── vite.config.ts
│
├── backend/          # Node.js + Express backend API
│   ├── src/          # Backend source code
│   ├── package.json  # Backend dependencies
│   └── tsconfig.json
│
└── migrations/       # Database migration files (legacy)
```

## Quick Start

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Backend Development

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:3000`

## Technology Stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router

### Backend
- Node.js
- Express
- TypeScript
- MongoDB (Mongoose)
- JWT Authentication

## Development Workflow

1. Start backend server: `cd backend && npm run dev`
2. Start frontend dev server: `cd frontend && npm run dev`
3. Frontend connects to backend API at `http://localhost:3000`

## Environment Variables

### Backend (.env)
See `backend/.env.example` for required variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Backend server port (default: 3000)

### Frontend
Frontend uses environment variables via Vite. See `frontend/.env.example` (if exists).

## Deployment

### Backend
- Deploy to Hostinger or any Node.js hosting
- Set environment variables in production
- Run `npm run build && npm start`

### Frontend
- Build: `npm run build`
- Deploy `dist/` folder to static hosting

## Notes

- This project is being migrated from Cloudflare Workers to Node.js + Express
- Old Cloudflare worker code is in `frontend/src/worker/` (legacy)
- Database migrations in `migrations/` are for the old Cloudflare D1 setup
