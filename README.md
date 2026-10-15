# SupportIQ — Production-Ready Customer Support Desk & Knowledge Platform

SupportIQ is an enterprise-grade customer support desk and knowledge management platform designed for SaaS organizations. It bridges customer inquiry management, support agent triage workflows, staff collaboration with private internal notes, server-enforced role-based access control (RBAC), secure authentication, and real-time MongoDB database persistence into an intuitive single-page application.

---

## 🌟 Architecture & Technology Stack

### Frontend Architecture
- **Framework**: React 18 with Vite
- **Language**: JavaScript (ES Modules)
- **Routing**: React Router DOM v6 with route-level security guards (`ProtectedRoute`)
- **Styling**: Tailwind CSS with modern design system (Plus Jakarta Sans & Inter)
- **Icons**: Lucide React
- **Client Networking**: Native `fetch` API client (`src/services/apiClient.js`) with `credentials: 'include'` for secure HttpOnly cookie sessions

### Backend Architecture
- **Server Framework**: Node.js & Express 5 (ES Modules)
- **Database**: MongoDB via Mongoose 9 ODM
- **Embedded Database Fallback**: Embedded `mongodb-memory-server` in development/testing mode when an external MongoDB connection is not supplied
- **Authentication**: JWT stored in secure `HttpOnly`, `SameSite`, and `Secure` cookies (or `Authorization: Bearer <token>` headers)
- **Password Security**: Salted password hashing via `bcryptjs` (work factor 10, never stored or returned in plaintext)
- **Security Hardening**:
  - `helmet`: Secure HTTP headers
  - `cors`: Strict origin validation with credential support
  - `express-rate-limit`: Rate limiters on login, registration, and general API endpoints
  - Request body payload limits (1MB maximum)
  - Centralized error handler preventing credential or stack trace leakage in production
  - Server-side parameter validation and mass-assignment prevention

---

## 📦 Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB** (optional in development, required in production): MongoDB v6.0+ local server or MongoDB Atlas cluster. In development, SupportIQ automatically initializes an embedded memory database if `MONGODB_URI` is not configured.

---

## 🚀 Quick Start & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Configure your environment variables in `.env` (refer to the [Environment Variables](#-environment-variables) section).

### 3. Start Backend Server
```bash
npm run server
```
The server will start on `http://localhost:5000` (or the configured `PORT`). In development, it automatically connects to MongoDB (or launches the embedded memory server) and seeds initial demo data if the database is empty.

### 4. Start Frontend Client (in a separate terminal)
```bash
npm run dev
```
Open your browser to: **`http://localhost:3000`** (or `http://localhost:5173`).

---

## 🔐 Authentication, Session Lifecycle & Role-Based Access Control (RBAC)

SupportIQ implements strict three-tier server-side authorization. Permissions are enforced on every database query and API controller, not just in UI view components.

| Role | Permissions & Boundaries |
| :--- | :--- |
| **Admin** | Full system administration. Manage company users (`/users`), assign roles, create staff accounts, access and manage all company tickets, reassign agents, adjust ticket priorities/categories, create/edit/publish/archive knowledge-base articles, and view system-wide dashboard metrics. |
| **Agent** | Triage and support execution. View company tickets, post public customer replies, post **private staff-only internal notes**, adjust ticket statuses and priorities, reassign tickets, view published & draft articles, and view agent dashboard analytics. Blocked from user management and administrative controls. |
| **Customer** | End-user support. Create support tickets, view **only tickets belonging to their authenticated account**, read public messages, post replies to their own tickets, and read published knowledge-base articles. **Strict Isolation**: Customers can NEVER view internal staff notes, other customers' tickets, administrative consoles, or company analytics. |

### Core Security Invariants
1. **Zero Internal Note Leakage**: Internal staff notes are stored with `visibility: 'internal'`. When a customer queries ticket messages, the database query filter unconditionally enforces `{ visibility: 'public' }`. Internal notes are physically omitted at the database layer and never transmitted over the network to customers.
2. **Customer Ticket Isolation**: Customer ticket queries are scoped to `{ customer: req.user._id }`. Attempts to access tickets belonging to other customer accounts return `403 Forbidden`.
3. **Privilege Escalation Protection**: Public self-registration (`/api/auth/register`) strictly sets `role: 'Customer'`. Any incoming `role` field in the request body is discarded. Only authenticated Administrators can provision staff accounts (`Admin` or `Agent`).
4. **Genuine Logout**: The `/api/auth/logout` endpoint clears the HttpOnly authentication cookie, invalidates the session, resets frontend authentication state, and redirects the user to `/login`. Logged-out users are never silently switched into a guest session.

---

## 🔑 Initial Administrator Setup (Bootstrap)

In production, default admin accounts must never be exposed publicly. SupportIQ provides an explicit bootstrap script requiring credentials:

```bash
# Using CLI arguments:
node server/scripts/setupAdmin.js "Initial Admin" "admin@yourcompany.com" "StrongPassword123!"

# Or using environment variables:
ADMIN_NAME="Initial Admin" ADMIN_EMAIL="admin@yourcompany.com" ADMIN_PASSWORD="StrongPassword123!" npm run setup-admin
```

