import "./globals.css";
import { RetroShell } from "@/components/layout/retro-shell";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth/context";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <RetroShell>
            <AppShell>{children}</AppShell>
          </RetroShell>
        </AuthProvider>
      </body>
    </html>
  );
}
