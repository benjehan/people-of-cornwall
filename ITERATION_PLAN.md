# People of Cornwall — Iteration Plan

> Development roadmap for a living digital museum and community archive.

---

## Manifesto Reminder

> Most platforms are built to make people scroll faster.  
> This platform is built to help people remember.

Every sprint should be evaluated against these principles:
- **Stories are artefacts** — Treat each with permanence and respect
- **Slowness is a feature** — No engagement tricks, no infinite scroll
- **Technology supports humans** — AI assists, never decides
- **Calm over viral** — Built to last, not to trend

---

## Overview

This iteration plan follows a progressive delivery model, building the platform in three major phases with clear milestones. Each phase delivers usable functionality while laying groundwork for subsequent phases.

```
Phase 1: Foundation (MVP)          Phase 2: Depth               Phase 3: Legacy
━━━━━━━━━━━━━━━━━━━━━━━━━━        ━━━━━━━━━━━━━━━              ━━━━━━━━━━━━━━━━
Weeks 1-8                          Weeks 9-14                    Weeks 15-20

[Core Storytelling]               [Timeline & Discovery]        [Archive & Heritage]
[Moderation]                      [Prompts & Engagement]        [Partnerships]
[Community Basics]                [Collections & Curation]      [Oral History]
[Digital Museum UX]               [Map-based Browsing]          [Public API]
```

---

## Phase 1: Foundation (MVP)

**Duration:** 8 weeks  
**Goal:** Launch a functional storytelling platform with core editorial workflow

### Sprint 1: Project Setup, Brand Identity & Auth (Week 1-2)

#### Tasks

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| 1.1.1 | Initialize Next.js 14 project with TypeScript | P0 | 2h |
| 1.1.2 | Configure Tailwind CSS with Cornwall brand palette | P0 | 3h |
| 1.1.3 | Set up Shadcn UI with brand customizations | P0 | 2h |
| 1.1.4 | Configure typography (Source Serif Pro + Inter) | P0 | 2h |
| 1.1.5 | Create CSS variables for design system tokens | P0 | 2h |
| 1.1.6 | Set up Supabase project | P0 | 1h |
| 1.1.7 | Create database schema (enums, tables) | P0 | 4h |
| 1.1.8 | Implement RLS policies | P0 | 4h |
| 1.1.9 | Configure Supabase Auth (Google, Facebook, Email) | P0 | 4h |
| 1.1.10 | Build authentication flow (login, logout, callback) | P0 | 6h |
| 1.1.11 | Create user profile table sync trigger | P0 | 2h |
| 1.1.12 | Implement auth middleware for protected routes | P0 | 3h |
| 1.1.13 | Design base layout with museum-inspired header/footer | P0 | 4h |
| 1.1.14 | Implement brand microcopy patterns ("Share a story", etc.) | P1 | 1h |

#### Brand Identity Implementation

**Colour Palette (Tailwind)**
```
chalk-white: #F7F6F2    (background)
slate-grey: #2F2F2F     (text)
atlantic-blue: #1F4E5F  (primary)
copper-clay: #B45A3C    (secondary)
sea-foam: #A7C7C5       (accent)
moss-green: #5F6F52     (success)
```

**Typography**
- Stories: `Source Serif Pro` (serif)
- UI: `Inter` (sans-serif)

**Microcopy**
- "Share a story" not "Post"
- "Send for review" not "Submit"
- "Recorded in…" not "Posted"

#### Deliverables
- [ ] Working authentication with all three providers
- [ ] Database schema deployed with RLS
- [ ] Base application shell with routing
- [ ] Cornwall brand design system fully configured
- [ ] Typography and colour palette in Tailwind config
- [ ] Microcopy guidelines documented in components

#### Acceptance Criteria
- Users can sign up/login via Google, Facebook, or email
- Session persists across page reloads
- Protected routes redirect unauthenticated users
- User profile syncs to `users` table on auth
- Brand colours and typography visible throughout
- No social media language in any UI copy

