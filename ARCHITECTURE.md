# People of Cornwall — System Architecture

> A living digital museum and community archive of Cornish stories.

---

## 0. Manifesto

> Most platforms are built to make people scroll faster.  
> This platform is built to help people remember.

**People of Cornwall** exists to preserve voices, memories, and lived experiences that would otherwise disappear in social media feeds.

### Core Beliefs

| Belief | Meaning |
|--------|---------|
| Stories are artefacts, not content | Each story is a permanent cultural record |
| Communities are participants, not audiences | Contributors shape the archive |
| Memory is identity, not nostalgia | Preserving who we are |
| Technology supports human judgement | AI assists, never decides |
| Slowness is a feature | Built to last, not to go viral |

The platform is intentionally **calm**, **curated**, and **human**.

---

## 1. Brand Identity

### Brand Essence

> "A living archive of Cornish voices."

### Emotional Tone

- Warm
- Respectful
- Intimate
- Editorial
- Non-corporate
- Anti-social-media

### Visual Identity

Minimalist editorial aesthetic inspired by Medium and cultural archives.  
**80–90% neutral colours** with subtle Cornwall-inspired accents.

### Colour Palette

| Name | Hex | Usage |
|------|-----|-------|
| Chalk White | `#F7F6F2` | Primary background |
| Slate Grey | `#2F2F2F` | Primary text |
| Atlantic Blue | `#1F4E5F` | Primary accent, links |
| Copper Clay | `#B45A3C` | Secondary accent, CTAs |
| Sea Foam | `#A7C7C5` | Subtle highlights |
| Moss Green | `#5F6F52` | Success states, tags |

### Typography

| Context | Font Stack | Fallback |
|---------|------------|----------|
| Stories/Content | Source Serif Pro, Playfair Display | Georgia, serif |
| UI/Interface | Inter, Geist | system-ui, sans-serif |

### Microcopy Style

| Instead of... | We say... |
|---------------|-----------|
| "Post" | "Share a story" |
| "Submit" | "Send for review" |
| "Posted" | "Recorded in…" |
| "Content" | "Stories" |
| "Users" | "Contributors" |
| "Feed" | "Recent stories" |

---

## 2. Digital Museum Philosophy

The platform must feel like a **slow digital museum**, not a feed.

### UX Principles

| Principle | Implementation |
|-----------|----------------|
| Anti-infinite-scroll | Paginated, intentional navigation |
| Editorial hierarchy | Curated prominence, not chronological |
| Stories as artefacts | Permanent, respectful presentation |
| Time & place navigation | Map and timeline as primary discovery |
| Calm interactions | No gamification, no engagement tricks |

### Homepage as Museum Rooms

