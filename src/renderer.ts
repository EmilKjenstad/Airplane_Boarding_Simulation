import type { SimSnapshot } from './simulation/types';

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

export function canvasDimensions(rows: number, seatsPerSide: number) {
  const w = PAD * 2 + seatsPerSide * 2 * CELL + AISLE;
  const h = PAD * 2 + rows * CELL;
  return { w, h };
}

function seatCenterX(col: number, seatsPerSide: number): number {
  if (col < seatsPerSide) {
    return PAD + col * CELL + CELL / 2;
  }
  return PAD + seatsPerSide * CELL + AISLE + (col - seatsPerSide) * CELL + CELL / 2;
}

function rowCenterY(row: number): number {
  return PAD + row * CELL + CELL / 2;
}

function aisleCenterX(seatsPerSide: number): number {
  return PAD + seatsPerSide * CELL + AISLE / 2;
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

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  snapshot: SimSnapshot,
): void {
  const { passengers, config } = snapshot;
  const { rows, seatsPerSide } = config;
  const { w, h } = canvasDimensions(rows, seatsPerSide);

  // Background
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, w, h);

  // Aisle background
  ctx.fillStyle = COLOR.aisleBg;
  ctx.fillRect(PAD + seatsPerSide * CELL, PAD, AISLE, rows * CELL);

  // Entry arrow at top of aisle
  ctx.fillStyle = '#334155';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▼', aisleCenterX(seatsPerSide), PAD - 6);

  // Draw all seats (empty)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < seatsPerSide * 2; col++) {
      const cx = seatCenterX(col, seatsPerSide);
      const cy = rowCenterY(row);
      ctx.fillStyle = COLOR.seatEmpty;
      roundRect(ctx, cx - CELL / 2 + 2, cy - CELL / 2 + 2, CELL - 4, CELL - 4, SEAT_CORNER);
      ctx.fill();
    }
  }

  // Draw seated passengers (override seat color)
  for (const p of passengers) {
    if (p.state === 'seated') {
      const cx = seatCenterX(p.seat.col, seatsPerSide);
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
      const cx = aisleCenterX(seatsPerSide);
      const cy = rowCenterY(p.aisleRow);
      ctx.fillStyle = p.state === 'stowing' ? COLOR.passengerStowing : COLOR.passengerAisle;
      ctx.beginPath();
      ctx.arc(cx, cy, PASSENGER_R, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
