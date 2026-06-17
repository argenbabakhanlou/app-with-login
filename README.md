# app-with-login

A demo app showcasing a full-stack Next.js authentication and CRUD flow. Built to demonstrate proficiency with the App Router, server actions, database modeling, and testing — not intended for production use.

**Preview:** https://app-with-login.vercel.app/

**Test login:**

- Email: `test.user-abc@example.com`
- Password: `password`

## Tech stack

- **Next.js 16 (App Router)** — server actions for forms (login, register, sign out) and the `proxy.ts` convention for route protection, avoiding a separate API layer for simple mutations.
- **Auth.js v5 (next-auth beta) + Credentials provider** — JWT-based sessions with a custom `authorize` callback against the local `User` table, demonstrating auth wired up without an external identity provider.
- **Prisma 7 + Neon (serverless Postgres)** — type-safe queries and migrations; Neon was chosen for a zero-maintenance, free-tier Postgres instance suited to a demo project.
- **bcryptjs** — password hashing (12 salt rounds) on registration.
- **TanStack React Query** — client-side cache and optimistic updates for the notes CRUD UI, to show data-fetching patterns beyond plain server-rendered pages.
- **Tailwind CSS v4** — utility-first styling, fast to iterate with for a small UI surface.
- **Vitest + React Testing Library** — unit tests for client components, API route handlers, and server components (see [Testing](#testing)).
- **Vercel** — deployment target; chosen because it has first-class support for Next.js 16's newer conventions (e.g. `proxy.ts`).

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with:
   ```
   DATABASE_URL="postgresql://..."   # a Postgres connection string (e.g. from Neon)
   AUTH_SECRET="..."                  # generate with: npx auth secret
   ```
3. Apply the schema to your database:
   ```bash
   npx prisma migrate dev
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```

## Testing

Run the unit test suite (Vitest):

```bash
npm test          # run once
npm run test:watch
```

Tests cover the notes client component, the notes API routes, the submit button's pending state, and the header component — see [components](components) and [app/api](app/api) for the corresponding `*.test.ts(x)` files.

Tests run automatically on push and pull request via GitHub Actions (see [.github/workflows/test.yml](.github/workflows/test.yml)), and `main` is protected so a failing test blocks merging.

## Commits

All commits must be prefixed with one of: `feat:`, `chore:`, `fix:`, `test:`, `config:`.