```
┌─────────────────────────────────────────────────────────────┐
│                    PEOPLE OF CORNWALL                        │
│                    ═══════════════════                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           FEATURED EXHIBITION                        │    │
│  │           [Hero Story with Image]                    │    │
│  │           "The Last Fisherman of Mousehole"          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Recently   │ │  Stories    │ │  Stories    │           │
│  │  Shared     │ │  by Place   │ │  by Time    │           │
│  │  ─────────  │ │  ─────────  │ │  ─────────  │           │
│  │  [Cards]    │ │  [Map]      │ │  [Timeline] │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                              │
│  ┌─────────────────────┐ ┌─────────────────────┐           │
│  │  Collections        │ │  Community Prompts   │           │
│  │  ───────────        │ │  ─────────────────   │           │
│  │  [Themed groups]    │ │  [Writing invites]   │           │
│  └─────────────────────┘ └─────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Story Page as Artefact

| Element | Museum Metaphor |
|---------|-----------------|
| Title | Plaque |
| Author | Signature |
| Date | Historical marker |
| Location | Provenance |
| Media | Exhibits |
| Tags | Archive labels |
| AI Summary | Curator's note |

---

## 3. Product Identity

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Community-driven | 60% | Real people sharing authentic stories |
| Editorial/Storytelling | 30% | Curated quality over viral engagement |
| Archival | 10% | Preserving cultural heritage (future) |

### Guiding Principles

- **Minimalist UX** — Every element earns its place
- **Human stories over algorithms** — No engagement-maximizing feeds
- **AI assists, never decides** — Tools for creators, not gatekeepers
- **Curated moderation** — Editorial judgment, not automation
- **Calm design** — Respectful of attention and culture

---

## 4. Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│  Next.js 14 (App Router) + TypeScript + Tailwind + Shadcn UI        │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  Home    │ │  Story   │ │  Editor  │ │  Profile │ │  Admin   │  │
│  │  Page    │ │  Reader  │ │  Writer  │ │  Dash    │ │  Panel   │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE PLATFORM                            │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │    Auth     │  │  Postgres   │  │   Storage   │  │   Edge     │ │
│  │  (OAuth +   │  │  Database   │  │   (Media)   │  │  Functions │ │
│  │   Email)    │  │             │  │             │  │   (AI)     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐                                   │
│  │  Realtime   │  │  Full-Text  │                                   │
│  │ (Comments)  │  │   Search    │                                   │
│  └─────────────┘  └─────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                             │
│                                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   OpenAI    │  │   Resend    │  │   Mapbox    │                  │
│  │   (LLM)     │  │   (Email)   │  │   (Maps)    │                  │
│  └─────────────┘  └─────────────┘  └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 | App Router, SSR, API routes |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| Shadcn UI | Accessible component primitives |
| React Query | Server state management |
| Leaflet/Mapbox | Interactive maps |
| Tiptap | Rich text editor |

### Backend (Supabase)
| Service | Purpose |
|---------|---------|
| Auth | Google, Facebook, Email authentication |
| Postgres | Primary database |
| Storage | Media files (images, audio, video) |
| Edge Functions | AI processing, webhooks |
| Realtime | Live comments, notifications |

### AI & Search
| Service | Purpose |
|---------|---------|
| OpenAI GPT-4 | Summaries, tags, moderation |
| Supabase FTS | Full-text search with pg_trgm |

### Email
| Service | Purpose |
|---------|---------|
| Resend | Transactional emails |

---

## 6. Module Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│   Auth   │  Story   │  Media   │Community │     Admin      │
│  Module  │  Module  │  Module  │  Module  │    Module      │
├──────────┴──────────┴──────────┴──────────┴────────────────┤
│                      SHARED SERVICES                         │
├──────────┬──────────┬──────────┬──────────────────────────┤
│    AI    │  Search  │   Map    │      Notifications        │
│  Module  │  Module  │  Module  │        Module             │
├──────────┴──────────┴──────────┴──────────────────────────┤
│                    DATA ACCESS LAYER                         │
│                  (Supabase Client + RLS)                     │
└─────────────────────────────────────────────────────────────┘
```

### Module Responsibilities

| Module | Responsibilities |
|--------|-----------------|
| **Auth** | Login/logout, session management, profile CRUD |
| **Story** | Create, edit, submit, publish lifecycle |
| **Media** | Upload, optimize, attach to stories |
| **Community** | Comments, likes, sharing |
| **Admin** | Review queue, moderation, collections |
| **AI** | Summaries, tags, toxicity detection |
| **Search** | Full-text search, filters |
| **Map** | Geographic story visualization |

---

## 7. Database Schema

### Enums

```sql
CREATE TYPE story_status AS ENUM (
  'draft',
  'review',
  'published',
  'rejected',
  'unpublished'
);

CREATE TYPE media_type AS ENUM (
  'image',
  'video',
  'audio'
);

CREATE TYPE comment_status AS ENUM (
  'visible',
  'hidden',
  'flagged'
);

CREATE TYPE user_role AS ENUM (
  'user',
  'admin'
);
```

### Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   stories    │       │    media     │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │◄──────│ author_id    │───────►│ story_id    │
│ email        │       │ id (PK)      │◄──────│ id (PK)      │
│ display_name │       │ title        │       │ type         │
│ avatar_url   │       │ body         │       │ url          │
│ role         │       │ status       │       │ caption      │
│ created_at   │       │ anonymous    │       │ order_index  │
└──────────────┘       │ location_*   │       └──────────────┘
       │               │ timeline_*   │
       │               │ ai_summary   │
       │               │ ai_tags[]    │
       │               └──────────────┘
       │                      │
       │                      │
       ▼                      ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   comments   │       │    likes     │       │ collections  │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ story_id     │       │ story_id     │       │ title        │
│ user_id      │       │ user_id      │       │ description  │
│ body         │       │ created_at   │       │ created_at   │
│ status       │       │ UNIQUE(s,u)  │       └──────────────┘
│ created_at   │       └──────────────┘              │
└──────────────┘                                     │
                                                     ▼
                                        ┌────────────────────┐
                                        │ story_collections  │
                                        ├────────────────────┤
                                        │ story_id (PK,FK)   │
                                        │ collection_id      │
                                        │   (PK,FK)          │
                                        └────────────────────┘