Alternatively, if no administrator account exists in the database, the initial admin can be provisioned via API:
```bash
curl -X POST http://localhost:5000/api/auth/bootstrap-admin \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-secret: your_configured_bootstrap_secret" \
  -d '{"name":"System Admin","email":"admin@yourcompany.com","password":"StrongPassword123!"}'
```

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `5000` | HTTP port for the Express backend server |
| `NODE_ENV` | Optional | `development` | Runtime environment (`development`, `production`, `test`) |
| `MONGODB_URI` | Production | *Embedded memory server in dev* | MongoDB connection string (e.g., `mongodb+srv://...` or `mongodb://localhost:27017/supportiq`) |
| `JWT_SECRET` | **Required in Prod** | *Development fallback* | Cryptographically random secret key (min 32 characters) for signing session JWTs |
| `JWT_EXPIRES_IN` | Optional | `7d` | Lifetime of authentication sessions (e.g., `7d`, `24h`) |
| `CLIENT_URL` | Optional | `http://localhost:3000` | Frontend application URL for CORS headers |
| `BOOTSTRAP_SECRET`| Optional | — | Secret token required to run administrator bootstrap when accounts exist |
| `ADMIN_NAME` | Optional | `System Administrator` | Name for initial admin bootstrap |
| `ADMIN_EMAIL` | Optional | `admin@supportiq.io` | Email for initial admin bootstrap |
| `ADMIN_PASSWORD` | Optional | — | Password for initial admin bootstrap (min 8 characters) |
| `GEMINI_API_KEY` | Optional | — | API key for Gemini Cloud AI. If omitted, SupportIQ uses its local heuristic rule engine |

---

## 🧪 Testing & Verification

SupportIQ includes comprehensive unit and integration test suites covering authentication, database persistence, RBAC enforcement, ticket workflows, customer privacy, and AI assistance.

### Run Core Service Unit Tests
```bash
npm test
```
*Executes the 54-assertion unit test suite verifying data transformations, calculations, and RBAC rules.*

### Run Backend Integration & Security Tests
```bash
npm run test:integration
```
*Spins up an isolated server and database instance, executing 58 automated integration tests verifying:*
- Health check sanitization (no secret leakage)
- Authentication and password hashing
- Customer self-registration privilege escalation blocking
- Cross-customer ticket access prevention (HTTP 403)
- **Zero-leakage internal note isolation at the database query layer**
- Customer attempt to post internal notes blocked (HTTP 403)
- Ticket lifecycle transitions (Open → Waiting for Customer → In Progress → Resolved)
- Knowledge base article CRUD, slug uniqueness, and voting anti-abuse
- Live MongoDB analytics aggregation
- Admin user provisioning and self-deletion prevention
- Genuine logout and session invalidation (HTTP 401 on subsequent requests)

---

## 🏗️ Production Build & Deployment

### Build the Frontend
```bash
npm run build
```
Builds optimized production assets to the `dist/` directory using Vite.

### Production Execution
1. Set `NODE_ENV=production` in your environment.
2. Configure your production `MONGODB_URI` and strong `JWT_SECRET`.
3. Start the production backend server:
```bash
npm start
```
4. Serve the static frontend assets from `dist/` using a reverse proxy (e.g., Nginx, Caddy, Cloudflare Pages, AWS CloudFront/S3) or configure Express to serve the static bundle.

### Health Check Endpoint
A sanitized health check endpoint is available at `/api/health`:
```bash
curl http://localhost:5000/api/health
```
Response:
```json
{
  "status": "ok",
  "service": "supportiq-api",
  "database": "connected",
  "isMemoryServer": false,
  "uptime": 3600,
  "timestamp": "2026-10-15T22:00:00.000Z"
}
```

---

## 💾 Database Backup & Restoration

### Backup Procedures (MongoDB `mongodump`)
```bash
# Backup entire database to archive
mongodump --uri="mongodb://localhost:27017/supportiq" --archive="supportiq_backup_$(date +%Y%m%d).gz" --gzip
```

### Restoration Procedures (MongoDB `mongorestore`)
```bash
# Restore database from archive
mongorestore --uri="mongodb://localhost:27017/supportiq" --archive="supportiq_backup_20261015.gz" --gzip --drop
```

---

## 🤖 AI Assistant: Architecture & Configuration

SupportIQ features an AI triage and draft assistant designed with strict privacy and security guardrails:
1. **Honest Labeling**: When no external AI provider API key is configured, all suggestions are transparently labeled as **Rule-Based Suggestions** (`SupportIQ Heuristic Rule Engine`).
2. **Untrusted Suggestions**: All generated summaries, categories, priorities, and drafts are marked as advisory recommendations requiring human review. The assistant is strictly decoupled from permissions and cannot execute privileged actions or alter access controls automatically.
3. **Data Minimization**: When forwarding requests to external AI providers, customer PII and internal staff notes are excluded.
4. **Enabling External AI**: To connect real cloud AI, supply `GEMINI_API_KEY=your_key_here` in `.env`.

---

## 📋 Client Handover Checklist

- [x] Full-stack architecture implemented with Node.js, Express, MongoDB, and Mongoose.
- [x] Browser `localStorage` replaced with persistent MongoDB database storage.
- [x] Demo-only auth replaced with real salted password hashing (`bcryptjs`) and secure session cookies.
- [x] Genuine logout implemented with cookie invalidation and redirect to login.
- [x] Route-level authorization guards added (`ProtectedRoute`).
- [x] Server-side RBAC enforced across all API endpoints (Admin, Agent, Customer).
- [x] Cross-customer ticket isolation verified.
- [x] Internal staff notes strictly hidden from customers at the database query level.
- [x] Ticket lifecycle, auto-transitions, and sequential ID generation (`TK-1001`...) functional.
- [x] Real-time database analytics aggregation implemented.
- [x] Knowledge base article CRUD, slug uniqueness, and voting anti-abuse verified.
- [x] Rate limiting, Helmet security headers, and request body size limits configured.
- [x] Sanitized `/api/health` check endpoint implemented.
- [x] Initial admin bootstrap script and setup documented.
- [x] 112 automated unit and integration tests passing with 0 failures.
- [x] Production build passes cleanly with zero lint or compilation errors.
