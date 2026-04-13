import { useEffect, useRef } from 'react';
import { SimEngine } from '../simulation/engine';
import type { SimConfig, SimMetrics } from '../simulation/types';
import { canvasDimensions, renderFrame } from '../renderer';

interface Props {
  simConfig: SimConfig;
  running: boolean;
  resetKey: number;
  onComplete: (metrics: SimMetrics) => void;
  onDoneChange: (done: boolean) => void;
}

export default function SimCanvas({ simConfig, running, resetKey, onComplete, onDoneChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SimEngine | null>(null);
  const rafRef = useRef<number>(0);
  const runningRef = useRef(running);
  const ticksPerSecRef = useRef(simConfig.ticksPerSecond);

  // Keep ticksPerSec ref in sync (no reset needed)
  useEffect(() => {
    ticksPerSecRef.current = simConfig.ticksPerSecond;
  }, [simConfig.ticksPerSecond]);

  // Recreate engine when resetKey changes (new config / manual reset)
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    runningRef.current = false;

    engineRef.current = new SimEngine(simConfig);
    onDoneChange(false);

    const canvas = canvasRef.current;
    if (canvas) {
      const { w, h } = canvasDimensions(simConfig.plane.rows, simConfig.plane.seatGroups);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) renderFrame(ctx, engineRef.current.getSnapshot());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  // Start / stop animation loop
  useEffect(() => {
    runningRef.current = running;

    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const engine = engineRef.current;
    if (!engine || engine.done) return;

    let lastTime = performance.now();
    let tickAccum = 0;

    const loop = (now: number) => {
      if (!runningRef.current) return;

      const elapsed = now - lastTime;
      lastTime = now;
      tickAccum += elapsed;

      const tickDuration = 1000 / ticksPerSecRef.current;

      while (tickAccum >= tickDuration && !engine.done) {
        engine.step();
        tickAccum -= tickDuration;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) renderFrame(ctx, engine.getSnapshot());
      }

      if (engine.done) {
        onDoneChange(true);
        onComplete(engine.getMetrics());
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const { w, h } = canvasDimensions(simConfig.plane.rows, simConfig.plane.seatGroups);

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      style={{ borderRadius: 8, display: 'block', maxHeight: '100%', maxWidth: '100%' }}
    />
  );
}
