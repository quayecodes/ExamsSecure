# ExamSecure — Phases 1–3 Documentation

CURRENT PROJECT: ExamSecure — Secure Online Examination Platform
CURRENT PHASE: 1–3 (Requirements, Architecture, Database Design)
OBJECTIVE: Establish scope, technical design, and data model before any code is written.

## Assumptions Made (confirm or correct before Phase 4)

Your brief didn't specify these, so I picked defaults suited to a portfolio project. Flag any you want changed:

1. **Tech stack**: Next.js (App Router) + TypeScript, PostgreSQL + Prisma, Tailwind CSS, NextAuth (credentials + JWT). Chosen because it's a single deployable full-stack framework, free-tier hosting (Vercel + Neon/Supabase) is realistic for a student project, and it demonstrates modern industry-standard skills.
2. **Scale target**: hundreds, not tens of thousands, of concurrent test-takers (realistic for a school/university deployment, not an enterprise one).
3. **No live camera-based proctoring** in MVP — anti-cheating is handled via tab-switch/focus-loss detection, time-boxing, and question randomization, not AI vision. Camera proctoring is listed as a stretch feature.
4. **Single institution per deployment** for MVP (multi-tenant SaaS is a stretch feature, not core).
5. **Grading**: auto-graded objective questions (MCQ, true/false) in MVP; manual grading for essay/short-answer questions is a stretch feature.

---

# PHASE 1 — REQUIREMENTS & PROJECT PLANNING

## Project Overview

ExamSecure is a web-based examination platform that lets an institution's staff create, schedule, and administer digital exams, and lets students take them under time-boxed, integrity-monitored conditions with automatic grading for objective question types.

## Problem Statement

Manual exams cost significant administrative time (printing, distribution, collection, grading) and don't scale well for large cohorts. Existing online exam tools are often either too simple (Google Forms — no timing enforcement, no anti-cheating, no role separation) or too complex/expensive (enterprise LMS platforms). ExamSecure targets the middle: a focused, secure, self-hostable platform for a single institution.

## User Personas

| Persona | Role | Goals |
|---|---|---|
| **Institution Admin** | System owner | Manage lecturer/student accounts, view institution-wide exam activity, configure global settings |
| **Lecturer/Teacher** | Content creator | Build question banks, assemble exams, schedule exam windows, review results and flagged incidents |
| **Student** | Test-taker | Take assigned exams within a time window, see results after grading/release |

## Functional Requirements

**Admin**
- FR1: Admin can create/deactivate Lecturer and Student accounts.
- FR2: Admin can view a dashboard of all exams currently active or scheduled.

**Lecturer**
- FR3: Lecturer can create a question bank per course, with MCQ, true/false, and short-answer question types.
- FR4: Lecturer can assemble an exam from the question bank, set duration, start/end window, and randomize question/option order.
- FR5: Lecturer can assign an exam to a specific class/cohort.
- FR6: Lecturer can view a results dashboard with per-student scores and per-question statistics.
- FR7: Lecturer can view integrity flags (tab-switch count, time-out submissions) per attempt.
- FR8: Lecturer can manually grade short-answer questions and publish final results.

**Student**
- FR9: Student can see a list of exams assigned to them with status (upcoming, active, completed).
- FR10: Student can start an exam only within its configured time window, and only once.
- FR11: Student's exam auto-submits when the timer expires, even without a manual click.
- FR12: Student can view their results only after the lecturer publishes them.

**Cross-cutting**
- FR13: All users authenticate via email/password; sessions are role-scoped (RBAC).
- FR14: All exam-related actions are logged for audit purposes (start, submit, flag events).

## Non-Functional Requirements

- **Performance**: exam page interactions (answer selection, navigation) respond in <300ms under normal load; page load <2s on a standard broadband connection.
- **Availability**: 99.5% uptime during any scheduled exam window (this is the hard requirement — outside exam windows, lower availability is acceptable for a student project).
- **Security**: passwords hashed with bcrypt (cost factor 12); all traffic over HTTPS; session tokens expire after 2 hours of inactivity.
- **Data integrity**: exam auto-submission must occur within 2 seconds of the timer reaching zero, server-side enforced (not just client-side), to prevent time manipulation.
- **Scalability**: support at least 300 concurrent active exam sessions on a single deployment (Vercel + managed Postgres tier).
- **Auditability**: every exam attempt retains an immutable log of start time, submit time, and flagged integrity events for at least 1 year.

