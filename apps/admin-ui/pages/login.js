import { useEffect } from 'react';

export default function LoginRedirect() {
  useEffect(() => {
    window.location.href = "/api/admin-api/api/auth/login?returnTo=%2Fdashboard";
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui' }}>
      <p>Opening Discord login…</p>
      <p style={{ fontSize: '0.875rem', opacity: 0.6, marginTop: '1rem' }}>
        If you are not redirected, <a href="/api/admin-api/api/auth/login?returnTo=%2Fdashboard">click here</a>.
      </p>
    </main>
  );
}