---

### Sprint 2: Story CRUD & Editor (Week 3-4)

#### Tasks

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| 1.2.1 | Build story editor page with Tiptap | P0 | 8h |
| 1.2.2 | Implement autosave functionality | P0 | 4h |
| 1.2.3 | Create draft management UI | P0 | 4h |
| 1.2.4 | Build story preview mode | P1 | 3h |
| 1.2.5 | Implement media upload to Supabase Storage | P0 | 6h |
| 1.2.6 | Create image insertion in editor | P0 | 4h |
| 1.2.7 | Build story metadata form (timeline, location) | P0 | 4h |
| 1.2.8 | Implement location picker with map | P1 | 6h |
| 1.2.9 | Create story submission flow | P0 | 4h |
| 1.2.10 | Build user profile page with story list | P0 | 4h |

#### Deliverables
- [ ] Distraction-free story editor
- [ ] Media upload and embedding
- [ ] Draft autosave with recovery
- [ ] Story metadata (timeline year, location)
- [ ] Profile page with story management

#### Acceptance Criteria
- Users can create, edit, and delete draft stories
- Autosave triggers every 30 seconds on change
- Images upload and display in editor
- Location can be set via map picker
- Stories can be submitted for review

---

### Sprint 3: Digital Museum Home & Story Reader (Week 5-6)

#### Digital Museum UX Philosophy
The homepage should feel like entering a **museum lobby**, not scrolling a feed:
- Anti-infinite-scroll (paginated, intentional)
- Editorial hierarchy (curated prominence)
- Calm interactions (no gamification)

#### Tasks

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| 1.3.1 | Design museum-inspired home page layout | P0 | 6h |
| 1.3.2 | Build "Featured Exhibition" hero component | P0 | 5h |
| 1.3.3 | Create "Artefact Card" story component (plaque style) | P0 | 4h |
| 1.3.4 | Build "Recently Shared" section (not "feed") | P0 | 4h |
| 1.3.5 | Add "Stories by Place" map preview | P1 | 4h |
| 1.3.6 | Add "Stories by Time" timeline preview | P1 | 4h |
| 1.3.7 | Build story reader as "artefact page" | P0 | 6h |
| 1.3.8 | Implement artefact metadata (plaque, signature, provenance) | P0 | 3h |
| 1.3.9 | Add "Curator's Note" (AI summary) styling | P1 | 2h |
| 1.3.10 | Implement story page SEO (meta tags) | P1 | 2h |
| 1.3.11 | Create story sharing (WhatsApp, Facebook, copy link) | P1 | 3h |
| 1.3.12 | Build basic search with filters | P0 | 6h |
| 1.3.13 | Implement pagination (not infinite scroll) | P0 | 3h |
| 1.3.14 | Add editorial loading states (not spinners) | P1 | 3h |

#### Museum Room Structure (Homepage)

```
┌─────────────────────────────────────────┐
│  Featured Exhibition (hero story)       │
├─────────────────────────────────────────┤
│  Recently Shared    │  By Place (map)   │
├─────────────────────┼───────────────────┤
│  By Time (timeline) │  Collections      │
└─────────────────────┴───────────────────┘
```

#### Story Page as Artefact

| UI Element | Museum Metaphor |
|------------|-----------------|
| Title | Plaque |
| Author | Signature |
| "Recorded in [date]" | Historical marker |
| Location | Provenance |
| Media | Exhibits |
| Tags | Archive labels |
| AI Summary | Curator's note |

#### Deliverables
- [ ] Museum-inspired home page with "rooms"
- [ ] Featured Exhibition hero section
- [ ] Artefact-style story cards
- [ ] Story reader with museum metaphors
- [ ] Basic search functionality
- [ ] SEO-optimized story pages

#### Acceptance Criteria
- Homepage feels like museum lobby, not social feed
- No infinite scroll anywhere
- Featured story prominent as "exhibition"
- Story page reads like viewing an artefact
- "Recorded in…" not "Posted"
- AI summary styled as "Curator's note"
- Pages are server-rendered for SEO

