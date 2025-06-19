# Med Writer - File Structure Documentation

## Current Existing Files (✅ Complete)

### Database & Schema
- ✅ `db/db.ts` - Database connection and schema configuration
- ✅ `db/schema/index.ts` - Schema exports (profiles, todos)
- ✅ `db/schema/profiles-schema.ts` - User profiles schema
- ✅ `db/schema/todos-schema.ts` - Todo items schema
- ✅ `db/migrations/` - Drizzle migration files (auto-generated)

### Actions (Server Actions)
- ✅ `actions/db/profiles-actions.ts` - Profile CRUD operations
- ✅ `actions/db/todos-actions.ts` - Todo CRUD operations
- ✅ `actions/stripe-actions.ts` - Stripe payment actions

### Types
- ✅ `types/index.ts` - Type exports
- ✅ `types/server-action-types.ts` - ActionState type definition

### Authentication & Middleware
- ✅ `middleware.ts` - Route protection with Clerk
- ✅ `app/(auth)/layout.tsx` - Auth layout
- ✅ `app/(auth)/login/[[...login]]/page.tsx` - Login page
- ✅ `app/(auth)/signup/[[...signup]]/page.tsx` - Signup page

### Existing App Routes
- ✅ `app/layout.tsx` - Root layout with Clerk provider
- ✅ `app/globals.css` - Global styles
- ✅ `app/todo/layout.tsx` - Todo section layout
- ✅ `app/todo/page.tsx` - Todo list page
- ✅ `app/todo/_components/todo-list.tsx` - Todo list component

### API Routes
- ✅ `app/api/stripe/webhooks/route.ts` - Stripe webhook handler

### Components (UI Library)
- ✅ `components/ui/` - Complete shadcn/ui component library (40+ components)
- ✅ `components/header.tsx` - App header with navigation
- ✅ `components/sidebar/` - Sidebar components (app-sidebar, nav-*)
- ✅ `components/landing/` - Landing page components
- ✅ `components/magicui/` - Magic UI components
- ✅ `components/utilities/` - Utility components (providers, theme, posthog)

### Configuration & Utils
- ✅ `lib/utils.ts` - Utility functions
- ✅ `lib/stripe.ts` - Stripe configuration
- ✅ `lib/hooks/` - Custom hooks
- ✅ `hooks/` - Additional hooks
- ✅ `package.json` - Dependencies and scripts
- ✅ `next.config.mjs` - Next.js configuration
- ✅ `tailwind.config.ts` - Tailwind configuration
- ✅ `tsconfig.json` - TypeScript configuration

---

## Planned Files for Med Writer (🔄 To Be Created)

### Phase 1: OpenAI Integration
- 🔄 `lib/openai.ts` - OpenAI client configuration
- 🔄 `app/api/test-openai/route.ts` - OpenAI API test endpoint
- 🔄 `.env.local` - Updated with OPENAI_API_KEY

### Phase 2: Document Management
- 🔄 `db/schema/documents-schema.ts` - Documents database schema
- 🔄 `actions/db/documents-actions.ts` - Document CRUD operations
- 🔄 `types/document-types.ts` - Document-related interfaces

### Phase 3: Core UI Components
- 🔄 `app/documents/page.tsx` - Main document editor page
- 🔄 `app/documents/layout.tsx` - Document editor layout
- 🔄 `app/documents/_components/three-panel-layout.tsx` - Main resizable layout
- 🔄 `app/documents/_components/document-list-sidebar.tsx` - Left sidebar
- 🔄 `app/documents/_components/content-editable-editor.tsx` - Center editor
- 🔄 `app/documents/_components/grammar-suggestions-sidebar.tsx` - Right sidebar

### Phase 4: Advanced Text Processing
- 🔄 `lib/position-tracker.ts` - Text position tracking utilities
- 🔄 `lib/text-processor.ts` - ContentEditable text processing
- 🔄 `components/editor/error-highlight.tsx` - Error highlighting component
- 🔄 `hooks/use-cursor-position.ts` - Cursor position management hook

### Phase 5: AI Grammar Integration
- 🔄 `actions/ai/grammar-actions.ts` - Grammar checking server actions
- 🔄 `lib/error-parser.ts` - Grammar error parsing utilities
- 🔄 `lib/medical-prompts.ts` - Medical-aware AI prompts
- 🔄 `app/api/grammar-check/route.ts` - Grammar checking API endpoint
- 🔄 `types/grammar-types.ts` - Grammar error and suggestion types

