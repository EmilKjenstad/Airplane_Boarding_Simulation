import type { Passenger, SimConfig, SimMetrics, SimSnapshot } from './types';
import { generateBoardingOrder } from './strategies';

function gaussianRandom(mean: number, stdDev: number): number {
  // Box-Muller transform
  const u1 = Math.random() || 1e-10;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(1, Math.round(mean + stdDev * z));
}

export class SimEngine {
  private config: SimConfig;
  private passengers: Passenger[];
  private queue: Passenger[];
  private aisleOccupancy: Map<number, Passenger>;
  private currentTick = 0;
  private aisleBlockEvents = 0;
  public done = false;

  constructor(config: SimConfig) {
    this.config = config;
    const { plane, stowMean, stowStdDev } = config;

    // Build all passengers
    this.passengers = [];
    let id = 0;
    for (let row = 0; row < plane.rows; row++) {
      for (let col = 0; col < plane.seatsPerSide * 2; col++) {
        this.passengers.push({
          id: id++,
          seat: { row, col },
          state: 'queued',
          aisleRow: -1,
          stowTicksRemaining: gaussianRandom(stowMean, stowStdDev),
          boardingOrder: 0,
          enteredAisleTick: -1,
          seatedTick: -1,
        });
      }
    }

    // Apply boarding strategy
    const ordered = generateBoardingOrder(
      this.passengers,
      config.strategy,
      plane,
      config.customZoneOrder,
    );
    ordered.forEach((p, i) => { p.boardingOrder = i; });

    this.queue = [...ordered];
    this.aisleOccupancy = new Map();
  }

  step(): void {
    if (this.done) return;
    this.currentTick++;

    // 1. Process stowing passengers — decrement timer, seat when done
    for (const p of this.passengers) {
      if (p.state === 'stowing') {
        p.stowTicksRemaining--;
        if (p.stowTicksRemaining <= 0) {
          p.state = 'seated';
          p.seatedTick = this.currentTick;
          this.aisleOccupancy.delete(p.aisleRow);
          p.aisleRow = -1;
        }
      }
    }

    // 2. Move aisle passengers toward their seat (highest row first = front of plane moves first)
    const aislePassengers = this.passengers
      .filter(p => p.state === 'aisle')
      .sort((a, b) => b.aisleRow - a.aisleRow);

    for (const p of aislePassengers) {
      if (p.aisleRow === p.seat.row) {
        // Arrived at seat row — start stowing (stays in aisleOccupancy while stowing)
        p.state = 'stowing';
      } else {
        const nextRow = p.aisleRow + 1;
        if (!this.aisleOccupancy.has(nextRow)) {
          this.aisleOccupancy.delete(p.aisleRow);
          p.aisleRow = nextRow;
          this.aisleOccupancy.set(nextRow, p);
        } else {
          // Blocked
          this.aisleBlockEvents++;
        }
      }
    }

    // 3. Let the next queued passenger enter if row 0 is free
    if (this.queue.length > 0 && !this.aisleOccupancy.has(0)) {
      const p = this.queue.shift()!;
      p.state = 'aisle';
      p.aisleRow = 0;
      p.enteredAisleTick = this.currentTick;
      this.aisleOccupancy.set(0, p);
    }

    this.done = this.passengers.every(p => p.state === 'seated');
  }

  getSnapshot(): SimSnapshot {
    return {
      passengers: this.passengers.map(p => ({ ...p })),
      tick: this.currentTick,
      done: this.done,
      config: this.config.plane,
    };
  }

  getMetrics(): SimMetrics {
    const seated = this.passengers.filter(p => p.seatedTick >= 0);
    const avgWait =
      seated.length > 0
        ? seated.reduce((sum, p) => sum + (p.seatedTick - p.enteredAisleTick), 0) /
          seated.length
        : 0;
    return {
      strategy: this.config.strategy,
      totalTicks: this.currentTick,
      aisleBlockEvents: this.aisleBlockEvents,
      avgWaitTicks: Math.round(avgWait * 10) / 10,
    };
  }
}

/** Run a simulation to completion without animation — used for comparison charts. */
export function runHeadless(config: SimConfig): SimMetrics {
  const engine = new SimEngine(config);
  const maxTicks = config.plane.rows * config.plane.seatsPerSide * 2 * 200;
  let guard = 0;
  while (!engine.done && guard < maxTicks) {
    engine.step();
    guard++;
  }
  return engine.getMetrics();
}
