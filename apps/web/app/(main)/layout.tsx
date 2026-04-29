import { AuthProvider } from "@/lib/auth/context";
import { RetroShell } from "@/components/layout/retro-shell";
import { AppShell } from "@/components/layout/app-shell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RetroShell>
        <AppShell>{children}</AppShell>
      </RetroShell>
    </AuthProvider>
  );
}
