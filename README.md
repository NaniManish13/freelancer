# FreelanceFlow — SaaS Project Management & Invoicing Platform

**FreelanceFlow** is a modern SaaS platform purpose-built for independent contractors, freelancers, and agile studios. It seamlessly unifies client relationship management, budget-tracked projects, kanban task sprints, live stopwatch time-tracking, and automated PDF invoice generation with automated time-log reconciliation.

---

## 🌟 Key Features

1. **Strict Multi-Tenant Architecture**
   - User resource isolation: Every database model and service verifies tenant ownership against `req.user.id`.
   - Free vs. Pro tier enforcement (Free tier capped at 2 clients; Pro tier unlocks unlimited clients and instant PDF rendering).

2. **Project & Budget Burn-Rate Analytics**
   - Real-time spend tracking computed on the backend from billable time logs.
   - Dynamic budget usage indicators and progress percentages.

3. **Kanban Sprint Task Boards**
   - Drag-and-drop / click status transitions (`TODO`, `IN_PROGRESS`, `DONE`).
   - Priority tagging (`LOW`, `MEDIUM`, `HIGH`) and deadline alerts.

4. **Live Stopwatch & Persistent Time Tracking**
   - Global persistent timer header running continuously across navigation.
   - Calculates exact logged amounts based on project hourly rates.
   - Unbilled vs. Billed time tracking with instant filtering.

5. **Automated Invoicing Engine & Puppeteer PDF Exports**
   - Generates sequential invoice numbering (`FF-YYYY-00000X`).
   - 1-Click invoice generation from unbilled time logs, automatically marking attached logs as billed.
   - High-fidelity PDF exports with clean print CSS and HTML preview fallbacks.

6. **Interactive Dashboard & Revenue Charts**
   - Monthly revenue bar charts and invoice status breakdowns using Recharts.
   - 1-Click Realistic Demo Data generation directly from the Settings page.

---

## 🏗️ Architecture

```
Client (React 19 + Tailwind CSS + Lucide)
   │
   ▼ HTTP / REST API (JWT Bearer Auth)
Express Server (Port 3000)
   ├── Middleware (Helmet, CORS, Rate Limit, Auth, Error Handler)
   ├── Routes (/api/auth, /api/clients, /api/projects, /api/tasks, /api/time-logs, /api/invoices)
   ├── Controllers (Thin request validation & response formatting)
   ├── Services (Business logic, budget math, invoice calculations, multi-tenancy scoping)
   ├── Models (Mongoose Schemas: User, Client, Project, Task, TimeLog, Invoice, InvoiceItem)
   └── MongoDB / MongoMemoryServer
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd freelanceflow

# Install all dependencies
npm install
```

### Environment Variables
Copy `.env.example` to `.env`:
```env
PORT=3000
NODE_ENV=development
JWT_SECRET=freelanceflow_super_secret_jwt_key_2026_production_grade
MONGO_URI=mongodb://127.0.0.1:27017/freelanceflow
```
*(Note: If `MONGO_URI` is not provided or local MongoDB is unavailable, FreelanceFlow automatically falls back to an embedded in-memory MongoDB instance.)*

### Running the App
```bash
# Start the full-stack dev server (Express + Vite on Port 3000)
npm run dev

# Run automated backend test suite
npm test

# Seed realistic demo data
npm run seed

# Build for production
npm run build

# Start production build
npm start
```

---

## 🧪 Testing & Verification

FreelanceFlow includes an automated integration test suite verifying:
- Authentication & JWT token security
- Multi-tenancy isolation between separate accounts
- Free plan client limit enforcement & Pro plan upgrades
- Project spend & budget calculation formulas
- Time-log creation and rate computation
- Invoicing workflow & automated time-log billing lock

To run tests:
```bash
npm test
```

---

## 🔒 Security Highlights
- Password hashing with **bcryptjs** (10 salt rounds).
- HTTP headers secured with **Helmet**.
- Rate limiting on authentication routes with **express-rate-limit**.
- Strict tenant authorization in service layers to prevent Insecure Direct Object References (IDOR).
