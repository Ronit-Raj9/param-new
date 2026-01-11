# PARAM — Academic Credential Management System

<div align="center">

![PARAM](frontend/public/college.jpg)

**Blockchain-Based Academic Credential Verification for ABV-IIITM Gwalior**

[![Next.js](https://img.shields.io/badge/Next.js-15.0.10-black?logo=next.js)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-green?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue?logo=postgresql)](https://postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://typescriptlang.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Base_Sepolia-purple?logo=ethereum)](https://base.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

[Features](#-features) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [User Guides](#-user-guides) • [API Reference](#-api-reference)

</div>

---

## 📋 Overview

**PARAM** (Portal for Academic Records and Management) is a comprehensive, blockchain-based academic credential management system designed for universities and educational institutions. Built for **ABV-Indian Institute of Information Technology and Management Gwalior**, PARAM enables tamper-proof issuance, verification, and sharing of academic credentials including semester results, transcripts, and degree certificates.

### Why PARAM?

- **Tamper-Proof**: Academic credentials are minted as NFTs on the blockchain, ensuring immutability
- **Instant Verification**: Employers and institutions can verify credentials in seconds using a public link
- **Zero Student Friction**: Students never need wallets or crypto knowledge — credentials are issued to institute-managed wallets
- **Audit Trail**: Every action is logged with immutable audit records for compliance
- **Multi-Level Approvals**: Configurable approval workflows ensure proper oversight before credential issuance

---

## ✨ Features

### 🎓 Academic Credential Management

| Feature | Description |
|---------|-------------|
| **Semester Results** | Upload, review, approve, and issue semester-wise academic transcripts |
| **Degree Certificates** | Multi-approval workflow for degree issuance with eligibility validation |
| **Curriculum Versioning** | Manage program curricula with version control (DRAFT → ACTIVE → ARCHIVED) |
| **Grade Management** | Configurable grading scales with automatic SGPA/CGPA calculation |

### ⛓️ Blockchain & NFT Credentials

| Feature | Description |
|---------|-------------|
| **ERC-721 Credentials** | Semester results and degrees minted as NFTs on Base Sepolia |
| **Document Hash Anchoring** | SHA-256 hash of PDF stored on-chain for integrity verification |
| **Credential Revocation** | Revoke credentials with reason; link to replacement credential |
| **Wallet Auto-Provisioning** | Privy-managed wallets created automatically for students |
| **Batch Minting** | Efficient bulk issuance with gas estimation |

### 👥 User Roles & Access Control

| Role | Capabilities |
|------|-------------|
| **ADMIN** | Full system access, credential issuance, system settings, user management |
| **ACADEMIC** | Upload students/results, manage curriculum, propose degrees, first-level approvals |
| **STUDENT** | View own results, download transcripts, share credentials, request corrections |
| **VERIFIER** | Public credential verification (no login required) |

### 🔄 Workflow & Approvals

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEMESTER RESULT WORKFLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   CSV Upload → DRAFT → REVIEWED → APPROVED → ISSUED (NFT)       │
│                   │         │          │                         │
│                   └─ Fix ───┴── Reject ┴── (Withheld)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DEGREE PROPOSAL WORKFLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Propose → PENDING_ACADEMIC → PENDING_ADMIN → APPROVED → ISSUED│
│                    │                 │              │            │
│                    └── Reject ───────┴── Reject ────┘            │
│                                                                  │
│   Credit Validation: Total credits ≥ required, No backlogs      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🔗 Public Verification

- **Shareable Links**: Time-limited verification URLs (7/30/90 days or custom)
- **QR Code Support**: Embed verification QR on PDF credentials
- **API Verification**: Machine-readable JSON endpoint for automated verification
- **Trust Indicators**: Shows blockchain transaction, IPFS CID, issuer information

### 📊 Additional Features

- **Bulk Operations**: CSV upload for students and results with streaming validation
- **PDF Generation**: Auto-generated transcripts with watermarks (DRAFT/APPROVED)
- **Audit Logs**: Complete trail of all actions with filters and export
- **Correction Requests**: Students can request grade corrections with approval workflow
- **Revaluation Support**: Versioned course results for grade changes

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PARAM ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        FRONTEND (Next.js 15)                         │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │   │
│  │  │  Admin   │ │ Academic │ │ Student  │ │ Verify   │ │  Auth    │  │   │
│  │  │Dashboard │ │  Portal  │ │  Portal  │ │  (Public)│ │ (Privy)  │  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    │ REST API + Bearer Token                 │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       BACKEND (Express.js 5)                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │                         API MODULES                              │ │   │
│  │  │  ┌──────┐ ┌──────┐ ┌───────┐ ┌────────┐ ┌────────┐ ┌───────┐  │ │   │
│  │  │  │ Auth │ │Users │ │Student│ │Results │ │Issuance│ │Verify │  │ │   │
│  │  │  └──────┘ └──────┘ └───────┘ └────────┘ └────────┘ └───────┘  │ │   │
│  │  │  ┌──────┐ ┌──────┐ ┌───────┐ ┌────────┐ ┌────────┐ ┌───────┐  │ │   │
│  │  │  │Degree│ │Curric│ │Approve│ │Credent.│ │ Audit  │ │Setting│  │ │   │
│  │  │  └──────┘ └──────┘ └───────┘ └────────┘ └────────┘ └───────┘  │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │                      BACKGROUND WORKERS (BullMQ)                │ │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │ │   │
│  │  │  │Blockchain│ │   CSV    │ │   PDF    │ │  Wallet  │          │ │   │
│  │  │  │  Worker  │ │  Worker  │ │  Worker  │ │  Worker  │          │ │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                      │                    │                                  │
│          ┌───────────┴───────────┐        │                                  │
│          ▼                       ▼        ▼                                  │
│  ┌───────────────┐      ┌───────────────┐ ┌────────────────┐                │
│  │  PostgreSQL   │      │    Redis      │ │    Privy       │                │
│  │  (Prisma ORM) │      │ (Queue/Cache) │ │ (Auth+Wallets) │                │
│  └───────────────┘      └───────────────┘ └────────────────┘                │
│                                                  │                           │
│                                                  ▼                           │
│                               ┌──────────────────────────────┐              │
│                               │    Ethereum (Base Sepolia)   │              │
│                               │  ┌──────────┐ ┌──────────┐   │              │
│                               │  │Semester  │ │ Degree   │   │              │
│                               │  │NFT (721) │ │NFT (721) │   │              │
│                               │  └──────────┘ └──────────┘   │              │
│                               └──────────────────────────────┘              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, TypeScript, TailwindCSS, shadcn/ui, TanStack Query |
| **Backend** | Express.js 5, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 15+ |
| **Queue** | Redis + BullMQ |
| **Authentication** | Privy (embedded wallets + social login) |
| **Blockchain** | Ethers.js 6, Base Sepolia (Chain ID: 84532) |
| **PDF** | Puppeteer |
| **Storage** | IPFS via Pinata |

---

## 📁 Project Structure

```
param/
├── backend/                          # Express.js API Server
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema (30+ models)
│   │   └── migrations/               # Database migrations
│   ├── scripts/
│   │   ├── seed.ts                   # Database seeding
│   │   └── verify-env.ts             # Environment validation
│   └── src/
│       ├── config/                   # Configuration
│       │   ├── env.ts                # Environment variables
│       │   ├── database.ts           # Prisma client
│       │   ├── redis.ts              # Redis connection
│       │   ├── privy.ts              # Privy client (auth + wallets)
│       │   └── blockchain.ts         # Ethers.js + contract config
│       ├── middleware/
│       │   ├── error.handler.ts      # Global error handling
│       │   ├── request.context.ts    # Privy token verification
│       │   └── role.guard.ts         # Role-based access control
│       ├── modules/                  # Feature modules
│       │   ├── auth/                 # Authentication (Privy)
│       │   ├── users/                # User management
│       │   ├── students/             # Student registry
│       │   ├── curriculum/           # Programs & courses
│       │   ├── results/              # Semester results
│       │   ├── approvals/            # Approval workflows
│       │   ├── degrees/              # Degree proposals
│       │   ├── credentials/          # Issued credentials
│       │   ├── issuance/             # Blockchain minting
│       │   ├── verification/         # Public verification
│       │   ├── audit/                # Audit logging
│       │   ├── dashboard/            # Dashboard aggregations
│       │   └── settings/             # System settings
│       ├── jobs/                     # Background workers
│       │   ├── blockchain/           # NFT minting worker
│       │   ├── csv/                  # CSV parsing worker
│       │   ├── pdf/                  # PDF generation worker
│       │   └── wallet/               # Wallet creation worker
│       ├── services/                 # Shared services
│       └── types/                    # TypeScript types
│
├── frontend/                         # Next.js Application
│   ├── app/
│   │   ├── (admin)/                  # Admin routes
│   │   │   └── admin/
│   │   │       ├── page.tsx          # Admin dashboard
│   │   │       ├── students/         # Student management
│   │   │       ├── results/          # Results upload & preview
│   │   │       ├── approve/          # Approval queue
│   │   │       ├── issuance/         # Credential issuance
│   │   │       ├── curriculum/       # Curriculum management
│   │   │       ├── logs/             # Audit logs
│   │   │       └── settings/         # System settings
│   │   ├── (auth)/                   # Auth routes
│   │   │   ├── login/                # Login page
│   │   │   └── activate/             # Account activation
│   │   ├── (student)/                # Student routes
│   │   │   └── student/
│   │   │       ├── page.tsx          # Student dashboard
│   │   │       ├── results/          # View results
│   │   │       ├── degree/           # View degree
│   │   │       └── share/            # Manage share links
│   │   ├── verify/[token]/           # Public verification
│   │   ├── docs/                     # Documentation
│   │   └── support/                  # Support page
│   ├── components/
│   │   ├── admin/                    # Admin-specific components
│   │   ├── auth/                     # Authentication components
│   │   ├── credentials/              # Credential display
│   │   ├── dashboard/                # Dashboard widgets
│   │   ├── forms/                    # Form components
│   │   ├── landing/                  # Landing page sections
│   │   ├── layout/                   # Navigation & layout
│   │   ├── modals/                   # Modal dialogs
│   │   ├── results/                  # Results display
│   │   ├── shared/                   # Shared components
│   │   ├── upload/                   # File upload components
│   │   └── ui/                       # shadcn/ui primitives
│   ├── hooks/                        # Custom React hooks
│   ├── lib/                          # Utilities & API client
│   ├── providers/                    # Context providers
│   └── types/                        # TypeScript types
│
└── README.md                         # This file
```

---

## 🗄️ Database Schema

### Entity Relationship Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATABASE SCHEMA                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────┐         ┌───────────┐         ┌───────────────────┐     │
│  │   User    │ 1:1     │  Student  │ N:1     │      Program      │     │
│  ├───────────┤────────▶├───────────┤────────▶├───────────────────┤     │
│  │ privyId   │         │ enrollment│         │ code              │     │
│  │ email     │         │ batch     │         │ name              │     │
│  │ role      │         │ cgpa      │         │ durationYears     │     │
│  │ status    │         │ wallet*   │         │ totalCredits      │     │
│  └───────────┘         └─────┬─────┘         └─────────┬─────────┘     │
│                              │                         │               │
│                              │ N:1                     │ 1:N           │
│                              ▼                         ▼               │
│  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐    │
│  │  SemesterResult   │ │    Curriculum     │ │CurriculumSemester │    │
│  ├───────────────────┤ ├───────────────────┤ ├───────────────────┤    │
│  │ semester          │ │ version           │ │ semesterNumber    │    │
│  │ sgpa/cgpa         │ │ batch             │ │ minCredits        │    │
│  │ status            │ │ status            │ │ maxCredits        │    │
│  │ documentHash      │ │ documentHash      │ └─────────┬─────────┘    │
│  └─────────┬─────────┘ └───────────────────┘           │ 1:N          │
│            │ 1:N                                       ▼              │
│            ▼                                  ┌───────────────────┐    │
│  ┌───────────────────┐                       │      Course       │    │
│  │   CourseResult    │                       ├───────────────────┤    │
│  ├───────────────────┤                       │ code              │    │
│  │ grade             │                       │ credits (L-T-P)   │    │
│  │ gradePoints       │                       │ type              │    │
│  │ earnedCredits     │                       └───────────────────┘    │
│  │ version           │                                                │
│  └───────────────────┘                                                │
│                                                                        │
│  ┌───────────────────┐         ┌───────────────────┐                  │
│  │    Credential     │◀────────│   DegreeProposal  │                  │
│  ├───────────────────┤         ├───────────────────┤                  │
│  │ type (SEM/DEGREE) │         │ status            │                  │
│  │ tokenId           │         │ totalCredits      │                  │
│  │ txHash            │         │ cgpa              │                  │
│  │ documentHash      │         │ hasBacklogs       │                  │
│  │ status            │         │ academicApproval  │                  │
│  └─────────┬─────────┘         │ adminApproval     │                  │
│            │ 1:N               └───────────────────┘                  │
│            ▼                                                          │
│  ┌───────────────────┐         ┌───────────────────┐                  │
│  │    ShareLink      │         │     AuditLog      │                  │
│  ├───────────────────┤         ├───────────────────┤                  │
│  │ token             │         │ action            │                  │
│  │ expiresAt         │         │ entityType/Id     │                  │
│  │ viewCount         │         │ metadata (JSON)   │                  │
│  └───────────────────┘         │ ipAddress         │                  │
│                                └───────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Core Models

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Authentication & access | `privyId`, `email`, `role`, `status` |
| **Student** | Academic records | `enrollmentNumber`, `batch`, `cgpa`, `walletAddress` |
| **Program** | Degree programs | `code`, `name`, `totalCredits`, `durationYears` |
| **Curriculum** | Program curriculum | `version`, `batch`, `status`, `documentHash` |
| **Course** | Individual courses | `code`, `credits`, `type`, `L-T-P hours` |
| **SemesterResult** | Semester grades | `semester`, `sgpa`, `cgpa`, `status` |
| **CourseResult** | Course grades | `grade`, `gradePoints`, `earnedCredits`, `version` |
| **Credential** | Blockchain credentials | `tokenId`, `txHash`, `documentHash`, `status` |
| **DegreeProposal** | Degree applications | `status`, `validationPassed`, approval fields |
| **ShareLink** | Verification links | `token`, `expiresAt`, `viewCount` |
| **AuditLog** | Audit trail | `action`, `entityType`, `metadata` |
| **Job** | Background jobs | `type`, `status`, `progress` |

### Status Enums

```typescript
// User lifecycle
UserStatus: PENDING_ACTIVATION → ACTIVE → SUSPENDED | DEACTIVATED

// Student lifecycle  
StudentStatus: PENDING_ACTIVATION → ACTIVE → GRADUATED | DROPPED_OUT | ...

// Result workflow
ResultStatus: DRAFT → REVIEWED → APPROVED → ISSUED | WITHHELD

// Curriculum lifecycle
CurriculumStatus: DRAFT → ACTIVE → ARCHIVED

// Credential states
CredentialStatus: PENDING → ISSUED → REVOKED | REPLACED

// Degree proposal workflow
DegreeProposalStatus: DRAFT → PENDING_ACADEMIC → PENDING_ADMIN → APPROVED → ISSUED | REJECTED
```

---

## 📄 Pages & Routes

### Public Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Hero section, features, verification demo |
| `/docs` | Documentation | How-to guides, CSV templates |
| `/support` | Support | Contact form, FAQ |
| `/verify/[token]` | Verification | Public credential verification |

### Authentication Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Privy login (email OTP, Google) |
| `/activate` | Activation | First-time account setup |
| `/reset-password` | Reset | Password reset flow |

### Admin Routes (`/admin/*`)

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard | Stats, pending actions, quick links |
| `/admin/users` | Users | Staff user management |
| `/admin/students` | Students | Student registry & search |
| `/admin/students/upload` | Upload | Bulk CSV student import |
| `/admin/results/upload` | Upload | CSV results upload |
| `/admin/results/preview` | Preview | Review draft results |
| `/admin/approve` | Approvals | Approval queue |
| `/admin/issuance` | Issuance | Mint credentials to blockchain |
| `/admin/curriculum` | Curriculum | Programs & courses |
| `/admin/logs` | Audit | Audit log viewer |
| `/admin/settings` | Settings | College & system config |

### Student Routes (`/student/*`)

| Route | Page | Description |
|-------|------|-------------|
| `/student` | Dashboard | Profile, CGPA, latest result |
| `/student/results` | Results | All semester results |
| `/student/degree` | Degree | Degree certificate |
| `/student/share` | Share | Manage share links |
| `/student/profile` | Profile | Personal settings |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 15+
- **Redis** 7+
- **pnpm** (recommended) or npm

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/iiitm-gwalior/param.git
cd param
```

#### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration

pnpm install
npx prisma generate
npx prisma migrate dev
pnpm run seed    # Optional: seed test data
pnpm run dev     # API server on port 4000
```

#### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local

pnpm install
pnpm run dev     # Next.js on port 3000
```

### Environment Variables

#### Backend (.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/param"
DIRECT_URL="postgresql://user:password@localhost:5432/param"

# Redis
REDIS_URL="redis://localhost:6379"

# Privy (https://dashboard.privy.io)
PRIVY_APP_ID="your-privy-app-id"
PRIVY_APP_SECRET="your-privy-app-secret"
PRIVY_VERIFICATION_KEY="your-privy-verification-key"

# Blockchain (Base Sepolia)
CHAIN_ID=84532
RPC_URL="https://sepolia.base.org"
MINTER_PRIVATE_KEY="0x..."  # Minting wallet private key
CONTRACT_SEMESTER_ADDRESS="0x..."
CONTRACT_DEGREE_ADDRESS="0x..."

# IPFS (Pinata)
PINATA_API_KEY="your-pinata-api-key"
PINATA_SECRET_KEY="your-pinata-secret-key"

# App
PORT=4000
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL="http://localhost:4000/api/v1"
NEXT_PUBLIC_PRIVY_APP_ID="your-privy-app-id"
NEXT_PUBLIC_CHAIN_ID=84532
```

### Docker Setup

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# With dev tools (pgAdmin, Redis Commander)
docker-compose --profile tools up -d
```

---

## 📖 User Guides

### 👨‍💼 Admin Workflow

#### 1. Initial Setup
1. Login at `/login` with admin credentials
2. Navigate to `/admin/settings` to configure:
   - College information (name, logo, contact)
   - Blockchain settings (chain ID, contract addresses)
   - Approval workflow settings

#### 2. Manage Curriculum
1. Go to `/admin/curriculum`
2. Create a **Program** (e.g., B.Tech CSE)
3. Create a **Curriculum Version** for the program
4. Add **Semesters** with credit limits
5. Add **Courses** to each semester (code, credits, L-T-P, type)
6. Set curriculum status to **ACTIVE**

#### 3. Upload Students
1. Navigate to `/admin/students/upload`
2. Download the CSV template
3. Fill in student data (enrollment, name, email, program, batch)
4. Upload and preview for validation errors
5. Process to create student records

#### 4. Upload Results
1. Go to `/admin/results/upload`
2. Select program, batch, semester, and academic year
3. Download the semester-specific CSV template
4. Fill in grades for each student and course
5. Upload and validate
6. Results are created in **DRAFT** status

#### 5. Review & Approve Results
1. Navigate to `/admin/results/preview`
2. Review individual student results
3. Make corrections if needed (creates new version)
4. Submit for review (status → **REVIEWED**)
5. Go to `/admin/approve`
6. Final approval (status → **APPROVED**)

#### 6. Issue Credentials
1. Go to `/admin/issuance`
2. Select credential type (Semester or Degree)
3. Filter by program, batch, semester
4. View gas estimation
5. Issue selected credentials to blockchain
6. Monitor job progress in real-time

#### 7. Manage Degrees
1. Navigate to `/admin/degrees` (via dashboard)
2. System auto-validates eligible students:
   - Total credits ≥ program requirement
   - No backlogs (F grades)
   - All semesters issued
3. Create degree proposals
4. Academic staff approves first
5. Admin gives final approval
6. Issue degree NFT

### 👩‍🎓 Student Workflow

1. **Activate Account**: Receive activation email → `/activate`
2. **View Dashboard**: `/student` shows CGPA, credits, latest result
3. **View Results**: `/student/results` — all semester grades with details
4. **View Degree**: `/student/degree` — degree status or certificate
5. **Share Credentials**: `/student/share` — create time-limited links
6. **Request Corrections**: Submit grade correction requests if needed

### 🔍 Public Verification

1. Receive share link (e.g., `https://param.iiitm.ac.in/verify/abc123`)
2. View verified credential with:
   - Student name & program
   - Semester/Degree details
   - SGPA/CGPA
   - Blockchain transaction proof
   - Issuer information
3. API verification: `GET /api/v1/verify?token=abc123`

---

## 🔌 API Reference

### Base URL
```
http://localhost:4000/api/v1
```

### Authentication
All authenticated endpoints require:
```
Authorization: Bearer <privy-access-token>
```

### Key Endpoints

#### Authentication
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/login` | Public | Authenticate with Privy token |
| GET | `/auth/me` | Auth | Get current user profile |
| POST | `/auth/logout` | Auth | Logout |

#### Students
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/students` | Admin/Academic | List students (paginated) |
| POST | `/students` | Admin/Academic | Create single student |
| POST | `/students/bulk` | Admin/Academic | Bulk import from CSV |
| GET | `/students/:id` | Admin/Academic | Get student details |
| GET | `/students/me` | Student | Get own profile |

#### Curriculum
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/curriculum/programs` | Auth | List programs |
| POST | `/curriculum/programs` | Academic | Create program |
| GET | `/curriculum` | Auth | List curricula |
| POST | `/curriculum` | Academic | Create curriculum |
| POST | `/curriculum/:id/courses` | Academic | Add course |

#### Results
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/results` | Admin/Academic | List all results |
| POST | `/results/bulk` | Admin/Academic | Bulk upload results |
| GET | `/results/me` | Student | Get own results |
| PATCH | `/results/:id/status` | Admin/Academic | Update result status |
| POST | `/results/me/correction` | Student | Request correction |

#### Credentials
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/credentials` | Admin/Academic | List credentials |
| GET | `/credentials/me` | Student | Get own credentials |
| POST | `/credentials/share` | Student | Create share link |
| DELETE | `/credentials/shares/:id` | Student | Revoke share link |

#### Issuance
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/issuance/eligible` | Admin/Academic | Get eligible students |
| POST | `/issuance/single` | Admin | Issue single credential |
| POST | `/issuance/bulk` | Admin | Bulk issue credentials |
| GET | `/issuance/estimate` | Admin/Academic | Estimate gas costs |

#### Verification (Public)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/verify/:token` | Public | Verify by share token |
| POST | `/verify/hash` | Public | Verify by document hash |
| POST | `/verify/token` | Public | Verify by NFT token ID |

#### Degrees
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/degrees` | Admin/Academic | List proposals |
| POST | `/degrees` | Admin/Academic | Create proposal |
| GET | `/degrees/eligibility/:studentId` | Admin/Academic | Check eligibility |
| PATCH | `/degrees/:id/academic` | Academic | Academic approval |
| PATCH | `/degrees/:id/admin` | Admin | Final approval |

#### Audit
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/audit` | Admin | Get audit logs |
| GET | `/audit/:entityType/:entityId` | Admin | Get entity history |

---

## 📊 Background Jobs

| Queue | Concurrency | Purpose |
|-------|-------------|---------|
| `blockchain` | 1 | NFT minting & revocation |
| `csv` | 2 | Bulk data parsing |
| `pdf` | 3 | Transcript generation |
| `wallet` | 5 | Privy wallet creation |

### Job Types
```typescript
CSV_PARSE_STUDENTS      // Import students from CSV
CSV_PARSE_RESULTS       // Import results from CSV
PDF_GENERATE_SEMESTER   // Generate semester transcript
PDF_GENERATE_DEGREE     // Generate degree certificate
BLOCKCHAIN_MINT_SEMESTER // Mint semester NFT
BLOCKCHAIN_MINT_DEGREE   // Mint degree NFT
BLOCKCHAIN_REVOKE       // Revoke credential
WALLET_CREATE           // Create student wallet
```

---

## 📄 CSV Templates

### Students Template
```csv
enrollment_number,name,personal_email,program_code,batch,admission_year,expected_grad_year
2024001,John Doe,john@email.com,BTECH_CSE,2024-2028,2024,2028
2024002,Jane Smith,jane@email.com,BTECH_CSE,2024-2028,2024,2028
```

### Results Template
```csv
enrollment_number,CS301,CS302,CS303,CS304,MA301
2024001,A+,A,B+,A,A+
2024002,A,B+,A+,B,A
```

---

## 🔐 Security

### Authentication & Authorization
- **Privy Integration**: Secure authentication via email OTP or social login
- **JWT Tokens**: Short-lived access tokens with automatic refresh
- **Role-Based Access**: Enforced at both API and UI levels
- **Request Context**: All requests carry user context for audit

### Blockchain Security
- **Institute Wallet**: Credentials minted from secure, institute-controlled wallet
- **Document Hashing**: SHA-256 hash anchored on-chain
- **Immutability**: Once minted, credentials cannot be altered (only revoked)
- **Revocation Trail**: Revoked credentials link to replacements

### Data Protection
- **Audit Logging**: Every action logged with actor, timestamp, IP
- **Soft Deletes**: Critical data archived, not deleted
- **Encrypted Connections**: TLS for all API communications
- **Input Validation**: Zod schemas for all API inputs

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pnpm run test           # Unit tests
pnpm run test:e2e       # Integration tests
pnpm run test:coverage  # Coverage report

# Frontend tests
cd frontend
pnpm run test           # Component tests
pnpm run test:e2e       # E2E tests with Playwright
```

---

## 🚢 Deployment

### Production Checklist
- [ ] Configure production database (managed PostgreSQL)
- [ ] Set up Redis cluster
- [ ] Configure Privy production app
- [ ] Deploy smart contracts to mainnet/production chain
- [ ] Set up IPFS pinning service (Pinata)
- [ ] Configure monitoring & alerting
- [ ] Enable SSL/TLS
- [ ] Set up backup jobs
- [ ] Configure CDN for frontend

### Recommended Infrastructure
- **API**: Docker container on Kubernetes/ECS
- **Database**: AWS RDS / Supabase / Neon
- **Redis**: AWS ElastiCache / Upstash
- **Frontend**: Vercel / Cloudflare Pages
- **Monitoring**: Datadog / Sentry

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

- **Email**: support@param.iiitm.ac.in
- **Documentation**: `/docs` in the application
- **Issues**: GitHub Issues

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ at ABV-IIITM Gwalior**

*Securing Academic Credentials on the Blockchain*

</div>
