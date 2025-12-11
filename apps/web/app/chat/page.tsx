"use client";
import { RetroChatWindow } from "@/components/chat/retro-chat-window";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context"; // FIXED IMPORT
import { useEffect } from "react";

export default function ChatPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.push("/");
  }, [user, isLoading, router]);

  if (isLoading) return null;
  if (!user) return null;

  return (
    <div className="w-full h-full flex items-center justify-center p-4 min-h-[85vh]">
       <RetroChatWindow isFullPage={true} />
    </div>
  );
}
