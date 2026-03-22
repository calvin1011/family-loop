# FamilyLoop - Development Phase Plan

> **Last Updated:** March 22, 2026
> **Status:** Active Development
> **Stack:** React Native (Expo SDK 53) + TypeScript + Supabase
> **Platforms:** Android, iOS, Web

---

## Agent & Model Guide

| Icon | Meaning |
|------|---------|
| **AUTO AGENT** | Safe for Cursor Auto Agent (background agent). Straightforward tasks with clear instructions -- let it run autonomously. |
| **OPUS 4.6** | Use Opus 4.6 (high-thinking manual chat). Complex architecture, multi-file refactors, nuanced decisions that need deep reasoning. |
| **EITHER** | Can go either way. Start with Auto Agent; escalate to Opus 4.6 if it struggles. |

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Phase 0 - Critical Fixes (Emergency) -- AUTO AGENT](#phase-0---critical-fixes-emergency)
3. [Phase 1 - Infrastructure Foundation -- OPUS 4.6](#phase-1---infrastructure-foundation)
4. [Phase 2 - Core Feature Completion -- MIXED](#phase-2---core-feature-completion)
5. [Phase 3 - The "Loop" (Social Layer) -- OPUS 4.6](#phase-3---the-loop-social-layer)
6. [Phase 4 - Modern UI Overhaul -- AUTO AGENT](#phase-4---modern-ui-overhaul)
7. [Phase 5 - Intelligence & ML -- OPUS 4.6](#phase-5---intelligence--ml)
8. [Phase 6 - Polish & App Store -- EITHER](#phase-6---polish--app-store)
9. [Technical Debt Registry](#technical-debt-registry)
10. [Architecture Decisions](#architecture-decisions)

---

## Current State Assessment

### What Works

| Feature | Status | Notes |
|---------|--------|-------|
| Firebase Auth (Email/Password) | Working | Session persistence via AsyncStorage |
| Firebase Auth (Google OAuth) | Working | Android + Web tested |
| Onboarding Flow | Working | 4-step flow with good copy |
| Contact Loading | Working | expo-contacts with smart filtering |
| Name-based Relationship Detection | Working | Keyword matching for family roles |
| Auto-grouping (Family/Work/Friends) | Working | Based on NameDetector |
| Manual Interaction Logging | Working | Call, text, in-person, video-call, other |
| Relationship Health Scoring | Working | 0-100 score with trend analysis |
| "Needs Attention" List | Working | Prioritized by score + days since contact |
| Communication Goals | Working | Frequency-based, persisted to AsyncStorage |
| Family Events | Working | Birthdays, anniversaries, etc. persisted |
| Auto-Detection (Android) | Working | Call log + SMS scanning |
| Settings Screen | Working | Auto-detection toggle, privacy info |
| Profile Screen | Working | Display name editing, sign out |

### What's Broken or Missing

| Issue | Severity | Impact |
|-------|----------|--------|
| Interactions not persisted (lost on restart) | **CRITICAL** | Users lose all logged data |
| No push notifications | **CRITICAL** | Core value prop (reminders) doesn't work |
| No database beyond auth | **HIGH** | No sync, no backup, no multi-device |
| Phone auth throws errors | **HIGH** | Crashes if user selects phone login |
| Chat tab is misleading (just opens SMS app) | **HIGH** | Bad user experience / false expectation |
| .env not in .gitignore (secrets exposed) | **HIGH** | Security vulnerability |
| No family group concept | **MEDIUM** | App called "Loop" but no loop exists |
| UserContext.tsx is empty | **MEDIUM** | No user data layer |
| OnDeviceMessageAnalyzer.ts fully commented out | **MEDIUM** | Dead code / unfinished feature |
| CommunicationGoalsSimple.tsx fully commented out | **LOW** | Dead code |
| explore.tsx not in tab bar | **LOW** | Orphaned screen |
| Password change is a stub | **LOW** | Profile feature incomplete |
| No account deletion | **MEDIUM** | Required by App Store / Play Store |
| Loading spinner doesn't animate | **LOW** | Visual polish |
| addInteraction called twice (lines 344, 352) | **MEDIUM** | Duplicate interactions logged |
| Contact interfaces defined 4+ different ways | **LOW** | Maintenance burden |
| Contact filtering duplicated in 3 files | **LOW** | Maintenance burden |
| Settings icon is chevron.right | **LOW** | Wrong icon |
| No dark mode despite theme infrastructure | **LOW** | Missed opportunity |
| No tests of any kind | **MEDIUM** | No safety net for changes |
| .env has malformed GOOGLE_WEB_CLIENT_ID (stray quote) | **MEDIUM** | Potential auth failures |
| iOS Google client ID is empty | **MEDIUM** | iOS Google auth won't work |

---

## Phase 0 - Critical Fixes (Emergency) -- AUTO AGENT

> **Agent:** Auto Agent for all sub-tasks. These are isolated, well-defined fixes. Run each as a separate Auto Agent task.
> **Goal:** Stop losing user data and fix security holes
> **Timeline:** 1-2 days
> **Priority:** Do this before anything else
>
> **Why Auto Agent:** Every task here is a targeted fix in 1-2 files with a clear before/after. No architectural decisions needed. Perfect for background agents running in parallel.

### 0.1 Persist Interactions to AsyncStorage

**Problem:** All interaction data lives in `useState` only. Closing the app erases everything.

**Fix:**
- Save interactions to AsyncStorage on every add/update
- Load interactions from AsyncStorage on app start
- Same pattern already used by CommunicationGoals and FamilyEvents

**Files affected:**
- `app/(tabs)/index.tsx` - add load/save functions for interactions

### 0.2 Fix the Double-Add Bug

**Problem:** `addInteraction()` in `index.tsx` calls `setInteractions` twice (lines 344 and 352), creating duplicate entries.

**Fix:** Remove the first `setInteractions` call, keep only the second one with the logging.

**Files affected:**
- `app/(tabs)/index.tsx` - lines 333-368

### 0.3 Secure Environment Variables

**Problem:** `.env` contains Firebase API keys and Google OAuth client IDs but is NOT in `.gitignore`. Also has a malformed web client ID (stray quote character).

**Fix:**
- Add `.env` to `.gitignore`
- Fix the stray quote in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- Add iOS client ID or remove iOS Google auth
- Rotate any already-committed credentials
- Consider using EAS Secrets for production builds

**Files affected:**
- `.gitignore`
- `.env`

### 0.4 Disable or Fix Phone Auth

**Problem:** Phone auth is presented as an option but throws "not implemented" errors.

**Fix (Option A - Quick):** Hide phone auth option from login/signup screens.
**Fix (Option B - Proper):** Implement Firebase phone auth with `@react-native-firebase/auth` (requires native module, development build).

**Files affected:**
- `app/(auth)/login.tsx`
- `contexts/AuthContext.tsx`

### 0.5 Remove Dead Code

**Problem:** Commented-out files and orphaned screens create confusion.

**Fix:**
- Delete or properly archive `OnDeviceMessageAnalyzer.ts` (entirely commented out)
- Delete or properly archive `CommunicationGoalsSimple.tsx` (entirely commented out)
- Either register `explore.tsx` in the tab bar or remove it
- Remove the `.idea/` directory files from tracking (add to `.gitignore`)

**Files affected:**
- `utils/OnDeviceMessageAnalyzer.ts`
- `components/CommunicationGoalsSimple.tsx`
- `app/(tabs)/explore.tsx`
- `app/(tabs)/_layout.tsx`
- `.gitignore`

---

## Phase 1 - Infrastructure Foundation -- OPUS 4.6

> **Agent:** Opus 4.6 (manual chat) for 1.1-1.3. Auto Agent for 1.4 after Opus sets up the patterns.
> **Goal:** Add a real backend, real database, and real notifications
> **Timeline:** 1-2 weeks
> **Dependency:** Phase 0 complete
>
> **Why Opus 4.6:** This phase involves critical architectural decisions -- Supabase schema design, auth migration strategy, notification architecture, and establishing the service layer pattern that every future phase depends on. Getting this wrong cascades into everything. Opus 4.6's deep reasoning is essential here. Once the patterns are established (1.1-1.3), Auto Agent can handle the mechanical extraction of shared types/services (1.4).

### 1.1 Supabase Setup

**Why Supabase over raw Firebase:**
- Postgres database (real SQL, relational data, powerful queries)
- Row-level security (family members can share data securely)
- Real-time subscriptions (live updates when family members interact)
- Edge Functions (serverless backend logic)
- Built-in auth (can replace or complement Firebase Auth)
- Push notification support via database webhooks
- Free tier is generous for MVP

**Tasks:**
- Create Supabase project
- Design database schema (see below)
- Set up Row Level Security policies
- Add `@supabase/supabase-js` dependency
- Create Supabase client config
- Create `lib/supabase.ts` client initialization

**Database Schema (Initial):**

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  timezone TEXT,
  notification_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family groups
CREATE TABLE family_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family group members
CREATE TABLE family_group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES family_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Contacts (user's tracked contacts from their phone)
CREATE TABLE tracked_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  device_contact_id TEXT,
  name TEXT NOT NULL,
  phone_number TEXT,
  relationship TEXT,
  group_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, device_contact_id)
);

-- Interactions (the core data - calls, texts, visits logged)
CREATE TABLE interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES tracked_contacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'text', 'in-person', 'video-call', 'other')),
  direction TEXT CHECK (direction IN ('outgoing', 'incoming', 'both')),
  duration_seconds INTEGER,
  note TEXT,
  auto_detected BOOLEAN DEFAULT FALSE,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication goals
CREATE TABLE communication_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES tracked_contacts(id) ON DELETE CASCADE,
  frequency_days INTEGER NOT NULL,
  frequency_label TEXT NOT NULL,
  method TEXT DEFAULT 'any' CHECK (method IN ('any', 'call', 'text')),
  custom_note TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family events (birthdays, anniversaries, etc.)
CREATE TABLE family_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES tracked_contacts(id),
  type TEXT NOT NULL CHECK (type IN ('birthday', 'anniversary', 'wedding', 'graduation', 'custom')),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT TRUE,
  reminder_days INTEGER[] DEFAULT '{1}',
  notes TEXT,
  last_wished_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification log (track what was sent)
CREATE TABLE notification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
```

### 1.2 Auth Migration Strategy

**Decision:** Keep Firebase Auth OR migrate to Supabase Auth.

**Option A - Keep Firebase Auth + Use Supabase DB:**
- Least disruption (auth already works)
- Use Firebase JWT to authenticate Supabase requests
- Slightly more complex (two services for auth + DB)

**Option B - Migrate fully to Supabase Auth:**
- Supabase has email/password, Google OAuth, phone auth (with Twilio)
- Simpler architecture (one service for everything)
- Phone auth actually works (unlike current Firebase Web SDK placeholder)
- Requires re-implementing auth flows
- **Recommended** for long-term simplicity

### 1.3 Push Notifications

**Dependencies to add:**
- `expo-notifications`
- `expo-task-manager` (for background notification scheduling)
- `expo-device` (for checking physical device)

**Notification types to implement:**

| Notification | Trigger | Example |
|-------------|---------|---------|
| Goal Due | Communication goal becomes due | "Time to call Mom - it's been 7 days" |
| Goal Overdue | Goal is past due | "You're 3 days overdue to text Dad" |
| Event Reminder | Family event approaching | "Mom's birthday is in 3 days!" |
| Streak Encouragement | User is on a streak | "You've reached out to 5 family members this week!" |
| Inactivity Nudge | User hasn't opened app in 3+ days | "Your family misses you - check in today" |

**Implementation approach:**
- Register for push notifications on app start
- Store push token in Supabase `profiles.notification_token`
- Use Supabase Edge Function (cron) to check due goals/events daily
- Send push via Expo Push Notification service
- Also schedule local notifications for immediate/offline reminders

### 1.4 Create Shared Types & Services

**Problem:** Contact, Interaction, and other interfaces are defined differently in 4+ files. Contact filtering is duplicated in 3 files.

**Fix:** Create centralized type definitions and service modules.

**New file structure:**
```
types/
  index.ts          -- All shared TypeScript interfaces
services/
  supabase.ts       -- Supabase client + helpers
  contacts.ts       -- Contact loading, filtering, grouping (single source)
  interactions.ts   -- Interaction CRUD (reads/writes to Supabase)
  goals.ts          -- Communication goal logic
  events.ts         -- Family event logic
  notifications.ts  -- Notification scheduling and sending
  detection.ts      -- Auto-detection (refactored from AutomaticDetection.ts)
  analytics.ts      -- RelationshipAnalyzer (refactored)
```

---

## Phase 2 - Core Feature Completion -- MIXED (per sub-task below)

> **Agent:** Mixed -- see each sub-task for recommendation.
> **Goal:** Make every existing feature actually work end-to-end
> **Timeline:** 2-3 weeks
> **Dependency:** Phase 1 complete
>
> **Why Mixed:** Some sub-tasks are straightforward CRUD migrations (Auto Agent), while others require UX redesign decisions (Opus 4.6).

### 2.1 Interaction Tracking (Complete) -- AUTO AGENT

> Auto Agent can handle this. It's CRUD operations against Supabase using patterns established in Phase 1.

- Sync interactions to Supabase in real-time
- Load interaction history on app start
- Show interaction history per contact (scrollable timeline)
- Support editing/deleting past interactions
- Auto-detection results merge with manual entries (deduplication)

### 2.2 Communication Goals (Complete) -- AUTO AGENT

> Auto Agent. Migrating existing AsyncStorage logic to Supabase is mechanical. Smart suggestions can be a follow-up Auto Agent task.

- Migrate from AsyncStorage to Supabase
- Add goal editing (currently can only create or delete)
- Smart goal suggestions ("You call Mom every ~5 days, want to set a goal?")
- Goal completion celebrations (subtle animation/haptic when you log an interaction that fulfills a goal)
- Snooze functionality ("Remind me tomorrow instead")

### 2.3 Family Events (Complete) -- AUTO AGENT

> Auto Agent. Same migration pattern as 2.2, plus wiring up the date picker that's already installed.

- Migrate from AsyncStorage to Supabase
- Use proper date picker (replace raw text input MM/DD)
- Add `@react-native-community/datetimepicker` (already in dependencies but unused)
- Import birthdays from device contacts automatically (expo-contacts has birthday field)
- Recurring event "next occurrence" calculation improvements
- "Send a wish" quick action (opens SMS/call to that contact)

### 2.4 Redesign the Chat Tab -- OPUS 4.6

> Opus 4.6. This is a full UX redesign -- reimagining a screen's purpose, designing new interaction patterns, and making product decisions about what "Reach Out" means. Needs deep thinking.

**Current problem:** Pretends to be an in-app chat but just opens SMS.

**Redesign as "Reach Out" tab:**
- Shows contacts sorted by urgency (who needs attention most)
- One-tap actions: Call, Text, WhatsApp, FaceTime
- Quick message templates ("Hey, thinking of you!", "How's everything going?")
- After reaching out, prompt to log the interaction
- Recent outreach history
- This is more honest and more useful than a fake chat

### 2.5 Profile Screen (Complete) -- AUTO AGENT

> Auto Agent. Standard profile CRUD with Supabase Storage for photo upload. Well-documented patterns.

- Profile photo upload (Supabase Storage)
- Edit all profile fields
- Working password change (with re-authentication)
- Account deletion (required by App Store and Play Store)
- Notification preferences
- Data export (download all your data as JSON)
- Connected accounts display

### 2.6 Settings Screen (Complete) -- AUTO AGENT

> Auto Agent. Each setting is an independent toggle/button wired to Supabase. Can be done in parallel sub-tasks.

- Auto-detection toggle actually persists properly (use Supabase)
- Scan frequency selection actually triggers background tasks
- Working "View Privacy Policy" link
- Working "Export All Data" button
- Working "Delete All Data" with proper confirmation
- Notification preferences (which types, quiet hours)
- App theme selection (light/dark/system)

---

## Phase 3 - The "Loop" (Social Layer) -- OPUS 4.6

> **Agent:** Opus 4.6 for all sub-tasks. This is the most architecturally complex phase.
> **Goal:** Make FamilyLoop a family product, not just an individual tool
> **Timeline:** 2-3 weeks
> **Dependency:** Phase 2 core features working
>
> **Why Opus 4.6:** Multi-user data sharing is the hardest problem in the app. Row-level security policies, invite code systems, shared vs. private data boundaries, real-time sync between family members, and privacy-respecting feed design all require careful architectural reasoning. One wrong RLS policy could leak family data. This is not Auto Agent territory.

### 3.1 Family Groups

- Create a family group with a name
- Generate shareable invite code/link
- Join a family group via code or deep link
- Group admin can remove members
- Each user can be in multiple family groups

### 3.2 Shared Family Events

- Events can be marked as "shared with group"
- All group members see shared events (e.g., Grandma's birthday)
- Group members can mark events as "wished" independently
- Shared event reminders go to all group members

### 3.3 Family Feed (Simple)

- Optional, low-friction feed within a family group
- NOT a social media scroll -- purpose-built micro-interactions
- "Calvin called Grandma today" (auto-posted when an interaction is logged, if user opts in)
- Celebrate milestones: "The Smith family has made 50 connections this month!"
- Weekly family digest: "This week, 4 of 6 family members reached out to Grandma"

### 3.4 Gentle Accountability

- Family members can see a group "connection score" (anonymized)
- No shaming -- positive reinforcement only
- "Your family is 80% connected this week!"
- Optional: family members can "nudge" each other ("Mom would love to hear from you")

---

## Phase 4 - Modern UI Overhaul -- AUTO AGENT (with Opus 4.6 kickoff)

> **Agent:** Opus 4.6 for 4.1 (design system setup + first component migration to establish the pattern). Then Auto Agent for 4.2-4.5 (applying the pattern to every screen/component).
> **Goal:** Transform the visual experience without rebuilding
> **Timeline:** 2 weeks
> **Dependency:** Can run in parallel with Phase 2-3
>
> **Why this split:** Setting up NativeWind, establishing design tokens, and converting the first screen is a pattern-setting task that needs Opus 4.6's judgment. Once the pattern exists ("here's how we convert a screen"), Auto Agent can mechanically apply it to every remaining screen. This is the most parallelizable phase -- multiple Auto Agent tasks can convert different screens simultaneously.

### 4.1 Design System

**Add NativeWind (Tailwind CSS for React Native):**
- Utility-first styling replaces inline StyleSheet objects
- Consistent spacing, colors, typography
- Dark mode support built-in
- Much faster to iterate on UI

**OR use Tamagui:**
- Full component library + styling system
- Built for React Native + Web
- Excellent performance
- More opinionated but faster to ship

**Design tokens to establish:**
```
Colors:
  Primary:    #3B82F6 (modern blue)
  Secondary:  #8B5CF6 (purple)
  Success:    #10B981 (green)
  Warning:    #F59E0B (amber)
  Danger:     #EF4444 (red)
  Background: #FAFAFA (light) / #0F172A (dark)
  Surface:    #FFFFFF (light) / #1E293B (dark)
  Text:       #0F172A (light) / #F1F5F9 (dark)
  Muted:      #64748B

Typography:
  Headings:   Inter or SF Pro (system fonts)
  Body:       Inter or SF Pro
  Monospace:  JetBrains Mono (for scores/stats)

Spacing: 4px base grid (4, 8, 12, 16, 20, 24, 32, 40, 48, 64)
Border Radius: 8px (small), 12px (medium), 16px (large), 9999px (pill)
```

### 4.2 Component Upgrades

| Current | Upgraded |
|---------|----------|
| Plain Text headers | Animated gradient headers with blur backgrounds |
| Static contact cards | Swipeable cards with quick actions (react-native-gesture-handler) |
| Basic modals | Bottom sheet modals (react-native-bottom-sheet) |
| Static loading view | Skeleton loading screens + animated spinner (react-native-reanimated) |
| Emoji icons (📞💬) | Proper icon library (Lucide or Phosphor icons) |
| Plain score numbers | Animated progress rings / circular charts |
| Basic FlatLists | Animated lists with layout transitions |
| Alert.alert() for feedback | Toast notifications (sonner-native or react-native-toast) |
| Plain buttons | Haptic-feedback buttons with press animations |

### 4.3 Key Screen Redesigns

**Home Screen:**
- Hero card with overall family connection health (animated ring)
- Horizontal scroll of "Reach out today" contact pills
- Collapsible sections for Goals, Events, Contact Groups
- Pull-to-refresh with haptic feedback

**Reach Out Tab (formerly Chat):**
- Full-width contact cards with gradient accent based on urgency
- Swipe right to call, swipe left to text
- Quick-action floating button for logging interactions
- Search bar at top

**Profile:**
- Large avatar with edit overlay
- Stats section (total interactions, active streak, family score)
- Clean settings list with icons

**Onboarding:**
- Lottie animations instead of static emojis
- Smooth page transitions with react-native-reanimated
- Progress bar instead of dots

### 4.4 Animations & Micro-interactions

- Screen transitions using react-native-reanimated shared element transitions
- Haptic feedback on all buttons (already have expo-haptics)
- Confetti animation when completing a goal streak
- Subtle parallax on scroll (already have ParallaxScrollView component)
- Skeleton screens while loading data
- Smooth number count-up animations for scores

### 4.5 Dark Mode

- Full dark mode support using color scheme detection (hook already exists)
- All components respect theme
- Smooth transition between modes
- User preference saved to Supabase profile

---

## Phase 5 - Intelligence & ML -- OPUS 4.6

> **Agent:** Opus 4.6 for all sub-tasks. Algorithm design, ML pipeline architecture, and privacy-preserving data flows require deep reasoning.
> **Goal:** Graduate from keyword matching to actual intelligence
> **Timeline:** 3-4 weeks
> **Dependency:** Phase 2 complete (need real data flowing)
>
> **Why Opus 4.6:** Designing scoring algorithms, communication pattern analysis, and ML model selection are judgment-heavy tasks. The privacy-first constraint (no raw data leaves device) adds architectural complexity. Auto Agent would produce naive implementations that miss edge cases. Opus 4.6 can reason about statistical distributions, optimal reminder timing, and anomaly detection properly.

### 5.1 On-Device Intelligence (No Backend Needed)

**Improved Relationship Detection:**
- Move beyond keyword matching ("mom", "dad") to pattern analysis
- Use contact frequency, call duration, and time-of-day patterns
- Detect relationships by communication patterns even without name hints
- "You call this number every Sunday for 20+ minutes -- is this a close family member?"

**Smart Scheduling:**
- Analyze user's calling patterns to suggest optimal reach-out times
- "You usually call Mom on Sundays at 2 PM -- want to set a reminder?"
- Detect when user is likely free based on historical interaction times

**Conversation Starters:**
- Based on last interaction note and time elapsed
- "Last time you talked to Dad, you mentioned his garden. Ask how it's going!"
- Simple template engine, not AI-generated

### 5.2 Backend Intelligence (Python FastAPI)

**Only build this if/when the app has real users generating real data.**

**Stack:**
- Python 3.12+ with FastAPI
- Deployed as Supabase Edge Function or separate service (Railway/Fly.io)
- scikit-learn for basic ML models

**Features:**
- Communication pattern clustering (identify which contacts are "fading")
- Optimal reminder scheduling using historical response data
- Anomaly detection ("You usually talk to Mom weekly but it's been 23 days")
- Family health score prediction (will this relationship improve or decline?)

### 5.3 Privacy-First ML Principles

- All raw message content stays on device (never sent to server)
- Only metadata goes to backend (timestamps, durations, frequencies)
- User can opt out of any intelligence features
- Clear data processing disclosure in settings
- All ML models can run on-device for offline support
- No third-party AI APIs (no OpenAI, no sending data to external services)

---

## Phase 6 - Polish & App Store -- EITHER (per sub-task)

> **Agent:** Mixed. See sub-tasks below.
> **Goal:** Ship to real users
> **Timeline:** 2 weeks
> **Dependency:** Phase 2 + Phase 4 at minimum
>
> **Why either:** Some tasks (writing tests, adding Sentry, performance fixes) are mechanical and perfect for Auto Agent. Others (writing compelling app store copy, determining analytics strategy, making privacy policy decisions) benefit from Opus 4.6's reasoning.

### 6.1 App Store Requirements -- OPUS 4.6

> Opus 4.6. Writing privacy policies, terms of service, and compelling app store copy requires nuanced language. Legal and marketing decisions, not code.

| Requirement | Status | Action Needed |
|-------------|--------|---------------|
| Privacy Policy | Exists (GitHub Pages link) | Review and update for Supabase/data collection |
| Terms of Service | Missing | Create and host |
| Account Deletion | Missing | Implement in Profile (required by Apple & Google) |
| Data Export | Missing | Implement in Settings |
| App Icons | Exists (default) | Design proper branded icons |
| Screenshots | Missing | Create for both stores |
| App Description | Missing | Write compelling store listing |
| Age Rating | Not set | Determine and configure |
| Content Rating | Not set | Complete questionnaire |

### 6.2 Testing -- AUTO AGENT

> Auto Agent. Writing unit tests and integration tests is mechanical once you tell it what to test. Run multiple agents in parallel -- one per test file.

- Unit tests for RelationshipAnalyzer, NameDetector, date calculations
- Integration tests for Supabase CRUD operations
- E2E tests for critical flows (signup, log interaction, create goal)
- Manual QA on Android and iOS devices
- Beta testing with 5-10 real family members

### 6.3 Performance -- EITHER

> Start with Auto Agent for lazy loading and image optimization. Escalate to Opus 4.6 if profiling reveals non-obvious bottlenecks.

- Profile app startup time (target: < 2 seconds to interactive)
- Optimize contact loading (currently loads ALL then filters -- should filter at query level)
- Lazy load tab screens
- Image optimization for avatars
- Memory profiling (300 contacts + interactions could get heavy)

### 6.4 Error Handling & Monitoring -- AUTO AGENT

> Auto Agent. Adding Sentry, error boundaries, and network error wrappers are well-documented patterns.

- Add Sentry or Bugsnag for crash reporting
- Proper error boundaries in React components
- Network error handling (offline support with local queue)
- User-facing error messages (replace raw Alert.alert with user-friendly messages)

### 6.5 Analytics (Privacy-Respecting) -- OPUS 4.6

> Opus 4.6. Deciding what to track, how to track it without violating privacy principles, and choosing the right tool requires judgment.

- Track key user actions (not personal data):
  - Interactions logged per day
  - Goals created/completed
  - Feature usage (which tabs, which actions)
  - Retention metrics
- Use Supabase analytics or PostHog (self-hosted option)
- No third-party trackers (no Google Analytics, no Facebook SDK)

---

## Technical Debt Registry -- AUTO AGENT (all items)

> Every item here is a small, isolated, well-defined fix. Perfect for Auto Agent. You can batch multiple items into a single agent prompt like: "Fix TD-01, TD-02, and TD-03 from the tech debt registry in PHASE_PLAN.md."

Issues to clean up as encountered (not blocking any phase):

| ID | Description | Location | Effort |
|----|-------------|----------|--------|
| TD-01 | Contact interface defined 4+ different ways | index.tsx, chat.tsx, FamilyEvents.tsx, AutomaticDetection.ts | Medium |
| TD-02 | Smart contact filtering duplicated in 3 files | index.tsx, chat.tsx, FamilyEvents.tsx | Medium |
| TD-03 | Relationship detection duplicated | nameDetector.js vs FamilyEvents.tsx inline | Small |
| TD-04 | nameDetector.js is JavaScript (should be TypeScript) | utils/nameDetector.js | Small |
| TD-05 | Console.log statements everywhere | Multiple files | Small |
| TD-06 | Unused imports in various files | Multiple files | Small |
| TD-07 | config/ directory is empty | config/ | Trivial |
| TD-08 | Default Expo README.md | README.md | Small |
| TD-09 | Unused Pressable import in chat.tsx | app/(tabs)/chat.tsx | Trivial |
| TD-10 | FirebaseAuthTypes import in login.tsx (wrong package) | app/(auth)/login.tsx | Small |
| TD-11 | useMemo dependency array has functions that change every render | contexts/AuthContext.tsx | Medium |
| TD-12 | ParallaxScrollView, HelloWave, Collapsible are unused template components | components/ | Small |

---

## Architecture Decisions

### ADR-001: Supabase over Firebase Firestore

**Decision:** Use Supabase (Postgres) as primary database.

**Rationale:**
- Relational data model fits family groups, contacts, interactions better than NoSQL
- Row-level security enables family sharing without custom backend
- Built-in real-time subscriptions
- SQL is more powerful for analytics queries (trend calculations, aggregations)
- Phone auth works out of the box (Firebase Web SDK doesn't support it well)
- Edge Functions replace need for separate backend
- Better free tier for startups

**Trade-off:** Firebase Auth migration needed if going all-in on Supabase.

### ADR-002: Keep React Native + Expo

**Decision:** Do NOT rewrite in Swift/Kotlin or switch to Flutter.

**Rationale:**
- Existing codebase has ~5,000+ lines of working business logic
- Expo SDK 53 is mature and feature-rich
- Cross-platform from one codebase (Android + iOS + Web)
- Large ecosystem (expo-notifications, expo-contacts, etc.)
- Development builds support native modules when needed
- Industry standard (used by Discord, Shopify, Bloomberg)

### ADR-003: NativeWind for UI Styling

**Decision:** Adopt NativeWind (Tailwind CSS for React Native) for styling.

**Rationale:**
- Replaces 1000+ lines of StyleSheet definitions with utility classes
- Built-in dark mode support
- Consistent design tokens (spacing, colors, typography)
- Faster iteration on UI changes
- Familiar to web developers
- Works with existing React Native components

**Alternative considered:** Tamagui (heavier but more features). NativeWind chosen for simplicity.

### ADR-004: No AI Chatbot / No External AI APIs

**Decision:** Intelligence features will be rule-based and on-device. No OpenAI/Claude API calls.

**Rationale:**
- Privacy is a core value (family data should not go to AI companies)
- Rule-based systems are predictable and explainable
- Lower cost (no API fees)
- Works offline
- ML can be added later with on-device models if needed
- Users trust "we analyze patterns" more than "we send your data to AI"

### ADR-005: Redesign Chat as "Reach Out"

**Decision:** Replace the misleading chat tab with a purpose-built "Reach Out" action screen.

**Rationale:**
- Building real in-app messaging is a massive undertaking (3-6 months alone)
- Current implementation opens native SMS anyway
- "Reach Out" is more aligned with app's purpose (prompting action, not replacing messaging)
- Simpler, more focused, more honest UX
- Can still deep-link to SMS, WhatsApp, Phone, FaceTime

---

## Dependencies to Add (by Phase)

### Phase 0
*No new dependencies*

### Phase 1
```
@supabase/supabase-js        -- Supabase client
expo-notifications            -- Push + local notifications
expo-task-manager             -- Background task scheduling
expo-device                   -- Device detection for notifications
```

### Phase 2
```
@react-native-community/datetimepicker  -- (already installed, just use it)
expo-image-picker                       -- Profile photo upload
```

### Phase 4
```
nativewind                    -- Tailwind CSS for React Native
tailwindcss                   -- Tailwind engine
react-native-bottom-sheet     -- Modern bottom sheet modals
@gorhom/bottom-sheet          -- Alternative bottom sheet
lottie-react-native           -- Lottie animations for onboarding
react-native-svg              -- SVG charts for health scores
lucide-react-native           -- Modern icon set
sonner-native                 -- Toast notifications
```

### Phase 5
*Python backend (separate repo):*
```
fastapi
uvicorn
scikit-learn
pandas
supabase-py
```

---

## Success Metrics

| Metric | Target (MVP) | Target (6 months) |
|--------|-------------|-------------------|
| Daily Active Users | 10 (beta testers) | 500 |
| Interactions logged per user/week | 3 | 7 |
| Goals created per user | 2 | 5 |
| Notification open rate | 30% | 40% |
| 7-day retention | 40% | 60% |
| App Store rating | N/A | 4.5+ |
| Crash-free rate | 95% | 99.5% |
| App startup time | < 3s | < 1.5s |

---

## Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| iOS restrictions block call log/SMS access | High | High | Focus iOS on manual logging + contact birthdays; auto-detection is Android-only feature |
| Users don't remember to open the app | High | Critical | Push notifications (Phase 1) are the #1 priority to solve this |
| Supabase free tier limits hit | Low | Medium | Monitor usage; upgrade plan costs ~$25/month |
| Users find manual interaction logging tedious | Medium | High | Auto-detection (Android), quick-log UX, one-tap actions |
| Privacy concerns about contact/call access | Medium | High | Clear permission explanations, on-device processing messaging, transparent privacy policy |
| Scope creep into social media territory | Medium | Medium | Stay focused on "communication prompting" not "content sharing" |

---

*This document is a living plan. Update it as decisions are made and phases are completed.*