## Feature Prioritization

**MVP (Phases 1–8 target)**
- Auth + RBAC (Admin, Lecturer, Student)
- Question bank CRUD (MCQ, true/false)
- Exam creation, scheduling, assignment
- Timed exam-taking flow with server-enforced auto-submit
- Auto-grading for objective questions
- Tab-switch / focus-loss detection and logging
- Results dashboard for lecturers, results view for students

**Advanced / Stretch (post-MVP)**
- Short-answer manual grading workflow
- Multi-institution (multi-tenant) support
- Webcam-based proctoring
- Question bank import/export (CSV)
- Analytics: item difficulty, discrimination index per question

## Development Roadmap (rough sequencing)

1. Phases 1–3 (this document) — done
2. Phase 4: project scaffold, DB connection, env config
3. Phase 5: auth + RBAC
4. Phase 6: question bank → exam builder → exam-taking flow → grading → results (built and approved one feature at a time)
5. Phase 7: UI/UX pass
6. Phase 8: testing + security review
7. Phase 9: CI/CD + deployment
8. Phase 10: documentation + GitHub presentation

**Definition of Done check**: every MVP feature above has a one-line acceptance criterion (FR1–FR14); NFRs carry specific numbers (300 concurrent sessions, 2s auto-submit, 99.5% uptime, bcrypt cost 12). ✅

---

# PHASE 2 — SYSTEM ARCHITECTURE & DESIGN

## Architecture Diagram (text form)

```
┌─────────────────────────────────────────────────────────┐
│                        Browser (Student/Lecturer/Admin)   │
│              Next.js React client (TypeScript)            │
└───────────────────────────┬─────────────────────────────┘
                             │ HTTPS
┌───────────────────────────▼─────────────────────────────┐
│                  Next.js App (Vercel)                     │
│  ┌─────────────────┐   ┌──────────────────────────────┐  │
│  │  React pages/    │   │  API Routes (/api/v1/*)      │  │
│  │  Server Components│  │  - auth                      │  │
│  │                  │   │  - exams                      │  │
│  │                  │   │  - questions                  │  │
│  │                  │   │  - attempts                   │  │
│  │                  │   │  - results                    │  │
│  └─────────────────┘   └──────────────┬───────────────┘  │
└──────────────────────────────────────┼───────────────────┘
                                        │ Prisma Client
                          ┌─────────────▼──────────────┐
                          │   PostgreSQL (Neon/Supabase) │
                          └─────────────┬──────────────┘
                                        │
                          ┌─────────────▼──────────────┐
                          │  Redis (exam timer state,    │
                          │  session cache) — optional   │
                          │  for MVP, added if timing     │
                          │  drift becomes an issue       │
                          └───────────────────────────────┘
```

## Technology Stack & Justification

| Layer | Choice | Why | Rejected alternative |
|---|---|---|---|
| Frontend | Next.js + React + TypeScript | Single framework for SSR + client, strong ecosystem, demonstrates modern skills for portfolio | Separate SPA (Vite/React) + Express backend — more moving parts to deploy/maintain for a solo project |
| Styling | Tailwind CSS | Fast to build consistent UI without hand-rolling CSS | Plain CSS — slower iteration; Chakra/MUI — heavier, less customizable for a distinctive design |
| Backend | Next.js API routes | Colocated with frontend, one deployment target, sufficient for expected scale | Standalone Express/NestJS API — justified only if you later split frontend/backend for a microservices story; not needed here |
| Database | PostgreSQL | Relational integrity matters here (exam attempts, grading must be consistent); strong support in Prisma | MongoDB — schema flexibility not needed; this data is inherently relational |
| ORM | Prisma | Type-safe queries matching the TypeScript stack, easy migrations | Raw SQL — more control but slower to iterate and more error-prone for a solo dev |
| Auth | NextAuth (Credentials provider) + JWT | Handles session/token plumbing, integrates natively with Next.js | Custom auth from scratch — more to secure correctly; roll your own only if you want the learning exercise (optional stretch) |
| Timer enforcement | Server-side timestamp check on submit, cross-checked against `exam_attempts.started_at` | Prevents client-side clock manipulation | Client-only `setTimeout` — trivially bypassable by editing browser JS |

## Frontend Architecture

