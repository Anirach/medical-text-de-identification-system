# Getting Started

This project consists of a NestJS backend and React frontend. Follow the steps below to get the app running locally.

## Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher
- **npm**: v9 or higher

## Running the Application

### 1. Install Dependencies

```bash
# Install all dependencies (root, backend, and frontend)
npm run install:all
```

### 2. Setup Environment

Create a `.env` file in the `backend` directory:

```bash
# Database connection
DATABASE_URL="postgresql://user:password@localhost:5432/deid_db?schema=public"

# Gemini API Key for LLM validation (optional)
GEMINI_API_KEY="your-gemini-api-key"

# Frontend URL for CORS
FRONTEND_URL="http://localhost:5173"

# Server port
PORT=4000
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 4. Start Development Servers

```bash
# Start both backend and frontend
npm run dev
```

Or run them separately:

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

## Building for Production

```bash
# Build both backend and frontend
npm run build

# Start production server
npm run start
```

## Database Commands

```bash
# Generate Prisma client after schema changes
npm run prisma:generate

# Create and apply a new migration
cd backend && npx prisma migrate dev --name your_migration_name

# Apply pending migrations in production
npm run prisma:migrate

# Open Prisma Studio (database GUI)
cd backend && npx prisma studio
```

## Project Structure

```
/
├── backend/              # NestJS backend
│   ├── src/              # Source code
│   ├── prisma/           # Database schema and migrations
│   └── package.json
├── frontend/             # React frontend
│   ├── components/       # UI components
│   ├── pages/            # Route pages
│   └── package.json
└── package.json          # Root package.json with workspace scripts
```

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
