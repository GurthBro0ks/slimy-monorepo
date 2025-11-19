# Labs: Front Door & Dashboard

This document describes the new experimental front door landing page and role-aware dashboard implemented in the `/app/labs` directory.

## Overview

These routes provide a draft "front door" experience and a role-aware dashboard shell that do not interfere with existing pages. They are designed to be safely tested and iterated on before integration into the main navigation.

## File Structure

```
apps/web/
├── app/
│   └── labs/
│       ├── _components/           # Shared components (isolated to labs)
│       │   ├── FeatureCard.tsx    # Reusable feature card component
│       │   └── RoleIndicator.tsx  # Badge showing user role
│       ├── frontdoor/             # Landing page route
│       │   └── page.tsx           # Front door landing page
│       └── dashboard/             # Dashboard route
│           ├── layout.tsx         # Dashboard layout with sidebar & header
│           └── page.tsx           # Dashboard home with role-awareness
```

## Routes

### 1. Front Door Landing Page

**URL:** `/labs/frontdoor`

**Purpose:** A public-facing landing page introducing Slimy.ai and its features.

**Features:**
- Hero section with gradient branding
- Feature grid showcasing:
  - Snail Tools (Discord utilities)
  - Slime Chat (AI chat assistant)
  - slime.craft (Minecraft integration)
  - Admin (admin controls)
- Placeholder authentication buttons:
  - "Login with Discord" (UI-only, see TODO)
  - "Continue as Guest" (UI-only, see TODO)
- Call-to-action section

