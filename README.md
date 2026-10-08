# 🎓 University Management System (UMS) - Backend API
> **Programming Hero Level-2 Batch 7 | Assignment 6**  
> **Student ID Last Digit: 9 (University Management System)**  
> **Author:** Abdul Mazid  
> **Repository:** [https://github.com/Abdulmazid24/B7A6](https://github.com/Abdulmazid24/B7A6)  

---

## 🌟 Executive Overview
The **University Management System (UMS)** is an enterprise-grade, high-performance, and secure RESTful backend built with **Node.js, Express.js, TypeScript, PostgreSQL, and Prisma ORM**. The system addresses complex academic workflows including multi-role administrative governance, department & semester lifecycles, prerequisite-aware course curricula, concurrency-safe course registrations with ACID transaction boundaries, faculty grading workflows, and automated tuition billing integrated with **Stripe Payments**.

---

## 🛠️ Tech Stack & Real-Time Latest Versions

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Runtime & Framework** | Node.js | v24.x LTS | High-performance asynchronous JavaScript runtime |
| **Framework** | Express.js | ^5.2.1 | Modern RESTful server framework |
| **Language** | TypeScript | ^7.0.2 / ^5.x | Strict type safety and enterprise maintainability |
| **Database** | PostgreSQL | 16+ (Neon Serverless) | ACID-compliant relational persistence |
| **ORM & Driver** | Prisma ORM & `@prisma/adapter-pg` | ^7.9.1 / ^7.10.0 | Type-safe query engine, migrations, relational modeling |
| **Validation** | Zod | ^4.4.3 | Strict runtime request schema validation |
| **Authentication** | JWT (`jsonwebtoken`) & `bcryptjs` | ^9.0.3 / ^3.0.3 | Bearer token authentication & salted password hashing |
| **Social Auth** | GCP Google OAuth | `google-auth-library` | Google Identity token verification |
| **Payment Gateway** | Stripe SDK | ^22.3.2 | Checkout Sessions, webhooks, tuition fee settlements |
| **Security** | Helmet, CORS, Express-Rate-Limit | Latest | HTTP security headers, CORS origin control, rate limiting |
| **Build & Dev Tooling** | `tsup`, `tsx` | ^8.5.1 / ^4.23.1 | Zero-config TypeScript bundling and instant watch mode |

---

## 👥 3 Distinct Roles & Permissions Matrix

| Resource / Action | ADMIN | FACULTY | STUDENT |
|---|:---:|:---:|:---:|
| **Manage Users & Roles** | Full Access | No | No |
| **Manage Departments & Semesters** | Full Access | View Only | View Only |
| **Manage Courses & Prerequisites** | Full Access | View Only | View Only |
| **Manage Sections & Course Offerings** | Full Access | View Assigned | View Offered |
| **Course Registration & Enrollment** | Oversee | View Enrolled | Register / Drop (Self) |
| **Submit / Update Marks & Grades** | Override | Grade Assigned Sections | View Own Grades |
| **Tuition Billing & Stripe Payments** | View All Bills | No | Initiate & Pay Own Fees |
| **System Audit Logs & Dashboard Stats** | Full Access | No | No |

---

## 🔑 Dedicated Demo Credentials (For Evaluator)

| Role | Email | Password |
|---|---|---|
| **ADMIN** | `admin@university.edu` | `AdminPassword123!` |
| **FACULTY** | `faculty@university.edu` | `FacultyPassword123!` |
| **STUDENT** | `student@university.edu` | `StudentPassword123!` |

---

## ⚙️ Minimum 20+ API Endpoints Catalog

### 1. Authentication & Identity (6 APIs)
- `POST /api/v1/auth/register` - Register a new student account
- `POST /api/v1/auth/login` - Authenticate with email/password (returns JWT access & refresh token)
- `POST /api/v1/auth/google-login` - Authenticate via Google OAuth / GCP token
- `POST /api/v1/auth/refresh-token` - Issue a new access token via refresh token
- `POST /api/v1/auth/change-password` - Update account password (authenticated)
- `POST /api/v1/auth/logout` - Invalidate session and clear auth cookies

### 2. User & Profile Management (3 APIs)
- `GET /api/v1/users/me` - Retrieve current authenticated profile
- `PATCH /api/v1/users/me` - Update personal profile details
- `GET /api/v1/users` - Admin: List users with pagination, role filtering, and search

### 3. Academic Departments (4 APIs)
- `POST /api/v1/departments` - Admin: Create new academic department
- `GET /api/v1/departments` - Public/Authenticated: List departments with search & pagination
- `GET /api/v1/departments/:id` - Get department details with faculties & courses
- `PATCH /api/v1/departments/:id` - Admin: Update department details
- `DELETE /api/v1/departments/:id` - Admin: Soft-delete department

### 4. Academic Semesters (4 APIs)
- `POST /api/v1/semesters` - Admin: Create academic semester
- `GET /api/v1/semesters` - List semesters with active filter & pagination
- `GET /api/v1/semesters/:id` - Get semester details
- `PATCH /api/v1/semesters/:id` - Admin: Update semester status (e.g. set as current)

### 5. Courses & Curricula (4 APIs)
- `POST /api/v1/courses` - Admin: Create course with credit hours & prerequisite courses
- `GET /api/v1/courses` - List courses with department filter, search, & pagination
- `GET /api/v1/courses/:id` - Get course details with prerequisite dependencies
- `PATCH /api/v1/courses/:id` - Admin: Update course details
- `DELETE /api/v1/courses/:id` - Admin: Soft-delete course

### 6. Course Offerings & Sections (4 APIs)
- `POST /api/v1/course-offerings` - Admin: Offer course in active semester with faculty & capacity
- `GET /api/v1/course-offerings` - List offerings with filter by semester, department, or faculty
- `GET /api/v1/course-offerings/:id` - Get offering details and section schedule
- `PATCH /api/v1/course-offerings/:id` - Admin: Update section capacity, faculty or time slot

### 7. Student Course Registration (ACID Safe) (4 APIs)
- `POST /api/v1/enrollments/register` - Student: Enroll in course section (Concurrency & prerequisite protected)
- `POST /api/v1/enrollments/withdraw` - Student: Withdraw/drop course section
- `GET /api/v1/enrollments/my-courses` - Student: View currently registered courses
- `GET /api/v1/enrollments/section/:sectionId` - Faculty/Admin: View enrolled student roster

### 8. Grading, GPA & Transcripts (3 APIs)
- `POST /api/v1/grades/submit` - Faculty: Submit student marks & compute letter grade / GPA
- `GET /api/v1/grades/my-transcript` - Student: View semester-wise grades, GPA, and CGPA
- `GET /api/v1/grades/section/:sectionId` - Faculty: View all grades for assigned section

### 9. Tuition Billing & Stripe Payment Gateway (3 APIs)
- `POST /api/v1/payments/create-checkout-session` - Student: Initiate Stripe Checkout Session for semester fees
- `POST /api/v1/payments/webhook` - Stripe Webhook: Verifies signature, settles invoice, marks as PAID
- `GET /api/v1/payments/my-invoices` - Student: View tuition invoices & payment receipts

### 10. Analytics & Audit Logging (2 APIs)
- `GET /api/v1/admin/dashboard-stats` - Admin: Comprehensive university stats & revenue metrics
- `GET /api/v1/admin/audit-logs` - Admin: System activity and security audit trail

---

## 🔒 Enterprise Engineering Highlights
1. **Race-Condition-Safe Registration**: Course enrollments utilize Prisma ACID transactions (`prisma.$transaction`) with lock checks to guarantee maximum student capacity is never breached during concurrent registrations.
2. **Standardized Responses**: Every endpoint adheres to uniform JSON structures:
   - Success: `{ "success": true, "message": "...", "data": { ... }, "meta": { ... } }`
   - Error: `{ "success": false, "message": "...", "errors": [ ... ] }`
3. **Auditing**: Critical system events (role alterations, enrollment changes, grade submissions, payment settlements) are persistently recorded in the `AuditLog` table.
4. **Soft Deletions**: Entities preserve data integrity via `isDeleted` flags and `deletedAt` timestamps.

---

## 🚀 Getting Started

### Prerequisites
- Node.js v20+ or v24+
- PostgreSQL database

### Installation
```bash
# Clone the repository
git clone https://github.com/Abdulmazid24/B7A6.git
cd B7A6

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Fill in your DATABASE_URL, JWT secrets, and Stripe keys in .env

# Generate Prisma Client & Run Migrations
npm run db:generate
npm run db:migrate

# Seed Database with sample departments, courses, and 3 demo accounts
npm run db:seed

# Start development server
npm run dev
```

The API will be available at: `http://localhost:5000`
Health check: `GET http://localhost:5000/api/v1/health`
