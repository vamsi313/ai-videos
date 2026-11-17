export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const smooth = (u: number) => {
  const c = clamp(u, 0, 1);
  return c * c * (3 - 2 * c);
};
export const easeOutBack = (u: number) => {
  const c1 = 1.70158, c3 = c1 + 1, x = clamp(u, 0, 1);
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export type Key = [number, number];

// Piecewise smoothstep keyframes: holds first/last value outside range.
export const kf = (t: number, keys: Key[]): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, smooth((t - t0) / (t1 - t0)));
  }
  return keys[keys.length - 1][1];
};

// Linear piecewise (no easing)
export const kfl = (t: number, keys: Key[]): number => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (t <= t1) return lerp(v0, v1, (t - t0) / (t1 - t0));
  }
  return keys[keys.length - 1][1];
};

export const pulse = (t: number, a: number, b: number, fade = 0.15) =>
  smooth((t - a) / fade) * (1 - smooth((t - b) / fade));

// Two-bone IK. Returns elbow/knee position. sign picks the bend side.
export const ik2 = (
  sx: number, sy: number, tx: number, ty: number, l1: number, l2: number, sign: number
): { ex: number; ey: number; hx: number; hy: number } => {
  let dx = tx - sx, dy = ty - sy;
  let d = Math.hypot(dx, dy);
  const maxD = l1 + l2 - 0.5;
  if (d > maxD) {
    dx *= maxD / d; dy *= maxD / d; d = maxD;
  }
  if (d < 1) d = 1;
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / d, uy = dy / d;
  const ex = sx + ux * a + sign * -uy * h;
  const ey = sy + uy * a + sign * ux * h;
  return { ex, ey, hx: sx + dx, hy: sy + dy };
};
