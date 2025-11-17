import Link from "next/link";
import { Pickaxe } from "lucide-react";

export default function SlimeCraftLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navLinks = [
    { href: "/slime.craft", label: "Home" },
    { href: "/slime.craft/how-to-join", label: "How to Join" },
    { href: "/slime.craft/rules", label: "Rules" },
    { href: "/slime.craft/status", label: "Status" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-emerald-500/30 bg-zinc-900/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/slime.craft" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Pickaxe className="h-6 w-6 text-neon-green" />
              <span className="text-xl font-bold text-neon-green">slime.craft</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-neon-green transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile menu placeholder */}
            <div className="md:hidden">
              <div className="flex gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs text-muted-foreground hover:text-neon-green transition-colors px-2 py-1"
                  >
                    {link.label.split(" ")[0]}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-emerald-500/30 bg-zinc-900/40 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div>
              <p>&copy; 2024 slime.craft - Part of the Slimy.ai ecosystem</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-neon-green transition-colors">
                Back to Slimy.ai
              </Link>
              <Link href="/slime.craft/rules" className="hover:text-neon-green transition-colors">
                Server Rules
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
