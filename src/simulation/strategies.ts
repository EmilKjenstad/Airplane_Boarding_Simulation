import type { Passenger, PlaneConfig, StrategyName } from './types';
import { NUM_ZONES } from './config';
import { windowDistance } from './helpers';

function shuffle<T>(arr: T[]): T[] {
  return arr
    .map(item => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function getZone(row: number, totalRows: number): number {
  return Math.min(NUM_ZONES - 1, Math.floor((row / totalRows) * NUM_ZONES));
}

export function generateBoardingOrder(
  passengers: Passenger[],
  strategy: StrategyName,
  plane: PlaneConfig,
  customZoneOrder?: number[],
): Passenger[] {
  switch (strategy) {
    case 'random':
      return shuffle(passengers);

    case 'back-to-front': {
      const withSort = passengers.map(p => ({
        p,
        zone: NUM_ZONES - 1 - getZone(p.seat.row, plane.rows),
        r: Math.random(),
      }));
      return withSort
        .sort((a, b) => a.zone - b.zone || a.r - b.r)
        .map(({ p }) => p);
    }

    case 'front-to-back': {
      const withSort = passengers.map(p => ({
        p,
        zone: getZone(p.seat.row, plane.rows),
        r: Math.random(),
      }));
      return withSort
        .sort((a, b) => a.zone - b.zone || a.r - b.r)
        .map(({ p }) => p);
    }

    case 'window-middle-aisle': {
      // Higher windowDistance = more window-like = boards first → sort descending
      const withSort = passengers.map(p => ({
        p,
        wDist: windowDistance(p.seat.col, plane.seatGroups),
        r: Math.random(),
      }));
      return withSort
        .sort((a, b) => b.wDist - a.wDist || a.r - b.r)
        .map(({ p }) => p);
    }

    case 'outside-in': {
      // Window seats first, within each type go back-to-front
      const withSort = passengers.map(p => ({
        p,
        wDist: windowDistance(p.seat.col, plane.seatGroups),
        rowDesc: -p.seat.row,
      }));
      return withSort
        .sort((a, b) => b.wDist - a.wDist || a.rowDesc - b.rowDesc)
        .map(({ p }) => p);
    }

    case 'custom': {
      const zoneOrder = customZoneOrder ?? [NUM_ZONES - 1, NUM_ZONES - 2, 0];
      const withSort = passengers.map(p => ({
        p,
        orderIdx: zoneOrder.indexOf(getZone(p.seat.row, plane.rows)),
        r: Math.random(),
      }));
      return withSort
        .sort((a, b) => a.orderIdx - b.orderIdx || a.r - b.r)
        .map(({ p }) => p);
    }

    default:
      return shuffle(passengers);
  }
}

export function getZoneLabel(zoneIdx: number, rows: number): string {
  const zoneSize = Math.ceil(rows / NUM_ZONES);
  const start = zoneIdx * zoneSize + 1;
  const end = Math.min((zoneIdx + 1) * zoneSize, rows);
  const names = ['Front', 'Middle', 'Back'];
  return `${names[zoneIdx] ?? `Zone ${zoneIdx + 1}`} (rows ${start}–${end})`;
}