```

### Tables

```sql
-- Users (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_display_name TEXT,
  anonymous BOOLEAN DEFAULT FALSE,
  status story_status DEFAULT 'draft',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  timeline_year INT,
  timeline_decade INT,
  location_name TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  ai_summary TEXT,
  ai_tags TEXT[],
  soft_deleted BOOLEAN DEFAULT FALSE
);

-- Media
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  type media_type NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  order_index INT DEFAULT 0
);

-- Comments
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status comment_status DEFAULT 'visible',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Likes
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

-- Collections
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Story Collections (junction)
CREATE TABLE story_collections (
  story_id UUID REFERENCES stories(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  PRIMARY KEY (story_id, collection_id)
);
```

### Indexes

```sql
-- Full-text search
CREATE INDEX idx_stories_fts ON stories 
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(body, '')));

-- Common filters
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_stories_timeline ON stories(timeline_year, timeline_decade);
CREATE INDEX idx_stories_location ON stories(location_name);
CREATE INDEX idx_stories_author ON stories(author_id);

-- Tags
CREATE INDEX idx_stories_tags ON stories USING GIN(ai_tags);

-- Soft delete filter
CREATE INDEX idx_stories_not_deleted ON stories(soft_deleted) WHERE soft_deleted = FALSE;
```

---

## 8. Row Level Security (RLS)

### Stories RLS

```sql
-- Enable RLS
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

-- Anyone can read published stories
CREATE POLICY "Public can read published stories"
  ON stories FOR SELECT
  USING (status = 'published' AND soft_deleted = FALSE);

-- Users can read their own stories
CREATE POLICY "Users can read own stories"
  ON stories FOR SELECT
  USING (auth.uid() = author_id);

-- Users can create drafts
CREATE POLICY "Users can create drafts"
  ON stories FOR INSERT
  WITH CHECK (auth.uid() = author_id AND status = 'draft');

-- Users can update own non-published stories
CREATE POLICY "Users can update own stories"
  ON stories FOR UPDATE
  USING (auth.uid() = author_id AND status != 'published')
  WITH CHECK (auth.uid() = author_id);

-- Admins can do everything
CREATE POLICY "Admins have full access"
  ON stories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

### Comments RLS

```sql
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible comments
CREATE POLICY "Public can read visible comments"
  ON comments FOR SELECT
  USING (status = 'visible');

-- Authenticated users can create comments
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage comments
CREATE POLICY "Admins manage comments"
  ON comments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

### Likes RLS

```sql
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Anyone can read likes
CREATE POLICY "Public can read likes"
  ON likes FOR SELECT
  USING (TRUE);

-- Users can like
CREATE POLICY "Users can like"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike
CREATE POLICY "Users can unlike"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 9. Story Lifecycle

```
                    ┌───────────┐
                    │   START   │
                    └─────┬─────┘
                          │
                          ▼
                    ┌───────────┐
        ┌──────────►│   DRAFT   │◄──────────┐
        │           └─────┬─────┘           │
        │                 │                 │
        │            [Submit]               │
        │                 │                 │
        │                 ▼                 │
        │           ┌───────────┐           │
        │           │  REVIEW   │           │
        │           └─────┬─────┘           │
        │                 │                 │
        │      ┌──────────┴──────────┐      │
        │      │                     │      │
        │ [Reject]              [Approve]   │
        │      │                     │      │
        │      ▼                     ▼      │
        │ ┌───────────┐       ┌───────────┐ │
        │ │ REJECTED  │       │ PUBLISHED │ │
        │ └─────┬─────┘       └─────┬─────┘ │
        │       │                   │       │
        │  [Edit]              [Unpublish]  │
        │       │                   │       │
        │       │                   ▼       │
        │       │           ┌─────────────┐ │
        └───────┴───────────│ UNPUBLISHED ├─┘
                            └─────┬───────┘
                                  │
                             [Delete]
                                  │
                                  ▼
                           ┌────────────┐
                           │  DELETED   │
                           │(soft_del)  │
                           └────────────┘
```

### State Transition Rules

| From | To | Actor | Condition |
|------|-----|-------|-----------|
| — | draft | User | Create new story |
| draft | review | User | Submit for review |
| draft | deleted | User | Delete draft |
| review | published | Admin | Approve story |
| review | rejected | Admin | Reject with feedback |
| published | unpublished | User | Unpublish to edit |
| unpublished | review | User | Resubmit after edit |
| unpublished | deleted | User | Delete story |
| rejected | draft | User | Edit to resubmit |

---

