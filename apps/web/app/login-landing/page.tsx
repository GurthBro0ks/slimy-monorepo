"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { MessageSquare, Snail, Rocket, Shield } from "lucide-react";
import Link from "next/link";

export default function LoginLanding() {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-[#39ff14] text-4xl animate-pulse">
        CONNECTING...
      </div>
    );
  }

  const cards = [
    {
      id: "slimechat",
      title: "SLIME CHAT",
      icon: <MessageSquare className="w-16 h-16" />,
      href: "https://chat.slimyai.xyz",
      external: true,
      borderColor: "#39ff14", // Green
      description: "Chat with the slimy community",
    },
    {
      id: "supersnail",
      title: "SUPER SNAIL",
      icon: <Snail className="w-16 h-16" />,
      href: "/snail",
      borderColor: "#8a4baf", // Purple
      description: "Access your dashboard and tools",
    },
    {
      id: "missioncontrol",
      title: "MISSION CONTROL",
      icon: <Rocket className="w-16 h-16" />,
      href: "/mission-control",
      borderColor: "#00ffff", // Cyan
      ownerOnly: true,
      description: "System administration and monitoring",
    },
    {
      id: "ownerpanel",
      title: "OWNER PANEL",
      icon: <Shield className="w-16 h-16" />,
      href: "/owner",
      borderColor: "#ffff00", // Yellow
      ownerOnly: true,
      description: "Secure management portal",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-[#d6b4fc] p-8 font-mono relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="h-full w-full bg-[radial-gradient(#39ff14_1px,transparent_1px)] [background-size:20px_20px] animate-[pulse_5s_infinite]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-12 text-center pt-10">
          <h1 className="text-6xl text-[#39ff14] mb-4 tracking-tighter drop-shadow-[0_0_8px_rgba(57,255,20,0.8)]" style={{ fontFamily: '"VT323", monospace' }}>
            WELCOME BACK
          </h1>
          <p className="text-3xl text-[#ff7ae9] drop-shadow-[0_0_5px_rgba(255,122,233,0.8)]">
             {user?.username?.toUpperCase()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cards
            .filter((card) => !card.ownerOnly || role === "owner")
            .map((card) => {
              const content = (
                <div
                  className="group relative bg-[#1a0b2e] border-4 p-8 min-h-[12rem] flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(138,75,175,0.3)] cursor-pointer"
                  style={{ borderColor: card.borderColor }}
                >
                  <div className="text-[#39ff14] drop-shadow-[0_0_10px_#39ff14] group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <h2 className="text-3xl font-bold tracking-widest text-center" style={{ color: card.borderColor, textShadow: `0 0 10px ${card.borderColor}` }}>
                    {card.title}
                  </h2>
                  <p className="text-lg text-center opacity-70 group-hover:opacity-100">{card.description}</p>
                  
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: card.borderColor }} />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: card.borderColor }} />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: card.borderColor }} />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: card.borderColor }} />
                </div>
              );

              if (card.external) {
                return (
                  <a key={card.id} href={card.href} target="_blank" rel="noopener noreferrer" className="no-underline">
                    {content}
                  </a>
                );
              }

              return (
                <Link key={card.id} href={card.href} className="no-underline">
                  {content}
                </Link>
              );
            })}
        </div>

        <div className="mt-16 text-center opacity-40 text-xl tracking-[0.5em]">
          SLIMY_AI_OS_V4.0.26
        </div>
      </div>
    </div>
  );
}