---

### Sprint 4: Admin & Moderation (Week 7-8)

#### Tasks

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| 1.4.1 | Build admin dashboard layout | P0 | 4h |
| 1.4.2 | Create review queue page | P0 | 6h |
| 1.4.3 | Build story moderation panel | P0 | 6h |
| 1.4.4 | Implement approve/reject workflow | P0 | 4h |
| 1.4.5 | Create rejection feedback form | P0 | 3h |
| 1.4.6 | Build admin-only route protection | P0 | 2h |
| 1.4.7 | Add story status indicators | P1 | 2h |
| 1.4.8 | Create email notifications (Resend) | P1 | 4h |
| 1.4.9 | Implement featured story toggle | P1 | 2h |
| 1.4.10 | Add basic analytics dashboard | P2 | 4h |

#### Deliverables
- [ ] Admin dashboard with review queue
- [ ] Story approval/rejection workflow
- [ ] Rejection feedback delivery
- [ ] Email notifications for status changes
- [ ] Featured story management

#### Acceptance Criteria
- Admins can access moderation dashboard
- Review queue shows pending stories
- Approve sets status to published
- Reject stores feedback and notifies author
- Authors receive email on status change

---

### Phase 1 Milestone Checklist

```
BRAND & IDENTITY
□ Cornwall colour palette implemented (Chalk, Slate, Atlantic, Copper, Seafoam, Moss)
□ Typography configured (Source Serif Pro + Inter)
□ Microcopy follows guidelines ("Share a story", "Recorded in…")
□ No social media language in UI

DIGITAL MUSEUM UX
□ Homepage feels like museum lobby
□ No infinite scroll anywhere
□ Featured Exhibition hero section
□ Artefact-style story cards
□ Story page reads as artefact (plaque, signature, provenance)
□ AI summary styled as "Curator's note"

CORE FUNCTIONALITY
□ Authentication working (Google, Facebook, Email)
□ Story creation and editing with autosave
□ Media upload and display
□ Story submission and status workflow
□ Admin review and moderation
□ Basic search functionality
□ Email notifications

QUALITY
□ Responsive design (mobile-first)
□ SEO optimization
□ Calm, editorial loading states
```

---

## Phase 2: Depth

**Duration:** 6 weeks  
**Goal:** Enhance discovery, engagement, and editorial curation

### Sprint 5: AI Integration (Week 9-10)

#### Tasks

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| 2.1.1 | Set up Supabase Edge Functions | P0 | 3h |
| 2.1.2 | Implement story summarization function | P0 | 4h |
| 2.1.3 | Create tag extraction function | P0 | 4h |
| 2.1.4 | Build content moderation function | P1 | 4h |
| 2.1.5 | Integrate AI summary in story submission | P0 | 3h |
| 2.1.6 | Display AI-generated tags on stories | P0 | 3h |
| 2.1.7 | Add AI summary to story reader | P0 | 2h |
| 2.1.8 | Create similar stories recommendation | P1 | 6h |
| 2.1.9 | Build comment moderation function | P1 | 4h |
| 2.1.10 | Add moderation flags to admin view | P1 | 3h |

#### Deliverables
- [ ] AI-powered story summaries
- [ ] Automatic tag extraction
- [ ] Content moderation scoring
- [ ] Similar story recommendations
- [ ] Comment toxicity detection

#### Acceptance Criteria
- Stories receive AI summary on submission
- Tags auto-extracted and displayed
- Moderation score visible in admin
- Related stories shown on reader page

---

### Sprint 6: Community Features (Week 11-12)

