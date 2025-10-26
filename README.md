# Fantasy Baseball Scorer

A full-stack TypeScript application for researching MLB players and building fantasy baseball lineups with custom scoring configurations.

## Tech Stack

### Backend
- **NestJS 10+** - TypeScript-first Node.js framework
- **Prisma ORM** - Type-safe database access
- **PostgreSQL 15+** - Primary database
- **JWT Authentication** - Access & refresh tokens
- **Swagger/OpenAPI** - API documentation

### Frontend
- **React 18+** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **React Router** - Client-side routing
- **Axios** - HTTP client with JWT interceptors

## Project Structure

```
fantasy-baseball-scorer/
├── backend/                 # NestJS backend application
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── common/         # Shared decorators, guards, filters
│   │   ├── modules/        # Feature modules
│   │   │   └── auth/       # Authentication module
│   │   ├── prisma/         # Prisma service
│   │   └── main.ts         # Application entry point
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── .env                # Environment variables
│
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── pages/          # Page components
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API services
│   │   └── App.tsx         # Main app component
│   └── .env                # Environment variables
│
├── specs/                   # Feature specifications
├── docker-compose.yml       # Docker services configuration
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js 20+ LTS
- Docker & Docker Compose (for database)
- npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fantasy-baseball-scorer
```

### 2. Start the Database

```bash
docker compose up -d postgres
```

This will start a PostgreSQL database on port 5432.

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Start the backend server
npm run start:dev
```

The backend will be available at:
- API: http://localhost:3000/api
- Swagger docs: http://localhost:3000/api/docs

### 4. Setup Frontend

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm start
```

The frontend will be available at http://localhost:3001

## Features Implemented

### ✅ Phase 1: Setup & Infrastructure
- NestJS backend project initialized
- React frontend project initialized
- Tailwind CSS configured
- Docker Compose setup for PostgreSQL & Redis
- Environment configuration

### ✅ Phase 2: Database Foundation
- Complete Prisma schema with 8 models:
  - User (authentication & profile)
  - ScoringConfiguration (custom scoring rules)
  - Player (MLB athletes)
  - PlayerStatistic (game & season stats)
  - Lineup (flexible research lineups)
  - LineupSlot (max 25 players, no position constraints)
  - AuditLog (security events)
  - RefreshToken (JWT rotation)

### ✅ Phase 3: Authentication
- User registration endpoint
- Login with JWT tokens
- Token refresh mechanism
- Password hashing with bcrypt (cost 12)
- Audit logging for security events
- Frontend registration page
- Frontend login page
- Protected home/dashboard page
- Axios interceptors for automatic token refresh

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)

Full API documentation available at http://localhost:3000/api/docs

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fantasy_baseball"
JWT_SECRET="your-secret-key-change-in-production"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
PORT=3000
NODE_ENV=development
CORS_ORIGINS="http://localhost:3001"
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3000/api
```

## Database Management

### Run Migrations
```bash
cd backend
npx prisma migrate dev
```

### Reset Database
```bash
cd backend
npx prisma migrate reset
```

### Open Prisma Studio (Database GUI)
```bash
cd backend
npx prisma studio
```

## Development Commands

### Backend
```bash
npm run start         # Start production server
npm run start:dev     # Start development server (watch mode)
npm run build         # Build for production
npm run test          # Run tests
npm run lint          # Run ESLint
```

### Frontend
```bash
npm start             # Start development server
npm run build         # Build for production
npm test              # Run tests
npm run lint          # Run ESLint
```

## Next Steps

The following features are planned but not yet implemented:

- **Scoring Configurations**: Create and manage custom scoring settings
- **Player Research**: Search MLB players with filters (team, position, etc.)
- **Player Data Sync**: Hourly MLB data updates via mlb-stats-api
- **Lineup Management**: Build flexible lineups (up to 25 players)
- **Score Calculation**: Calculate projected and actual scores
- **MFA**: Multi-factor authentication with TOTP
- **Email Verification**: Email confirmation for new accounts
- **Password Reset**: Secure password reset flow
- **Mobile Optimization**: Touch-friendly UI for mobile devices

## Project Specifications

Detailed specifications available in `specs/001-player-research-scoring/`:
- `spec.md` - Feature requirements and user stories
- `plan.md` - Technical architecture and decisions
- `data-model.md` - Database schema documentation
- `contracts/` - OpenAPI specifications for all endpoints
- `tasks.md` - Implementation task breakdown

## License

Private project - All rights reserved

## Support

For issues or questions, please create an issue in the GitHub repository.
