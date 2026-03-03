const STOPS: [number, number, number, number][] = [
  [0, 0x4a, 0xde, 0x80], // green  — 0 ms
  [1, 0xfa, 0xcc, 0x15], // yellow — 1 ms
  [5, 0xfb, 0x92, 0x3c], // orange — 5 ms
  [16, 0xf8, 0x71, 0x71], // red   — 16 ms
];

const lerp = (a: number, b: number, t: number): number =>
  Math.round(a + (b - a) * t);

const toHex = (n: number): string => n.toString(16).padStart(2, '0');

export const getDurationColor = (ms: number): string => {
  if (ms <= STOPS[0][0]) {
    return `#${toHex(STOPS[0][1])}${toHex(STOPS[0][2])}${toHex(STOPS[0][3])}`;
  }

  for (let i = 1; i < STOPS.length; i++) {
    if (ms <= STOPS[i][0]) {
      const [prevMs, pr, pg, pb] = STOPS[i - 1];
      const [currMs, cr, cg, cb] = STOPS[i];
      const t = (ms - prevMs) / (currMs - prevMs);
      const r = toHex(lerp(pr, cr, t));
      const g = toHex(lerp(pg, cg, t));
      const b = toHex(lerp(pb, cb, t));
      return `#${r}${g}${b}`;
    }
  }

  const last = STOPS[STOPS.length - 1];
  return `#${toHex(last[1])}${toHex(last[2])}${toHex(last[3])}`;
};