#### Tasks

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| 2.2.1 | Build comments component with Realtime | P0 | 6h |
| 2.2.2 | Implement comment submission | P0 | 3h |
| 2.2.3 | Create likes functionality | P0 | 3h |
| 2.2.4 | Build like animation | P1 | 2h |
| 2.2.5 | Add comment count to story cards | P1 | 2h |
| 2.2.6 | Implement comment moderation in admin | P0 | 4h |
| 2.2.7 | Build anonymous author support | P0 | 3h |
| 2.2.8 | Create user profile customization | P1 | 4h |
| 2.2.9 | Add reading history | P2 | 4h |
| 2.2.10 | Implement bookmarks | P2 | 4h |

#### Deliverables
- [ ] Real-time comments on stories
- [ ] Like/unlike functionality
- [ ] Comment moderation tools
- [ ] Anonymous posting option
- [ ] Enhanced user profiles

#### Acceptance Criteria
- Comments appear in real-time
- Likes persist and show counts
- Admins can hide/delete comments
- Authors can choose anonymous display
- Users can customize profiles

---

### Sprint 7: Discovery & Collections (Week 13-14)

#### Tasks

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| 2.3.1 | Build timeline visualization | P0 | 8h |
| 2.3.2 | Create interactive story map | P0 | 8h |
| 2.3.3 | Implement decade filtering | P0 | 3h |
| 2.3.4 | Build location-based filtering | P0 | 3h |
| 2.3.5 | Create collections CRUD for admin | P0 | 4h |
| 2.3.6 | Build collection display pages | P0 | 4h |
| 2.3.7 | Implement story-to-collection assignment | P0 | 3h |
| 2.3.8 | Add tag-based filtering | P1 | 3h |
| 2.3.9 | Create "Explore" page | P1 | 4h |
| 2.3.10 | Build advanced search with facets | P1 | 6h |

#### Deliverables
- [ ] Interactive timeline browser
- [ ] Story map with clustering
- [ ] Curated collections
- [ ] Advanced filtering options
- [ ] Explore/discover page

#### Acceptance Criteria
- Timeline shows stories by decade
- Map clusters stories geographically
- Collections display curated groups
- Filters combine (AND logic)
- Search includes faceted refinement

---

### Phase 2 Milestone Checklist

```
□ AI summaries and tags working
□ Content moderation scoring
□ Similar story recommendations
□ Real-time comments
□ Like functionality
□ Anonymous posting
□ Interactive timeline
□ Story map with clusters
□ Collections system
□ Advanced search and filters
□ Explore page
```

---

## Phase 3: Legacy

**Duration:** 6 weeks  
**Goal:** Build archival features and partnership foundations

### Sprint 8: Writing Prompts & Engagement (Week 15-16)

#### Tasks

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| 3.1.1 | Design writing prompts system | P1 | 3h |
| 3.1.2 | Create prompts admin CRUD | P1 | 4h |
| 3.1.3 | Build prompt display on home page | P1 | 3h |
| 3.1.4 | Implement "write from prompt" flow | P1 | 4h |
| 3.1.5 | Create prompt-based collections | P1 | 3h |
| 3.1.6 | Add seasonal/thematic prompts | P2 | 3h |
| 3.1.7 | Build contributor leaderboard | P2 | 4h |
| 3.1.8 | Create story statistics for authors | P2 | 4h |
| 3.1.9 | Implement email digests | P2 | 4h |
| 3.1.10 | Add social sharing improvements | P2 | 3h |

#### Deliverables
- [ ] Writing prompts system
- [ ] Prompt-driven story creation
- [ ] Author statistics
- [ ] Email digest subscription
- [ ] Enhanced sharing

---

### Sprint 9: Archive Foundation (Week 17-18)

#### Tasks

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| 3.2.1 | Design oral history recording feature | P1 | 4h |
| 3.2.2 | Implement audio upload and playback | P1 | 6h |
| 3.2.3 | Create transcript storage | P1 | 3h |
| 3.2.4 | Build audio story player | P1 | 4h |
| 3.2.5 | Add video embed support | P2 | 4h |
| 3.2.6 | Create historical photo gallery | P2 | 4h |
| 3.2.7 | Implement archive search | P2 | 4h |
| 3.2.8 | Build "This Day in Cornwall" feature | P2 | 4h |
| 3.2.9 | Create export functionality (PDF) | P2 | 4h |
| 3.2.10 | Add print-friendly story view | P2 | 3h |

