import type { PlaneConfig, SimConfig } from './types';

export const DEFAULT_PLANE: PlaneConfig = {
  rows: 30,
  seatsPerSide: 3,
};

export const DEFAULT_SIM_CONFIG: SimConfig = {
  plane: DEFAULT_PLANE,
  strategy: 'back-to-front',
  ticksPerSecond: 10,
  stowMean: 15,
  stowStdDev: 5,
  customZoneOrder: [2, 1, 0], // back, middle, front
};

export const NUM_ZONES = 3;
