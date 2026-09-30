# ExamSecure

ExamSecure is a secure online examination platform for schools, universities, and training organizations. It is designed to reduce the administrative cost of paper-based examinations while treating authentication, authorization, exam timing, and auditability as first-class requirements.

This portfolio project has completed Phases 1-5: requirements and planning, architecture, database design, project initialization, and authentication/RBAC. Core examination workflows are intentionally not implemented yet.

## Project goals

- Give administrators controlled account and institution management.
- Give lecturers tools to build, schedule, and review examinations.
- Give students a timed, server-controlled examination experience.
- Preserve security and auditability across examination actions.

## Technology

| Area | Technology | Purpose |
| --- | --- | --- |
| Application | Next.js 14 App Router | Full-stack React application and route handlers |
| Language | TypeScript | Static typing across frontend and backend code |
| Styling | Tailwind CSS | Consistent utility-based styling |
| Database | PostgreSQL | Relational storage for users, exams, attempts, and grading |
| ORM | Prisma | Type-safe queries and migrations |
| Authentication | NextAuth Credentials + JWT | Password login, sessions, and role claims |
| Validation | Zod | Server-side request validation |
| Password hashing | bcryptjs, cost factor 12 | One-way password hashing |

## Current status

### Completed

- Requirements, personas, MVP boundary, and non-functional targets.
- Architecture and OWASP-focused security decisions.
- Normalized Prisma database schema and PostgreSQL migration.
- Next.js, TypeScript, Tailwind, Prisma, and environment configuration.
- Student registration with validated input.
- Credentials login and logout through NextAuth.
- Two-hour JWT sessions with role claims.
- Server-side route protection for admin, lecturer, and student areas.
- Manual authentication verification for registration, login, session claims, RBAC, and logout.

### Next

Phase 6 begins with one approved core feature at a time. The planned order is question-bank management, exam creation and scheduling, exam-taking, grading, and results.

## Local setup

### Prerequisites

- Node.js 20 or newer
- npm
- PostgreSQL 14 or newer

### Installation

1. Install dependencies:

	```bash
	npm install
	```

2. Create a local environment file:

	```bash
	cp .env.example .env
	```

	On Windows, copy `.env.example` to `.env` manually if `cp` is unavailable.

3. Set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` in `.env`. Never commit `.env` or real credentials.

4. Apply the database schema and generate Prisma Client:

	```bash
	npx prisma migrate dev
	```

5. Start the development server:

	```bash
	npm run dev
	```

Open `http://localhost:3000` in a browser.

## Verification commands

```bash
npm run typecheck
npm run lint
npm run build
```

Useful database commands:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

## Project structure

```text
src/app/       Next.js pages and API route handlers
src/lib/       Shared server-side services such as Prisma and authentication
src/types/     TypeScript module augmentations
prisma/        Prisma schema and database migrations
docs/          Requirements, architecture, database, and phase implementation records
```

## Security notes

- Passwords are never stored in plaintext; bcrypt cost factor 12 is used.
- Sessions use JWTs in HttpOnly cookies and expire after two hours.
- Role checks are enforced in server middleware, not only in the user interface.
- Registration and login errors avoid revealing whether an email exists.
- Prisma parameterizes database queries; raw SQL is not used by the authentication flow.
- Production deployments must use HTTPS, a rotated strong `NEXTAUTH_SECRET`, and managed secret storage.

Known risks and future hardening, including brute-force rate limiting and broader automated security tests, are tracked in the Phase 4-5 documentation.

## Documentation

- [Requirements, architecture, and database design](docs/Phase1-3%20Requirements,Architecture,%20and%20Database%20Design.md)
- [Project initialization and authentication](docs/Phase4-5%20Project%20Initialization%20and%20Authentication.md)
- [Development contract and phase rules](context.md)

## Git conventions

- Branches: `feature/<name>`, `fix/<name>`, `chore/<name>`, `docs/<name>`
- Commits: Conventional Commits such as `feat:`, `fix:`, `refactor:`, `test:`, and `docs:`
- Every implementation commit should be accompanied by a relevant verification command.

## Scope exclusions

The MVP does not include webcam proctoring, AI monitoring, payments, native mobile applications, or multi-institution SaaS tenancy.