#### Deliverables
- [ ] Audio story support
- [ ] Oral history recording
- [ ] Video embeds
- [ ] Archive browsing
- [ ] Story export options

---

### Sprint 10: Partnership & API (Week 19-20)

#### Tasks

| ID | Task | Priority | Estimate |
|----|------|----------|----------|
| 3.3.1 | Design public API architecture | P1 | 4h |
| 3.3.2 | Implement read-only story API | P1 | 6h |
| 3.3.3 | Create API authentication | P1 | 4h |
| 3.3.4 | Build API documentation | P1 | 4h |
| 3.3.5 | Create embed widget for stories | P2 | 6h |
| 3.3.6 | Implement RSS feed | P2 | 3h |
| 3.3.7 | Add accessibility audit fixes | P1 | 6h |
| 3.3.8 | Performance optimization pass | P1 | 4h |
| 3.3.9 | Create admin analytics expansion | P2 | 4h |
| 3.3.10 | Documentation and handoff prep | P1 | 4h |

#### Deliverables
- [ ] Public read API
- [ ] API documentation
- [ ] Embeddable story widget
- [ ] RSS feed
- [ ] Accessibility compliance
- [ ] Performance optimization

---

### Phase 3 Milestone Checklist

```
□ Writing prompts system
□ Audio story support
□ Oral history recording
□ Video embeds
□ Archive browsing
□ Public API
□ Embeddable widgets
□ RSS feed
□ Accessibility audit passed
□ Performance optimized
□ Documentation complete
```

---

## Quality Gates

### Brand Consistency
- [ ] All colours from Cornwall palette only
- [ ] Typography follows serif/sans rules
- [ ] Microcopy reviewed for social media language
- [ ] No gamification elements (streaks, points, badges)
- [ ] No engagement tricks (notifications, urgency)
- [ ] Calm, editorial tone in all copy

### Museum UX
- [ ] No infinite scroll on any page
- [ ] Pagination is intentional and clear
- [ ] Story pages feel like artefacts
- [ ] Homepage structured as museum rooms
- [ ] Loading states are editorial, not spinners

### Code Quality
- TypeScript strict mode
- ESLint + Prettier configuration
- No `any` types in production code
- Component-level testing for critical paths
- E2E tests for core user flows

### Design Quality
- Design review for all new screens
- Mobile-first responsive testing
- Accessibility testing (WCAG 2.1 AA)
- Cross-browser testing (Chrome, Firefox, Safari)

### Performance
- Lighthouse score > 90
- Core Web Vitals passing
- Bundle size monitoring
- Image optimization audit

### Security
- RLS policies tested
- Auth flow security review
- Input validation audit
- OWASP checklist review

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| AI API costs exceed budget | Medium | Medium | Implement caching, rate limiting |
| Supabase limits hit | High | Low | Monitor usage, plan for scaling |
| Slow adoption | High | Medium | Focus on quality over features |
| Content moderation backlog | Medium | Medium | AI pre-screening, community guidelines |
| Scope creep | High | High | Strict PR review, phase gates |

---

## Success Metrics

### Phase 1 (MVP)
- [ ] 50+ stories published
- [ ] 10+ active contributors
- [ ] < 48h average review time
- [ ] Zero critical bugs in production

### Phase 2 (Depth)
- [ ] 200+ stories published
- [ ] 50+ active contributors
- [ ] 500+ monthly visitors
- [ ] 80% user satisfaction score

### Phase 3 (Legacy)
- [ ] 500+ stories in archive
- [ ] 1 partnership established
- [ ] API in use by external site
- [ ] Community self-sustaining

---

## Team Allocation

