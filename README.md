# Payline Docs

Payline Docs is an internal document management system (DMS) for Payline, built with Next.js App Router and focused on secure document storage, role-aware access control, and team collaboration.

## Key Features

- Secure authentication with **Clerk**
- Private document uploads using **UploadThing**
- Metadata and access control powered by **Prisma** + **PostgreSQL**
- Client-side data fetching via **TanStack Query**
- Lightweight UI state with **Zustand**
- Modular repository pattern in `repository/`
- Consistent UI with **Shadcn** and shared design system components

## Tech Stack

- **Next.js 15+**
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Prisma**
- **Clerk**
- **UploadThing**
- **Zod**
- **Radix UI**

## Getting Started

### Prerequisites

- Node.js 20+ (recommended)
- npm
- PostgreSQL or database connection for Prisma
- Clerk account and configuration
- UploadThing configuration for private file storage

### Install dependencies

```bash
npm install
```

### Set up environment

Create a `.env` file with the required values for Clerk, Prisma, and UploadThing. Example values may include:

```env
NEXT_PUBLIC_CLERK_FRONTEND_API=
CLERK_API_KEY=
DATABASE_URL=
UPLOADTHING_API_KEY=
```

### Run locally

```bash
npm run dev
```

Open http://localhost:3000 to view the app.

## Database

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

## Available Scripts

- `npm run dev` — start the Next.js development server
- `npm run build` — build the production app
- `npm run start` — start the production server
- `npm run lint` — run ESLint
- `npm run prisma:generate` — generate Prisma client
- `npm run prisma:migrate` — run Prisma migrations

## Project Structure

- `app/` — Next.js App Router pages and API routes
- `components/` — UI components and shared client modules
- `repository/` — API repository modules for client-side data access
- `lib/` — server utilities and shared logic
- `prisma/` — Prisma schema and migrations
- `store/` — Zustand app state stores
- `types/` — shared TypeScript types

## Notes

This repo is configured for use with the Payline Docs GitHub remote at `https://github.com/payline-co/payline-docs.git`.

## Contributing

For changes, follow the existing conventions in `.agent/` and append a changelog entry in `.agent/guide/CHANGELOG.md` after updating the code.
