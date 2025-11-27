import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "slime.chat",
  description: "Secure terminal uplink.",
};

export default function ChatPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-green-500 font-mono selection:bg-green-500/30">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter">slimyai</h1>
          <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-sm text-green-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            System Online
          </div>
        </div>
        
        <div className="rounded-lg border border-white/10 bg-black/50 p-6 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="h-2 w-2/3 animate-pulse rounded bg-green-900/50" />
            <div className="h-2 w-full animate-pulse rounded bg-green-900/30" />
            <div className="h-2 w-5/6 animate-pulse rounded bg-green-900/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