- `app/(auth)/` — login, register
- `app/(admin)/` — admin dashboard, user management
- `app/(lecturer)/` — question bank, exam builder, results
- `app/(student)/` — exam list, exam-taking view, results view
- Shared `components/` for form inputs, timers, question renderers
- Server Components for data-heavy pages (dashboards); Client Components only where interactivity is required (exam-taking timer, answer selection)

## Backend Architecture

- REST API under `/api/v1/*`, versioned so a v2 can be introduced without breaking the client.
- Route handlers are thin — they validate input (via Zod schemas) and delegate to a `services/` layer that holds business logic (e.g., `examService.submitAttempt()`), keeping logic testable independent of HTTP.
- All mutating endpoints (exam submit, grade publish) run inside a Prisma transaction to guarantee atomicity.

## Authentication Strategy

- Credentials-based login (email + password), bcrypt-hashed.
- JWT session token, 2-hour expiry, stored in an HttpOnly cookie (not localStorage — mitigates XSS token theft).
- Role claim embedded in the JWT (`ADMIN` / `LECTURER` / `STUDENT`); every API route checks role server-side — the frontend role-based UI is a convenience, not the security boundary.

## API Communication Strategy

- REST, JSON, versioned (`/api/v1/`).
- Standard response envelope: `{ data, error }` so client-side error handling is uniform.
- Idempotency: exam submission endpoint checks `attempt.status` before writing, so a duplicate/retried submit request can't double-submit.

## Security Considerations (OWASP-mapped)

| OWASP risk | Relevance to ExamSecure | Mitigation |
|---|---|---|
| Broken Access Control | A student could try to access another student's attempt, or a lecturer's question bank | Every query scoped by authenticated user ID + role check, never trust a client-supplied user/exam ID alone |
| Injection | Question/answer text fields | Prisma parameterizes all queries by default; no raw SQL string concatenation |
| Identification/Auth failures | Session hijacking during a live exam | Short JWT expiry, HttpOnly + Secure + SameSite cookies, re-auth required if session expires mid-exam (attempt state preserved server-side) |
| Sensitive data exposure | Exam questions leaking before the exam window | Question bank never sent to the client until the exam officially starts for that student, and only the current question's data, not the whole bank |
| Security misconfiguration | Default secrets, verbose errors in prod | `.env` secrets never committed; generic error messages in production, detailed logs server-side only |

## Scalability Considerations

- Stateless API routes — horizontal scaling is just adding more serverless function instances (Vercel handles this automatically).
- Database connection pooling (Prisma + PgBouncer via Neon/Supabase) to handle exam-start traffic spikes.
- If timer drift or session load becomes an issue at higher concurrency, introduce Redis for exam session state — deferred from MVP since 300 concurrent sessions doesn't require it yet.

## Out of Scope (explicitly not building in MVP)

- Webcam/AI-based proctoring
- Multi-tenant (multi-institution) architecture
- Payment/billing
- Native mobile app (responsive web only)

**Definition of Done check**: each major decision above states what was rejected and why. ✅

---

# PHASE 3 — DATABASE DESIGN

## Entities

`User`, `Institution`, `Course`, `QuestionBank`, `Question`, `QuestionOption`, `Exam`, `ExamAttempt`, `AnswerResponse`, `IntegrityEvent`

## Entity Relationships (ERD explanation)

- An **Institution** has many **Users** (Admins, Lecturers, Students) and many **Courses**.
- A **Course** belongs to one Institution and has many **Exams**.
- A **Lecturer** (User) owns many **QuestionBanks**; a **QuestionBank** belongs to one Course.
- A **QuestionBank** has many **Questions**; a **Question** has many **QuestionOptions** (for MCQ) — true/false and short-answer questions use a simplified option set or none.
- An **Exam** belongs to one Course and pulls a defined set of **Questions** (via a join table `ExamQuestion` to control order/points per exam, since the same question bank can feed multiple exams).
- A **Student** (User) has many **ExamAttempts**; each ExamAttempt belongs to one Exam and one Student, and has many **AnswerResponses** (one per question answered) and many **IntegrityEvents** (tab-switch, focus-loss logs).

## Table Structures

