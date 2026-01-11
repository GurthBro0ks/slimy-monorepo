import Link from "next/link";

export default function TraderForbiddenPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)] flex items-center justify-center p-4">
      <div className="text-center space-y-6 p-8 border-2 border-red-500/50 bg-black/50 rounded-lg max-w-md">
        <div className="text-6xl text-red-500 font-['VT323'] tracking-widest">
          403
        </div>

        <h1 className="text-2xl font-['VT323'] text-red-400 tracking-widest uppercase">
          Access Denied
        </h1>

        <div className="text-gray-400 font-mono text-sm space-y-3">
          <p>You do not have permission to access the Trader UI.</p>
          <p className="text-xs text-gray-600">
            Contact an administrator to request trader access.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 border border-[var(--neon-green)] text-[var(--neon-green)] hover:bg-[var(--neon-green)] hover:text-black transition-all font-mono text-sm"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-300 text-xs font-mono"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