| Role | Phase 1 | Phase 2 | Phase 3 |
|------|---------|---------|---------|
| Full-stack Developer | 100% | 100% | 80% |
| UI/UX Designer | 50% | 30% | 20% |
| Content/Editorial | 20% | 40% | 50% |
| Community Manager | 10% | 30% | 50% |

---

## Release Schedule

| Milestone | Target Date | Scope |
|-----------|-------------|-------|
| Alpha | Week 4 | Internal testing |
| Beta | Week 8 | Closed community testing |
| Public Launch | Week 10 | Open registration |
| V1.0 | Week 14 | Full Phase 2 features |
| V2.0 | Week 20 | Archive and API |

---

## Phase 4: Digital Heritage Archive (Future Vision)

**Duration:** Ongoing  
**Goal:** Transform from community storytelling platform into a comprehensive digital museum for Cornish heritage

> This phase represents a significant expansion in scope, requiring additional infrastructure, partnerships, and potentially funding. It builds upon the community platform to create an institutional-grade heritage archive.

### 4.1 Vision: The Digital Museum

The platform expands beyond individual stories to become a **digital repository** for:
- **Private collections** - Families with photographs, films, documents on hard drives
- **Institutional archives** - Heritage societies, museums, libraries
- **Oral history projects** - Audio/video recordings of interviews
- **Historical media** - Digitised newspapers, maps, certificates
- **Multimedia collections** - Curated exhibitions by theme, location, era

### 4.2 Infrastructure Requirements

| Component | Current | Required | Notes |
|-----------|---------|----------|-------|
| **Storage** | Supabase 1GB | 100GB+ or S3/R2 | Videos/high-res images need dedicated storage |
| **Video Hosting** | YouTube embeds | Self-hosted or Bunny.net | For archival video content |
| **File Size Limit** | 5MB | 100MB+ | Large scans, audio recordings |
| **CDN** | Vercel | Cloudflare R2 or similar | Cost-effective media delivery |

### 4.3 Feature Roadmap

#### Sprint 4.1: Collection Management (Admin)
| ID | Task | Priority | Notes |
|----|------|----------|-------|
| 4.1.1 | Bulk upload interface for admins | P0 | Drag-drop multiple files |
| 4.1.2 | Batch metadata editor | P0 | Add titles, dates, tags to multiple items |
| 4.1.3 | Collection hierarchy (collection > sub-collections) | P1 | Nested organization |
| 4.1.4 | Import from external sources (CSV, JSON) | P1 | Bulk data migration |
| 4.1.5 | Video upload and transcoding | P1 | Requires Bunny.net or similar |
| 4.1.6 | High-resolution image viewer (zoom/pan) | P1 | For detailed documents |

#### Sprint 4.2: Heritage Archive UX
| ID | Task | Priority | Notes |
|----|------|----------|-------|
| 4.2.1 | Museum-style browsing experience | P0 | Gallery views, exhibitions |
| 4.2.2 | Advanced filtering (date range, media type) | P0 | Powerful search for researchers |
| 4.2.3 | Citation/reference generator | P1 | For academic use |
| 4.2.4 | Download permissions system | P1 | Control access to high-res |
| 4.2.5 | Lightbox gallery for collections | P0 | Immersive viewing |
| 4.2.6 | Audio tour mode | P2 | Guided narrative through collections |

#### Sprint 4.3: Partnerships & Contributions
| ID | Task | Priority | Notes |
|----|------|----------|-------|
| 4.3.1 | Contribution intake form | P0 | For CTA respondents |
| 4.3.2 | Digitisation workflow | P1 | Track items being processed |
| 4.3.3 | Donor/contributor recognition | P1 | Credit and thank contributors |
| 4.3.4 | Partnership dashboard | P1 | Manage institutional relationships |
| 4.3.5 | Loan/rights management | P2 | Track ownership and permissions |

### 4.4 Cost Considerations

