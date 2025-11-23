import Image from 'next/image';

type CTAProps = {
  onOpenLogin: () => void;
};

export function CTA({ onOpenLogin }: CTAProps) {
  return (
    <section id="cta" className="section cta">
      <Image src="/brand/slimy-logo.png" alt="Slimy wordmark" width={280} height={120} />
      <h2 className="section-title">Let your agents get a little slimy</h2>
      <p className="section-subtitle">
        Wire up your tools, drop in your playbooks, and ship an on-brand neon agent in hours—not weeks.
      </p>
      <div className="cta-actions">
        <button className="primary-button" type="button" onClick={onOpenLogin}>
          Launch Slimy
        </button>
        <a className="ghost-button" href="mailto:hey@slimy.ai">
          Talk to a human
        </a>
      </div>
    </section>
  );
}

export default CTA;