### Phase 6: Error Correction System
- 🔄 `components/editor/error-tooltip.tsx` - Interactive error tooltips
- 🔄 `components/editor/correction-interface.tsx` - Correction acceptance UI
- 🔄 `hooks/use-error-state.ts` - Error state management hook
- 🔄 `lib/position-calculator.ts` - Mathematical position updates

### Phase 7: Readability & Medical Features
- 🔄 `lib/readability-calculator.ts` - Flesch reading-ease calculator
- 🔄 `components/editor/readability-score.tsx` - Readability display
- 🔄 `lib/medical-dictionary.ts` - Medical terminology utilities
- 🔄 `data/medical-terms.json` - Medical vocabulary data

### Phase 8: Performance & State Management
- 🔄 `contexts/document-context.tsx` - Document state management
- 🔄 `contexts/grammar-context.tsx` - Grammar state management
- 🔄 `hooks/use-document-cache.ts` - Document caching hook
- 🔄 `lib/performance-optimizer.ts` - Performance optimization utilities

### Phase 9: Polish & Testing
- 🔄 `components/ui/loading-states.tsx` - Loading state components
- 🔄 `lib/keyboard-shortcuts.ts` - Keyboard shortcut handlers
- 🔄 `components/accessibility/` - Accessibility enhancement components

---

## File Naming Conventions

### Database Files
- Schema files: `{entity}-schema.ts` (e.g., `documents-schema.ts`)
- Action files: `{entity}-actions.ts` (e.g., `documents-actions.ts`)

### Component Files
- Page components: `page.tsx`
- Layout components: `layout.tsx`
- Feature components: `{feature}-{type}.tsx` (e.g., `document-list-sidebar.tsx`)
- UI components: `{component-name}.tsx` (kebab-case)

### Utility Files
- Lib utilities: `{purpose}.ts` (e.g., `position-tracker.ts`)
- Hook files: `use-{purpose}.ts` (e.g., `use-cursor-position.ts`)
- Type files: `{domain}-types.ts` (e.g., `document-types.ts`)

### Route Files
- App routes: `app/{route}/page.tsx`
- API routes: `app/api/{endpoint}/route.ts`
- Component folders: `app/{route}/_components/`

---

## Directory Structure

```
grammarlyV2/
├── actions/
│   ├── db/
│   │   ├── profiles-actions.ts ✅
│   │   ├── todos-actions.ts ✅
│   │   └── documents-actions.ts 🔄
│   ├── ai/
│   │   └── grammar-actions.ts 🔄
│   └── stripe-actions.ts ✅
├── app/
│   ├── (auth)/ ✅
│   ├── api/
│   │   ├── stripe/webhooks/route.ts ✅
│   │   ├── grammar-check/route.ts 🔄
│   │   └── test-openai/route.ts 🔄
│   ├── documents/ 🔄
│   │   ├── page.tsx 🔄
│   │   ├── layout.tsx 🔄
│   │   └── _components/ 🔄
│   ├── todo/ ✅
│   ├── layout.tsx ✅
│   └── globals.css ✅
├── components/
│   ├── ui/ ✅ (complete shadcn library)
│   ├── editor/ 🔄
│   ├── sidebar/ ✅
│   ├── landing/ ✅
│   ├── magicui/ ✅
│   ├── utilities/ ✅
│   └── header.tsx ✅
├── contexts/ 🔄
├── db/
│   ├── schema/
│   │   ├── index.ts ✅
│   │   ├── profiles-schema.ts ✅
│   │   ├── todos-schema.ts ✅
│   │   └── documents-schema.ts 🔄
│   ├── migrations/ ✅
│   └── db.ts ✅
├── docs/
│   ├── phase1.md ✅
│   ├── phase2.md ✅
│   ├── process-task-list.md ✅
│   └── file_structure.md ✅
├── hooks/ ✅
├── lib/
│   ├── hooks/ ✅
│   ├── utils.ts ✅
│   ├── stripe.ts ✅
│   ├── openai.ts 🔄
│   └── [various utilities] 🔄
├── types/
│   ├── index.ts ✅
│   ├── server-action-types.ts ✅
│   ├── document-types.ts 🔄
│   └── grammar-types.ts 🔄
└── [config files] ✅
```

---

## Notes

- ✅ = File exists and is complete
- 🔄 = File needs to be created as part of Med Writer implementation
- All existing files should be preserved and not duplicated
- New files should follow established naming conventions
- Check this document before creating any new files to prevent duplicates 