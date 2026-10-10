# 🎓 University Management System (UMS) - Backend REST API
> **Programming Hero Level-2 Batch 7 | Assignment 6 (Final Milestone)**  
> **Student ID Last Digit: 9 (University Management System)**  
> **Author:** Abdul Mazid  
> **Repository:** [https://github.com/Abdulmazid24/B7A6.git](https://github.com/Abdulmazid24/B7A6.git)  

---

## 📌 Submission Information (Exact Format)

```text
Project Name    : University Management System (UMS)
Backend Repo    : https://github.com/Abdulmazid24/B7A6.git
Live API        : https://b7-a6-kohl.vercel.app
API Docs        : Available in /postman/UMS_Postman_Collection.json
Demo Video      : https://drive.google.com/file/d/your-video-id/view
Admin Email     : admin@university.edu
Admin Password  : AdminPassword123!
```

---

## 🌟 Executive Overview
The **University Management System (UMS)** is an enterprise-grade, high-performance RESTful backend engineered with **Node.js, Express.js 5, TypeScript, PostgreSQL (Neon Serverless), and Prisma ORM 7**. 

The architecture strictly follows clean layered modular design (`Router` ➔ `Middleware` ➔ `Controller` ➔ `Service` ➔ `Prisma Client`) with **ACID transaction guarantees**, **Zod server-side validation**, **Stripe payment processing**, **Bearer token authentication with strict RBAC**, and **reactive memory caching**.

---

## 🛠️ Tech Stack & Real-Time Latest Stable Versions

| Category | Technology | Real-time Version | Purpose |
|---|---|---|---|
| **Runtime & Framework** | Node.js, Express.js | Node v24 LTS, Express ^5.2.1 | High-throughput asynchronous REST server |
| **Language** | TypeScript | ^5.8.2 | Strict compile-time type safety & enterprise maintainability |
| **Database & ORM** | PostgreSQL + Prisma ORM | Neon Postgres, Prisma ^7.10.0, `@prisma/adapter-pg` | Relational modeling, database indexing, driver adapter, and transactions |
| **Validation** | Zod | ^3.24.2 | Strict schema-based input validation on all routes |
| **Authentication & RBAC** | Custom JWT + GCP OAuth | `jsonwebtoken` ^9.0.3, `bcryptjs` ^3.0.3, `google-auth-library` ^9.15.1 | Bearer token auth, HTTP-only refresh cookies, and Google Social Login |
| **Payment Gateway** | Stripe SDK | ^22.3.2 | Real Stripe Checkout Sessions, webhooks, and tuition billing |
| **Security** | Helmet, CORS, Rate-Limiter | Latest | HTTP headers, origin protection, 200 req/15min rate limiting |
| **Performance & Cache** | In-Memory TTL Cache | Custom Reactive Manager | Sub-millisecond reads with reactive key invalidation on state updates |
| **Bundler & Tooling** | `tsup`, `tsx` | ^8.5.1, ^4.23.1 | ESM bundling and instant TypeScript execution |

---

## 👥 3 Distinct Roles & Permissions Matrix

The system strictly enforces **3 distinct roles** with dedicated permissions:

| System Capabilities | ADMIN | FACULTY | STUDENT |
|---|:---:|:---:|:---:|
| **User Management & Role/Status Updates** | ✅ Full Access | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **Department & Semester Lifecycles** | ✅ Full Access | 👁️ View Only | 👁️ View Only |
| **Course & Prerequisite Management** | ✅ Full Access | 👁️ View Only | 👁️ View Only |
| **Course Offering & Section Scheduling** | ✅ Full Access | 👁️ View Assigned | 👁️ View Offered |
| **Course Registration & Withdrawal** | 👁️ Oversee | ❌ Forbidden (403) | ✅ Register / Withdraw |
| **Student Roster per Section** | ✅ Full Access | ✅ Assigned Sections | ❌ Forbidden (403) |
| **Marks Submission & Grade Computation** | ✅ Override | ✅ Assigned Sections | ❌ Forbidden (403) |
| **View Official Academic Transcript** | ❌ Forbidden (403) | ❌ Forbidden (403) | ✅ Own Transcript |
| **Tuition Billing & Stripe Payments** | 👁️ View All Ledgers | ❌ Forbidden (403) | ✅ Initiate & Settle |
| **System Audit Logs & Dashboard Stats** | ✅ Full Access | ❌ Forbidden (403) | ❌ Forbidden (403) |

---

## 🔑 Dedicated Demo Credentials (For Evaluation)

| Role | Email | Password | Student ID / Faculty ID |
|---|---|---|---|
| **ADMIN** | `admin@university.edu` | `AdminPassword123!` | System Administrator |
| **FACULTY** | `faculty@university.edu` | `FacultyPassword123!` | `FAC-2026-001` (Dr. Farhan Ahmed) |
| **STUDENT** | `student@university.edu` | `StudentPassword123!` | `STU-2026-001` (Tanvir Hossain) |

---

## ⚙️ Complete 33 APIs Catalog

### 1. Authentication & Security (8 APIs)
- `POST /api/v1/auth/register` - Student registration with auto-generated Student ID
- `POST /api/v1/auth/login` - Authenticate with email/password (returns Access Token + sets Refresh Cookie)
- `POST /api/v1/auth/google-login` - Authenticate with GCP Google OAuth ID token
- `POST /api/v1/auth/refresh-token` - Renew expired access token using refresh token
- `POST /api/v1/auth/change-password` - Authenticated password update
- `POST /api/v1/auth/logout` - Invalidate session & clear HTTP-only cookies

### 2. User & Profile Management (5 APIs)
- `GET /api/v1/users/me` - Retrieve current authenticated profile with department details
- `PATCH /api/v1/users/me` - Update personal profile information
- `GET /api/v1/users` - Admin: User directory with pagination (`?page=1&limit=10`), search, and role filters
- `PATCH /api/v1/users/:id/role-status` - Admin: Update user role (`ADMIN`, `FACULTY`, `STUDENT`) or status (`ACTIVE`, `BLOCKED`, `SUSPENDED`)
- `DELETE /api/v1/users/:id` - Admin: Soft-delete user (`isDeleted: true`)

### 3. Academic Departments (5 APIs)
- `POST /api/v1/departments` - Admin: Create new academic department (e.g., CSE, EEE, BBA)
- `GET /api/v1/departments` - Authenticated: List departments with search & pagination
- `GET /api/v1/departments/:id` - Authenticated: Get department details with faculties & courses
- `PATCH /api/v1/departments/:id` - Admin: Update department details
- `DELETE /api/v1/departments/:id` - Admin: Soft-delete department

### 4. Academic Semesters (4 APIs)
- `POST /api/v1/semesters` - Admin: Create semester (name, code, dates, isCurrent, isRegistrationOpen)
- `GET /api/v1/semesters` - Authenticated: List semesters with filter by `isCurrent` & pagination
- `GET /api/v1/semesters/:id` - Authenticated: Get semester details with scheduled course offerings
- `PATCH /api/v1/semesters/:id` - Admin: Update semester status (transactional current semester toggle)

### 5. Courses & Curricula (5 APIs)
- `POST /api/v1/courses` - Admin: Create course with credit hours & prerequisite course associations
- `GET /api/v1/courses` - Authenticated: List courses with search, department filter, and pagination
- `GET /api/v1/courses/:id` - Authenticated: Get course details with prerequisite dependencies
- `PATCH /api/v1/courses/:id` - Admin: Update course details and re-sync prerequisites in transaction
- `DELETE /api/v1/courses/:id` - Admin: Soft-delete course

### 6. Course Offerings & Sections (5 APIs)
- `POST /api/v1/course-offerings` - Admin: Offer course in active semester with initial sections
- `POST /api/v1/course-offerings/:id/sections` - Admin: Add new section with capacity, schedule, & faculty
- `GET /api/v1/course-offerings` - List offerings with filter by semester, department, or faculty
- `GET /api/v1/course-offerings/:id` - Get offering details and section schedules
- `PATCH /api/v1/course-offerings/sections/:sectionId` - Admin: Update section capacity, faculty, or schedule

### 7. Student Course Registration (ACID Safe) (4 APIs)
- `POST /api/v1/enrollments/register` - Student: Enroll in section (**Concurrency-Safe Transaction**, prerequisite check, credit limit check, auto-tuition assessment)
- `POST /api/v1/enrollments/withdraw` - Student: Withdraw/drop course (decrements section count, adjusts tuition bill)
- `GET /api/v1/enrollments/my-courses` - Student: View currently registered courses
- `GET /api/v1/enrollments/section/:sectionId` - Faculty/Admin: View student roster enrolled in assigned section

### 8. Grading, GPA & Academic Transcripts (3 APIs)
- `POST /api/v1/grades/submit` - Faculty: Submit student marks (Midterm, Final, Assessment) & auto-compute Letter Grade, Grade Point, and graduation completion
- `GET /api/v1/grades/section/:sectionId` - Faculty/Admin: View all student grades for assigned section
- `GET /api/v1/grades/my-transcript` - Student: Official transcript with Semester GPA & Cumulative CGPA

### 9. Tuition Billing & Stripe Payment Gateway (4 APIs)
- `GET /api/v1/payments/my-invoices` - Student: View semester tuition bills & payment history
- `POST /api/v1/payments/create-checkout-session` - Student: Initiate Stripe Checkout Session for tuition fees
- `POST /api/v1/payments/webhook` - Stripe Webhook: Verifies signature (`whsec_...`), settles invoice, marks as PAID
- `GET /api/v1/payments/verify` - Verify Stripe session on client return or manual inspection
- `GET /api/v1/payments` - Admin: University-wide payment transaction ledger

### 10. Analytics & Audit Logging (2 APIs)
- `GET /api/v1/admin/dashboard-stats` - Admin: Aggregate metrics (total students, faculties, courses, revenue collected, outstanding dues)
- `GET /api/v1/audit-logs` - Admin: Security and activity audit trail with pagination and filters

---

## 🔒 Enterprise Engineering Decisions

### 1. Concurrency-Safe Course Enrollment
To prevent race conditions during high-traffic registration windows:
- All checks and mutations are encapsulated inside a **Prisma ACID Transaction (`prisma.$transaction`)**.
- Checks section seat availability (`enrolledCount < capacity`).
- Validates student prerequisite course completion (must have `COMPLETED` enrollment with non-failing grade).
- Enforces maximum semester credit limit (15 credits).
- Atomically increments `enrolledCount` on `CourseSection` and assesses the student's `TuitionFee`.

### 2. Standardized Response Envelope
Every response adheres to the uniform format:
- **Success:**
  ```json
  {
    "success": true,
    "message": "Operation successful",
    "meta": { "page": 1, "limit": 10, "total": 100, "totalPages": 10 },
    "data": { ... }
  }
  ```
- **Error:**
  ```json
  {
    "success": false,
    "message": "Validation Error",
    "errors": [
      { "path": "email", "message": "Valid email address is required" }
    ]
  }
  ```

### 3. Security Hardening & Rate Limiting
- **Helmet**: Secures HTTP response headers against clickjacking, sniffing, and XSS.
- **Rate Limiting**: `express-rate-limit` throttles API abuse to **200 requests per 15 minutes** per IP.
- **BCrypt**: 10 rounds of cryptographic salting for passwords.
- **Soft Deleting**: Sensitive entities maintain an `isDeleted` flag and `deletedAt` timestamp to prevent accidental data loss.

---

## 🧪 Automated Integration Verification Suite

The repository includes a dedicated automated test suite that tests all 10 core integration flows, RBAC enforcement, CGPA calculation, and Stripe checkout:

```bash
# Run automated verification suite
npm test
```

Expected Output:
```text
1. Health Check: ✅ PASSED
2. Admin Login: ✅ PASSED
3. Faculty Login: ✅ PASSED
4. Student Login: ✅ PASSED
5. RBAC Student -> Admin Route (Must be 403): ✅ PASSED (403 Forbidden correctly enforced)
6. Admin Dashboard Stats: ✅ PASSED
7. Fetch Courses: ✅ PASSED
8. Student Transcript (CGPA Calculation): ✅ PASSED
9. Student Tuition Invoices: ✅ PASSED
10. System Audit Logs: ✅ PASSED

✨ ALL 10 INTEGRATION VERIFICATION TESTS PASSED FLAWLESSLY! ✨
```

---

## 🚀 Local Setup & Installation

```bash
# 1. Clone the repository
git clone https://github.com/Abdulmazid24/B7A6.git
cd B7A6

# 2. Install all dependencies
npm install

# 3. Configure environment variables (.env)
cp .env.example .env
# Provide your DATABASE_URL, JWT secrets, and Stripe keys in .env

# 4. Verify environment configuration
npm run verify:env

# 5. Push database schema to PostgreSQL
npm run db:push

# 6. Seed demo departments, courses, and 3 demo user roles
npm run db:seed

# 7. Start development server
npm run dev
```

Server runs on: `http://localhost:5000`  
Health check: `http://localhost:5000/api/v1/health`

---

## 🎥 Video Walkthrough Guide (5-10 Minutes)

When recording your demo video:
1. **Overview & Architecture**: Walk through the layered modular design (`routes` ➔ `middleware` ➔ `controller` ➔ `service` ➔ `prisma`).
2. **Demonstrate 3 Roles**:
   - Login as `admin@university.edu` -> access `/api/v1/admin/dashboard-stats` (200 OK).
   - Login as `student@university.edu` -> attempt `/api/v1/admin/dashboard-stats` -> show **403 Forbidden**.
   - Show Faculty viewing their assigned section student roster.
3. **Demonstrate CRUD**: Show creating an Academic Department (`POST /api/v1/departments`), getting list with search & pagination, updating, and soft-deleting.
4. **Demonstrate Validation & Errors**: Send invalid body to `/api/v1/auth/register` (e.g. invalid email) and show structured Zod error JSON response.
5. **Demonstrate Payment Flow**:
   - Student calls `POST /api/v1/payments/create-checkout-session` -> opens Stripe checkout session link.
   - Settle payment and show `TuitionFee` and `Payment` status updating to `COMPLETED` and `PAID`.
6. **Technical Highlight**: Explain the Prisma ACID transaction boundary in `EnrollmentService.registerCourse` preventing race conditions during course enrollment!