| Service | Estimated Monthly Cost | Notes |
|---------|----------------------|-------|
| Cloudflare R2 | £10-50 | Object storage (first 10GB free) |
| Bunny.net CDN | £5-20 | Video streaming |
| Supabase Pro | £25 | Database/auth |
| Vercel Pro | £20 | Hosting |
| **Total** | **£60-115/month** | Scale-dependent |

### 4.5 Funding Opportunities

- **Heritage Lottery Fund** - Digital preservation grants
- **Arts Council England** - Culture recovery fund
- **Cornwall Council** - Community heritage initiatives
- **Crowdfunding** - Community-supported archive
- **Sponsorship** - Local businesses and heritage organisations

### 4.6 Dependencies

Before starting Phase 4:
- [ ] Phase 1-3 complete and stable
- [ ] Community of active contributors established
- [ ] At least one partnership in discussion
- [ ] Funding or budget secured for infrastructure
- [ ] Legal framework for contributions (rights, licensing)

---

## ✅ Recently Implemented Features

### Ambient Sounds for Stories ✅
Writers can add atmospheric background sounds to immerse readers:
- **12 Soundscapes**: Waves, rain, harbour, pub, church bells, wind, seagulls, storm, mine, market, dripping water, rugby match
- **Preview**: 8-second preview in story editor before selecting
- **Integration**: Plays automatically with text-to-speech reader
- **Storage**: Hosted on Supabase Storage CDN

### Text-to-Speech Story Reader ✅
Readers can listen to stories read aloud:
- **Voice Selection**: Authors choose male or female voice
- **Browser-based**: Uses Web Speech API (no API costs!)
- **Ambient Integration**: Background sounds play alongside narration
- **Controls**: Play, pause, progress bar, volume

### Rich Media Embeds ✅
- **Link Cards**: Preview cards for external links (news, Wikipedia, etc.)
- **Video Embeds**: YouTube and Vimeo with thumbnail extraction
- **Audio Uploads**: MP3 recordings with inline player
- **Image Cropping**: Crop uploaded images before insertion

### Enhanced Author Experience ✅
- **Edit stories in review**: Authors can edit while awaiting approval
- **Author name sync**: Display name updates reflect on all stories
- **Collection feedback**: Visual confirmation when adding to collections

### Admin AI Tools ✅
- **AI Image Generation**: Generate DALL-E images for stories without photos
- **One-click in review panel**: Admin can create heritage illustrations

---

## Near-Term Enhancements (Ready to Implement)

Quick wins that enhance the current platform without major infrastructure changes:

### Enhanced Audio Stories
- Allow longer audio recordings (oral history style)
- Waveform visualization
- Transcript display alongside audio

### Story Themes/Moods
- Visual themes for stories (seaside, mining, pastoral)
- Customizable reading backgrounds
- Font choices for different eras

### Community Engagement Features
- **Story of the Week**: Auto-featured rotating story
- **Monthly writing prompts**: Themed challenges
- **Contributor badges**: Recognition for active members

---

## Appendix: Sprint Ceremonies

### Weekly Rhythm
- **Monday**: Sprint planning (1h)
- **Wednesday**: Design review (30m)
- **Friday**: Demo + retrospective (1h)

### Definition of Done
- [ ] Code reviewed and merged
- [ ] Tests passing
- [ ] Deployed to staging
- [ ] Product owner sign-off
- [ ] Documentation updated

---

## Future Feature Ideas (Backlog)

Features to implement once the platform has more traction and community:

### Lost Cornwall 📍 ✅ IMPLEMENTED
- Tag locations with historical photos
- "Before and after" comparisons
- Community-sourced visual history
- Memory sharing on historic photos
- Map overlay of vanished places (future)

### "Where Is This?" Challenge 🔍 ✅ IMPLEMENTED
- Photo-based guessing game
- Community votes on answers
- Weekly featured mystery photo
- Difficulty levels (easy/medium/hard)
- Leaderboard for correct guesses (future)

