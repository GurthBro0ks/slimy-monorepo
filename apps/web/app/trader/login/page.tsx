"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function TraderLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/trader";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/trader/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push(returnTo);
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
              trader@slimyai.xyz
            </span>
          </div>

          <h1 className="text-2xl font-['VT323'] text-[#39ff14] tracking-widest text-center mb-8">
            TRADER LOGIN
          </h1>

          {error && (
            <div className="mb-6 p-3 border border-red-500/50 bg-red-900/20 rounded text-red-400 text-sm font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                autoFocus
                required
              />
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
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 border-2 border-[#39ff14] text-[#39ff14] font-mono hover:bg-[#39ff14] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">_</span>
                  AUTHENTICATING...
                </span>
              ) : (
                "LOGIN"
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <p className="text-gray-600 text-sm font-mono mb-2">
              Have an invite code?
            </p>
            <Link
              href="/trader/register"
              className="text-[#39ff14]/70 hover:text-[#39ff14] text-sm font-mono transition-colors"
            >
              Register here &rarr;
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs font-mono mt-6">
          Isolated authentication for trader.slimyai.xyz
        </p>
      </div>
    </div>
  );
}