```
User
  id            UUID PK
  institution_id UUID FK -> Institution.id
  email         VARCHAR UNIQUE NOT NULL
  password_hash VARCHAR NOT NULL
  role          ENUM('ADMIN','LECTURER','STUDENT') NOT NULL
  full_name     VARCHAR NOT NULL
  created_at    TIMESTAMP DEFAULT now()

Institution
  id            UUID PK
  name          VARCHAR NOT NULL

Course
  id            UUID PK
  institution_id UUID FK -> Institution.id
  name          VARCHAR NOT NULL
  lecturer_id   UUID FK -> User.id

QuestionBank
  id            UUID PK
  course_id     UUID FK -> Course.id
  title         VARCHAR NOT NULL

Question
  id              UUID PK
  question_bank_id UUID FK -> QuestionBank.id
  type            ENUM('MCQ','TRUE_FALSE','SHORT_ANSWER') NOT NULL
  prompt          TEXT NOT NULL
  points          INT NOT NULL DEFAULT 1
  correct_answer  TEXT  -- used for TRUE_FALSE/SHORT_ANSWER auto-grading

QuestionOption
  id            UUID PK
  question_id   UUID FK -> Question.id
  option_text   VARCHAR NOT NULL
  is_correct    BOOLEAN NOT NULL DEFAULT false

Exam
  id            UUID PK
  course_id     UUID FK -> Course.id
  title         VARCHAR NOT NULL
  duration_minutes INT NOT NULL
  window_start  TIMESTAMP NOT NULL
  window_end    TIMESTAMP NOT NULL
  randomize_questions BOOLEAN DEFAULT true
  status        ENUM('DRAFT','SCHEDULED','ACTIVE','CLOSED') NOT NULL DEFAULT 'DRAFT'

ExamQuestion   -- join table: which questions belong to which exam, in what order
  id            UUID PK
  exam_id       UUID FK -> Exam.id
  question_id   UUID FK -> Question.id
  order_index   INT NOT NULL
  points_override INT  -- nullable, overrides Question.points if set

ExamAttempt
  id            UUID PK
  exam_id       UUID FK -> Exam.id
  student_id    UUID FK -> User.id
  started_at    TIMESTAMP NOT NULL
  submitted_at  TIMESTAMP
  status        ENUM('IN_PROGRESS','SUBMITTED','AUTO_SUBMITTED','GRADED') NOT NULL DEFAULT 'IN_PROGRESS'
  score         DECIMAL
  UNIQUE(exam_id, student_id)   -- one attempt per student per exam

AnswerResponse
  id            UUID PK
  attempt_id    UUID FK -> ExamAttempt.id
  question_id   UUID FK -> Question.id
  selected_option_id UUID FK -> QuestionOption.id  -- nullable for short-answer
  answer_text   TEXT  -- nullable, used for short-answer
  is_correct    BOOLEAN  -- nullable until graded
  points_awarded DECIMAL

IntegrityEvent
  id            UUID PK
  attempt_id    UUID FK -> ExamAttempt.id
  event_type    ENUM('TAB_SWITCH','FOCUS_LOSS','TIME_OUT') NOT NULL
  occurred_at   TIMESTAMP NOT NULL
```

## Indexes

- `User.email` — unique index (login lookups).
- `ExamAttempt(exam_id, student_id)` — unique composite index (enforces one attempt per student per exam, and speeds up "has this student already started?" checks).
- `Exam(course_id, status)` — composite index for dashboard queries (e.g., "show all active exams for this course").
- `AnswerResponse.attempt_id` — index for fast retrieval of all answers in an attempt.

## Constraints