### Map Improvements 🗺️
- **Bigger, full-screen map option**
- **Nicer basemap** (explore options):
  - Stamen Watercolor (artistic)
  - Carto Voyager (clean, modern)
  - Thunderforest Outdoors (trails/walking)
  - Ordnance Survey (heritage, requires API key)
- **Multiple layers**:
  - Stories layer
  - Poll winners layer
  - Events layer
  - Lost Cornwall photos layer
  - Heritage trails layer
  - Businesses/POIs layer (future)
- **Clustering improvements** for dense areas
- **Heat map view** for story concentration
- **Save map state** (zoom, center) for sharing

### Heritage Trails & Walks 🚶
- Curated story routes on map
- **Walking/hiking trail data**:
  - GPX track upload
  - Distance and elevation
  - Difficulty rating
  - Estimated time
- **Trail media**:
  - Photos along the route
  - Videos of scenic spots
  - Audio guides at waypoints
- **Community contributions**:
  - User-submitted trails
  - Admin approval workflow
  - Trail ratings and reviews
- Walking tour integration
- QR codes at physical locations
- Tourism board partnerships

### Cornish Dialect Glossary 📖
- Community-contributed phrases and words
- Audio pronunciations
- Regional variations
- Search and browse by category

### Best Photo of the Week 📸
- Community nominations
- Weekly voting
- Featured on homepage
- Annual "best of" compilation

### Mini-Stories Feed 💬
- 500-character quick stories
- Twitter-like feed format
- Quick memories and moments
- Easier barrier to entry

---

## Monetization Strategy

### Phase 1: Community Building (Current)
- Focus on organic growth
- Free platform, no ads
- Build trust and content library
- Establish brand identity

### Phase 2: Soft Monetization
- **Sponsored Collections**: Local businesses sponsor themed collections (£50-200/month)
- **Featured Events**: Priority listing in events calendar (£10-25/event)
- **"Friend of Cornwall" Membership**: Optional £30/year for badges, early access

### Phase 3: Business Integration
- **Local Business Directory**: Featured listings near relevant stories
- **Heritage Trail Sponsorship**: Businesses sponsor walking routes
- **Museum Partnerships**: Co-branded digital exhibitions

### Phase 4: Premium Features
- **Stripe Integration**: Payment processing for sponsorships
- **Business Dashboard**: Analytics for sponsors
- **Advertising Slots**: Tasteful, heritage-aligned ads

### Tourism Opportunities
- **Visit Cornwall Partnership**: Official heritage content partner
- **Hotel/B&B Promotions**: "Stay near this story" links
- **Tour Operator Integration**: Stories as tour content
- **Heritage Site Tie-ins**: Digital companion to physical visits

### Revenue Projections (Year 2)
| Stream | Monthly | Annual |
|--------|---------|--------|
| Sponsored Collections | £500 | £6,000 |
| Featured Events | £200 | £2,400 |
| Memberships (500 @ £30) | - | £15,000 |
| Business Directory | £300 | £3,600 |
| **Total** | **~£1,000** | **~£27,000** |

---

## Growth Strategy

### Quick Wins (This Month)
1. **Local Press**: Cornwall Live, West Briton, Falmouth Packet
2. **BBC Radio Cornwall**: Heritage storytelling segment pitch
3. **Parish Magazines**: Free listings in community newsletters

### Medium Effort
1. **Library Partnerships**: "Share Your Story" workshops
2. **WI/Rotary Presentations**: Demo to community groups
3. **Care Home Visits**: Help elderly residents record memories

### Community Retention
1. **Weekly Digest Emails**: Top 3 stories every Sunday ✅
2. **Story of the Week**: Homepage featured story
3. **Seasonal Prompts**: Christmas memories, harvest stories
4. **Anniversary Emails**: "Your story was shared 1 year ago"

### Social Media
1. **Facebook Groups**: Target local village groups
2. **Instagram Stories**: Daily heritage photos
3. **WhatsApp Sharing**: Easy share buttons on stories ✅

---

*Last updated: January 2026*
