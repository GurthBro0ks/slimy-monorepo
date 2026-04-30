import Link from "next/link";
import {
  BookOpen,
  Camera,
  CheckCircle2,
  FileSpreadsheet,
  Hash,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

const guides = [
  {
    title: "Club Dashboard",
    href: "/snail/club",
    icon: Users,
    summary: "Review current roster power, import XLSX snapshots, and open owner-only import history.",
    steps: [
      "Use the dashboard for the latest club roster snapshot.",
      "Use XLSX import when you already have structured roster data.",
      "Use history to confirm previous imports and pushes.",
    ],
  },
  {
    title: "Screenshot OCR",
    href: "/snail/club/screenshots",
    icon: Camera,
    summary: "Upload Manage Members screenshots, review extracted rows, then push confirmed data.",
    steps: [
      "Upload 1 to 10 clear PNG, JPG, or WEBP screenshots.",
      "Capture both Power and Sim Power sorted views when you need both values.",
      "Review extracted names and powers before pushing.",
      "Remove questionable rows instead of pushing uncertain OCR output.",
    ],
  },
  {
    title: "Codes",
    href: "/snail/codes",
    icon: Hash,
    summary: "Browse active Super Snail codes and source metadata from the public scanner.",
    steps: [
      "Use active scope for current codes.",
      "Check metadata when deciding whether a code needs manual review.",
      "Owner tools can scan and push code updates to Discord.",
    ],
  },
  {
    title: "Stats",
    href: "/snail/stats",
    icon: TrendingUp,
    summary: "Track club-level power, member counts, and trend data where the data source is available.",
    steps: [
      "Use stats after imports to verify aggregate changes.",
      "Compare club dashboard rows against stats totals after large updates.",
      "Treat missing values as a data-source gap, not a player result.",
    ],
  },
];

const roles = [
  { role: "Public", access: "Snail hub, wiki, docs, public codes, public stats links." },
  { role: "Member", access: "Guild list and authenticated dashboard areas." },
  { role: "Leader", access: "Club dashboard and stats surfaces used for roster review." },
  { role: "Owner", access: "Screenshot OCR, import history, pushes, and owner admin tools." },
];

export default function DocsPage() {
  return (
    <div className="space-y-10 font-mono">
      <section className="border-b-2 border-[#39ff14] pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3 text-[#00ffff]">
              <BookOpen size={28} />
              <span className="text-sm font-bold tracking-[0.35em]">SNAIL OPS MANUAL</span>
            </div>
            <h1
              className="text-3xl font-bold tracking-tighter text-[#39ff14] drop-shadow-[0_0_10px_#39ff14] md:text-5xl"
              style={{ fontFamily: '"Press Start 2P", cursive' }}
            >
              DOCUMENTATION
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-[#d6b4fc]/80">
              Current operating notes for the SlimyAI Super Snail tools. This page covers the live web surfaces,
              the owner-only OCR workflow, and the minimum checks to run before trusting imported club data.
            </p>
          </div>
          <Link
            href="/snail"
            className="inline-flex items-center justify-center border-2 border-[#8a4baf] px-5 py-3 text-sm font-bold tracking-widest text-[#8a4baf] transition-all hover:bg-[#8a4baf] hover:text-black"
          >
            BACK TO HUB
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <article key={guide.title} className="border-2 border-[#8a4baf]/40 bg-[#0a0412] p-5">
              <div className="mb-4 flex items-center gap-3 text-[#00ffff]">
                <Icon size={24} />
                <h2 className="text-2xl font-bold tracking-widest" style={{ fontFamily: '"VT323", monospace' }}>
                  {guide.title}
                </h2>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-[#d6b4fc]/75">{guide.summary}</p>
              <ul className="space-y-2">
                {guide.steps.map((step) => (
                  <li key={step} className="flex gap-2 text-sm text-[#d6b4fc]">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#39ff14]" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={guide.href}
                className="mt-5 inline-flex border border-[#39ff14]/70 px-4 py-2 text-xs font-bold tracking-widest text-[#39ff14] transition-all hover:bg-[#39ff14] hover:text-black"
              >
                OPEN {guide.title.toUpperCase()}
              </Link>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="border-2 border-[#00ffff]/30 bg-[#0a0412] p-5">
          <div className="mb-4 flex items-center gap-3 text-[#00ffff]">
            <ShieldCheck size={24} />
            <h2 className="text-2xl font-bold tracking-widest" style={{ fontFamily: '"VT323", monospace' }}>
              Access Model
            </h2>
          </div>
          <div className="space-y-3">
            {roles.map((item) => (
              <div key={item.role} className="border border-[#8a4baf]/25 bg-[#1a0b2e]/45 p-3">
                <p className="text-sm font-bold tracking-widest text-[#39ff14]">{item.role}</p>
                <p className="mt-1 text-sm text-[#d6b4fc]/75">{item.access}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-2 border-[#ff6b00]/40 bg-[#0a0412] p-5">
          <div className="mb-4 flex items-center gap-3 text-[#ff6b00]">
            <FileSpreadsheet size={24} />
            <h2 className="text-2xl font-bold tracking-widest" style={{ fontFamily: '"VT323", monospace' }}>
              Data Trust Rules
            </h2>
          </div>
          <ul className="space-y-3 text-sm leading-relaxed text-[#d6b4fc]/80">
            <li>Screenshot OCR is a draft extraction until a human reviews row names and power values.</li>
            <li>Regular Power and Sim Power screenshots must stay distinguishable; do not merge those fields by guess.</li>
            <li>XLSX imports are preferred when the source sheet is current and structured.</li>
            <li>Pushes should be treated as live data changes. Confirm guild, roster count, and obvious OCR mistakes first.</li>
            <li>When OCR and sheet data disagree, keep the original import evidence and check import history before overwriting.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
