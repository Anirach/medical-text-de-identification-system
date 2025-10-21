# Medical Text De-Identification System

A full-stack application for automatically detecting and anonymizing Protected Health Information (PHI) and Personally Identifiable Information (PII) in medical text.

## Overview

This system helps healthcare organizations and researchers comply with privacy regulations (HIPAA, GDPR) by automatically identifying and anonymizing sensitive information in medical documents and clinical notes.

## Features

- **Multiple Anonymization Methods**: Redact, mask, generalize, or pseudonymize sensitive data
- **Entity Detection**: Automatically detects persons, dates, locations, IDs, contact information, and organizations
- **Custom Mask Lists**: User-specific keyword lists for domain-specific terminology
- **Multi-language Support**: Automatic language detection
- **Batch Processing**: Process multiple documents simultaneously
- **User Authentication**: Secure access with Clerk authentication
- **Real-time Processing**: Instant de-identification with visual entity highlighting

## Tech Stack

### Backend
- **Encore.ts**: TypeScript backend framework
- **PostgreSQL**: Database for storing user mask lists
- **Clerk**: Authentication and user management

### Frontend
- **React**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Build tool
- **Tailwind CSS**: Styling
- **shadcn/ui**: Component library
- **React Router**: Client-side routing

## Prerequisites

- **Node.js**: v18 or higher
- **Encore CLI**: Install from [encore.dev](https://encore.dev)

## Installation

### 1. Install Encore CLI

```bash
# macOS
brew install encoredev/tap/encore

# Linux
curl -L https://encore.dev/install.sh | bash

# Windows
iwr https://encore.dev/install.ps1 | iex
```

### 2. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd medical-text-de-identification-system

# No npm install needed - dependencies are auto-installed by Encore
```

### 3. Configure Secrets

The application requires a Clerk secret key. Set it up through the Leap settings:

1. Open **Settings** in the Leap sidebar
2. Add the secret: `ClerkSecretKey`
3. Get your Clerk secret key from [Clerk Dashboard](https://dashboard.clerk.com)

### 4. Run the Application

```bash
# Start the development server
encore run
```

The application will be available at:
- Frontend: `http://localhost:4000`
- Backend API: `http://localhost:4000/api`

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

#### 1. Input Processing
- User submits medical text through the web interface
- Text can be processed individually or in batches

#### 2. Language Detection
- Automatically detects the language of the input text
- Ensures appropriate processing for different languages

#### 3. Entity Detection
The system uses two detection mechanisms:

**Regex Patterns** (`backend/deid/regex_patterns.ts`):
- Pattern-based detection for structured data (emails, phones, dates, IDs)
- Language-agnostic and highly accurate for formatted information

**Custom Mask List** (`backend/deid/mask_list.ts`):
- User-defined keywords stored in PostgreSQL
- Domain-specific terms (drug names, procedure names, etc.)
- Enables personalized detection beyond standard patterns

#### 4. Anonymization
- Entities are sorted in reverse order to preserve text positions
- Replacement strategy is applied based on selected method
- Pseudonymization maintains consistency across the same document

#### 5. Output
- De-identified text
- List of detected entities with positions and types
- Statistics showing entity counts by type

### Database Schema

```sql
mask_keywords
├── id (BIGSERIAL PRIMARY KEY)
├── user_id (TEXT) - Links to Clerk user
├── keyword (TEXT) - The term to detect
├── entity_type (TEXT) - Category (PERSON, LOCATION, etc.)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### API Endpoints

#### De-Identification
- `POST /process` - Process text and return de-identified version

#### Mask List Management
- `GET /mask-keywords` - List user's custom keywords
- `POST /mask-keywords` - Create new keyword
- `PUT /mask-keywords/:id` - Update existing keyword
- `DELETE /mask-keywords/:id` - Delete keyword

All endpoints require authentication via Clerk.

## Project Structure

```
/
├── backend/
│   ├── auth/                 # Clerk authentication handler
│   │   ├── auth.ts
│   │   └── encore.service.ts
│   ├── db/                   # Database configuration
│   │   ├── index.ts
│   │   └── migrations/
│   │       └── 001_create_tables.up.sql
│   └── deid/                 # De-identification service
│       ├── anonymize.ts      # Text anonymization logic
│       ├── encore.service.ts
│       ├── language_detection.ts
│       ├── mask_list.ts      # Custom keyword management
│       ├── process.ts        # Main processing endpoint
│       ├── process_with_llm.ts
│       ├── regex_patterns.ts # Pattern-based detection
│       ├── types.ts          # TypeScript interfaces
│       └── validate_entities.ts
└── frontend/
    ├── App.tsx               # Main app component
    ├── components/           # Reusable UI components
    │   ├── ConfigPanel.tsx
    │   ├── EntityDisplay.tsx
    │   ├── Footer.tsx
    │   ├── Header.tsx
    │   ├── Hero.tsx
    │   ├── MaskListManager.tsx
    │   └── TechStack.tsx
    ├── hooks/
    │   └── useBackend.ts
    └── pages/                # Route pages
        ├── Batch.tsx
        ├── DeIdentify.tsx
        └── Home.tsx
```

## Development

### Running Tests

```bash
encore test
```

### Building for Production

```bash
encore build
```

### Database Migrations

Migrations are automatically applied by Encore. New migrations should be added to:
```
backend/db/migrations/XXX_description.up.sql
```

## Example Usage

### Single Text Processing

```typescript
import backend from "~backend/client";

const result = await backend.deid.process({
  text: "Patient John Doe was admitted on 01/15/2024.",
  method: "mask",
  enabledEntityTypes: ["PERSON", "DATE"],
  customMaskList: []
});

// Result:
// {
//   deidentifiedText: "Patient [PERSON] was admitted on [DATE].",
//   entities: [
//     { type: "PERSON", text: "John Doe", start: 8, end: 16 },
//     { type: "DATE", text: "01/15/2024", start: 36, end: 46 }
//   ],
//   language: "en",
//   statistics: { totalEntities: 2, byType: { PERSON: 1, DATE: 1, ... } }
// }
```

### Custom Mask List

```typescript
// Add a custom keyword
await backend.deid.createMaskKeyword({
  keyword: "Metformin",
  entityType: "ORGANIZATION"
});

// Use in processing
const result = await backend.deid.process({
  text: "Patient prescribed Metformin 500mg.",
  method: "mask",
  enabledEntityTypes: ["ORGANIZATION"],
  customMaskList: [{ keyword: "Metformin", entityType: "ORGANIZATION" }]
});
```

## Security & Privacy

- All API endpoints require authentication
- User data is isolated by `user_id`
- Text processing happens server-side
- No medical text is stored permanently
- Clerk handles secure authentication

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `encore test`
4. Build: `encore build`
5. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions:
- GitHub Issues: [Repository Issues]
- Documentation: [Encore.ts Docs](https://encore.dev/docs)
- Clerk Docs: [Clerk Documentation](https://clerk.com/docs)