**Styling:**
- Uses neon-green (#00FF41) and purple (#8B4FBF) brand colors
- Tailwind CSS with existing design tokens
- Responsive layout (mobile, tablet, desktop)

### 2. Dashboard

**URL:** `/labs/dashboard`

**Purpose:** Role-aware dashboard with sidebar navigation and feature access.

**Layout Features (`layout.tsx`):**
- Responsive sidebar navigation
  - Desktop: Always visible (w-64)
  - Mobile: Collapsible menu
- Top header bar with:
  - Mobile menu toggle
  - Page title
  - Labs preview indicator
- User section in sidebar:
  - User avatar placeholder
  - Role indicator badge
  - Logout button (UI-only)
- Role-based nav items:
  - Dashboard, Snail Tools, Slime Chat, slime.craft always visible
  - Admin menu item only shown when `isAdmin: true`

**Dashboard Features (`page.tsx`):**
- Mock user object with role-awareness:
  ```typescript
  const mockUser = {
    id: "mock-user-123",
    name: "Demo User",
    role: "admin" | "club" | "user",
    isAdmin: boolean,
    isClubMember: boolean,
  }
  ```
- Stats overview cards:
  - Total Commands
  - Chat Messages
  - Minecraft Players
  - Server Uptime
- Quick access feature cards
- Role-specific sections:
  - **Club Members:** Exclusive features card (priority support, analytics, etc.)
  - **Admins:** Admin dashboard card (user management, logs, config)
- Debug info card showing mock data (remove in production)

## How to Try Locally

### Prerequisites
- Monorepo dependencies installed (`pnpm install`)
- Web app dev server running

### Steps

1. **Start the development server:**
   ```bash
   cd apps/web
   pnpm dev
   ```

2. **Navigate to the front door:**
   ```
   http://localhost:3000/labs/frontdoor
   ```

3. **Navigate to the dashboard:**
   ```
   http://localhost:3000/labs/dashboard
   ```

4. **Test role-awareness:**

   Edit `apps/web/app/labs/dashboard/page.tsx` and change the mock user role:

   ```typescript
   // Try different roles
   const mockUser = {
     role: "admin",    // Shows admin section + club section
     isAdmin: true,
     isClubMember: true,
   }

   // OR

   const mockUser = {
     role: "club",     // Shows club section only
     isAdmin: false,
     isClubMember: true,
   }

   // OR

   const mockUser = {
     role: "user",     // Shows basic features only
     isAdmin: false,
     isClubMember: false,
   }
   ```

## Design Decisions

### Why `/app/labs`?
- **Isolation:** Prevents conflicts with existing routes
- **Safe experimentation:** Can be easily removed or refactored
- **Clear intent:** Developers know this is experimental

### Why shared components in `_components/`?
- **Namespace isolation:** Underscore prefix signals internal/private
- **Reusability:** Components can be shared between frontdoor and dashboard
- **Non-interference:** Won't be imported by existing code outside labs

### Styling Consistency
- Uses existing design tokens from `tailwind.config.ts`
- Follows patterns from `app/page.tsx`, `app/features/page.tsx`
- Leverages existing UI components from `components/ui/`
- Maintains neon-green brand identity

## TODO List (Wiring to Real Functionality)

### Authentication & User Management

#### Front Door (`app/labs/frontdoor/page.tsx`)
- [ ] **Wire Discord OAuth**
  - Replace `console.log` in "Login with Discord" button
  - Implement OAuth flow using Next-Auth or similar
  - Redirect to dashboard on successful auth

- [ ] **Wire Guest Mode**
  - Define guest user permissions
  - Create guest session
  - Redirect to dashboard with limited access

#### Dashboard Layout (`app/labs/dashboard/layout.tsx`)
- [ ] **Replace mock user with real auth context**
  - Implement auth provider/hook (e.g., `useAuth()`)
  - Fetch user from session/JWT
  - Handle loading and error states

- [ ] **Wire real logout**
  - Call auth provider's logout method
  - Clear session/cookies
  - Redirect to front door or home

#### Dashboard Page (`app/labs/dashboard/page.tsx`)
- [ ] **Replace mock user object**
  - Use `useAuth()` or `getServerSession()`
  - Fetch user profile from API
  - Implement proper TypeScript types for User

- [ ] **Implement real permissions checking**
  - Create permissions/roles system
  - Check `isAdmin` from database or auth provider
  - Check `isClubMember` from subscription/membership API

### API Integration

#### Dashboard Stats
- [ ] **Connect stats to real APIs**
  - Total Commands: `/api/stats/commands`
  - Chat Messages: `/api/stats/messages`
  - Minecraft Players: `/api/minecraft/players`
  - Server Uptime: `/api/stats/uptime`

- [ ] **Implement error handling**
  - Show skeleton loaders while fetching
  - Display error states
  - Add retry logic

- [ ] **Add real-time updates**
  - Use SWR or React Query for auto-refresh
  - Consider WebSocket for live stats

### Navigation & Routing

#### Feature Card Links
- [ ] **Create actual feature pages**
  - `/labs/dashboard/snail` - Snail Tools page
  - `/labs/dashboard/chat` - Slime Chat configuration
  - `/labs/dashboard/minecraft` - Minecraft stats & management
  - `/labs/dashboard/admin` - Admin control panel

- [ ] **Implement active route highlighting**
  - Add `usePathname()` to sidebar nav
  - Apply active state styling to current route

#### Integration with Main App
- [ ] **Add labs routes to main navigation**
  - Update header/navigation to include labs entry
  - Or create dedicated "Dashboard" link

- [ ] **Set up redirects**
  - Redirect `/` to `/labs/frontdoor` for new users
  - Redirect authenticated users to `/labs/dashboard`

- [ ] **Handle route protection**
  - Redirect unauthenticated users from dashboard to front door
  - Implement middleware for protected routes

### UI/UX Improvements

#### Front Door
- [ ] **Add animations**
  - Fade-in effects for hero section
  - Scroll-triggered animations for features

- [ ] **Implement actual feature descriptions**
  - Replace placeholder text with real descriptions
  - Add screenshots or demo videos

#### Dashboard
- [ ] **Add user avatar support**
  - Fetch avatar URL from auth provider
  - Use Next.js Image component
  - Fallback to initials or default avatar

- [ ] **Implement notifications**
  - Add notification bell icon to header
  - Show unread count
  - Wire to real notification API

- [ ] **Add settings modal**
  - User profile settings
  - Theme preferences
  - Notification preferences

- [ ] **Remove debug info card**
  - Delete the yellow debug card in production builds
  - Or gate it with `process.env.NODE_ENV === 'development'`

### Data & State Management

- [ ] **Set up global state management**
  - Consider Zustand, Redux, or React Context
  - Manage user state, permissions, preferences

- [ ] **Implement data caching**
  - Use SWR or React Query
  - Cache API responses
  - Implement optimistic updates

### Testing

- [ ] **Write unit tests**
  - Test FeatureCard component
  - Test RoleIndicator component
  - Test role-based visibility logic

- [ ] **Write integration tests**
  - Test navigation flow
  - Test role-based access control
  - Test responsive layouts

- [ ] **E2E tests**
  - Test complete auth flow
  - Test dashboard interactions
  - Test mobile responsiveness

### Performance

- [ ] **Optimize images**
  - Use Next.js Image component
  - Implement lazy loading

- [ ] **Code splitting**
  - Dynamic imports for heavy components
  - Route-based code splitting

- [ ] **Add loading states**
  - Skeleton components for async data
  - Loading spinners for actions

### Accessibility

- [ ] **Keyboard navigation**
  - Ensure all interactive elements are keyboard accessible
  - Add focus indicators

- [ ] **ARIA labels**
  - Add proper ARIA attributes
  - Test with screen readers

- [ ] **Color contrast**
  - Verify WCAG AA compliance
  - Test in high contrast mode

## Security Considerations

### Authentication
- [ ] Use secure session management (HTTPOnly cookies, CSRF protection)
- [ ] Implement rate limiting on auth endpoints
- [ ] Add MFA support for admin users

### Authorization
- [ ] Server-side permission checks (never trust client-side)
- [ ] Implement proper RBAC (Role-Based Access Control)
- [ ] Audit log for admin actions

### Data Protection
- [ ] Sanitize all user inputs
- [ ] Implement CSP (Content Security Policy)
- [ ] Use HTTPS in production

## Migration Path

When ready to integrate into main app:

1. **Phase 1: Testing**
   - Get feedback on labs routes
   - Iterate on design and UX
   - Test with real users

2. **Phase 2: Integration**
   - Move components from `app/labs/_components/` to `components/`
   - Update routes to production paths (e.g., `/dashboard`)
   - Wire up real authentication and APIs

3. **Phase 3: Deployment**
   - Update navigation to point to new routes
   - Set up redirects from old routes (if any)
   - Monitor analytics and errors

4. **Phase 4: Cleanup**
   - Remove `/app/labs` directory
   - Archive old implementations
   - Update documentation

## Questions?

If you have questions or need help with implementation:
- Check existing patterns in `apps/web/app/`
- Reference UI components in `apps/web/components/ui/`
- Consult `tailwind.config.ts` for design tokens
- Review similar features in the codebase (e.g., `/app/admin`, `/app/analytics`)

## Notes

- **No existing code was modified** - All new routes and components are isolated
- **Placeholder auth** - All auth-related functionality is UI-only with TODO comments
- **Mock data** - Stats and user data are hard-coded for demonstration
- **Responsive design** - Layouts work on mobile, tablet, and desktop
- **Role-based visibility** - Admin sections only show when `isAdmin: true`
