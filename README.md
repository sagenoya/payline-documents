# Next.js Agent-Ready Boilerplate

This is a premium Next.js foundation designed for modern web development and optimized for collaboration with AI coding assistants.

## Features

- **Next.js 15+** (App Router)
- **Tailwind CSS v4**
- **Shadcn UI** (Generic components included)
- **Modular Repository Pattern**: Clean API interaction in `repository/`.
- **State Management**: Focused Zustand stores in `store/`.
- **Type-Safe Forms**: TanStack Form + Zod.
- **Agent Guide System**: Built-in documentation in `.agent/` for AI context management.

## Getting Started

1. **Clone/Copy** this directory to your new project folder.
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run development server**:
   ```bash
   npm run dev
   ```

## Using the Agent Guide

When working with an AI coding assistant (like Anti-Gravity), direct it to start by reading `.agent/guide/AGENT-INDEX.md`. This will ensure it follows your project's architectural rules and maintains the changelog correctly.
