import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tutorial | Slimy.ai',
};

export default function TutorialPage() {
  return (
    <div className="prose mx-auto max-w-4xl p-8">
      <h1>🚀 Slimy.ai Tutorial</h1>
      
      <section>
        <h2>1. Quick Auth</h2>
        <p>Sign in → Access dashboard and chat. Discord OAuth for authentication.</p>
      </section>
      
      <section>
        <h2>2. Chat</h2>
        <p>Real-time messaging with channels and direct messages.</p>
      </section>
      
      <section>
        <h2 id="supersnail">🎮 Supersnail Club Integration</h2>
        <p>For QCPlay Supersnail players (~60 club-mates):</p>
        <ul>
          <li>Connect Apple Music/Game Center → Track scores/boosts.</li>
          <li>Bot dashboard: Shadow trades tied to game events (e.g., &quot;Edge on [market] -&gt; snail boost?&quot;).</li>
          <li>Private MVP: Alerts -&gt; Discord/Telegram (&quot;Score 1M -&gt; bet $0.01?&quot;).</li>
        </ul>
        <p><strong>Next:</strong> /dashboard/supersnail stub → full tie-in.</p>
      </section>
      
      <section>
        <h2>3. Trading Bot</h2>
        <p>Shadow → micro-live → scale. Gates: VenueBook/Stale-Edge/Launch Radar.</p>
        <details>
          <summary>Verify Shadow</summary>
          <pre>ssh nuc2 &apos;cd /opt/slimy/pm_updown_bot_bundle && ./scripts/run_tests.sh&apos;</pre>
        </details>
      </section>
      
      <hr />
      <p><em>Built with proof-packs. Questions? @GurthBr00ks</em></p>
    </div>
  );
}