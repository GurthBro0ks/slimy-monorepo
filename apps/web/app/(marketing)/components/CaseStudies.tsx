'use client';

import { useEffect, useRef, useState } from 'react';

type KPI = { label: string; value: number; suffix?: string };

const kpis: KPI[] = [
  { label: 'Support deflection', value: 64, suffix: '%' },
  { label: 'Activation lift', value: 38, suffix: '%' },
  { label: 'Time to respond', value: 0.9, suffix: 's' },
  { label: 'Tasks automated', value: 120 },
];

export function CaseStudies() {
  const [progress, setProgress] = useState<number[]>(kpis.map(() => 0));
  const observed = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || observed.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !observed.current) {
            observed.current = true;
            const start = performance.now();

            const animate = (ts: number) => {
              const t = Math.min((ts - start) / 1400, 1);
              setProgress(
                kpis.map((kpi) => {
                  const eased = 1 - Math.pow(1 - t, 3);
                  return parseFloat((kpi.value * eased).toFixed(2));
                })
              );
              if (t < 1) {
                rafId.current = requestAnimationFrame(animate);
              }
            };

            rafId.current = requestAnimationFrame(animate);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <section id="cases" className="section">
      <div className="section-header">
        <p className="section-kicker">Case signals</p>
        <h2 className="section-title">Proof from teams already sliming</h2>
        <p className="section-subtitle">
          Early adopters are replacing brittle scripts with neon-stable agents. Slimy keeps a ledger on every action so
          ops can sleep.
        </p>
      </div>
      <div ref={containerRef} className="case-grid">
        {kpis.map((kpi, index) => (
          <article key={kpi.label} className="kpi-card">
            <div className="kpi-value">
              {progress[index].toLocaleString(undefined, { maximumFractionDigits: kpi.value < 5 ? 1 : 0 })}
              {kpi.suffix || '+'}
            </div>
            <p className="kpi-label">{kpi.label}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default CaseStudies;
