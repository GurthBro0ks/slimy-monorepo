import { RetroShell } from "@/components/layout/retro-shell";
import { AppShell } from "@/components/layout/app-shell";
// import { AuthProvider } from "@/lib/auth/auth-context"; // Original path was wrong
import { AuthProvider } from "@/lib/auth/context";
import { ChatProvider } from "@/components/retro-chat/chat-context";
// ... imports

import { headers } from "next/headers";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const host = headerList.get('host') || "";
  const pathname = headerList.get('x-pathname') || "";

  const isTrader = host.includes('trader') || pathname.startsWith('/trader');

  if (isTrader) {
    return (
      <html lang="en">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        </head>
        <body className="antialiased">
          <AuthProvider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </AuthProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <ChatProvider>
            <RetroShell>
              <AppShell>{children}</AppShell>
            </RetroShell>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
