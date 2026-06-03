# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface, Claude generates code via tool calls into a virtual file system, and a live preview renders the result in a sandboxed iframe.

## Commands

```bash
npm run dev          # Dev server with Turbopack
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run test         # Vitest (unit tests)
npm run setup        # Install deps + Prisma generate + migrate
npm run db:reset     # Reset SQLite database
```

Run a single test file: `npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx`

All scripts require `NODE_OPTIONS='--require ./node-compat.cjs'` (already configured in package.json).

## Architecture

### Core Flow

1. User sends a message via `ChatInterface` -> `ChatContext` (wraps Vercel AI SDK `useChat`)
2. Request hits `POST /api/chat` which streams responses from Claude (claude-haiku-4-5) via `streamText()`
3. Claude uses two tools — `str_replace_editor` and `file_manager` — to create/modify files in a `VirtualFileSystem` instance (in-memory, no disk writes)
4. Tool call results flow back to `FileSystemContext`, which updates the virtual FS state
5. `PreviewFrame` transforms the virtual files via Babel (`jsx-transformer.ts`), builds an import map, and renders them in a sandboxed iframe
6. For authenticated users, project state (messages + file system) is auto-saved to SQLite on chat completion

### Key Abstractions

- **VirtualFileSystem** (`lib/file-system.ts`): In-memory file tree with serialize/deserialize. All AI-generated code lives here — nothing is written to disk.
- **ChatContext** (`lib/contexts/chat-context.tsx`): Wraps `useChat()` hook, manages message state, dispatches tool call results to FileSystemContext.
- **FileSystemContext** (`lib/contexts/file-system-context.tsx`): Provides the virtual FS to all components; handles tool call processing.
- **JSX Transformer** (`lib/transform/jsx-transformer.ts`): Babel standalone compilation + import map generation. Resolves `@/` aliases, creates blob URLs for local modules, proxies third-party packages through esm.sh.

### Auth

JWT tokens in HTTP-only cookies (7-day expiry) using `jose`. Middleware protects `/api/projects` and `/api/filesystem`. The chat endpoint (`/api/chat`) is public — anonymous users can generate components but projects aren't persisted unless they sign up. Server actions in `src/actions/` handle signup/signin/signout.

### AI Provider

Set `ANTHROPIC_API_KEY` in `.env` for real generation. Without it, a `MockLanguageModel` in `lib/provider.ts` produces hardcoded component responses for development.

### Database

SQLite via Prisma. Schema in `prisma/schema.prisma`. Prisma client is generated to `src/generated/prisma`. Projects store messages and file system state as JSON strings.

## Tech Stack

- **Next.js 15** (App Router, React 19, Turbopack)
- **Tailwind CSS v4** + **shadcn/ui** (new-york style, Radix primitives)
- **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`)
- **Prisma** (SQLite)
- **Monaco Editor** for code editing
- **Vitest** + Testing Library (jsdom environment)

## Conventions

- Path alias: `@/*` maps to `src/*`
- shadcn/ui components live in `src/components/ui/`
- Tests are colocated in `__tests__/` directories next to the code they test
- Server actions are in `src/actions/`
- The system prompt for Claude's component generation is in `lib/prompts/generation.tsx`
- Use comments sparingly. Only comment complex code that isn't self-explanatory.
