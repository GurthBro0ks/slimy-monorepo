"use client";

import React from "react";
import Link from "next/link";
import {
  Gamepad2,
  Zap,
  Users,
  Gift,
  Terminal,
  ExternalLink,
  ArrowRight,
  ChevronDown,
  BookOpen,
  Star,
  Shield,
  BarChart3,
  Key,
  MessageSquare,
  ImageIcon,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const tocSections = [
  { id: "getting-started", label: "Getting Started" },
  { id: "power-leveling", label: "Power Leveling" },
  { id: "club-management", label: "Club Management" },
  { id: "code-redemption", label: "Code Redemption" },
  { id: "bot-commands", label: "Bot Commands" },
  { id: "useful-links", label: "Useful Links" },
];

export default function WikiPage() {
  return (
    <div className="space-y-10 font-mono max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-[#ff6b00] pb-6">
        <h1 className="text-5xl text-[#ff6b00] mb-4 tracking-tighter font-bold drop-shadow-[0_0_10px_#ff6b00]">
          🐌 KNOWLEDGE BASE
        </h1>
        <p className="text-xl text-[#8a4baf]">
          BEGINNER&apos;S GUIDE TO SUPER SNAIL &middot; CORMYS BAR EDITION
        </p>
      </div>

      {/* Online Badge */}
      <div className="flex justify-center">
        <div className="bg-[#0a0412] border-2 border-[#39ff14] px-6 py-2 inline-flex items-center gap-3">
          <div className="w-3 h-3 bg-[#39ff14] rounded-full drop-shadow-[0_0_5px_#39ff14]" />
          <span className="text-[#39ff14] font-bold tracking-[0.3em] text-sm drop-shadow-[0_0_5px_#39ff14]">
            ONLINE
          </span>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-[#0a0412] border-2 border-[#ff6b00]/40 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen size={22} className="text-[#ff6b00]" />
          <h2 className="text-xl font-bold text-[#ff6b00] tracking-widest">
            TABLE OF CONTENTS
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {tocSections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a0b2e]/50 border border-[#8a4baf]/20 text-[#d6b4fc] hover:text-[#ff6b00] hover:border-[#ff6b00]/40 transition-all"
            >
              <ChevronDown size={14} className="text-[#8a4baf]" />
              <span className="text-sm tracking-widest">{section.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* ─── Section 1: Getting Started ─── */}
      <WikiSection id="getting-started" icon={<Gamepad2 size={24} />} title="GETTING STARTED">
        <div className="space-y-6">
          <SubSection title="What is Super Snail?">
            <p className="text-[#d6b4fc]/80 leading-relaxed">
              Super Snail is a mobile idle RPG where you progress through increasingly powerful
              stages, collect resources, and compete with other players through club-based rankings.
              It combines idle mechanics with active progression — your snail keeps growing even
              when you&apos;re away, but smart decisions accelerate your gains significantly.
            </p>
          </SubSection>

          <SubSection title="How to Join Cormys Bar">
            <p className="text-[#d6b4fc]/80 leading-relaxed">
              Cormys Bar is our club and the heart of our community. To join:
            </p>
            <ol className="mt-3 space-y-2 ml-4">
              <ListItem number={1}>
                Reach the required level to unlock the Club feature in-game.
              </ListItem>
              <ListItem number={2}>
                Open the Club menu and search for <strong className="text-[#39ff14]">Cormys Bar</strong>.
              </ListItem>
              <ListItem number={3}>
                Apply to join — an officer will approve your request.
              </ListItem>
              <ListItem number={4}>
                Join our Discord for coordination, tips, and bot commands.
              </ListItem>
            </ol>
          </SubSection>

          <SubSection title="Linking Your Account">
            <p className="text-[#d6b4fc]/80 leading-relaxed">
              To use SlimyAI bot commands for stats tracking, you&apos;ll need to link your Discord
              account with your in-game profile. Use the <Code>/snail stats</Code> command in Discord
              to get started. The bot will guide you through linking your game account so your power
              data and rankings are tracked automatically.
            </p>
          </SubSection>
        </div>
      </WikiSection>

      {/* ─── Section 2: Power Leveling ─── */}
      <WikiSection id="power-leveling" icon={<Zap size={24} />} title="POWER LEVELING BASICS">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard
              icon={<Star size={20} className="text-[#ff6b00]" />}
              title="SIM Power"
              accent="#ff6b00"
            >
              SIM Power represents your snail&apos;s core combat strength. It&apos;s the primary metric
              used in club rankings and determines your effectiveness in battles. Higher SIM Power
              means faster stage clears and better rewards.
            </InfoCard>
            <InfoCard
              icon={<Shield size={20} className="text-[#00ffff]" />}
              title="Total Power"
              accent="#00ffff"
            >
              Total Power is the combined measure of all your snail&apos;s stats, equipment, and
              bonuses. It provides a more holistic view of your overall progression. Both SIM Power
              and Total Power contribute to your club&apos;s ranking.
            </InfoCard>
          </div>

          <SubSection title="How Power is Calculated">
            <p className="text-[#d6b4fc]/80 leading-relaxed">
              Power is derived from multiple in-game systems working together — your snail&apos;s
              base stats, equipped gear and upgrades, collected companions and their levels,
              research and technology bonuses, and various multipliers from events and buffs.
              Each system contributes to your overall power number.
            </p>
          </SubSection>

          <SubSection title="Tips for Increasing Power Quickly">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TipCard>Log in daily to collect idle rewards and maintain streaks</TipCard>
              <TipCard>Prioritize upgrades that give the biggest power-per-resource ratio</TipCard>
              <TipCard>Participate in events for limited-time bonuses and exclusive items</TipCard>
              <TipCard>Keep your companions leveled — they provide significant passive bonuses</TipCard>
              <TipCard>Join club activities for group rewards that boost individual power</TipCard>
              <TipCard>Redeem active codes regularly for free resources (see Code Redemption below)</TipCard>
            </div>
          </SubSection>
        </div>
      </WikiSection>

      {/* ─── Section 3: Club Management ─── */}
      <WikiSection id="club-management" icon={<Users size={24} />} title="CLUB MANAGEMENT">
        <div className="space-y-6">
          <SubSection title="How Club Rankings Work">
            <p className="text-[#d6b4fc]/80 leading-relaxed">
              Club rankings are determined by the aggregate power of all members. Every member&apos;s
              contribution matters. Clubs are ranked against other clubs in the game, and high
              rankings unlock exclusive rewards and bonuses for all members. The more powerful your
              club, the better the perks.
            </p>
          </SubSection>

          <SubSection title="Weekly Snapshots &amp; WoW Tracking">
            <p className="text-[#d6b4fc]/80 leading-relaxed">
              SlimyAI takes weekly snapshots of club member power data. This allows us to track
              week-over-week (WoW) changes — who&apos;s growing fast, who might need help, and how the
              club is trending overall. These snapshots are taken when officers run club analysis
              and the data is committed to our tracking system.
            </p>
          </SubSection>

          <SubSection title="Reading the /club-stats Command">
            <p className="text-[#d6b4fc]/80 leading-relaxed">
              The <Code>/club-stats</Code> Discord command shows a summary of club performance:
            </p>
            <ul className="mt-3 space-y-2 ml-4">
              <Bullet color="#39ff14">
                <strong>Total Members</strong> — current roster count
              </Bullet>
              <Bullet color="#39ff14">
                <strong>Average Power</strong> — mean power level across all members
              </Bullet>
              <Bullet color="#39ff14">
                <strong>Top Movers</strong> — members with the biggest WoW power gains
              </Bullet>
              <Bullet color="#39ff14">
                <strong>Decliners</strong> — members whose power dropped (may need help)
              </Bullet>
            </ul>
          </SubSection>

          <SubSection title="Reading the Website Stats Pages">
            <p className="text-[#d6b4fc]/80 leading-relaxed">
              For detailed stats, check the web dashboard. The{" "}
              <Link href="/snail/club" className="text-[#39ff14] hover:underline">Club Dashboard</Link>
              {" "}shows sortable member rankings with SIM Power, Total Power, and WoW change %.
              The{" "}
              <Link href="/snail/stats" className="text-[#39ff14] hover:underline">Stats page</Link>
              {" "}breaks down top 10 lists, movers, and decliners. All data is owner-authenticated
              and sourced from our weekly MySQL snapshots.
            </p>
          </SubSection>
        </div>
      </WikiSection>

      {/* ─── Section 4: Code Redemption ─── */}
      <WikiSection id="code-redemption" icon={<Gift size={24} />} title="CODE REDEMPTION">
        <div className="space-y-6">
          <SubSection title="Where to Find Codes">
            <p className="text-[#d6b4fc]/80 leading-relaxed">
              Redeem codes are distributed through several channels: the in-game mailbox often
              contains codes from the developers, official social media posts announce limited-time
              codes, community events may distribute exclusive codes, and our SlimyAI bot aggregates
              all known active codes for easy access.
            </p>
          </SubSection>

          <SubSection title="How to Redeem Codes">
            <ol className="space-y-2 ml-4">
              <ListItem number={1}>
                Open Super Snail and navigate to the settings or redemption menu in-game.
              </ListItem>
              <ListItem number={2}>
                Enter the code exactly as shown (codes are usually case-sensitive).
              </ListItem>
              <ListItem number={3}>
                Confirm the redemption — rewards will appear in your mailbox.
              </ListItem>
            </ol>
          </SubSection>

          <SubSection title="Using the /snail codes Bot Command">
            <p className="text-[#d6b4fc]/80 leading-relaxed">
              Type <Code>/snail codes</Code> in Discord to browse all currently active codes. The
              bot pulls from multiple sources and categorizes codes as <strong className="text-[#39ff14]">Latest</strong> or{" "}
              <strong className="text-[#8a4baf]">Older</strong> so you can prioritize which to redeem first.
              Codes that have expired are automatically filtered out.
            </p>
          </SubSection>

          <div className="bg-[#1a0b2e]/60 border border-[#8a4baf]/30 p-4 flex items-center gap-4">
            <Key size={24} className="text-[#ff6b00] shrink-0" />
            <div>
              <p className="text-[#d6b4fc] text-sm">
                For the full web experience with copy-to-clipboard, visit the{" "}
                <Link href="/snail/codes" className="text-[#39ff14] hover:underline font-bold">
                  Snail Codes page
                </Link>{" "}
                on the website.
              </p>
            </div>
          </div>
        </div>
      </WikiSection>

      {/* ─── Section 5: Bot Commands Reference ─── */}
      <WikiSection id="bot-commands" icon={<Terminal size={24} />} title="BOT COMMANDS REFERENCE">
        <div className="space-y-2">
          <p className="text-[#d6b4fc]/60 text-sm mb-4 tracking-widest">
            ALL COMMANDS RUN IN DISCORD
          </p>
          <div className="space-y-2">
            <CommandRow
              cmd="/club-stats"
              desc="View club power rankings with WoW changes"
              icon={<BarChart3 size={18} />}
              category="CLUB"
            />
            <CommandRow
              cmd="/club-analyze"
              desc="Analyze club roster screenshots and commit data"
              icon={<Users size={18} />}
              category="CLUB"
            />
            <CommandRow
              cmd="/snail codes"
              desc="Browse all active game redemption codes"
              icon={<Gift size={18} />}
              category="SNAIL"
            />
            <CommandRow
              cmd="/snail analyze"
              desc="Analyze game screenshots for power data"
              icon={<ImageIcon size={18} />}
              category="SNAIL"
            />
            <CommandRow
              cmd="/snail stats"
              desc="View your personal stats and linked account info"
              icon={<TrendingUp size={18} />}
              category="SNAIL"
            />
            <CommandRow
              cmd="/leaderboard"
              desc="View club power leaderboard rankings"
              icon={<TrendingUp size={18} />}
              category="RANKING"
            />
            <CommandRow
              cmd="/farming"
              desc="Farming tips, guides, and airdrop tracking"
              icon={<Sparkles size={18} />}
              category="GUIDE"
            />
            <CommandRow
              cmd="/chat"
              desc="Chat with the AI assistant"
              icon={<MessageSquare size={18} />}
              category="AI"
            />
            <CommandRow
              cmd="/dream"
              desc="Generate AI images with style presets"
              icon={<Sparkles size={18} />}
              category="AI"
            />
          </div>
        </div>
      </WikiSection>

      {/* ─── Section 6: Useful Links ─── */}
      <WikiSection id="useful-links" icon={<ExternalLink size={24} />} title="USEFUL LINKS">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LinkCard href="https://slimyai.xyz" label="SlimyAI Website" desc="Main site &amp; dashboard" />
          <LinkCard href="/snail/club" label="Club Stats" desc="Cormys Bar rankings &amp; data" />
          <LinkCard href="/snail/stats" label="Stats Dashboard" desc="Detailed power analysis" />
          <LinkCard href="/snail/codes" label="Game Codes" desc="Active redemption codes" />
        </div>
      </WikiSection>

      {/* Footer */}
      <div className="pt-8 border-t border-[#8a4baf]/30 space-y-3">
        <p className="text-[#8a4baf] text-sm tracking-widest font-mono text-center">
          WIKI_V2.0 // CORMYS_BAR_INTEL // SLIMY_AI_SYSTEMS
        </p>
        <div className="flex justify-center gap-4 text-xs text-[#d6b4fc]/50 tracking-widest">
          <Link href="/snail" className="flex items-center gap-1 hover:text-[#ff6b00] transition-colors">
            <ArrowRight size={12} /> BACK TO HUB
          </Link>
          <Link href="/snail/codes" className="flex items-center gap-1 hover:text-[#d400ff] transition-colors">
            <ArrowRight size={12} /> SNAIL CODES
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────────

function WikiSection({
  id,
  icon,
  title,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 border-b-2 border-[#ff6b00]/40 pb-4 mb-6">
        <div className="text-[#ff6b00]">{icon}</div>
        <h2 className="text-2xl font-bold text-[#ff6b00] tracking-widest drop-shadow-[0_0_5px_rgba(255,107,0,0.3)]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-bold text-[#d6b4fc] tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 bg-[#1a0b2e] border border-[#39ff14]/40 text-[#39ff14] text-sm font-bold">
      {children}
    </span>
  );
}

function ListItem({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 text-[#d6b4fc]/80 leading-relaxed">
      <span className="text-[#ff6b00] font-bold shrink-0">{number}.</span>
      <span>{children}</span>
    </li>
  );
}

function Bullet({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 text-[#d6b4fc]/80 leading-relaxed">
      <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span>{children}</span>
    </li>
  );
}

function InfoCard({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0a0412] border-2 p-5 space-y-3" style={{ borderColor: `${accent}66` }}>
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-bold tracking-widest text-lg" style={{ color: accent }}>
          {title}
        </h4>
      </div>
      <p className="text-sm text-[#d6b4fc]/70 leading-relaxed">{children}</p>
    </div>
  );
}

function TipCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 bg-[#1a0b2e]/60 border border-[#39ff14]/20 p-3">
      <span className="text-[#39ff14] mt-0.5 shrink-0">▸</span>
      <p className="text-sm text-[#d6b4fc]/80 leading-relaxed">{children}</p>
    </div>
  );
}

function CommandRow({
  cmd,
  desc,
  icon,
  category,
}: {
  cmd: string;
  desc: string;
  icon: React.ReactNode;
  category: string;
}) {
  return (
    <div className="flex items-center gap-4 bg-[#0a0412] border border-[#8a4baf]/20 p-3 hover:border-[#8a4baf]/50 transition-colors">
      <div className="text-[#8a4baf] shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <span className="text-[#39ff14] font-bold tracking-wider">{cmd}</span>
        <span className="text-[#d6b4fc]/50 text-sm ml-3">{desc}</span>
      </div>
      <span className="text-[10px] text-[#ff6b00]/60 tracking-[0.2em] border border-[#ff6b00]/30 px-2 py-0.5 shrink-0 hidden sm:inline">
        {category}
      </span>
    </div>
  );
}

function LinkCard({
  href,
  label,
  desc,
}: {
  href: string;
  label: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 bg-[#0a0412] border-2 border-[#8a4baf]/30 p-4 hover:border-[#ff6b00]/60 hover:bg-[#1a0b2e] transition-all group"
    >
      <ExternalLink size={20} className="text-[#8a4baf] group-hover:text-[#ff6b00] transition-colors shrink-0" />
      <div>
        <p className="text-[#d6b4fc] font-bold tracking-widest group-hover:text-[#ff6b00] transition-colors">
          {label}
        </p>
        <p className="text-[#d6b4fc]/50 text-xs tracking-wider">{desc}</p>
      </div>
    </Link>
  );
}
