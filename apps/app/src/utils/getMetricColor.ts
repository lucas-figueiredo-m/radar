const STOPS: [number, number, number, number][] = [
  [0, 0xf8, 0x71, 0x71], // red    — ratio 0
  [0.33, 0xfb, 0x92, 0x3c], // orange — ratio 0.33
  [0.66, 0xfa, 0xcc, 0x15], // yellow — ratio 0.66
  [1, 0x4a, 0xde, 0x80], // green  — ratio 1
];

const lerp = (a: number, b: number, t: number): number =>
  Math.round(a + (b - a) * t);

const toHex = (n: number): string => n.toString(16).padStart(2, '0');

export const getMetricColor = (ratio: number): string => {
  const clamped = Math.max(0, Math.min(1, ratio));

  if (clamped <= STOPS[0][0]) {
    return `#${toHex(STOPS[0][1])}${toHex(STOPS[0][2])}${toHex(STOPS[0][3])}`;
  }

  for (let i = 1; i < STOPS.length; i++) {
    if (clamped <= STOPS[i][0]) {
      const [prevRatio, pr, pg, pb] = STOPS[i - 1];
      const [currRatio, cr, cg, cb] = STOPS[i];
      const t = (clamped - prevRatio) / (currRatio - prevRatio);
      const r = toHex(lerp(pr, cr, t));
      const g = toHex(lerp(pg, cg, t));
      const b = toHex(lerp(pb, cb, t));
      return `#${r}${g}${b}`;
    }
  }

  const last = STOPS[STOPS.length - 1];
  return `#${toHex(last[1])}${toHex(last[2])}${toHex(last[3])}`;
};
