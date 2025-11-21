# Web Backend Integration Summary

This document describes the integration between the web frontend (`apps/web`) and the admin API backend (`apps/admin-api`), including authentication flows, routes, and navigation.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication System](#authentication-system)
3. [Front Door & Navigation](#front-door--navigation)
4. [Routes & Pages](#routes--pages)
5. [Protected Routes](#protected-routes)
6. [Manual Test Checklist](#manual-test-checklist)

---

## Architecture Overview

The Slimy monorepo uses a clean separation between frontend and backend:

- **Frontend**: Next.js 14 app (`apps/web`) with App Router, React Server Components, and Client Components
- **Backend**: Express.js API (`apps/admin-api`) handling Discord OAuth, JWT sessions, and data operations
- **Communication**: HTTP requests via `AdminApiClient` with credential-based authentication (cookies)

### Environment Modes

The frontend supports two modes:

1. **Sandbox Mode** (default): No backend required, uses mock data for development
   - Set when `NEXT_PUBLIC_ADMIN_API_BASE` is not configured
   - All features work with mock data

2. **Live Mode**: Connected to admin-api backend
   - Set `NEXT_PUBLIC_ADMIN_API_BASE` to admin-api URL (e.g., `http://localhost:3001`)
   - Real Discord OAuth, JWT sessions, and live data

---

## Authentication System

### Custom Discord OAuth (NOT NextAuth)

The authentication system is a custom implementation built around Discord OAuth:

- **Provider**: `AuthProvider` in `apps/web/lib/auth/context.tsx`
- **Hook**: `useAuth()` exposes auth state and methods
- **Cookie-based**: JWT tokens stored in HTTP-only cookies (set by admin-api)

### Auth Context API

```typescript
const { user, loading, error, login, logout, refresh } = useAuth();
```

- `user`: Current user object with `{ id, name, role, guilds[] }` or `null`
- `loading`: Boolean indicating auth check in progress
- `error`: Error message if auth fails
- `login()`: Redirects to Discord OAuth flow
- `logout()`: Clears session and redirects
- `refresh()`: Manually refresh user session

### User Roles

Three role levels with hierarchical access:

1. **user** (level 0): Basic authenticated user
2. **club** (level 1): Club member access
3. **admin** (level 2): Full admin access

### Login Flow

1. User clicks "Login with Discord"
2. `login()` redirects to `${ADMIN_API_BASE}/api/auth/login`
3. Admin-api redirects to Discord OAuth
4. Discord redirects back to admin-api callback
5. Admin-api sets JWT cookie and redirects to web app
6. Web app calls `/api/auth/me` to fetch user data
7. User is now authenticated

### Logout Flow

1. User clicks "Logout"
2. `logout()` clears local state
3. Redirects to `${ADMIN_API_BASE}/api/auth/logout`
4. Admin-api clears cookie and redirects to home

---

## Front Door & Navigation

### Homepage (`/`)

The homepage serves as the front door to Slimy:

- **Hero Section**:
  - Slimy branding and tagline
  - Auth-aware CTA:
    - Guests: "Login with Discord" button
    - Authenticated: "Welcome back, [name]" + "Open Dashboard" button

- **Feature Grid**:
  - Four clickable feature cards with links to actual pages:
    - Slime Chat (`/chat`) - Public, no login required
    - Snail Codes (`/snail/codes`) - Protected, requires login
    - Club Analytics (`/club`) - Club members only
    - Snail Tools (`/snail`) - Protected, requires login
  - Each card shows a badge indicating access level
  - Club-only features are hidden from non-club users

- **Backend Status Section**:
  - Explains sandbox vs live mode
  - Shows configuration info

- **Behavior**:
  - Works in both sandbox and live modes
  - No backend required for initial render
  - Gracefully handles auth loading state

### Login Page (`/login`)

Dedicated login page with three states:

1. **Loading State**:
   - Shows spinner with "Checking session..."

2. **Already Logged In**:
   - Displays "You're already logged in as [name]"
   - Provides buttons:
     - "Go to Dashboard" (links to `/snail/codes`)
     - "Back to Home"
     - "Logout" (secondary action)

3. **Not Logged In**:
   - Shows slimy.ai branding
   - Explanation: "Connect with Discord to access..."
   - Primary button: "Login with Discord" with Discord icon
   - Secondary link: "Back to Home"

### Primary Navigation (Header)

The `Header` component (`apps/web/components/layout/header.tsx`) provides site-wide navigation:

**Left Side**:
- Slimy logo and brand name (links to `/`)
- Horizontal nav menu (desktop only):
  - Home (`/`)
  - Chat (`/chat`)
  - Snail Codes (`/snail/codes`)
  - Club (`/club`) - Only visible to club members and admins

**Right Side**:
- Usage badge (shows API usage stats)
- Auth indicator:
  - **Loading**: Skeleton placeholder
  - **Not Logged In**: "Login with Discord" button
  - **Logged In**:
    - Username display
    - Role badge (if club or admin)
    - "Dashboard" button (role-aware link)
    - "Logout" button with icon

**Smart Features**:
- Active route highlighting (neon green)
- Role-based visibility for Club link
- Prefetching of critical paths when authenticated
- Loading states for login/logout actions

---

## Routes & Pages

### Public Routes

- `/` - Homepage (works without auth)
- `/chat` - Slime Chat (session-aware, works without login)
- `/login` - Login page

### Protected Routes (Require Authentication)

- `/snail` - Snail tools landing
- `/snail/codes` - Secret codes list
- `/screenshots` - Screenshot analysis (TODO: not yet implemented)
- `/tiers` - Tier calculator (TODO: not yet implemented)

### Role-Restricted Routes

- `/club` - Club analytics (requires `role: "club"` or `role: "admin"`)

### Admin Routes

- `/guilds` - Guild management (requires `role: "admin"`)

---

## Protected Routes

### ProtectedRoute Component

Location: `apps/web/components/auth/protected-route.tsx`

Usage:

```tsx
// Any authenticated user
<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>

// Club members only
<ProtectedRoute requiredRole="club">
  <ClubContent />
</ProtectedRoute>

// Admins only
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>
```

**Behavior**:
- Shows loading skeleton while checking auth
- Redirects to home (or `/login` if specified) when access denied
- Supports custom fallback components
- Respects role hierarchy (admin can access club content)

**Important**: ProtectedRoute remains the source of truth for access control. Navigation links in Header may be visible but the route itself enforces access.

---

## Manual Test Checklist

### Phase 4: Homepage + Login + Navigation

#### Test as Guest (Not Logged In)

- [ ] Visit `/` (homepage)
  - [ ] Hero shows "Login with Discord" CTA
  - [ ] Feature cards are visible and clickable
  - [ ] Club Analytics card is NOT visible (unless you're logged in as club)
  - [ ] Backend status section explains sandbox mode
  - [ ] No errors in console

- [ ] Click "Login with Discord" button
  - [ ] Redirects to Discord OAuth (or shows error if admin-api not configured)

- [ ] Visit `/login` as guest
  - [ ] Shows "Login to slimy.ai" card
  - [ ] "Login with Discord" button visible
  - [ ] "Back to Home" link works

- [ ] Check Header navigation
  - [ ] Logo and brand name visible
  - [ ] Nav links: Home, Chat, Snail Codes visible
  - [ ] Club link NOT visible (unless authenticated as club)
  - [ ] "Login with Discord" button visible in header
  - [ ] No errors in console

#### Test After Login (Authenticated User)

- [ ] Complete Discord OAuth flow
  - [ ] Redirected back to web app
  - [ ] User data appears in Header (username + role badge if applicable)
  - [ ] "Dashboard" and "Logout" buttons appear in Header

- [ ] Visit `/` (homepage) as logged-in user
  - [ ] Hero shows "Welcome back, [name]!" message
  - [ ] CTA button changes to "Open Dashboard"
  - [ ] Club Analytics card visible if user has club role
  - [ ] No errors in console

- [ ] Visit `/login` as logged-in user
  - [ ] Shows "You're already logged in as [name]"
  - [ ] "Go to Dashboard" button works
  - [ ] "Back to Home" link works
  - [ ] "Logout" button works

- [ ] Test Header navigation
  - [ ] All public nav links work (Home, Chat, Snail Codes)
  - [ ] Club link visible if user has club role
  - [ ] Username and role badge display correctly
  - [ ] "Dashboard" button links to correct page based on role:
    - Admin → `/guilds`
    - Club → `/club`
    - User → `/snail`

- [ ] Test logout flow
  - [ ] Click "Logout" in Header
  - [ ] Redirected through admin-api logout
  - [ ] Header returns to guest state (shows "Login" button)
  - [ ] User data cleared from context

#### Test Protected Routes

- [ ] Visit protected routes as guest
  - [ ] `/snail/codes` redirects to login or triggers login flow
  - [ ] `/club` redirects if not club member
  - [ ] `/guilds` redirects if not admin

- [ ] Visit protected routes as authenticated user
  - [ ] `/snail/codes` works for all authenticated users
  - [ ] `/club` works only for club members and admins
  - [ ] `/guilds` works only for admins

#### Test Sandbox Mode (No Backend)

- [ ] Ensure `NEXT_PUBLIC_ADMIN_API_BASE` is not set
- [ ] Visit `/` - should load without errors
- [ ] Click "Login with Discord" - should log error in console but not crash
- [ ] Visit `/login` - should load without errors
- [ ] Visit `/chat` - should work with mock data

#### Test Live Mode (With Backend)

- [ ] Set `NEXT_PUBLIC_ADMIN_API_BASE` to admin-api URL
- [ ] Ensure admin-api is running
- [ ] Complete full login/logout cycle
- [ ] Test all protected routes
- [ ] Verify JWT cookies are set correctly

---

## API Client

### AdminApiClient

Location: `apps/web/lib/api-client.ts`

Usage:

```typescript
import { apiClient } from "@/lib/api-client";

const response = await apiClient.get<User>("/auth/me");
```

**Features**:
- Automatic `credentials: "include"` for cookie-based auth
- Type-safe responses with generics
- Sandbox mode support (returns mock data when backend unavailable)
- Request caching with configurable TTL
- Error handling with fallbacks

---

## Development Tips

### Running in Sandbox Mode

```bash
cd apps/web
pnpm dev
```

Visit `http://localhost:3000` - everything works with mock data, no backend required.

### Running with Live Backend

Terminal 1 (Backend):
```bash
cd apps/admin-api
pnpm dev
```

Terminal 2 (Frontend):
```bash
cd apps/web
NEXT_PUBLIC_ADMIN_API_BASE=http://localhost:3001 pnpm dev
```

Visit `http://localhost:3000` - connected to live backend with real Discord OAuth.

### Testing Authentication

1. Set up Discord OAuth app credentials in admin-api
2. Configure `NEXT_PUBLIC_ADMIN_API_BASE`
3. Click "Login with Discord"
4. Authorize app on Discord
5. Redirected back authenticated

---

## Future Enhancements (TODOs)

### Homepage UX Polish

- [ ] Add animated hero section
- [ ] Add testimonials or user quotes
- [ ] Add feature screenshots/demos
- [ ] Add footer newsletter signup
- [ ] Add Discord community stats widget
- [ ] Add "Getting Started" guide section

### Navigation Improvements

- [ ] Add mobile navigation menu (hamburger)
- [ ] Add breadcrumbs for nested routes
- [ ] Add keyboard navigation shortcuts
- [ ] Add search functionality in header
- [ ] Add notification bell for alerts

### Login Flow Enhancements

- [ ] Add "Remember me" option
- [ ] Add redirect to original destination after login
- [ ] Add social proof (e.g., "Join 10,000+ Super Snail players")
- [ ] Add loading animation during OAuth flow
- [ ] Add error handling for failed OAuth

### Feature Pages

- [ ] Implement `/screenshots` page for screenshot analysis
- [ ] Implement `/tiers` page for tier calculator
- [ ] Add usage analytics to feature pages
- [ ] Add feature tour/onboarding for new users

---

## Related Documentation

- [STRUCTURE.md](./STRUCTURE.md) - Overall monorepo structure
- Admin API routes - See `apps/admin-api/routes/`
- Web components - See `apps/web/components/`

---

**Last Updated**: 2025-11-21 (Phase 4: Homepage + Login + Nav)
