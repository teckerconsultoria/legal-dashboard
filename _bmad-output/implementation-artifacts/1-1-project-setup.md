---
status: done
story_id: 1-1-project-setup
epic_id: epic-1
priority: high
---

# Story 1.1: Project Setup

As a developer,
I want a Next.js 16.2 project with Supabase integration,
So that I can build the dashboard features.

## Implementation Specification

### Stack
- **Framework:** Next.js 16.2 (App Router)
- **Database:** Supabase v2.101
- **Styling:** Tailwind CSS
- **State:** React Query + Zustand

### File Structure

```
/app
  /layout.tsx       - Root layout
  /page.tsx        - Homepage (OAB selector)
  /api/           - API routes
/components
  /ui/            - Reusable UI
/lib
  /supabase.ts    - Supabase client
  /escavador.ts   - Escavador API client
/types
  /index.ts       - TypeScript types
```

### Tasks

1. Initialize Next.js 16.2 project with TypeScript
2. Install dependencies: @supabase/supabase-js, @tanstack/react-query, zustand
3. Configure Tailwind CSS
4. Set up Supabase client
5. Create type definitions

### Acceptance Criteria

**Given** a clean development environment
**When** I run `npm run dev`
**Then** the development server starts without errors
**And** TypeScript compiles without errors
**And** The homepage renders at `/`