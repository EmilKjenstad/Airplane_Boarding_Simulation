import type { Passenger, SimConfig, SimMetrics, SimSnapshot } from './types';
import { generateBoardingOrder } from './strategies';
import { totalCols, colToAisle } from './helpers';

function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random() || 1e-10;
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(1, Math.round(mean + stdDev * z));
}

export class SimEngine {
  private config: SimConfig;
  private passengers: Passenger[];
  /** Per-aisle boarding queue — passengers sorted by boardingOrder wait here. */
  private aisleQueues: Passenger[][];
  /** Per-aisle row occupancy — key = row index, value = passenger blocking that row. */
  private aisleOccupancy: Map<number, Passenger>[];
  private currentTick = 0;
  private aisleBlockEvents = 0;
  public done = false;

  constructor(config: SimConfig) {
    this.config = config;
    const { plane, stowMean, stowStdDev } = config;
    const numAisles = Math.max(1, plane.seatGroups.length - 1);
    const cols = totalCols(plane.seatGroups);

    // Build all passengers
    this.passengers = [];
    let id = 0;
    for (let row = 0; row < plane.rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.passengers.push({
          id: id++,
          seat: { row, col },
          state: 'queued',
          aisleIndex: colToAisle(col, plane.seatGroups),
          aisleRow: -1,
          stowTicksRemaining: gaussianRandom(stowMean, stowStdDev),
          boardingOrder: 0,
          enteredAisleTick: -1,
          seatedTick: -1,
        });
      }
    }

    // Apply boarding strategy and assign boarding order
    const ordered = generateBoardingOrder(
      this.passengers,
      config.strategy,
      plane,
      config.customZoneOrder,
    );
    ordered.forEach((p, i) => { p.boardingOrder = i; });

    // Split ordered queue into per-aisle queues (preserving relative boarding order)
    this.aisleQueues = Array.from({ length: numAisles }, () => []);
    for (const p of ordered) {
      this.aisleQueues[p.aisleIndex].push(p);
    }

    this.aisleOccupancy = Array.from({ length: numAisles }, () => new Map<number, Passenger>());
  }

  step(): void {
    if (this.done) return;
    this.currentTick++;

    const numAisles = this.aisleOccupancy.length;

    for (let ai = 0; ai < numAisles; ai++) {
      const occupancy = this.aisleOccupancy[ai];

      // 1. Decrement stowing timers; seat passengers whose timer reached zero
      for (const p of this.passengers) {
        if (p.state === 'stowing' && p.aisleIndex === ai) {
          p.stowTicksRemaining--;
          if (p.stowTicksRemaining <= 0) {
            p.state = 'seated';
            p.seatedTick = this.currentTick;
            occupancy.delete(p.aisleRow);
            p.aisleRow = -1;
          }
        }
      }

      // 2. Move aisle passengers forward (process front-of-plane first to avoid chain blocks)
      const moving = this.passengers
        .filter(p => p.state === 'aisle' && p.aisleIndex === ai)
        .sort((a, b) => b.aisleRow - a.aisleRow);

      for (const p of moving) {
        if (p.aisleRow === p.seat.row) {
          p.state = 'stowing';
        } else {
          const nextRow = p.aisleRow + 1;
          if (!occupancy.has(nextRow)) {
            occupancy.delete(p.aisleRow);
            p.aisleRow = nextRow;
            occupancy.set(nextRow, p);
          } else {
            this.aisleBlockEvents++;
          }
        }
      }

      // 3. Admit next queued passenger into this aisle if row 0 is free
      const queue = this.aisleQueues[ai];
      if (queue.length > 0 && !occupancy.has(0)) {
        const p = queue.shift()!;
        p.state = 'aisle';
        p.aisleRow = 0;
        p.enteredAisleTick = this.currentTick;
        occupancy.set(0, p);
      }
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
  const maxTicks = config.plane.rows * config.plane.seatGroups.reduce((a, b) => a + b, 0) * 200;
  let guard = 0;
  while (!engine.done && guard < maxTicks) {
    engine.step();
    guard++;
  }
  return engine.getMetrics();
}
