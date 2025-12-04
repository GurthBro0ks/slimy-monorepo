"use client";

import { useEffect, useRef } from "react";

/**
 * MatrixBackground - Dramatic Matrix-style rain effect with slimy green drips
 * Replaces the subtle particle animation with cyberpunk terminal aesthetic
 */
export default function MatrixBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Matrix characters (including slime-related symbols)
    const chars = "01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ🐌💧🟢※◆◇";
    const charArray = chars.split("");

    const fontSize = 16;
    const columns = Math.floor(width / fontSize);

    // Initialize drops - one per column
    const drops = Array(columns).fill(1);

    // Random speeds for each column
    const speeds = Array(columns).fill(0).map(() => Math.random() * 0.5 + 0.3);

    // Accumulator for smooth animation
    const accumulators = Array(columns).fill(0);

    // Trail colors for slimy effect
    const colors = [
      "rgba(0, 255, 100, 1)",    // Bright green (head)
      "rgba(0, 255, 100, 0.8)",  // Slightly dimmer
      "rgba(0, 255, 100, 0.6)",  // Medium
      "rgba(0, 255, 100, 0.4)",  // Dim
      "rgba(0, 255, 100, 0.2)",  // Very dim
      "rgba(0, 255, 100, 0.1)",  // Almost invisible
    ];

    const draw = () => {
      // Create fade effect with semi-transparent black
      ctx.fillStyle = "rgba(13, 7, 32, 0.08)"; // Slower fade for longer trails
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < drops.length; i++) {
        // Update accumulator
        accumulators[i] += speeds[i];

        // Only update position when accumulator reaches 1
        if (accumulators[i] >= 1) {
          drops[i] += Math.floor(accumulators[i]);
          accumulators[i] = accumulators[i] % 1;
        }

        // Draw trail effect (multiple characters behind the main one)
        const trailLength = 6;
        for (let j = 0; j < trailLength; j++) {
          const yPos = (drops[i] - j) * fontSize;

          // Skip if off screen
          if (yPos < 0 || yPos > height) continue;

          const char = charArray[Math.floor(Math.random() * charArray.length)];

          // Use gradient colors for trail
          ctx.fillStyle = colors[j] || colors[colors.length - 1];
          ctx.font = `${fontSize}px 'VT323', monospace`;
          ctx.fillText(char, i * fontSize, yPos);

          // Add glow effect to the head of the drop
          if (j === 0) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(0, 255, 100, 0.8)";
            ctx.fillStyle = "rgba(0, 255, 100, 1)";
            ctx.fillText(char, i * fontSize, yPos);
            ctx.shadowBlur = 0;
          }
        }

        // Reset drop to top when it goes off screen
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
          speeds[i] = Math.random() * 0.5 + 0.3; // New random speed
        }
      }

      requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      // Recalculate columns
      const newColumns = Math.floor(width / fontSize);
      drops.length = newColumns;
      speeds.length = newColumns;
      accumulators.length = newColumns;

      for (let i = 0; i < newColumns; i++) {
        if (drops[i] === undefined) {
          drops[i] = Math.floor(Math.random() * height / fontSize);
          speeds[i] = Math.random() * 0.5 + 0.3;
          accumulators[i] = 0;
        }
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="matrix-canvas"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.6,
      }}
    />
  );
}
