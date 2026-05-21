# System Architecture

## Architecture principle

One operational object model powers every view.

```txt
Cards are the primary business object.
Views are filtered renderings of the same data.
AI tools operate on approved domain functions.
```

## Main layers

### 1. Frontend layer

- Next.js app router
- Tailwind
- shadcn/ui
- drag/drop Kanban components
- AI command components
- realtime board updates

### 2. Backend/API layer

- Next.js API routes
- Supabase client/server helpers
- domain services
- AI command endpoint
- tool executor

### 3. Database layer

- PostgreSQL
- Supabase RLS
- activity logs
- AI tool-call logs
- operational records

### 4. AI layer

- Gemini 2.5 Flash
- tool registry
- context loader
- risk classifier
- approval engine
- memory loader
- audit logging

### 5. Realtime layer

- board updates
- card movement
- notifications
- AI action results

## Data flow

```txt
User action
→ frontend event
→ API/domain service
→ Supabase write
→ activity log
→ realtime update
→ UI refresh
```

## AI action flow

```txt
User command
→ /api/ai/command
→ load user/org/page context
→ load relevant records
→ send prompt + tools to Gemini
→ receive tool request
→ validate with Zod
→ classify risk
→ execute or request approval
→ write activity log
→ return result to UI
```

## Hard rule

AI never writes directly to the database. AI only requests approved tool calls.
