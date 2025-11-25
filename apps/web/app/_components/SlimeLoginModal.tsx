"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Minus, X, ChevronDown, HelpCircle, Settings } from "lucide-react";

interface SlimeLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSlimeOn?: () => void;
}

export function SlimeLoginModal({ isOpen, onClose, onSlimeOn }: SlimeLoginModalProps) {
    // Toggle states for visual fidelity
    const [savePass, setSavePass] = useState(true);
    const [autoLogin, setAutoLogin] = useState(true);

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
        onClose();
    }, [onClose]);

    const handleSlimeOn = useCallback(() => {
        if (typeof window !== "undefined") {
            window.location.href = "/api/auth/login";
        }
        if (onSlimeOn) {
            onSlimeOn();
        }
    }, [onSlimeOn]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
        >
            {/* --- Main Window Frame --- */}
            {/* Uses specific borders to create a 'raised' 3D plastic look */}
            <div
                className="w-[400px] bg-[#1a0b2e] border-t-2 border-l-2 border-r-4 border-b-4 relative"
                style={{
                    borderColor: '#8a4baf #0f0518 #0f0518 #8a4baf', // Top/Left Light, Bot/Right Dark
                    borderTopColor: '#d6b4fc', // Highlight top
                    borderLeftColor: '#8a4baf',
                    fontFamily: '"VT323", monospace',
                    boxShadow: '0 0 0 2px #2d0b4e, 0 0 20px rgba(138, 75, 175, 0.4)' // Double border effect
                }}
                onClick={(event) => event.stopPropagation()}
            >

                {/* --- Title Bar --- */}
                <div className="flex justify-between items-center p-1 bg-[#2d0b4e] border-b-2 border-[#0f0518] px-2 mb-1">
                    <div className="flex items-center gap-2 text-[#d6b4fc] text-2xl tracking-wide select-none drop-shadow-[0_0_2px_rgba(214,180,252,0.8)]">
                        <span className="text-[#39ff14]">🌀</span> Slime On
                    </div>
                    <div className="flex gap-1">
                        {/* Minimize Button */}
                        <button className="w-6 h-6 bg-[#2d0b4e] border border-t-[#d6b4fc] border-l-[#d6b4fc] border-b-[#0f0518] border-r-[#0f0518] flex items-center justify-center active:border-t-[#0f0518] active:border-l-[#0f0518]">
                            <Minus size={16} className="text-[#d6b4fc]" />
                        </button>
                        {/* Close Button */}
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

                    {/* Top Inset Well (The large indented box) */}
                    <div className="bg-[#120621] border-2 border-[#0f0518] border-b-[#3d2c5e] border-r-[#3d2c5e] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] p-4 mb-6 flex gap-4 items-center justify-center relative overflow-hidden">
                        {/* Inner Border (simulates the light edge of the well) */}
                        <div className="absolute inset-0 border-t-[#000] border-l-[#000] border-b-[#3d2c5e] border-r-[#3d2c5e] border-2 pointer-events-none opacity-50"></div>

                        {/* Logo Box */}
                        <div className="w-24 h-24 bg-black border border-[#39ff14]/30 rounded-lg flex items-center justify-center relative shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                            {/* CSS Spiral Approximation */}
                            <svg viewBox="0 0 100 100" className="w-20 h-20 text-[#39ff14] animate-pulse drop-shadow-[0_0_5px_rgba(57,255,20,0.8)]">
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

                    {/* --- Form Controls --- */}
                    <div className="space-y-4 px-1">

                        {/* Screen Name Input */}
                        <div className="flex items-center gap-2">
                            <label className="text-[#d6b4fc] text-xl min-w-[100px] drop-shadow-[0_0_2px_rgba(214,180,252,0.5)]">Screen Name</label>
                            <div className="relative flex-1">
                                <div className="w-full bg-[#0a0412] h-10 border-2 border-t-[#000] border-l-[#000] border-b-[#3d2c5e] border-r-[#3d2c5e] flex items-center px-2 text-[#ff7ae9] text-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,1)]">
                                    &lt;New User&gt;
                                </div>
                                <div className="absolute right-[2px] top-[2px] bottom-[2px] w-8 bg-[#2d0b4e] border-l border-black flex items-center justify-center">
                                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-[#39ff14] drop-shadow-[0_0_2px_#39ff14]"></div>
                                </div>
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="flex items-center gap-2">
                            <label className="text-[#d6b4fc] text-xl min-w-[100px] drop-shadow-[0_0_2px_rgba(214,180,252,0.5)]">Password</label>
                            <div className="w-full bg-[#0a0412] h-10 border-2 border-t-[#000] border-l-[#000] border-b-[#3d2c5e] border-r-[#3d2c5e] flex items-center px-2 text-[#ff7ae9] text-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,1)] tracking-[4px]">
                                *********
                            </div>
                        </div>
                    </div>

                    {/* --- Checkboxes --- */}
                    <div className="flex gap-8 mt-5 px-1 mb-8">
                        {/* Save Password */}
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setSavePass(!savePass)}
                        >
                            <div className="w-5 h-5 bg-[#0a0412] border border-[#39ff14] flex items-center justify-center shadow-[0_0_5px_rgba(57,255,20,0.3)]">
                                {savePass && <div className="text-[#39ff14] text-lg leading-none font-bold drop-shadow-[0_0_2px_#39ff14]">×</div>}
                            </div>
                            <span className="text-[#d6b4fc] text-xl group-hover:text-white transition-colors">Save password</span>
                        </div>

                        {/* Auto-login */}
                        <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => setAutoLogin(!autoLogin)}
                        >
                            <div className="w-5 h-5 bg-[#0a0412] border border-[#39ff14] flex items-center justify-center shadow-[0_0_5px_rgba(57,255,20,0.3)]">
                                {autoLogin && <div className="text-[#39ff14] text-lg leading-none font-bold drop-shadow-[0_0_2px_#39ff14]">×</div>}
                            </div>
                            <span className="text-[#d6b4fc] text-xl group-hover:text-white transition-colors">Auto-login</span>
                        </div>
                    </div>

                    {/* --- Bottom Icons --- */}
                    <div className="flex justify-between items-end px-2 pb-2">

                        {/* Help Button */}
                        <div className="flex flex-col items-center gap-1 group cursor-pointer">
                            <div className="relative">
                                <HelpCircle size={48} className="text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.6)] group-hover:drop-shadow-[0_0_15px_#39ff14] transition-all" strokeWidth={1.5} />
                            </div>
                            <span className="text-[#39ff14] text-xl tracking-wide drop-shadow-[0_0_2px_#39ff14]">Help</span>
                        </div>

                        {/* Setup Button */}
                        <div className="flex flex-col items-center gap-1 group cursor-pointer">
                            <div className="relative">
                                <Settings size={48} className="text-[#39ff14] drop-shadow-[0_0_5px_rgba(57,255,20,0.6)] group-hover:drop-shadow-[0_0_15px_#39ff14] transition-all" strokeWidth={1.5} />
                                {/* Wrench Overlay */}
                                <div className="absolute -top-1 -right-2 text-[#39ff14] drop-shadow-[0_0_2px_#39ff14] rotate-12">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                                </div>
                            </div>
                            <span className="text-[#39ff14] text-xl tracking-wide drop-shadow-[0_0_2px_#39ff14]">Setup</span>
                        </div>

                        {/* Slime On Button (Snail) */}
                        <button
                            onClick={handleSlimeOn}
                            className="flex flex-col items-center gap-1 group cursor-pointer"
                        >
                            <div className="relative w-14 h-12">
                                {/* Custom CSS Snail */}
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

                    {/* Footer Version */}
                    <div className="text-center mt-4 text-[#8a4baf] text-lg opacity-80">
                        Version: 3.0.1464
                    </div>

                </div>
            </div>
        </div>
    );
}