## 10. AI System

### Edge Function Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AI Edge Functions                      │
│                                                          │
│  /functions                                              │
│    ├── summarize-story/                                  │
│    │     └── index.ts    → OpenAI GPT-4                 │
│    ├── extract-tags/                                     │
│    │     └── index.ts    → OpenAI GPT-4                 │
│    ├── moderate-content/                                 │
│    │     └── index.ts    → OpenAI GPT-4                 │
│    └── moderate-comment/                                 │
│          └── index.ts    → OpenAI GPT-4                 │
└─────────────────────────────────────────────────────────┘
```

### AI Prompts

**Story Summary**
```
You are an editorial assistant for a cultural storytelling platform about Cornwall.

Summarise the following story in 2–3 sentences.
Preserve the author's voice and emotional tone.
Focus on the human experience, not just facts.

Story:
{content}
```

**Tag Extraction**
```
Extract relevant tags from this Cornwall story.
Include: places, themes, time periods, cultural elements.
Avoid generic tags like "story" or "Cornwall".
Return as JSON array: ["tag1", "tag2", ...]

Story:
{content}
```

**Content Moderation**
```
Analyse this story for:
1. Hate speech or discrimination
2. Spam or promotional content
3. Content unrelated to Cornwall or personal stories
4. Privacy violations

Return JSON:
{
  "safe": boolean,
  "risk_score": 0-100,
  "issues": ["issue1", ...],
  "explanation": "..."
}

Story:
{content}
```

---

## 11. Folder Structure

```
/people-of-cornwall
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── stories/
│   │   ├── page.tsx               # Story listing
│   │   └── [id]/page.tsx          # Story reader
│   ├── write/
│   │   ├── page.tsx               # New story
│   │   └── [id]/page.tsx          # Edit story
│   ├── profile/
│   │   └── page.tsx
│   ├── admin/
│   │   ├── page.tsx               # Dashboard
│   │   ├── review/page.tsx        # Review queue
│   │   ├── stories/[id]/page.tsx  # Story moderation
│   │   └── collections/page.tsx
│   └── api/
│       └── ...                    # API routes if needed
├── components/
│   ├── ui/                        # Shadcn components
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── nav.tsx
│   ├── story/
│   │   ├── story-card.tsx
│   │   ├── story-reader.tsx
│   │   ├── story-editor.tsx
│   │   └── story-status.tsx
│   ├── community/
│   │   ├── comments.tsx
│   │   ├── like-button.tsx
│   │   └── share-button.tsx
│   ├── map/
│   │   ├── story-map.tsx
│   │   └── location-picker.tsx
│   └── admin/
│       ├── review-queue.tsx
│       └── moderation-panel.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── ai/
│   │   └── client.ts
│   ├── search/
│   │   └── queries.ts
│   └── utils.ts
├── hooks/
│   ├── use-story.ts
│   ├── use-auth.ts
│   └── use-comments.ts
├── types/
│   ├── database.ts                # Generated from Supabase
│   └── index.ts
├── styles/
│   └── globals.css
├── supabase/
│   ├── migrations/
│   └── functions/
│       ├── summarize-story/
│       ├── extract-tags/
│       └── moderate-content/
├── public/
├── .env.local
├── tailwind.config.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 12. Design System

### Color Palette (CSS Variables)

```css
:root {
  /* Brand Colours — Cornwall-inspired */
  --chalk-white: #F7F6F2;         /* Primary background */
  --slate-grey: #2F2F2F;          /* Primary text */
  --atlantic-blue: #1F4E5F;       /* Primary accent, links */
  --copper-clay: #B45A3C;         /* Secondary accent, CTAs */
  --sea-foam: #A7C7C5;            /* Subtle highlights */
  --moss-green: #5F6F52;          /* Success states, tags */
  
  /* Extended palette */
  --chalk-white-dark: #EDECEA;    /* Hover background */
  --slate-grey-light: #5A5A5A;    /* Secondary text */
  --atlantic-blue-light: #2A6A7F; /* Link hover */
  --copper-clay-light: #C97A5E;   /* CTA hover */
  
  /* Semantic */
  --color-success: var(--moss-green);
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-info: var(--atlantic-blue);
}
```

### Typography

