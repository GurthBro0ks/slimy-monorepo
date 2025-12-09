"use client";

import { useEffect, useRef } from "react";

/**
 * Slime drip animation overlay component.
 * Creates random animated slime drips falling down the screen.
 */
export function SlimeDrip() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;

    // Create random slime drips
    const createDrip = () => {
      const drip = document.createElement("div");
      drip.className = "slime-drip";

      // Random positioning and sizing
      const left = Math.random() * 100;
      const width = 2 + Math.random() * 4;
      const duration = 8 + Math.random() * 4;
      const delay = Math.random() * 5;

      drip.style.left = `${left}%`;
      drip.style.width = `${width}px`;
      drip.style.animationDuration = `${duration}s`;
      drip.style.animationDelay = `${delay}s`;

      overlay.appendChild(drip);
    };

    // Create initial drips
    for (let i = 0; i < 15; i++) {
      createDrip();
    }

    // Cleanup
    return () => {
      if (overlay) {
        overlay.innerHTML = "";
      }
    };
  }, []);

  return <div ref={overlayRef} id="slime-overlay" />;
}
