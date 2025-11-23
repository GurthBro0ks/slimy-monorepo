import { useEffect, useRef } from 'react';

type RGB = { r: number; g: number; b: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Lightweight fluid-ish shader using canvas2d; keeps it performant but lively.
export function useFluidCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let time = 0;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      canvas.width = innerWidth * pixelRatio;
      canvas.height = innerHeight * pixelRatio;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const randomColor = (): RGB => ({
      r: 70 + Math.random() * 40,
      g: 120 + Math.random() * 120,
      b: 200 + Math.random() * 55,
    });

    const colorA = randomColor();
    const colorB = randomColor();

    const draw = () => {
      const { innerWidth: w, innerHeight: h } = window;
      time += 0.008;

      ctx.clearRect(0, 0, w, h);
      const grd = ctx.createRadialGradient(
        w * (0.45 + Math.sin(time * 0.8) * 0.15),
        h * (0.4 + Math.cos(time * 0.6) * 0.2),
        80,
        w * (0.55 + Math.sin(time * 0.5) * 0.2),
        h * (0.6 + Math.cos(time * 0.7) * 0.18),
        Math.max(w, h)
      );

      const mix = (c1: RGB, c2: RGB, t: number): string =>
        `rgba(${lerp(c1.r, c2.r, t)}, ${lerp(c1.g, c2.g, t)}, ${lerp(c1.b, c2.b, t)}, 0.3)`;

      grd.addColorStop(0, mix(colorA, colorB, (Math.sin(time * 1.4) + 1) / 2));
      grd.addColorStop(0.4, mix(colorB, colorA, (Math.cos(time * 1.2) + 1) / 2));
      grd.addColorStop(1, 'rgba(13, 7, 32, 0.9)');

      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      rafId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []);

  return { canvasRef };
}

export default useFluidCanvas;
