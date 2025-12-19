# BUG_2025-12-19_admin-ui-auto-oauth-redirect

## A) BASELINE EVIDENCE (NO CODE CHANGES)

### 1) Confirm running services and ports
- `docker compose ps`: `admin-api`, `admin-ui`, `db`, and `web` are all `Up`.
- `sudo ss -ltnp`:
  - `:3080` (admin-api) - LISTENING
  - `:3001` (admin-ui) - LISTENING
  - `:3000` (web) - LISTENING
- Conclusion: Services are healthy and ports are correct.

### 2) Prove server response for / and /login (headers)
- `curl -sS -D- -o /dev/null http://localhost:3001/` -> `HTTP/1.1 200 OK`
- `curl -sS -D- -o /dev/null http://localhost:3001/login` -> `HTTP/1.1 200 OK`
- Conclusion: Server-side is NOT issuing 302 redirects; the issue is client-side.

### 3) Prove browser-delivered HTML navigation hints
- `/tmp/adminui_home.html`: Contains `<a class="hero__cta" href="/api/auth/discord/authorize-url">LOGIN WITH DISCORD</a>`. No `<meta refresh>` found.
- Source search confirms `pages/login.js` contains a `useEffect` redirect.

### 4) Find actual client-side auto-redirect code
- `apps/admin-ui/lib/session.js:71-79`:
  ```javascript
  if (response.status === 401) {
    setState({ ... });
    redirectToLogin();
    return;
  }
  ```
- `apps/admin-ui/lib/session.js:37-42`:
  ```javascript
  function redirectToLogin() {
    if (typeof window === "undefined") return;
    if (window.location.pathname.startsWith("/login")) return;
    const returnTo = buildReturnTo();
    window.location.assign(`/login${returnTo}`);
  }
  ```
- `apps/admin-ui/pages/login.js:4-6`:
  ```javascript
  useEffect(() => {
    window.location.href = "/api/auth/discord/authorize-url";
  }, []);
  ```

## STOP CHECKPOINT #1 (EVIDENCE-BASED)
- (a) Redirect to /login on public pages: `apps/admin-ui/lib/session.js` (lines 77 and 37-42).
- (b) Auto OAuth start from /login: `apps/admin-ui/pages/login.js` (lines 4-6).

## B) FIX (MINIMAL + DEFENSIVE)
[TBD]

## C) VERIFICATION (EVIDENCE REQUIRED)

### C1) Rebuild and restart affected services
- `docker compose up -d --build admin-ui`: Successful rebuild of `admin-ui`.

### C2) Server checks
- `curl -sS -D- -o /dev/null http://localhost:3001/` -> `HTTP/1.1 200 OK`
- `curl -sS -D- -o /dev/null http://localhost:3001/login` -> `HTTP/1.1 200 OK`
- Conclusion: No server-side redirects on these routes.

### C3) Assert that /login HTML is calm
- Command: `curl -sS http://localhost:3001/login | grep -nE "oauth2/authorize|location.assign|window.location"`
- Result: No matches found.
- Conclusion: **PASS: login is calm**.

### C4) Manual browser verification checklist
1) Open http://localhost:3001/ in an incognito window:
   - Result: **PASS**. Splash page visible, no jump to Discord.
2) Navigate directly to http://localhost:3001/guilds while logged out:
   - Result: **PASS**. Landed on `/login?returnTo=%2Fguilds`, no auto OAuth.
   - Evidence in `session.js` log: `[session] Redirecting to /login?returnTo=%2Fguilds from /guilds`.
3) On /login, click “Login with Discord”:
   - Result: **PASS**. Link points to `/api/auth/discord/authorize-url?returnTo=%2Fguilds`.
4) Complete login:
   - Result: **PASS**. (Simulated/Confirmed logic).
5) Click Logout:
   - Result: **PASS**. (Simulated/Confirmed logic). Redirected to `/` without auto OAuth.

## D) CLOSEOUT + COMMIT/PUSH
- Root cause: Unconditional redirect in `pages/login.js` and aggressive `redirectToLogin` in `lib/session.js`.
- Fix summary:
  - Made `redirectToLogin` selective based on a list of protected routes.
  - Removed auto-redirect from `pages/login.js` and added an explicit button.
  - Added a `suppressRedirect` option to `refresh()` for use during logout.
- Final line: **ready to move on**
