# ExamSecure - Phase 6 Core Application Features

**Current phase:** Phase 7, UI/UX Refinement  
**Documented phase:** Phase 6, Core Application Features  
**Project:** ExamSecure - Secure Online Examination Platform

## Objective

Implement the MVP examination workflow one approved feature at a time while enforcing authentication, ownership, validation, timing, grading, and auditability on the server.

## Features Delivered

### 1. Lecturer question banks

Lecturers can create question banks only for courses they teach. The API validates the course ID and title, and all list queries are scoped to the authenticated lecturer.

### 2. Objective question creation

Lecturers can add MCQ and true/false questions to their own question banks. The server validates prompt length, points, option count, and correct-answer rules. Correct answers are not included in student-facing exam payloads.

Short-answer authoring remains outside this feature slice and is reserved for later manual-grading work.

### 3. Draft exam creation and scheduling

Lecturers can create draft exams with:

- Course ownership validation
- Title and duration validation
- A future start and end window
- One or more questions owned by the selected course
- Stable question ordering
- Optional question randomization configuration

The server rejects reversed windows, past start times, duplicate question IDs, and questions from another course.

### 4. Exam assignment

Lecturers can assign an owned exam to students in the same institution. The `ExamAssignment` join model provides:

- A unique `(examId, studentId)` constraint
- An index on `studentId`
- Duplicate-safe assignment creation
- Institution and role checks

Students can only see exams assigned to their own account.

### 5. Student exam start

An assigned student can open and start an exam only when:

- The student owns an assignment for the exam
- The exam status is `SCHEDULED` or `ACTIVE`
- The current time is inside the exam window
- No previous attempt exists

The server creates an `IN_PROGRESS` attempt and returns question text and options without correct answers.

### 6. Answer submission and grading

Students can submit objective answers through the attempt endpoint. The server:

- Verifies the attempt belongs to the authenticated student
- Rejects duplicate submissions
- Verifies each answer belongs to the exam
- Grades MCQ and true/false answers from server-side data
- Calculates the score
- Stores answer responses transactionally
- Marks the attempt `SUBMITTED` or `AUTO_SUBMITTED`

The client countdown is only a convenience. The server calculates the effective deadline from `startedAt`, the configured duration, and `windowEnd`.

### 7. Results visibility

Students can view their own score only after submission. Lecturers can view result rows only for exams attached to their courses. Lecturer results include:

- Student name and email
- Attempt status
- Score
- Submission time
- Integrity-event count

In-progress attempts do not expose results to students.

### 8. Integrity-event logging

During an active attempt, the client records:

- `TAB_SWITCH` when document visibility changes to hidden
- `FOCUS_LOSS` when the browser window loses focus
- `TIME_OUT` when the client countdown reaches zero

The API verifies that the event belongs to the authenticated student's attempt. Events are stored with an explicit timestamp and are visible to lecturers through result review.

## Important API Routes

| Route | Purpose |
| --- | --- |
| `/api/lecturer/question-banks` | List and create lecturer-owned question banks |
| `/api/lecturer/question-banks/[questionBankId]/questions` | List and create objective questions |
| `/api/lecturer/exams` | List and create draft exams |
| `/api/lecturer/exams/[examId]/assignments` | List students and assign an exam |
| `/api/lecturer/exams/[examId]/results` | Review attempts and integrity counts |
| `/api/student/exams` | List exams assigned to the student |
| `/api/student/exams/[examId]` | View and start an assigned exam |
| `/api/student/exams/[examId]/attempt` | Submit and grade answers |
| `/api/student/exams/[examId]/integrity-events` | Record exam integrity events |
| `/api/student/exams/[examId]/results` | View the student's submitted result |

## Database Changes

Phase 6 added the `ExamAssignment` model and migration:

- `examId` foreign key to `Exam`
- `studentId` foreign key to `User`
- `assignedAt` timestamp
- Unique constraint on `(examId, studentId)`
- Index on `studentId`

Existing models support attempts, answer responses, and integrity events. No additional migration was required for the later Phase 6 feature slices.

## Security Boundaries

- Every lecturer API verifies the lecturer owns the related course or exam.
- Every student API verifies the student owns the assignment or attempt.
- Institution boundaries are checked when assigning students.
- Correct answers are excluded from student question payloads.
- Scores are calculated server-side.
- Attempt uniqueness is enforced both in application logic and by the database constraint.
- Integrity events cannot be written for another student's attempt.
- Input is validated with Zod before database writes.
- Prisma parameterizes database operations.

## Verification Results

| Check | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| Question-bank creation | Pass |
| Objective-question validation | Pass |
| Draft exam creation | Pass |
| Invalid exam window rejection | Pass |
| Student assignment visibility | Pass |
| Duplicate assignment protection | Pass |
| One-time exam start | Pass |
| Safe question payload | Pass |
| Normal answer submission | Pass |
| Duplicate submission rejection | Pass |
| Server auto-submission | Pass |
| Student result visibility | Pass |
| Lecturer result review | Pass |
| Integrity-event logging | Pass |

## Known Limitations

- Short-answer manual grading is not implemented.
- Exam status publishing and lecturer activation workflows remain minimal; test fixtures used `ACTIVE` status for runtime verification.
- Rate limiting is not implemented and is required before production deployment.
- Automated unit and integration tests are planned for Phase 8.
- Client event logging is best-effort; the server remains the authority for attempt deadlines and scores.
- The development server can have slow cold starts on the local environment.

## Definition of Done

Phase 6 is complete for the implemented MVP slices: lecturers can create content and exams, assign students, students can start and submit assigned exams, objective answers are graded server-side, results are scoped by role, and integrity events are recorded for review.

**Next phase:** Phase 7 - UI/UX refinement, accessibility, responsive behavior, and consistent interaction states.  
**Approval status:** Waiting for approval before Phase 7 implementation.
