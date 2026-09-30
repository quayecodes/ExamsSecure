# ExamSecure

ExamSecure is a secure online examination platform for schools and institutions. This repository is currently in Phase 4: project initialization and environment setup.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- NextAuth for authentication

## Local setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Run database migrations when PostgreSQL is available: `npx prisma migrate dev`
4. Start local development: `npm run dev`

## Git conventions

- Branch names: `feature/<name>`, `fix/<name>`, `chore/<name>`, `docs/<name>`
- Commit style: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`

## Notes

This project intentionally does not implement business features yet. The current focus is infrastructure, configuration, and a clean, extensible foundation for the future Auth and exam features.
