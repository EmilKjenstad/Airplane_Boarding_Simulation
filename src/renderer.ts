import type { SimSnapshot } from './simulation/types';
import { totalCols, groupStartCol } from './simulation/helpers';

const CELL = 26;
const AISLE = 20;
const PAD = 24;
const SEAT_CORNER = 4;
const PASSENGER_R = 7;

const COLOR = {
  bg: '#0f172a',
  seatEmpty: '#1e3a5f',
  seatOccupied: '#22c55e',
  aisleBg: '#1e293b',
  passengerAisle: '#60a5fa',
  passengerStowing: '#fb923c',
  rowLabel: '#475569',
};

/** X pixel offset of the start of group g (left edge of first seat in that group). */
function groupOffsetX(groups: number[], g: number): number {
  return PAD + groupStartCol(groups, g) * CELL + g * AISLE;
}

/** Center X of a seat column. */
function seatCenterX(col: number, groups: number[]): number {
  let cumCols = 0;
  for (let g = 0; g < groups.length; g++) {
    if (col < cumCols + groups[g]) {
      const colInGroup = col - cumCols;
      return groupOffsetX(groups, g) + colInGroup * CELL + CELL / 2;
    }
    cumCols += groups[g];
  }
  return PAD + col * CELL + CELL / 2;
}

/** Center X of aisle i (the aisle between group i and group i+1). */
function aisleCenterX(aisleIdx: number, groups: number[]): number {
  // Aisle starts right after group aisleIdx ends
  return groupOffsetX(groups, aisleIdx) + groups[aisleIdx] * CELL + AISLE / 2;
}

function rowCenterY(row: number): number {
  return PAD + row * CELL + CELL / 2;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function canvasDimensions(rows: number, groups: number[]) {
  const numAisles = Math.max(0, groups.length - 1);
  const w = PAD * 2 + totalCols(groups) * CELL + numAisles * AISLE;
  const h = PAD * 2 + rows * CELL;
  return { w, h };
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  snapshot: SimSnapshot,
): void {
  const { passengers, config } = snapshot;
  const { rows, seatGroups } = config;
  const numAisles = Math.max(0, seatGroups.length - 1);
  const { w, h } = canvasDimensions(rows, seatGroups);

  // Background
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, w, h);

  // Draw aisle backgrounds and entry arrows
  for (let ai = 0; ai < numAisles; ai++) {
    const ax = groupOffsetX(seatGroups, ai) + seatGroups[ai] * CELL;
    ctx.fillStyle = COLOR.aisleBg;
    ctx.fillRect(ax, PAD, AISLE, rows * CELL);

    ctx.fillStyle = '#334155';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('▼', aisleCenterX(ai, seatGroups), PAD - 6);
  }

  // Draw all seats (empty)
  const cols = totalCols(seatGroups);
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cx = seatCenterX(col, seatGroups);
      const cy = rowCenterY(row);
      ctx.fillStyle = COLOR.seatEmpty;
      roundRect(ctx, cx - CELL / 2 + 2, cy - CELL / 2 + 2, CELL - 4, CELL - 4, SEAT_CORNER);
      ctx.fill();
    }
  }

  // Draw seated passengers over their seats
  for (const p of passengers) {
    if (p.state === 'seated') {
      const cx = seatCenterX(p.seat.col, seatGroups);
      const cy = rowCenterY(p.seat.row);
      ctx.fillStyle = COLOR.seatOccupied;
      roundRect(ctx, cx - CELL / 2 + 2, cy - CELL / 2 + 2, CELL - 4, CELL - 4, SEAT_CORNER);
      ctx.fill();
    }
  }

  // Row labels
  ctx.fillStyle = COLOR.rowLabel;
  ctx.font = '8px sans-serif';
  ctx.textAlign = 'right';
  for (let row = 0; row < rows; row++) {
    ctx.fillText(String(row + 1), PAD - 4, rowCenterY(row) + 3);
  }

  // Draw passengers in the aisle (aisle + stowing states)
  for (const p of passengers) {
    if (p.state === 'aisle' || p.state === 'stowing') {
      const cx = aisleCenterX(p.aisleIndex, seatGroups);
      const cy = rowCenterY(p.aisleRow);
      ctx.fillStyle = p.state === 'stowing' ? COLOR.passengerStowing : COLOR.passengerAisle;
      ctx.beginPath();
      ctx.arc(cx, cy, PASSENGER_R, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