- `ExamAttempt` unique on `(exam_id, student_id)` — enforces FR10 (one attempt only) at the database level, not just application logic.
- `Question.correct_answer` / `QuestionOption.is_correct` — at least one option must be marked correct for MCQ (enforced in application logic + a check at write time, since cross-row constraints aren't natively expressible in a single CHECK constraint).
- Foreign keys use `ON DELETE RESTRICT` for anything tied to grading history (you shouldn't be able to delete a Question that has live AnswerResponses); `ON DELETE CASCADE` for genuinely dependent child records (e.g., deleting an ExamAttempt cascades to its AnswerResponses and IntegrityEvents).

## Normalization

Schema is in **3NF**: no repeating groups (1NF), no partial dependencies since every table uses a single-column UUID PK (2NF), and no transitive dependencies — e.g., `points_awarded` lives on `AnswerResponse` rather than being derivable-but-duplicated data stored elsewhere.

## Prisma Schema (draft)

```prisma
enum Role {
  ADMIN
  LECTURER
  STUDENT
}

enum QuestionType {
  MCQ
  TRUE_FALSE
  SHORT_ANSWER
}

enum ExamStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  CLOSED
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  AUTO_SUBMITTED
  GRADED
}

model Institution {
  id      String   @id @default(uuid())
  name    String
  users   User[]
  courses Course[]
}

model User {
  id            String   @id @default(uuid())
  institutionId String
  institution   Institution @relation(fields: [institutionId], references: [id])
  email         String   @unique
  passwordHash  String
  role          Role
  fullName      String
  createdAt     DateTime @default(now())
  coursesTaught Course[]      @relation("LecturerCourses")
  attempts      ExamAttempt[]
}

model Course {
  id            String   @id @default(uuid())
  institutionId String
  institution   Institution @relation(fields: [institutionId], references: [id])
  lecturerId    String
  lecturer      User @relation("LecturerCourses", fields: [lecturerId], references: [id])
  name          String
  questionBanks QuestionBank[]
  exams         Exam[]
}

model QuestionBank {
  id        String @id @default(uuid())
  courseId  String
  course    Course @relation(fields: [courseId], references: [id])
  title     String
  questions Question[]
}

model Question {
  id             String @id @default(uuid())
  questionBankId String
  questionBank   QuestionBank @relation(fields: [questionBankId], references: [id])
  type           QuestionType
  prompt         String
  points         Int    @default(1)
  correctAnswer  String?
  options        QuestionOption[]
  examLinks      ExamQuestion[]
  responses      AnswerResponse[]
}

model QuestionOption {
  id         String   @id @default(uuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id])
  optionText String
  isCorrect  Boolean  @default(false)
}

model Exam {
  id                 String     @id @default(uuid())
  courseId           String
  course             Course     @relation(fields: [courseId], references: [id])
  title              String
  durationMinutes    Int
  windowStart        DateTime
  windowEnd          DateTime
  randomizeQuestions Boolean    @default(true)
  status             ExamStatus @default(DRAFT)
  questions          ExamQuestion[]
  attempts           ExamAttempt[]
}

model ExamQuestion {
  id             String   @id @default(uuid())
  examId         String
  exam           Exam     @relation(fields: [examId], references: [id])
  questionId     String
  question       Question @relation(fields: [questionId], references: [id])
  orderIndex     Int
  pointsOverride Int?
}

model ExamAttempt {
  id             String        @id @default(uuid())
  examId         String
  exam           Exam          @relation(fields: [examId], references: [id])
  studentId      String
  student        User          @relation(fields: [studentId], references: [id])
  startedAt      DateTime
  submittedAt    DateTime?
  status         AttemptStatus @default(IN_PROGRESS)
  score          Decimal?
  responses      AnswerResponse[]
  integrityEvents IntegrityEvent[]

  @@unique([examId, studentId])
  @@index([examId, status])
}

model AnswerResponse {
  id               String       @id @default(uuid())
  attemptId        String
  attempt          ExamAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionId       String
  question         Question     @relation(fields: [questionId], references: [id])
  selectedOptionId String?
  answerText       String?
  isCorrect        Boolean?
  pointsAwarded    Decimal?

  @@index([attemptId])
}

model IntegrityEvent {
  id         String      @id @default(uuid())
  attemptId  String
  attempt    ExamAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  eventType  String
  occurredAt DateTime
}
```

## Seed Data Strategy

- Seed script creates: 1 Institution, 1 Admin, 2 Lecturers, 10 Students, 2 Courses, 1 QuestionBank per course with ~10 questions (mixed MCQ/true-false), 1 sample Exam per course.
- Purpose: enough data to exercise every role's dashboard and the full exam-taking flow in development without manual data entry.

## Migration Strategy

- Prisma Migrate, one migration per schema change, committed to version control (never edit a generated migration file after it's applied to a shared environment).
- Production migrations run as a separate CI/CD step before deploying new app code, so schema changes are never applied by application boot logic.

**Definition of Done check**: schema is stated at 3NF with justification; every FK relationship above is explained in one sentence in the "Entity Relationships" section. ✅

---

COMPLETED: Phases 1–3 (Requirements, Architecture, Database Design)
FILES CHANGED: `examsecure-phase1-3.md` (new)
DEFINITION OF DONE MET: YES
NEXT PHASE: Phase 4 — Project Initialization
WAITING FOR APPROVAL: YES
