'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // RetroShell handles the outer layout (Header, Nav, Background, Chat Widget).
  // AppShell now focuses strictly on inner content layout if needed.
  // Legacy AuthenticatedChatBar/RetroChatWidget has been REMOVED to prevent duplicates.

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-hidden relative z-10">
        {children}
      </main>
    </div>
  );
}
