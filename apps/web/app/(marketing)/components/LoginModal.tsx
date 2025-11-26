'use client';

import { useEffect, useState } from 'react';

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
};

export function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleLogin = () => {
    // Removed localStorage.setItem('slimySession', 'true') to prevent chat auto-open
    onLogin();
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="aim-window">
        <div className="aim-titlebar">
          <span>SLIME ON</span>
          <button aria-label="Close login" className="ghost-button" onClick={onClose} type="button">
            ✕
          </button>
        </div>
        <div className="aim-body">
          <p>Log into the neon console. We&apos;ll drop you right into your slime stream.</p>
          <input
            className="aim-input"
            type="email"
            placeholder="you@team.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div className="pill-row">
            <span className="badge">Single sign-on ready</span>
            <span className="badge">2FA enforced</span>
          </div>
          <button className="primary-button" type="button" onClick={handleLogin}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
