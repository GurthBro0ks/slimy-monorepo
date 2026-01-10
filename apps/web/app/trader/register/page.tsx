"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TraderRegisterPage() {
  const router = useRouter();

  const [inviteCode, setInviteCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Format invite code as user types (XXXX-XXXX-XXXX-XXXX)
  const handleInviteCodeChange = (value: string) => {
    // Remove non-alphanumeric characters and uppercase
    const cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    // Add dashes every 4 characters
    const formatted = cleaned
      .slice(0, 16)
      .replace(/(.{4})(?=.)/g, "$1-");
    setInviteCode(formatted);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setError("Username must be 3-20 characters (letters, numbers, _ or -)");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/trader/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite_code: inviteCode,
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/trader");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="border-2 border-[#39ff14]/50 bg-black/50 rounded-lg p-8">
          {/* Terminal Header */}
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-xs font-mono text-gray-600 ml-2">
              trader@slimyai.xyz ~ register
            </span>
          </div>

          <h1 className="text-2xl font-['VT323'] text-[#39ff14] tracking-widest text-center mb-8">
            TRADER REGISTRATION
          </h1>

          {error && (
            <div className="mb-6 p-3 border border-red-500/50 bg-red-900/20 rounded text-red-400 text-sm font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-400 text-sm font-mono mb-2">
                <span className="text-[#39ff14]">$</span> invite_code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => handleInviteCodeChange(e.target.value)}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded font-mono text-gray-200 focus:border-[#39ff14] focus:outline-none focus:ring-1 focus:ring-[#39ff14]/30 uppercase tracking-wider placeholder:text-gray-700"
                autoComplete="off"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-mono mb-2">
                <span className="text-[#39ff14]">$</span> username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded font-mono text-gray-200 focus:border-[#39ff14] focus:outline-none focus:ring-1 focus:ring-[#39ff14]/30"
                autoComplete="username"
                required
              />
              <p className="mt-1 text-xs text-gray-600 font-mono">
                3-20 characters, letters, numbers, _ or -
              </p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-mono mb-2">
                <span className="text-[#39ff14]">$</span> password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded font-mono text-gray-200 focus:border-[#39ff14] focus:outline-none focus:ring-1 focus:ring-[#39ff14]/30"
                autoComplete="new-password"
                required
              />
              <p className="mt-1 text-xs text-gray-600 font-mono">
                Minimum 8 characters
              </p>
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-mono mb-2">
                <span className="text-[#39ff14]">$</span> confirm_password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black border border-gray-700 rounded font-mono text-gray-200 focus:border-[#39ff14] focus:outline-none focus:ring-1 focus:ring-[#39ff14]/30"
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 border-2 border-[#39ff14] text-[#39ff14] font-mono hover:bg-[#39ff14] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">_</span>
                  CREATING ACCOUNT...
                </span>
              ) : (
                "REGISTER"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-600 text-sm font-mono mb-2">
              Already have an account?
            </p>
            <Link
              href="/trader/login"
              className="text-[#39ff14]/70 hover:text-[#39ff14] text-sm font-mono transition-colors"
            >
              Login here &rarr;
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs font-mono mt-6">
          Invite-only registration for trader.slimyai.xyz
        </p>
      </div>
    </div>
  );
}
