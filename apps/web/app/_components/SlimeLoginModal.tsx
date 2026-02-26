"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Minus, X, HelpCircle, Settings, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

interface SlimeLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SlimeLoginModal({ isOpen, onClose }: SlimeLoginModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();
    const router = useRouter();

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const handleClose = useCallback(() => {
        if (!isAuthenticating) {
            onClose();
        }
    }, [onClose, isAuthenticating]);

    const handleSlimeOn = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email || !password || isAuthenticating) return;

        setError(null);
        setIsAuthenticating(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                onClose();
                router.push("/login-landing");
            } else {
                setError(result.error || "LOGIN FAILED");
            }
        } catch (err) {
            setError("SYSTEM ERROR");
        } finally {
            setIsAuthenticating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
        >
            {/* --- Main Window Frame --- */}
            <div
                className="w-[400px] bg-[#1a0b2e] border-t-2 border-l-2 border-r-4 border-b-4 relative"
                style={{
                    borderColor: '#8a4baf #0f0518 #0f0518 #8a4baf',
                    borderTopColor: '#d6b4fc',
                    borderLeftColor: '#8a4baf',
                    fontFamily: '"VT323", monospace',
                    boxShadow: '0 0 0 2px #2d0b4e, 0 0 20px rgba(138, 75, 175, 0.4)'
                }}
                onClick={(event) => event.stopPropagation()}
            >

                {/* --- Title Bar --- */}
                <div className="flex justify-between items-center p-1 bg-[#2d0b4e] border-b-2 border-[#0f0518] px-2 mb-1">
                    <div className="flex items-center gap-2 text-[#d6b4fc] text-2xl tracking-wide select-none drop-shadow-[0_0_2px_rgba(214,180,252,0.8)]">
                        <span className="text-[#39ff14]">🌀</span> Slime On
                    </div>
                    <div className="flex gap-1">
                        <button className="w-6 h-6 bg-[#2d0b4e] border border-t-[#d6b4fc] border-l-[#d6b4fc] border-b-[#0f0518] border-r-[#0f0518] flex items-center justify-center active:border-t-[#0f0518] active:border-l-[#0f0518]">
                            <Minus size={16} className="text-[#d6b4fc]" />
                        </button>
                        <button
                            onClick={handleClose}
                            className="w-6 h-6 bg-[#2d0b4e] border border-t-[#d6b4fc] border-l-[#d6b4fc] border-b-[#0f0518] border-r-[#0f0518] flex items-center justify-center active:border-t-[#0f0518] active:border-l-[#0f0518]"
                        >
                            <X size={16} className="text-[#d6b4fc]" />
                        </button>
                    </div>
                </div>

                {/* --- Content Area --- */}
                <div className="p-4 pt-2">

                    {/* Top Inset Well */}
                    <div className="bg-[#120621] border-2 border-[#0f0518] border-b-[#3d2c5e] border-r-[#3d2c5e] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] p-4 mb-6 flex gap-4 items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 border-t-[#000] border-l-[#000] border-b-[#3d2c5e] border-r-[#3d2c5e] border-2 pointer-events-none opacity-50"></div>

                        {/* Logo Box */}
                        <div className="w-24 h-24 bg-black border border-[#39ff14]/30 rounded-lg flex items-center justify-center relative shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                            <svg viewBox="0 0 100 100" className={`w-20 h-20 text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.8)] ${isAuthenticating ? 'animate-spin' : 'animate-pulse'}`}>
                                <path d="M50 50 m0 -40 a40 40 0 1 0 0 80 a40 40 0 1 0 0 -80 M50 50 m0 -25 a25 25 0 1 1 0 50 a25 25 0 1 1 0 -50" fill="none" stroke="url(#grad1)" strokeWidth="8" strokeLinecap="round" />
                                <defs>
                                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#39ff14', stopOpacity: 1 }} />
                                        <stop offset="100%" style={{ stopColor: '#8a4baf', stopOpacity: 1 }} />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        {/* Text Stack */}
                        <div className="flex flex-col">
                            <h1 className="text-5xl text-[#ff7ae9] leading-none drop-shadow-[0_0_4px_rgba(255,122,233,1)]" style={{ textShadow: '3px 3px 0px #4a004e' }}>
                                slimy.ai
                            </h1>
                            <h2 className="text-4xl text-[#39ff14] leading-[0.8] mt-1 drop-shadow-[0_0_4px_rgba(57,255,20,1)]" style={{ textShadow: '2px 2px 0px #003300' }}>
                                ACCESS<br />PORTAL
                            </h2>
                        </div>
                    </div>

                    {/* --- Authentication Status --- */}
                    {isAuthenticating && (
                        <div className="mb-4 p-2 border-2 border-[#39ff14] bg-[#0a0412] text-[#39ff14] text-center animate-pulse text-xl font-bold">
                            AUTHENTICATING...
                        </div>
                    )}

                    {/* --- Error Box --- */}
                    {error && (
                        <div className="mb-4 p-2 border-2 border-[#ff0000] bg-[#1a0000] text-[#ff0000] flex items-center gap-2 text-lg">
                            <AlertCircle size={20} />
                            <span>{typeof error === 'string' ? error.toUpperCase() : 'ERROR'}</span>
                        </div>
                    )}

                    {/* --- Form --- */}
                    <form onSubmit={handleSlimeOn} className="space-y-4 px-1">
                        {/* Email Input */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[#d6b4fc] text-xl drop-shadow-[0_0_2px_rgba(214,180,252,0.5)]">Email</label>
                            <input
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isAuthenticating}
                                className="w-full bg-[#0a0412] h-10 border-2 border-t-[#000] border-l-[#000] border-b-[#3d2c5e] border-r-[#3d2c5e] px-2 text-[#ff7ae9] text-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,1)] focus:outline-none focus:border-[#39ff14]/50"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[#d6b4fc] text-xl drop-shadow-[0_0_2px_rgba(214,180,252,0.5)]">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isAuthenticating}
                                className="w-full bg-[#0a0412] h-10 border-2 border-t-[#000] border-l-[#000] border-b-[#3d2c5e] border-r-[#3d2c5e] px-2 text-[#ff7ae9] text-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,1)] focus:outline-none focus:border-[#39ff14]/50"
                                placeholder="********"
                                required
                            />
                        </div>

                        {/* --- Bottom Icons --- */}
                        <div className="flex justify-between items-end px-2 pb-2 pt-4">
                            {/* Help Button */}
                            <a href="/docs" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 group cursor-pointer">
                                <div className="relative">
                                    <HelpCircle size={48} className="text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.6)] group-hover:drop-shadow-[0_0_15px_#39ff14] transition-all" strokeWidth={1.5} />
                                </div>
                                <span className="text-[#39ff14] text-xl tracking-wide drop-shadow-[0_0_2px_#39ff14]">Help</span>
                            </a>

                            {/* Setup Button */}
                            <div className="flex flex-col items-center gap-1 group cursor-pointer opacity-50">
                                <div className="relative">
                                    <Settings size={48} className="text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.6)]" strokeWidth={1.5} />
                                    <div className="absolute -top-1 -right-2 text-[#39ff14] rotate-12">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                                    </div>
                                </div>
                                <span className="text-[#39ff14] text-xl tracking-wide">Setup</span>
                            </div>

                            {/* Slime On Button (Snail) */}
                            <button
                                type="submit"
                                disabled={isAuthenticating}
                                className={`flex flex-col items-center gap-1 group cursor-pointer ${isAuthenticating ? 'opacity-50' : ''}`}
                            >
                                <div className="relative w-14 h-12">
                                    <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-[0_0_5px_#39ff14] group-hover:drop-shadow-[0_0_15px_#39ff14] transition-all">
                                        <path d="M20 45 L55 45 L60 35 Q60 20 45 20 Q30 20 30 35" fill="none" stroke="#39ff14" strokeWidth="3" />
                                        <circle cx="45" cy="35" r="8" stroke="#39ff14" strokeWidth="3" fill="none" />
                                        <path d="M10 40 L20 40" stroke="#39ff14" strokeWidth="2" />
                                        <path d="M5 35 L15 35" stroke="#39ff14" strokeWidth="2" />
                                        <path d="M58 20 L62 15" stroke="#39ff14" strokeWidth="2" />
                                    </svg>
                                </div>
                                <span className="text-[#39ff14] text-xl tracking-wide font-bold drop-shadow-[0_0_4px_#39ff14]">Slime On</span>
                            </button>
                        </div>
                    </form>

                    {/* Footer Version */}
                    <div className="text-center mt-4 text-[#8a4baf] text-lg opacity-80 font-bold">
                        Version: 4.0.2026
                    </div>

                </div>
            </div>
        </div>
    );
}
