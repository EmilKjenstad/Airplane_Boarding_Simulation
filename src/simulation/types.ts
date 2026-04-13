export type PassengerState = 'queued' | 'aisle' | 'stowing' | 'seated';

export type StrategyName =
  | 'random'
  | 'back-to-front'
  | 'front-to-back'
  | 'window-middle-aisle'
  | 'outside-in'
  | 'custom';

export interface SeatPosition {
  row: number; // 0-indexed, 0 = front of plane
  col: number; // 0-indexed
}

export interface Passenger {
  id: number;
  seat: SeatPosition;
  state: PassengerState;
  aisleIndex: number;         // which aisle this passenger uses
  aisleRow: number;          // current row in the aisle (-1 if not yet entered)
  stowTicksRemaining: number; // pre-assigned stow time
  boardingOrder: number;     // position in boarding queue (0 = first)
  enteredAisleTick: number;  // tick they entered the aisle (-1 if not yet)
  seatedTick: number;        // tick they were seated (-1 if not yet)
}

export interface PlaneConfig {
  rows: number;
  /** Seat counts per group — aisles are inferred between groups. E.g. [3,3], [2,4,2], [1,2]. */
  seatGroups: number[];
}

export interface SimConfig {
  plane: PlaneConfig;
  strategy: StrategyName;
  ticksPerSecond: number;
  stowMean: number;
  stowStdDev: number;
  customZoneOrder?: number[]; // zone indices in boarding order (for 'custom' strategy)
}

export interface SimMetrics {
  strategy: StrategyName;
  totalTicks: number;
  aisleBlockEvents: number;
  avgWaitTicks: number; // avg (seatedTick - enteredAisleTick) per passenger
}

export interface SimSnapshot {
  passengers: Passenger[];
  tick: number;
  done: boolean;
  config: PlaneConfig;
}
