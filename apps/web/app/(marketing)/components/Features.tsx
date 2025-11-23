import Image from 'next/image';

const features = [
  {
    title: 'Slime Stack Orchestrator',
    text: 'Chain GPTs, RAG, and tools into one gooey flow. Visual builder ships JSON and TypeScript instantly.',
    icon: '/brand/feature-orbit.png',
  },
  {
    title: 'Holographic Inbox',
    text: 'Centralize chat, email, and voice transcripts with neon threads and automatic intent routing.',
    icon: '/brand/feature-inbox.png',
  },
  {
    title: 'Retro Sandbox',
    text: 'Replay user journeys, time-travel diff prompts, and QA agent changes with one toggle.',
    icon: '/brand/feature-sandbox.png',
  },
  {
    title: 'Signals Engine',
    text: 'Capture KPIs from every conversation and ship them into your data warehouse with zero glue code.',
    icon: '/brand/feature-signal.png',
  },
  {
    title: 'Multiplayer Editing',
    text: 'Co-edit prompts with your team, annotate edge cases, and ship experiments safely.',
    icon: '/brand/feature-collab.png',
  },
  {
    title: 'Guarded Actions',
    text: 'Policy-guarded function calling keeps every slime trail auditable and reversible.',
    icon: '/brand/feature-guard.png',
  },
];

export function Features() {
  return (
    <section id="features" className="section">
      <div className="section-header">
        <p className="section-kicker">Neon toolkit</p>
        <h2 className="section-title">Tools that drip with intent</h2>
        <p className="section-subtitle">
          Slimy stitches together your AI stack with a Y2K UI that ops teams love. Everything is composable, logged,
          and production-safe.
        </p>
      </div>
      <div className="features-grid">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <div className="feature-icon">
              <Image src={feature.icon} alt="" width={28} height={28} />
            </div>
            <h3 className="feature-title">{feature.title}</h3>
            <p className="feature-text">{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Features;
