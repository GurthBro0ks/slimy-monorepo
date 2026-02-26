"use client";

import React, { useEffect, useState, Suspense } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            const returnTo = searchParams.get("returnTo") || "/login-landing";
            router.replace(returnTo);
        }
    }, [isAuthenticated, isLoading, router, searchParams]);

    const handleSlimeOn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || isAuthenticating) return;

        setError(null);
        setIsAuthenticating(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                const returnTo = searchParams.get("returnTo") || "/login-landing";
                router.push(returnTo);
            } else {
                setError(result.error || "LOGIN FAILED");
            }
        } catch (err) {
            setError("SYSTEM ERROR");
        } finally {
            setIsAuthenticating(false);
        }
    };

    if (isLoading || isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-[#39ff14] text-4xl animate-pulse font-mono">LOADING...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div
                className="w-full max-w-[450px] bg-[#1a0b2e] border-t-2 border-l-2 border-r-4 border-b-4 relative"
                style={{
                    borderColor: '#8a4baf #0f0518 #0f0518 #8a4baf',
                    borderTopColor: '#d6b4fc',
                    borderLeftColor: '#8a4baf',
                    fontFamily: '"VT323", monospace',
                    boxShadow: '0 0 0 2px #2d0b4e, 0 0 40px rgba(138, 75, 175, 0.6)'
                }}
            >
                <div className="flex justify-between items-center p-1 bg-[#2d0b4e] border-b-2 border-[#0f0518] px-2 mb-1">
                    <div className="flex items-center gap-2 text-[#d6b4fc] text-2xl tracking-wide select-none drop-shadow-[0_0_2px_rgba(214,180,252,0.8)]">
                        <span className="text-[#39ff14]">🌀</span> Slime Portal Login
                    </div>
                </div>

                <div className="p-6 pt-4">
                    <div className="bg-[#120621] border-2 border-[#0f0518] border-b-[#3d2c5e] border-r-[#3d2c5e] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] p-6 mb-8 flex gap-6 items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 border-t-[#000] border-l-[#000] border-b-[#3d2c5e] border-r-[#3d2c5e] border-2 pointer-events-none opacity-50"></div>

                        <div className="w-28 h-28 bg-black border border-[#39ff14]/30 rounded-lg flex items-center justify-center relative shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                            <svg viewBox="0 0 100 100" className={`w-24 h-24 text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.8)] ${isAuthenticating ? 'animate-spin' : 'animate-pulse'}`}>
                                <path d="M50 50 m0 -40 a40 40 0 1 0 0 80 a40 40 0 1 0 0 -80 M50 50 m0 -25 a25 25 0 1 1 0 50 a25 25 0 1 1 0 -50" fill="none" stroke="url(#gradPage)" strokeWidth="8" strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="gradPage" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#39ff14', stopOpacity: 1 }} />
                                        <stop offset="100%" style={{ stopColor: '#8a4baf', stopOpacity: 1 }} />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        <div className="flex flex-col">
                            <h1 className="text-6xl text-[#ff7ae9] leading-none drop-shadow-[0_0_4px_rgba(255,122,233,1)]" style={{ textShadow: '4px 4px 0px #4a004e' }}>
                                slimy.ai
                            </h1>
                            <h2 className="text-5xl text-[#39ff14] leading-[0.8] mt-1 drop-shadow-[0_0_4px_rgba(57,255,20,1)]" style={{ textShadow: '2px 2px 0px #003300' }}>
                                ACCESS<br />PORTAL
                            </h2>
                        </div>
                    </div>

                    {isAuthenticating && (
                        <div className="mb-6 p-3 border-2 border-[#39ff14] bg-[#0a0412] text-[#39ff14] text-center animate-pulse text-2xl font-bold">
                            AUTHENTICATING...
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-3 border-2 border-[#ff0000] bg-[#1a0000] text-[#ff0000] flex items-center gap-3 text-xl">
                            <AlertCircle size={24} />
                            <span>{typeof error === 'string' ? error.toUpperCase() : 'ERROR'}</span>
                        </div>
                    )}

                    <form onSubmit={handleSlimeOn} className="space-y-6 px-1">
                        <div className="flex flex-col gap-2">
                            <label className="text-[#d6b4fc] text-2xl drop-shadow-[0_0_2px_rgba(214,180,252,0.5)]">Email</label>
                            <input
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isAuthenticating}
                                className="w-full bg-[#0a0412] h-12 border-2 border-t-[#000] border-l-[#000] border-b-[#3d2c5e] border-r-[#3d2c5e] px-3 text-[#ff7ae9] text-2xl shadow-[inset_2px_2px_5px_rgba(0,0,0,1)] focus:outline-none focus:border-[#39ff14]/50"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-end">
                                <label className="text-[#d6b4fc] text-2xl drop-shadow-[0_0_2px_rgba(214,180,252,0.5)]">Password</label>
                                <a href="https://chat.slimyai.xyz" target="_blank" rel="noopener noreferrer" className="text-[#8a4baf] text-lg hover:text-[#d6b4fc] transition-colors">Forgot?</a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isAuthenticating}
                                className="w-full bg-[#0a0412] h-12 border-2 border-t-[#000] border-l-[#000] border-b-[#3d2c5e] border-r-[#3d2c5e] px-3 text-[#ff7ae9] text-2xl shadow-[inset_2px_2px_5px_rgba(0,0,0,1)] focus:outline-none focus:border-[#39ff14]/50"
                                placeholder="********"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isAuthenticating}
                            className={`w-full flex items-center justify-center gap-4 py-4 bg-[#2d0b4e] border-2 border-t-[#d6b4fc] border-l-[#d6b4fc] border-b-[#0f0518] border-r-[#0f0518] active:border-t-[#0f0518] active:border-l-[#0f0518] group ${isAuthenticating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#3d0f6a]'}`}
                        >
                            <div className="relative w-12 h-10">
                                <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_0_5px_#39ff14] group-hover:drop-shadow-[0_0_15px_#39ff14] transition-all">
                                    <path d="M20 45 L55 45 L60 35 Q60 20 45 20 Q30 20 30 35" fill="none" stroke="#39ff14" strokeWidth="3" />
                                    <circle cx="45" cy="35" r="8" stroke="#39ff14" strokeWidth="3" fill="none" />
                                    <path d="M10 40 L20 40" stroke="#39ff14" strokeWidth="2" />
                                    <path d="M5 35 L15 35" stroke="#39ff14" strokeWidth="2" />
                                    <path d="M58 20 L62 15" stroke="#39ff14" strokeWidth="2" />
                                </svg>
                            </div>
                            <span className="text-[#39ff14] text-3xl tracking-widest font-bold drop-shadow-[0_0_4px_#39ff14]">SLIME ON</span>
                        </button>

                        <div className="text-center pt-2">
                            <p className="text-[#d6b4fc] text-xl">
                                New here? <a href="https://chat.slimyai.xyz" target="_blank" rel="noopener noreferrer" className="text-[#39ff14] hover:underline">Register at slime.chat</a>
                            </p>
                        </div>
                    </form>

                    <div className="text-center mt-8 text-[#8a4baf] text-xl opacity-80 font-bold">
                        Version: 4.0.2026
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoginLoading() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-[#39ff14] text-4xl animate-pulse font-mono">LOADING...</div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginLoading />}>
            <LoginForm />
        </Suspense>
    );
}