```css
:root {
  /* Font families */
  --font-serif: 'Source Serif Pro', 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', 'Geist', system-ui, sans-serif;
  
  /* Usage */
  --font-story: var(--font-serif);   /* Story content */
  --font-ui: var(--font-sans);       /* Interface elements */
}

/* Type Scale (fluid) */
--text-xs: clamp(0.7rem, 0.65rem + 0.25vw, 0.75rem);
--text-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
--text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
--text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);
--text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
--text-2xl: clamp(1.5rem, 1.25rem + 1vw, 2rem);
--text-3xl: clamp(1.875rem, 1.5rem + 1.5vw, 2.5rem);
--text-4xl: clamp(2.25rem, 1.75rem + 2vw, 3rem);
--text-5xl: clamp(3rem, 2.25rem + 3vw, 4rem);

/* Line heights */
--leading-tight: 1.2;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

### Spacing

```css
--space-1: 0.25rem;      /* 4px */
--space-2: 0.5rem;       /* 8px */
--space-3: 0.75rem;      /* 12px */
--space-4: 1rem;         /* 16px */
--space-6: 1.5rem;       /* 24px */
--space-8: 2rem;         /* 32px */
--space-12: 3rem;        /* 48px */
--space-16: 4rem;        /* 64px */
--space-24: 6rem;        /* 96px */
--space-32: 8rem;        /* 128px */
```

### Component Patterns

| Component | Style |
|-----------|-------|
| Cards | Chalk white bg, subtle shadow, rounded-lg, generous padding |
| Buttons | Minimal, Atlantic Blue primary, Copper Clay secondary |
| Forms | Slate grey borders, focus ring with Atlantic Blue |
| Story Text | Serif, relaxed line-height, max-w-prose |
| UI Text | Sans-serif, normal line-height |

### Museum-Inspired Patterns

| Pattern | Description |
|---------|-------------|
| Artefact Card | Story preview with plaque-like typography |
| Exhibition Hero | Full-width featured story with image backdrop |
| Gallery Grid | Masonry-style story collection |
| Timeline Rail | Horizontal decade navigation |
| Map Overlay | Story pins on Cornwall geography |
| Curator Note | AI summary in muted, italic style |

---

## 13. User Roles & Permissions

| Action | Visitor | Contributor | Admin |
|--------|---------|-------------|-------|
| Browse published stories | ✓ | ✓ | ✓ |
| Search & filter | ✓ | ✓ | ✓ |
| View map & timeline | ✓ | ✓ | ✓ |
| Create account | ✓ | — | — |
| Create stories | — | ✓ | ✓ |
| Edit own stories | — | ✓ | ✓ |
| Delete own unpublished | — | ✓ | ✓ |
| Like stories | — | ✓ | ✓ |
| Comment on stories | — | ✓ | ✓ |
| Review queue access | — | — | ✓ |
| Approve/reject stories | — | — | ✓ |
| Moderate comments | — | — | ✓ |
| Manage collections | — | — | ✓ |
| Feature stories | — | — | ✓ |

---

## 14. API Design

### Story Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /stories | List published stories |
| GET | /stories/:id | Get story by ID |
| POST | /stories | Create draft |
| PATCH | /stories/:id | Update story |
| POST | /stories/:id/submit | Submit for review |
| POST | /stories/:id/unpublish | Unpublish story |
| DELETE | /stories/:id | Soft delete |

### Admin Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/review | Get review queue |
| POST | /admin/stories/:id/approve | Approve story |
| POST | /admin/stories/:id/reject | Reject with feedback |
| PATCH | /admin/stories/:id/feature | Toggle featured |

### Search

| Method | Path | Description |
|--------|------|-------------|
| GET | /search?q=&filters= | Full-text search |

---

## 15. Security Considerations

1. **Authentication**: Supabase Auth with OAuth (Google, Facebook) and email
2. **Authorization**: Row Level Security at database level
3. **Input Validation**: Zod schemas for all inputs
4. **XSS Prevention**: React's built-in escaping + DOMPurify for rich text
5. **CSRF**: Supabase handles via secure cookies
6. **Rate Limiting**: Supabase Edge Functions limits + custom throttling
7. **File Upload**: Type validation, size limits, virus scanning consideration

---

## 16. Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Score | > 90 |
| Core Web Vitals | Pass |

### Optimizations

- SSR for story pages (SEO + performance)
- Image optimization via Next.js Image
- Incremental Static Regeneration for popular stories
- Edge caching for public content
- Lazy loading for maps and media

---

## 17. Monitoring & Analytics

| Tool | Purpose |
|------|---------|
| Vercel Analytics | Performance monitoring |
| Supabase Dashboard | Database metrics |
| Sentry | Error tracking |
| Simple Analytics | Privacy-respecting analytics |

---

*Last updated: January 2026*
