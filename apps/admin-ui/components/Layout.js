"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession } from "../lib/session";
import { useApi } from "../lib/api";
import { disconnectSocket } from "../lib/socket";
import { ensureActiveGuildCookie, useActiveGuild } from "../lib/active-guild";
import DiagWidget from "./DiagWidget";
import SlimeChatBar from "./SlimeChatBar";
import SlimeChatWidget from "./SlimeChatWidget";

const NAV_SECTIONS = [
  { href: (id) => `/club/${id}`, label: "Dashboard" },
  { href: (id) => `/club/${id}/settings`, label: "Club Settings" },
  { href: (id) => `/club/${id}/channels`, label: "Channels" },
  { href: (id) => `/club/${id}/personality`, label: "Personality" },
  { href: (id) => `/club/${id}/usage`, label: "Usage" },
];

export default function Layout({ guildId, children, title, hideSidebar = false }) {
  const router = useRouter();
  const api = useApi();
  const { user, refresh, csrfToken, loading: sessionLoading } = useSession();
  const activeGuild = useActiveGuild({ explicitGuildId: guildId, router });
  const [open, setOpen] = useState(false);
  const canvasRef = useRef(null);
  const closeMenu = () => setOpen(false);
  const baseRole = user?.role || "member";
  const roleFromSessionGuilds = useMemo(() => {
    const list = Array.isArray(user?.sessionGuilds)
      ? user.sessionGuilds
      : Array.isArray(user?.guilds)
        ? user.guilds
        : null;
    if (!guildId || !list) return baseRole;
    const match = list.find((g) => String(g.id) === String(guildId));
    return (match && match.role) || baseRole;
  }, [user?.sessionGuilds, user?.guilds, guildId, baseRole]);

  const activeGuildId = user?.activeGuildId ? String(user.activeGuildId) : "";
  const activeGuildAppRole = user?.activeGuildAppRole
    ? String(user.activeGuildAppRole).toLowerCase()
    : "";
  const pageGuildId = guildId ? String(guildId) : "";
  const pageGuildSelected = !pageGuildId || (activeGuildId && activeGuildId === pageGuildId);
  const pageGuildMismatch = Boolean(pageGuildId && activeGuildId && activeGuildId !== pageGuildId);

  const effectiveRole = useMemo(() => {
    if (!user) return baseRole;
    if (baseRole === "admin") return "admin";
    if (pageGuildId && activeGuildId === pageGuildId && user.activeGuildAppRole) {
      return String(user.activeGuildAppRole || "").toLowerCase();
    }
    return roleFromSessionGuilds;
  }, [user, baseRole, pageGuildId, activeGuildId, roleFromSessionGuilds]);
  const isAdmin = effectiveRole === "admin";
  const isClub = effectiveRole === "club" && !isAdmin;
  const canUseGuildTools = isAdmin || isClub;
  const hasActiveGuildToolsRole =
    baseRole === "admin" || activeGuildAppRole === "admin" || activeGuildAppRole === "club";
  const badgeRole =
    pageGuildId ? effectiveRole : baseRole === "admin" ? "admin" : activeGuildAppRole || baseRole;

  const currentPath = useMemo(() => {
    if (!router.asPath) return "";
    return router.asPath.split("?")[0];
  }, [router.asPath]);

  const navLinks = useMemo(() => {
    if (!guildId || !isAdmin) return [];
    return NAV_SECTIONS.map((entry) => {
      const href = entry.href(guildId);
      return {
        ...entry,
        href,
        active: currentPath === href,
      };
    });
  }, [guildId, currentPath, isAdmin]);

  const snailHref = "/snail";
  const snailLabel = "Snail";
  const snailActive = useMemo(() => {
    if (!router.asPath) return false;
    return router.asPath.startsWith("/snail");
  }, [router.asPath]);

  const snailToolsHref = activeGuildId ? `/snail/${activeGuildId}` : "";
  const snailToolsActive = useMemo(() => {
    if (!router.asPath) return false;
    return router.asPath.startsWith("/snail/") && router.asPath !== "/snail";
  }, [router.asPath]);

  const emailActive = useMemo(() => {
    if (!router.asPath) return false;
    return router.asPath.startsWith("/email-login");
  }, [router.asPath]);

  const clubActive = useMemo(() => {
    if (!router.asPath) return false;
    return router.asPath.startsWith("/club");
  }, [router.asPath]);

  const clubHomeHref = activeGuildId ? `/club/${activeGuildId}` : "";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles = Array.from({ length: 70 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(61, 255, 140, 0.4)";
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!user || !activeGuild.guildId) return;
    let cancelled = false;

    (async () => {
      const result = await ensureActiveGuildCookie(activeGuild.guildId, { csrfToken });
      if (cancelled) return;
      if (result?.performed && result?.ok) {
        await refresh();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.discordId, activeGuild.guildId, csrfToken, refresh]);

  useEffect(() => {
    if (sessionLoading) return;
    if (user) return;
    disconnectSocket();
  }, [sessionLoading, user]);

  const content = useMemo(() => {
    if (sessionLoading) return children;
    if (!user) return children;
    if (!pageGuildId) return children;

    if (!pageGuildSelected || pageGuildMismatch) {
      return (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ marginTop: 0 }}>Select a guild first</h3>
          <p style={{ margin: 0, opacity: 0.8 }}>
            This page requires an active guild selection. Go to <a href="/guilds">/guilds</a> and pick one.
          </p>
          {pageGuildMismatch ? (
            <p style={{ margin: "0.75rem 0 0", opacity: 0.7, fontFamily: "monospace" }}>
              activeGuildId={activeGuildId} requestedGuildId={pageGuildId}
            </p>
          ) : null}
        </div>
      );
    }

    if (!canUseGuildTools) {
      return (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 style={{ marginTop: 0 }}>Access denied</h3>
          <p style={{ margin: 0, opacity: 0.8 }}>
            You don’t have guild tools access for this server. Pick a different guild from <a href="/guilds">/guilds</a>.
          </p>
        </div>
      );
    }

    return children;
  }, [
    sessionLoading,
    user,
    children,
    pageGuildId,
    pageGuildSelected,
    pageGuildMismatch,
    activeGuildId,
    canUseGuildTools,
  ]);

  return (
    <>
      <Head><title>{title || "slimy.ai – Admin Panel"}</title></Head>
      <canvas id="bg-canvas" ref={canvasRef} aria-hidden />
      <div className="crt-overlay" aria-hidden />

      <nav className="sticky-nav">
        <div className="nav-left">
          <button className="burger" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">☰</button>
          <span>slimy.ai</span>
          <div className="nav-links">
            {isAdmin && guildId && navLinks.map((link) => (
              <Link key={link.href} href={link.href} legacyBehavior>
                <a className={link.active ? "active" : ""}>{link.label}</a>
              </Link>
            ))}
            <Link href="/guilds" legacyBehavior>
              <a className={router.asPath.startsWith("/guilds") ? "active" : ""}>Guilds</a>
            </Link>
            {clubHomeHref && hasActiveGuildToolsRole ? (
              <Link href={clubHomeHref} legacyBehavior>
                <a className={clubActive ? "active" : ""}>Club</a>
              </Link>
            ) : (
              <a
                className="disabled"
                title={clubHomeHref ? "Requires club/admin role" : "Select a guild first"}
                style={{ pointerEvents: "none", opacity: 0.5 }}
              >
                Club
              </a>
            )}
            <Link href={snailHref} legacyBehavior>
              <a className={snailActive && !snailToolsActive ? "active" : ""}>{snailLabel}</a>
            </Link>
            {snailToolsHref && hasActiveGuildToolsRole ? (
              <Link href={snailToolsHref} legacyBehavior>
                <a className={snailToolsActive ? "active" : ""}>Snail Tools</a>
              </Link>
            ) : (
              <a
                className="disabled"
                title={snailToolsHref ? "Requires club/admin role" : "Select a guild first"}
                style={{ pointerEvents: "none", opacity: 0.5 }}
              >
                Snail Tools
              </a>
            )}
            <Link href="/chat" legacyBehavior>
              <a className={router.asPath.startsWith("/chat") ? "active" : ""}>Chat</a>
            </Link>
            {isAdmin && (
              <Link href="/email-login" legacyBehavior>
                <a className={emailActive ? "active" : ""}>Email</a>
              </Link>
            )}
          </div>
        </div>
        <div className="nav-actions">
          {user && (
            <span className="badge">
              {user.username} · {badgeRole.toUpperCase()}
            </span>
          )}
          {user && (
            <button
              className="btn outline"
              onClick={async () => {
                try {
	                  // Clear stored guild state to prevent stale returnTo
	                  localStorage.removeItem("activeGuild");
	                  await api("/api/auth/logout", { method: "POST" });
	                  await refresh({ suppressRedirect: true });
	                  // Use replace to prevent back-button returning to protected page
	                  router.replace("/");
	                } catch (err) {
                  console.error(err);
                }
              }}
            >
              Logout
            </button>
          )}
        </div>
      </nav>

      <div className="top-marquee" aria-hidden>
        <div className="top-marquee__inner">
          <span>WELCOME</span> TO SLIMY.AI ADMIN • <span>/DASHBOARD</span> • <span>/GUILDS</span> • <span>/SNAIL</span> • <span>/CHAT</span> • <span>SLIME MODE</span> •
        </div>
      </div>
      <div className="slime-drips" aria-hidden />

      {!hideSidebar && (
        <div className="dashboard-wrapper">
          {/* Mobile header */}
          <div className="header">
            <button className="burger" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">☰</button>
            <div style={{ fontWeight: 700 }}>slimy.ai Admin</div>
            <div style={{ width: 40 }} />
          </div>

          <div className="shell">
            <aside data-open={open ? "true" : "false"}>
              <div className="diag card" style={{ marginBottom: 16 }}>
                <DiagWidget />
              </div>

              <div style={{ marginBottom: 16 }}>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>slimy.ai Admin</h1>
                {user && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                    <span style={{ opacity: 0.8, fontSize: 14 }}>
                      {user.username} · {badgeRole.toUpperCase()}
                    </span>
                    <button
                      className="btn outline"
                      onClick={async () => {
                        try {
	                          // Clear stored guild state to prevent stale returnTo
	                          localStorage.removeItem("activeGuild");
	                          await api("/api/auth/logout", { method: "POST" });
	                          await refresh({ suppressRedirect: true });
	                          // Use replace to prevent back-button returning to protected page
	                          router.replace("/");
	                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                {isAdmin && guildId ? (
                  <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href} legacyBehavior>
                        <a
                          onClick={closeMenu}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 8,
                            background: link.active
                              ? "rgba(61, 255, 140, 0.12)"
                              : "transparent",
                            border: link.active
                              ? "1px solid var(--glass-border)"
                              : "1px solid transparent",
                          }}
                        >
                          {link.label}
                        </a>
                      </Link>
                    ))}
                  </nav>
                ) : isAdmin ? (
                  <p style={{ opacity: 0.7 }}>Select a guild to begin.</p>
                ) : (
                  <p style={{ opacity: 0.7 }}>
                    Select a guild in <a href="/guilds">/guilds</a> to enable club + snail tools.
                  </p>
                )}

	                <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
		                  {clubHomeHref && hasActiveGuildToolsRole ? (
		                    <Link href={clubHomeHref} legacyBehavior>
		                      <a
		                        onClick={closeMenu}
	                        style={{
	                          padding: "10px 12px",
	                          borderRadius: 8,
	                          background: clubActive
	                            ? "rgba(61, 255, 140, 0.12)"
	                            : "transparent",
	                          border: clubActive
	                            ? "1px solid var(--glass-border)"
	                            : "1px solid transparent",
	                        }}
	                      >
	                        Club Dashboard
		                      </a>
		                    </Link>
		                  ) : (
		                    <a
	                      style={{
	                        padding: "10px 12px",
	                        borderRadius: 8,
	                        opacity: 0.5,
		                        pointerEvents: "none",
		                      }}
		                      title={clubHomeHref ? "Requires club/admin role" : "Select a guild first"}
		                    >
		                      Club Dashboard
		                    </a>
		                  )}
	                  <Link href={snailHref} legacyBehavior>
	                    <a
	                      onClick={closeMenu}
	                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: 600,
                        background: snailActive
                          ? "rgba(61, 255, 140, 0.12)"
                          : "transparent",
                        border: snailActive
                          ? "1px solid var(--glass-border)"
                          : "1px solid transparent",
	                      }}
	                    >
	                      <span role="img" aria-label="snail">🐌</span> Snail
	                    </a>
	                  </Link>
		                  {snailToolsHref && hasActiveGuildToolsRole ? (
		                    <Link href={snailToolsHref} legacyBehavior>
		                      <a
		                        onClick={closeMenu}
	                        style={{
	                          padding: "10px 12px",
	                          borderRadius: 8,
	                          display: "inline-flex",
	                          alignItems: "center",
	                          gap: 8,
	                          fontWeight: 600,
	                          background: snailToolsActive
	                            ? "rgba(61, 255, 140, 0.12)"
	                            : "transparent",
	                          border: snailToolsActive
	                            ? "1px solid var(--glass-border)"
	                            : "1px solid transparent",
	                        }}
	                      >
	                        <span role="img" aria-label="tools">🧰</span> Snail Tools
		                      </a>
		                    </Link>
		                  ) : (
		                    <a
	                      style={{
	                        padding: "10px 12px",
	                        borderRadius: 8,
	                        opacity: 0.5,
		                        pointerEvents: "none",
		                      }}
		                      title={snailToolsHref ? "Requires club/admin role" : "Select a guild first"}
		                    >
		                      <span role="img" aria-label="tools">🧰</span> Snail Tools
		                    </a>
		                  )}
	                  <Link href="/chat" legacyBehavior>
	                    <a
	                      onClick={closeMenu}
	                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        fontWeight: 600,
                        background: router.asPath.startsWith("/chat")
                          ? "rgba(61, 255, 140, 0.12)"
                          : "transparent",
                        border: router.asPath.startsWith("/chat")
                          ? "1px solid var(--glass-border)"
                          : "1px solid transparent",
                      }}
                    >
                      💬 Slime Chat
                    </a>
                  </Link>
                  {isAdmin && (
                    <Link href="/email-login" legacyBehavior>
                      <a
                        onClick={closeMenu}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: 600,
                          background: emailActive
                            ? "rgba(61, 255, 140, 0.12)"
                            : "transparent",
                          border: emailActive
                            ? "1px solid var(--glass-border)"
                            : "1px solid transparent",
                        }}
                      >
                        📧 Email Login
                      </a>
                    </Link>
                  )}
                </nav>
              </div>
            </aside>
            <div
              className="mobile-overlay"
              data-open={open ? "true" : "false"}
              onClick={closeMenu}
            />

	            <main className="content">
	              {title && <h2 style={{ marginTop: 0, marginBottom: 24 }}>{title}</h2>}
	              <div className="panel">
	                {content}
	              </div>
	            </main>
	          </div>
	        </div>
	      )}

	      {hideSidebar && (
	        <div className="dashboard-wrapper">
	          <main className="content content--without-sidebar">
	            {title && <h2 style={{ marginTop: 0, marginBottom: 24 }}>{title}</h2>}
	            <div className="panel">
	              {content}
	            </div>
	          </main>
	        </div>
	      )}

	      {/* Slime Chat bottom bar (shows for all logged-in users) */}
	      {user && <SlimeChatBar guildId={pageGuildId || activeGuildId} />}
	      <SlimeChatWidget />
    </>
  );
}
