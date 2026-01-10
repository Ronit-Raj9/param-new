# PARAM Backend

TypeScript backend for the PARAM Academic Portal - IIITM Gwalior's blockchain-based credential management system.

## Tech Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with BullMQ
- **Authentication**: Privy (embedded wallets + account abstraction)
- **Blockchain**: Ethers.js for NFT credential minting
- **PDF Generation**: Puppeteer
- **Storage**: IPFS via Pinata

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your configuration

# Verify environment
npm run verify-env

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npm run seed

# Start development server
npm run dev
```

### Docker Setup

```bash
# Start all services (API, Worker, PostgreSQL, Redis)
docker-compose up -d

# View logs
docker-compose logs -f api

# Run with development tools (pgAdmin, Redis Commander)
docker-compose --profile tools up -d
```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration files
├── scripts/
│   ├── seed.ts            # Database seeding
│   └── verify-env.ts      # Environment verification
├── src/
│   ├── config/            # Configuration files
│   │   ├── env.ts         # Environment validation
│   │   ├── database.ts    # Prisma client
│   │   ├── redis.ts       # Redis connection
│   │   ├── privy.ts       # Privy client
│   │   └── blockchain.ts  # Blockchain config
│   ├── middleware/        # Express middleware
│   │   ├── error.handler.ts
│   │   ├── request.context.ts
│   │   └── role.guard.ts
│   ├── modules/           # Feature modules
│   │   ├── auth/          # Privy authentication
│   │   ├── users/         # User management
│   │   ├── students/      # Student management
│   │   ├── curriculum/    # Programs & courses
│   │   ├── results/       # Semester results
│   │   ├── approvals/     # Multi-level approvals
│   │   ├── degrees/       # Degree proposals
│   │   ├── credentials/   # Transcripts & certificates
│   │   ├── verification/  # Public verification
│   │   └── audit/         # Audit logging
│   ├── services/          # Shared services
│   │   ├── pdf.service.ts
│   │   ├── csv.service.ts
│   │   ├── blockchain.service.ts
│   │   ├── ipfs.service.ts
│   │   └── privy.service.ts
│   ├── queues/            # BullMQ queue definitions
│   ├── jobs/              # Background job processors
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   ├── app.ts             # Express app setup
│   ├── routes.ts          # Route aggregator
│   ├── server.ts          # Server entry point
│   └── worker.ts          # Worker entry point
├── tests/
│   ├── unit/
│   └── integration/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with Privy token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/wallet` - Link wallet to account
- `POST /api/auth/register` - Pre-register user (admin only)

### Users
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `POST /api/students/bulk` - Bulk import students

### Curriculum
- `GET /api/curriculum/programs` - List programs
- `POST /api/curriculum/programs` - Create program
- `GET /api/curriculum/curriculums` - List curriculums
- `POST /api/curriculum/curriculums` - Create curriculum
- `POST /api/curriculum/courses` - Add course to semester

### Results
- `GET /api/results` - List semester results
- `POST /api/results` - Create semester result
- `POST /api/results/bulk` - Bulk upload results
- `POST /api/results/:id/submit` - Submit for approval
- `POST /api/results/corrections` - Request correction

### Approvals
- `GET /api/approvals` - List approvals
- `POST /api/approvals/:id/approve` - Approve
- `POST /api/approvals/:id/reject` - Reject

### Degrees
- `GET /api/degrees/proposals` - List degree proposals
- `POST /api/degrees/proposals` - Create proposal
- `GET /api/degrees/eligibility/:studentId` - Check eligibility

### Credentials
- `GET /api/credentials` - List credentials
- `POST /api/credentials` - Create credential
- `POST /api/credentials/:id/mint` - Queue for minting
- `POST /api/credentials/:id/share` - Create share link
- `GET /api/credentials/:id/download` - Download PDF

### Public Verification
- `GET /api/verify/token/:token` - Verify by token
- `GET /api/verify/hash/:hash` - Verify by hash
- `GET /api/verify/nft/:tokenId` - Verify NFT on-chain

### Audit
- `GET /api/audit/logs` - List audit logs (admin only)

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/param_db

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-secret-key

# Privy
PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-app-secret

# Blockchain
BLOCKCHAIN_RPC_URL=https://your-rpc-url
BLOCKCHAIN_PRIVATE_KEY=your-wallet-private-key
BLOCKCHAIN_CHAIN_ID=11155111
NFT_CONTRACT_ADDRESS=0x...

# IPFS/Pinata
PINATA_JWT=your-pinata-jwt
PINATA_GATEWAY=https://your-gateway.mypinata.cloud

# CORS
FRONTEND_URL=http://localhost:3001
```

## Scripts

```bash
# Development
npm run dev           # Start dev server with hot reload
npm run worker:dev    # Start worker with hot reload

# Build
npm run build         # Compile TypeScript
npm start             # Run production server
npm run worker        # Run production worker

# Database
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations (dev)
npm run db:push       # Push schema changes
npm run seed          # Seed database

# Utilities
npm run verify-env    # Verify environment variables
npm run lint          # Run ESLint
npm run lint:fix      # Fix lint errors
npm test              # Run tests
```

## Authentication Flow

1. **Login**: User authenticates with Privy on frontend
2. **Token Exchange**: Frontend sends Privy token to `/api/auth/login`
3. **User Creation**: Backend verifies token and creates/updates user
4. **Session**: JWT returned for subsequent requests
5. **Wallet Link**: When degree is approved, backend creates embedded wallet via Privy

## Approval Workflow

1. **Result Upload**: Academic staff uploads semester results
2. **Multi-level Approval**: Results go through configured approval levels
3. **Degree Proposal**: After 8 semesters, degree proposal is created
4. **Credential Minting**: After all approvals, credential is minted as NFT

## License

Proprietary - IIITM Gwalior
