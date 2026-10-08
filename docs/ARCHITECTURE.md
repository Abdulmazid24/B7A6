# 🏛️ University Management System (UMS) - Architecture & Technical Design

This document details the system design, entity-relationship models, transaction boundaries, state transitions, and security topology of the **University Management System (UMS)**.

---

## 1. 🏗️ High-Level System Architecture

```mermaid
graph TD
    Client["Client / Postman / Frontend"]
    
    subgraph Security Layer
        Helmet["Helmet (HTTP Headers)"]
        CORS["CORS Policy"]
        RateLimit["Rate Limiter (200 req / 15 min)"]
    end
    
    subgraph Application Core
        Router["Centralized API Router (/api/v1)"]
        AuthGuard["JWT / RBAC Middleware"]
        Validator["Zod Schema Validation"]
        Controllers["Domain Controllers"]
        Services["Business Logic Services"]
        PrismaORM["Prisma Client & Driver Adapter"]
    end
    
    subgraph External & Persistence
        NeonPostgres[("Neon PostgreSQL Database")]
        StripeGateway["Stripe Payment Gateway"]
        GCPAuth["Google OAuth (GCP)"]
        AuditEngine[("Audit Logging Engine")]
    end
    
    Client --> SecurityLayer
    Security Layer --> Router
    Router --> AuthGuard
    AuthGuard --> Validator
    Validator --> Controllers
    Controllers --> Services
    Services --> PrismaORM
    Services --> StripeGateway
    Services --> GCPAuth
    Services --> AuditEngine
    PrismaORM --> NeonPostgres
```

---

## 2. 🗄️ Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o| Profile : has
    User ||--o{ StudentEnrollment : enrolls
    User ||--o{ CourseSection : teaches
    User ||--o{ StudentGrade : receives
    User ||--o{ TuitionFee : billed
    User ||--o{ Payment : makes
    User ||--o{ AuditLog : triggers

    AcademicDepartment ||--o{ Profile : belongs_to
    AcademicDepartment ||--o{ Course : offers

    AcademicSemester ||--o{ CourseOffering : schedules
    AcademicSemester ||--o{ TuitionFee : assesses

    Course ||--o{ CourseOffering : offered_in
    Course ||--o{ CoursePrerequisite : requires
    Course ||--o{ CoursePrerequisite : prerequisite_for

    CourseOffering ||--o{ CourseSection : divides_into

    CourseSection ||--o{ StudentEnrollment : contains
    CourseSection ||--o{ StudentGrade : evaluates

    StudentEnrollment ||--o| StudentGrade : graded_in

    TuitionFee ||--o{ Payment : settled_by
```

---

## 3. ⚡ Concurrency & ACID Transaction Boundary (Course Registration)

To prevent race conditions, overselling seats beyond section capacity, and violating academic prerequisites:

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant Controller as EnrollmentController
    participant Service as EnrollmentService
    participant TX as Prisma $transaction
    participant DB as PostgreSQL

    Student->>Controller: POST /api/v1/enrollments/register (sectionId)
    Controller->>Service: registerCourse(studentId, sectionId)
    Service->>TX: Begin Transaction
    TX->>DB: Lock & Read Section, Course, Semester
    Note over TX,DB: Verify semester registration is open
    Note over TX,DB: Verify enrolledCount < capacity (Capacity Guard)
    Note over TX,DB: Verify student is not already enrolled in course
    Note over TX,DB: Verify student total credits + course credits <= 15
    Note over TX,DB: Verify prerequisite courses completed with grade != 'F'
    TX->>DB: INSERT into StudentEnrollment (status: ENROLLED)
    TX->>DB: UPDATE CourseSection (enrolledCount = enrolledCount + 1)
    TX->>DB: UPSERT TuitionFee (add course credit tuition charge)
    TX->>DB: INSERT into AuditLog (COURSE_REGISTERED)
    TX->>Service: Commit Transaction
    Service->>Controller: Return Enrollment Details
    Controller->>Student: 201 Created { success: true, data: enrollment }
```

---

## 4. 💳 Stripe Payment Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant API as UMS Backend
    participant Stripe as Stripe API
    participant DB as PostgreSQL

    Student->>API: POST /api/v1/payments/create-checkout-session
    API->>DB: Check TuitionFee dueAmount > 0
    API->>DB: INSERT Payment (status: PENDING)
    API->>Stripe: stripe.checkout.sessions.create()
    Stripe-->>API: Returns session URL & Session ID
    API->>DB: UPDATE Payment (stripeSessionId)
    API-->>Student: 200 OK { checkoutUrl }

    Note over Student,Stripe: Student completes card payment on Stripe Checkout

    alt Webhook Delivery
        Stripe->>API: POST /api/v1/payments/webhook (checkout.session.completed)
        API->>API: Verify Webhook Signature with whsec_...
        API->>DB: $transaction: Payment COMPLETED, TuitionFee PAID/PARTIALLY_PAID
        API-->>Stripe: 200 OK { received: true }
    else Manual / Local Redirect Verification
        Student->>API: GET /api/v1/payments/verify?session_id=...
        API->>Stripe: stripe.checkout.sessions.retrieve(sessionId)
        API->>DB: Settle Payment & Update TuitionFee
        API-->>Student: 200 OK { payment: COMPLETED }
    end
```

---

## 5. 🛡️ Role-Based Access Control (RBAC) Matrix

| Endpoint Group | Resource | ADMIN | FACULTY | STUDENT | Unauthenticated |
|---|---|:---:|:---:|:---:|:---:|
| `/auth/register` | Student Registration | ✅ | ✅ | ✅ | ✅ |
| `/auth/login` | Authentication | ✅ | ✅ | ✅ | ✅ |
| `/users/me` | Own Profile | ✅ | ✅ | ✅ | ❌ |
| `/users` | User Directory | ✅ | ❌ | ❌ | ❌ |
| `/departments` (Create/Edit) | Academic Departments | ✅ | ❌ | ❌ | ❌ |
| `/courses` (Create/Edit) | Courses & Prerequisites | ✅ | ❌ | ❌ | ❌ |
| `/course-offerings` | Section Management | ✅ | ❌ | ❌ | ❌ |
| `/enrollments/register` | Course Enrollment | ❌ | ❌ | ✅ | ❌ |
| `/enrollments/section/:id` | Section Student Roster | ✅ | ✅ | ❌ | ❌ |
| `/grades/submit` | Marks Submission | ✅ | ✅ (Own Section) | ❌ | ❌ |
| `/grades/my-transcript` | Academic Transcript | ❌ | ❌ | ✅ | ❌ |
| `/payments/create-checkout-session` | Stripe Payment | ❌ | ❌ | ✅ | ❌ |
| `/admin/dashboard-stats` | University Metrics | ✅ | ❌ | ❌ | ❌ |
| `/audit-logs` | Security Audit Trail | ✅ | ❌ | ❌ | ❌ |
