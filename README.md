# Medical Text De-Identification System

A full-stack application for automatically detecting and anonymizing Protected Health Information (PHI) and Personally Identifiable Information (PII) in medical text.

## Overview

This system helps healthcare organizations and researchers comply with privacy regulations (HIPAA, GDPR) by automatically identifying and anonymizing sensitive information in medical documents and clinical notes.

## Features

- **Multiple Anonymization Methods**: Redact, mask, generalize, or pseudonymize sensitive data
- **Entity Detection**: Automatically detects persons, dates, locations, IDs, contact information, and organizations
- **Custom Mask Lists**: User-specific keyword lists for domain-specific terminology
- **Multi-language Support**: Automatic language detection (Thai/English)
- **Batch Processing**: Process multiple documents simultaneously
- **User Authentication**: Secure access with session-based authentication
- **Real-time Processing**: Instant de-identification with visual entity highlighting

## Tech Stack

### Backend
- **NestJS**: TypeScript backend framework
- **Prisma**: Database ORM
- **PostgreSQL**: Database for storing users and mask lists

### Frontend
- **React**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library
- **React Router**: Client-side routing

## Prerequisites

- **Node.js**: v18 or higher
- **PostgreSQL**: v14 or higher

## Installation

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd medical-text-de-identification-system

# Install all dependencies
npm run install:all
```

### 2. Configure Environment

Create a `.env` file in the `backend` directory:

```bash
# Database
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

# Run migrations
npm run prisma:migrate
```

### 4. Run the Application

```bash
# Start both backend and frontend in development mode
npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:4000`

## Core Concepts

### Entity Types

The system detects six types of sensitive entities:

1. **PERSON**: Names of patients, doctors, family members
2. **DATE**: Birth dates, admission dates, treatment dates
3. **LOCATION**: Addresses, cities, hospital names
4. **ID**: Medical record numbers, SSNs, insurance IDs
5. **CONTACT**: Phone numbers, email addresses, fax numbers
6. **ORGANIZATION**: Healthcare providers, insurance companies

### Anonymization Methods

1. **Redact**: Replace all entities with `[REDACTED]`
2. **Mask**: Replace with entity type, e.g., `[PERSON]`, `[DATE]`
3. **Generalize**: Similar to mask, replaces with general category
4. **Pseudonymize**: Replace with consistent pseudonyms, e.g., `[PERSON_abc123]`

### Workflow

```
Input Text → Language Detection → Entity Detection → Anonymization → Output
                                         ↓
                                  Regex Patterns
                                         +
                                  Custom Mask List
```

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### De-Identification
- `POST /process` - Process text and return de-identified version
- `POST /process-with-llm` - Process with LLM validation (requires GEMINI_API_KEY)
- `POST /validate-entities` - Validate entities using LLM

### Mask List Management
- `GET /mask-keywords` - List user's custom keywords
- `POST /mask-keywords` - Create new keyword
- `PUT /mask-keywords/:id` - Update existing keyword
- `DELETE /mask-keywords/:id` - Delete keyword

## Project Structure

```
/
├── backend/
│   ├── src/
│   │   ├── main.ts              # Application entry point
│   │   ├── app.module.ts        # Root module
│   │   ├── auth/                # Authentication module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.guard.ts
│   │   ├── deid/                # De-identification module
│   │   │   ├── deid.module.ts
│   │   │   ├── deid.controller.ts
│   │   │   ├── deid.service.ts
│   │   │   ├── types.ts
│   │   │   ├── anonymize.ts
│   │   │   ├── regex_patterns.ts
│   │   │   ├── language_detection.ts
│   │   │   └── entity_filters.ts
│   │   └── prisma/              # Database module
│   │       ├── prisma.module.ts
│   │       └── prisma.service.ts
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   └── package.json
└── frontend/
    ├── App.tsx                  # Main app component
    ├── client.ts                # API client
    ├── components/              # Reusable UI components
    ├── contexts/                # React contexts
    ├── hooks/                   # Custom hooks
    ├── pages/                   # Route pages
    └── package.json
```

## Development

### Running in Development Mode

```bash
# Start both backend and frontend
npm run dev

# Or run separately
npm run dev:backend
npm run dev:frontend
```

### Building for Production

```bash
# Build both backend and frontend
npm run build

# Start production server
npm run start
```

### Database Migrations

```bash
# Create a new migration
cd backend && npx prisma migrate dev --name migration_name

# Apply migrations
npm run prisma:migrate
```

## Example Usage

### Single Text Processing

```typescript
const result = await fetch('/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Patient John Doe was admitted on 01/15/2024.",
    method: "mask",
    enabledEntityTypes: ["PERSON", "DATE"],
    customMaskList: []
  })
});

// Result:
// {
//   deidentifiedText: "Patient [PERSON] was admitted on [DATE].",
//   entities: [
//     { type: "PERSON", text: "John Doe", start: 8, end: 16 },
//     { type: "DATE", text: "01/15/2024", start: 36, end: 46 }
//   ],
//   language: "English",
//   statistics: { totalEntities: 2, byType: { PERSON: 1, DATE: 1, ... } }
// }
```

## Security & Privacy

- All API endpoints require authentication (except /process for demo)
- User data is isolated by user_id
- Text processing happens server-side
- No medical text is stored permanently
- Session-based authentication with secure cookies

## License

MIT License

## Support

For issues and questions:
- GitHub Issues: [Repository Issues]
- NestJS Docs: [NestJS Documentation](https://docs.nestjs.com)
- Prisma Docs: [Prisma Documentation](https://www.prisma.io/docs)
