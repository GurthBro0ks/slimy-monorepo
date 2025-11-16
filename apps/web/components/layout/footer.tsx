import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container px-4 py-8">
        {/* Mobile: Horizontal scrollable layout */}
        <div className="md:hidden mb-8">
          <h3 className="mb-4 text-lg font-bold text-neon-green">slimy.ai</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Your AI-powered Discord companion for Super Snail and more.
          </p>
          
          <div className="grid grid-flow-col auto-cols-max gap-8 overflow-x-auto snap-x pb-4">
            {/* Product */}
            <div className="snap-start">
              <h4 className="mb-3 text-sm font-semibold whitespace-nowrap">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/features" className="text-muted-foreground hover:text-neon-green whitespace-nowrap" prefetch>
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-muted-foreground hover:text-neon-green whitespace-nowrap" prefetch>
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="text-muted-foreground hover:text-neon-green whitespace-nowrap">
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            {/* Tools */}
            <div className="snap-start">
              <h4 className="mb-3 text-sm font-semibold whitespace-nowrap">Tools</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/snail" className="text-muted-foreground hover:text-neon-green whitespace-nowrap" prefetch>
                    Snail Tools
                  </Link>
                </li>
                <li>
                  <Link href="/club" className="text-muted-foreground hover:text-neon-green whitespace-nowrap" prefetch>
                    Club Analytics
                  </Link>
                </li>
                <li>
                  <Link href="/chat" className="text-muted-foreground hover:text-neon-green whitespace-nowrap" prefetch>
                    Slime Chat
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community */}
            <div className="snap-start">
              <h4 className="mb-3 text-sm font-semibold whitespace-nowrap">Community</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://discord.gg/supersnail"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-neon-green whitespace-nowrap"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/slimyai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-neon-green whitespace-nowrap"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="mb-4 text-lg font-bold text-neon-green">slimy.ai</h3>
            <p className="text-sm text-muted-foreground">
              Your AI-powered Discord companion for Super Snail and more.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="text-muted-foreground hover:text-neon-green" prefetch>
                  Features
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-muted-foreground hover:text-neon-green" prefetch>
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-muted-foreground hover:text-neon-green">
                  Status
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold">Tools</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/snail" className="text-muted-foreground hover:text-neon-green" prefetch>
                  Snail Tools
                </Link>
              </li>
              <li>
                <Link href="/club" className="text-muted-foreground hover:text-neon-green" prefetch>
                  Club Analytics
                </Link>
              </li>
              <li>
                <Link href="/chat" className="text-muted-foreground hover:text-neon-green" prefetch>
                  Slime Chat
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold">Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://discord.gg/supersnail"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-neon-green"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/slimyai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-neon-green"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p className="mb-2">fueled by adhd — driven by feet — motivated by ducks</p>
          <p>&copy; {currentYear} slimy.ai. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
