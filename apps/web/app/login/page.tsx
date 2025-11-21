"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { user, loading, login, logout } = useAuth();

  // If already logged in, show appropriate message
  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-md border-emerald-500/30 bg-zinc-900/40">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neon-green mb-4" />
            <p className="text-muted-foreground">Checking session...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user) {
    return (
      <div className="container flex items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-md border-emerald-500/30 bg-zinc-900/40">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/images/logo.svg"
                alt="slimy.ai Logo"
                width={60}
                height={60}
                className="w-14 h-14"
              />
            </div>
            <CardTitle className="text-2xl">You&apos;re already logged in</CardTitle>
            <CardDescription className="text-base">
              Welcome back, <span className="text-neon-green font-semibold">{user.name}</span>!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/snail/codes" className="block">
              <Button variant="neon" size="lg" className="w-full group">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/" className="block">
              <Button variant="outline" size="lg" className="w-full">
                Back to Home
              </Button>
            </Link>
            <div className="pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in - show login prompt
  return (
    <div className="container flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-md border-emerald-500/30 bg-zinc-900/40">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/logo.svg"
              alt="slimy.ai Logo"
              width={60}
              height={60}
              className="w-14 h-14"
            />
          </div>
          <CardTitle className="text-2xl">Login to slimy.ai</CardTitle>
          <CardDescription className="text-base">
            Connect with Discord to access your snail tools, codes, screenshots, and club analytics.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="neon" size="lg" className="w-full" onClick={login}>
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Login with Discord
          </Button>
          <div className="text-center pt-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-neon-green transition-colors">
              ← Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
