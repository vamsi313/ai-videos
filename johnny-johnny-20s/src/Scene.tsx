import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character, JOHNNY, PAPA, Hand, Pose} from './Character';
import {Kitchen} from './Kitchen';
import {clamp, easeOutBack, kf, lerp, pulse, smooth, Key} from './anim';
import lip from './lipsync.json';
import captions from './captions.json';
import choreo from './choreo.json';

const FONT = '"Comic Sans MS", "Trebuchet MS", "Segoe UI", sans-serif';
const OUTC = '#3b2418';

const basePose = (): Pose => ({
  x: 0, y: 900, scale: 1, facing: 1, walkPhase: 0, walkAmt: 0, crouch: 0, lean: 0, bob: 0, squash: 0,
  headTilt: 0, headTurn: 0, look: [0, 0], blink: 0, eyeWide: 1, eyesHappy: 0, brow: 0, browRaise: 0,
  smile: 0.5, mouthOpen: 0, mouthWide: 1, sugar: 0, sparkle: 0,
  armL: {x: -58, y: -120, bend: 1}, armR: {x: 58, y: -120, bend: 1},
  spoon: {on: false, angle: 0, loaded: false}, opacity: 1,
});

const blinkAt = (t: number, times: number[]) => {
  for (const b of times) {
    if (t >= b && t <= b + 0.16) return 1 - Math.abs((t - b) / 0.08 - 1);
  }
  return 0;
};

const blendHand = (a: Hand, b: Hand, w: number): Hand => ({
  x: lerp(a.x, b.x, w), y: lerp(a.y, b.y, w), bend: lerp(a.bend, b.bend, w),
  behind: w > 0.5 ? b.behind : a.behind, finger: w > 0.5 ? b.finger : a.finger,
});

const decaySin = (t: number, t0: number, dur: number, freq: number, decay = 3) => {
  const u = t - t0;
  if (u < 0 || u > dur) return 0;
  return Math.exp(-u * decay) * Math.sin(u * freq);
};

const J_SCALE = choreo.johnnyScale, P_SCALE = choreo.papaScale;
const jx = (t: number) => kf(t, choreo.johnnyX as Key[]);
const px = (t: number) => kf(t, choreo.papaX as Key[]);
const speed = (f: (t: number) => number, t: number) => Math.abs(f(t + 0.04) - f(t - 0.04)) / 0.08;

const johnnyPose = (t: number, frame: number): Pose => {
  const p = basePose();
  p.scale = J_SCALE; p.facing = 1; p.x = jx(t);
  const v = speed(jx, t);
  p.walkAmt = smooth(v / 40);
  p.walkPhase = (Math.PI * (p.x - choreo.johnnyX[0][1])) / (2 * choreo.johnnyStride * J_SCALE);
  const walkBob = -Math.abs(Math.sin(p.walkPhase)) * 6 * p.walkAmt;
  const sneak = kf(t, [[0, 1], [3.0, 1], [3.3, 0]]);
  p.crouch = 10 * sneak * (0.5 + 0.5 * p.walkAmt);
  p.lean = 9 * sneak * p.walkAmt + 4 * sneak * (1 - p.walkAmt);
  p.bob = walkBob + Math.sin(t * 3.1) * 1.2;
  p.squash = 0.01 * Math.sin(t * 2.8);

  // head orientation
  p.headTurn = kf(t, [
    [0, 0.6], [1.0, 0.6], [1.25, -0.9], [1.5, -0.9], [1.85, 0.8], [2.6, 0.5], [2.85, 0], [3.2, 0], [3.4, 0.55],
    [6.0, 0.55], [6.25, 1.0], [6.7, 0.4], [8.0, 0.8], [15.4, 0.8], [15.8, 0.3], [17.3, 0.5], [17.6, 0.2],
  ]);
  p.headTilt = kf(t, [[0, 4], [2.8, 4], [3.1, -6], [3.4, 0], [6.4, 2], [6.9, 9], [8.0, 7], [9.0, 2], [15.4, 2], [16.4, -9], [17.3, -9], [17.7, 0]]);
  p.headTilt += 9 * decaySin(t, 11.65, 1.1, 18, 2.2) + 11 * decaySin(t, 14.05, 1.1, 18, 1.6);
  p.bob += -5 * Math.abs(decaySin(t, 9.15, 1.0, 11, 3));
  p.look = [p.headTurn * 0.45, 0];
  const whistle = pulse(t, 6.75, 8.0, 0.2);
  p.look = [lerp(p.look[0], 0.35, whistle), lerp(p.look[1], -0.85, whistle)];
  const nerv = pulse(t, 15.0, 16.3, 0.2);
  p.look = [lerp(p.look[0], Math.sin(t * 9) * 0.8, nerv * 0.7), lerp(p.look[1], Math.cos(t * 7) * 0.4, nerv * 0.7)];
  const upLook = pulse(t, 16.3, 17.4, 0.15);
  p.look = [lerp(p.look[0], 0.6, upLook), lerp(p.look[1], -1, upLook)];
  const toCam = pulse(t, 2.9, 3.2, 0.12);
  p.look = [lerp(p.look[0], 0, toCam), lerp(p.look[1], 0.1, toCam)];
  p.blink = blinkAt(t, [0.9, 2.45, 4.35, 5.4, 7.0, 8.7, 10.7, 13.3, 15.55]);
  p.eyeWide = 1 + 0.35 * pulse(t, 6.05, 6.9, 0.1) + 0.15 * nerv + 0.2 * upLook;
  p.brow = kf(t, [[0, -0.6], [2.8, -0.6], [3.0, -0.8], [3.4, 0.1], [6.0, 0.1], [6.2, 0.7], [6.9, 0.9], [8.0, 0.9], [9.0, 0.4], [15.0, 0.9], [16.3, 0.9], [17.3, 0.2], [17.6, 0]]);
  p.browRaise = 12 * pulse(t, 6.05, 7.0, 0.1) + 6 * pulse(t, 15.0, 17.3, 0.2);
  p.smile = kf(t, [[0, 0.7], [2.9, 0.8], [3.1, 1], [3.5, 0.8], [6.0, 0.9], [6.15, -0.2], [6.7, 0.2], [7.0, 0.4], [9.0, 0.7], [15.0, 0.2], [16.0, -0.3], [16.35, 0.3], [17.4, 0.6], [17.7, 1]]);

  // chewing / whistling / reveal / laugh mouth
  let open = 0;
  for (const [a, b] of [[3.95, 4.5], [4.8, 5.4], [5.85, 6.1]]) if (t >= a && t <= b) open = 0.28 * Math.abs(Math.sin((t - a) * 15));
  open = Math.max(open, 0.45 * pulse(t, 6.1, 6.7, 0.08));
  const ooo = pulse(t, 6.75, 8.0, 0.15);
  open = Math.max(open, 0.22 * ooo);
  p.mouthWide = lerp(1, 0.5, ooo) * lerp(1, 0.75, pulse(t, 6.1, 6.7, 0.08));
  const reveal = pulse(t, 16.4, 17.45, 0.25);
  open = Math.max(open, reveal);
  p.mouthWide = lerp(p.mouthWide, 1.15, reveal);
  const laugh = pulse(t, 17.4, 19.5, 0.12);
  open = Math.max(open, laugh * (0.45 + 0.4 * Math.abs(Math.sin(t * 13))));
  const lipv = (lip.johnny as number[])[Math.min(frame, 599)] ?? 0;
  p.mouthOpen = clamp(Math.max(open, lipv * 0.95), 0, 1);
  if (lipv > 0.05 && !reveal && !laugh) p.mouthWide *= 1 - 0.22 * Math.abs(Math.sin(frame * 0.8));
  p.eyesHappy = laugh * 0.95;
  p.smile = lerp(p.smile, 1, laugh);
  p.sugar = kf(t, [[3.9, 0], [4.15, 0.7], [5.6, 1]]) * (1 + 0.25 * reveal);
  p.sparkle = pulse(t, 16.85, 18.6, 0.2) * (0.6 + 0.4 * Math.sin(t * 14));
  p.squash += 0.04 * laugh * Math.sin(t * 26);
  p.bob += -8 * laugh * Math.abs(Math.sin(t * 13));

  // arms
  const sw = Math.sin(p.walkPhase) * 14 * p.walkAmt;
  const xR = kf(t, [[0, 56], [2.6, 56], [2.9, 18], [3.15, 18], [3.5, 118], [3.62, 118], [3.95, 34], [4.35, 34], [4.65, 118], [4.78, 118], [5.1, 34], [5.45, 34], [5.75, 118], [5.85, 118], [6.05, 34], [6.4, 34], [6.75, -6], [20, -6]]);
  const yR = kf(t, [[0, -150], [2.6, -150], [2.9, -262], [3.15, -262], [3.5, -296], [3.62, -296], [3.95, -258], [4.35, -258], [4.65, -296], [4.78, -296], [5.1, -258], [5.45, -258], [5.75, -296], [5.85, -296], [6.05, -258], [6.4, -258], [6.75, -125], [20, -125]]);
  const bendR = kf(t, [[0, 1], [2.6, 1], [2.9, -1], [6.4, -1], [6.75, 1], [20, 1]]);
  const rest: Hand = {x: 56, y: -128, bend: 1};
  let aR: Hand = {x: xR + sw * (t < 2.9 ? 1 : 0), y: yR, bend: bendR, behind: t > 6.55};
  let aL: Hand = {x: -56 - sw, y: -146 + 4 * Math.abs(sw), bend: 1, behind: false};
  aL = blendHand(aL, {x: 6, y: -126, bend: 1, behind: true}, smooth((t - 6.2) / 0.4));
  aL = blendHand(aL, {x: -58, y: -130, bend: 1, behind: false}, pulse(t, 15.3, 16.4, 0.25) * 0.0 + smooth((t - 15.3) / 0.4) * (1 - smooth((t - 16.6) / 0.3)));
  aR = blendHand(aR, rest, smooth((t - 15.3) / 0.4) * (1 - smooth((t - 16.6) / 0.3)));
  // "No, Papa!" waving
  for (const [a, b] of [[11.5, 12.8], [13.95, 15.1]] as const) {
    const w = pulse(t, a, b, 0.2);
    const wag = Math.sin((t - a) * 17) * 20;
    aR = blendHand(aR, {x: 70 + wag, y: -236, bend: 1, behind: false}, w);
    if (a > 13) aL = blendHand(aL, {x: -70 - wag, y: -236, bend: 1, behind: false}, w);
  }
  // laughing: hands on belly
  const wl = pulse(t, 17.3, 19.9, 0.2);
  aR = blendHand(aR, {x: 30, y: -150 + Math.sin(t * 13) * 5, bend: 1, behind: false}, wl);
  aL = blendHand(aL, {x: -30, y: -150 + Math.sin(t * 13) * 5, bend: 1, behind: false}, wl);
  p.armR = aR; p.armL = aL;
  const carry = (t >= 3.55 && t < 4.4) || (t >= 4.7 && t < 5.5) || (t >= 5.8 && t < 6.4);
  p.spoon = {on: false, angle: 0, loaded: carry};
  return p;
};

const papaPose = (t: number, frame: number): Pose => {
  const p = basePose();
  p.scale = P_SCALE; p.facing = -1; p.x = px(t);
  p.smile = 0.7;
  const v = speed(px, t);
  p.walkAmt = smooth(v / 40);
  p.walkPhase = (Math.PI * (choreo.papaX[0][1] - p.x)) / (2 * choreo.papaStride * P_SCALE);
  p.opacity = smooth((t - 3.95) / 0.15);
  p.bob = -Math.abs(Math.sin(p.walkPhase)) * 7 * p.walkAmt + Math.sin(t * 2.6) * 1.2;
  p.squash = 0.006 * Math.sin(t * 2.4);
  p.armL = {x: -84, y: -205, bend: 1}; p.armR = {x: 84, y: -205, bend: 1};
  const sw = Math.sin(p.walkPhase) * 30 * p.walkAmt;
  p.armR = {...p.armR, x: 84 + sw * 0.4, y: -215 + Math.abs(sw) * 0.4};
  p.armL = {...p.armL, x: -84 - sw * 0.4, y: -215 + Math.abs(sw) * 0.4};

  const notice = pulse(t, 6.0, 6.75, 0.08);
  const stern = pulse(t, 6.75, 8.2, 0.2);
  const qs = [8.0, 10.35, 12.85];
  const isQ = qs.some((q) => t >= q - 0.1 && t <= q + 1.0);
  p.headTurn = kf(t, [[0, 0.5], [4.0, 0.6], [5.9, 0.6], [6.1, 0.9], [20, 0.7]]);
  p.headTilt = kf(t, [[0, 0], [6.0, 0], [6.3, -6], [7.0, 5], [8.0, 5], [9.0, 0], [15.0, 3], [16.5, 8], [17.3, 4], [17.6, -3]]);
  p.headTilt += 4 * decaySin(t, 10.35, 1.0, 12, 2) + 5 * decaySin(t, 12.85, 1.0, 12, 2);
  p.look = [0.75, 0.1];
  p.look = [lerp(p.look[0], 0.9, notice), lerp(p.look[1], 0.5, notice)];
  const upLook = pulse(t, 15.2, 17.3, 0.2);
  p.look = [lerp(p.look[0], 0.55, upLook), lerp(p.look[1], 0.9, upLook)];
  p.blink = blinkAt(t, [4.7, 5.5, 7.4, 9.3, 11.2, 13.5, 15.0, 17.1]);
  p.eyeWide = 1 + 0.45 * notice + 0.3 * pulse(t, 16.7, 17.45, 0.1);
  p.brow = kf(t, [[0, 0.1], [6.0, 0.1], [6.1, 0.8], [6.7, 0.3], [7.0, -0.35], [8.0, -0.35], [8.2, 0.4], [15.0, 0.4], [16.7, 0.8], [17.4, 0.8], [17.7, 0]]);
  p.browRaise = 14 * notice + 8 * (isQ ? 1 : 0) * smooth(1) + 8 * pulse(t, 16.6, 17.45, 0.1);
  p.smile = kf(t, [[0, 0.7], [6.0, 0.7], [6.1, 0], [6.8, 0.3], [8.0, 0.4], [15.0, 0.5], [16.5, 0.6], [17.4, 0.8], [17.7, 1]]);

  let open = 0.55 * pulse(t, 6.05, 6.7, 0.08);
  p.mouthWide = lerp(1, 0.6, notice);
  const laugh = pulse(t, 17.4, 19.6, 0.12);
  open = Math.max(open, laugh * (0.5 + 0.4 * Math.abs(Math.sin(t * 12 + 1))));
  const lipv = (lip.papa as number[])[Math.min(frame, 599)] ?? 0;
  p.mouthOpen = clamp(Math.max(open, lipv * 0.95), 0, 1);
  if (lipv > 0.05 && !laugh) p.mouthWide *= 1 - 0.22 * Math.abs(Math.sin(frame * 0.7 + 1));
  p.eyesHappy = laugh * 0.95;
  p.smile = lerp(p.smile, 1, laugh);
  p.bob += -7 * laugh * Math.abs(Math.sin(t * 12));
  p.squash += 0.025 * laugh * Math.sin(t * 24);

  // body lean
  p.lean = 3 * p.walkAmt + kf(t, [[0, 0], [10.2, 0], [10.5, 7], [11.2, 7], [11.6, 0], [12.7, 0], [13.0, 8], [13.8, 8], [14.2, 0], [15.1, 0], [15.9, 34], [17.3, 34], [17.8, 8], [19.0, 6]]);
  p.lean += 5 * laugh * Math.sin(t * 11);
  p.lean += -4 * notice;

  // arms
  let aR: Hand = p.armR, aL: Hand = p.armL;
  aR = blendHand(aR, {x: 118, y: -488, bend: -1, behind: false}, notice);
  aL = blendHand(aL, {x: -118, y: -488, bend: -1, behind: false}, notice);
  aR = blendHand(aR, {x: 112, y: -302, bend: 1}, stern * 0.0 + smooth((t - 6.75) / 0.35) * (1 - smooth((t - 7.95) / 0.3)));
  aL = blendHand(aL, {x: -112, y: -302, bend: 1}, smooth((t - 6.75) / 0.35) * (1 - smooth((t - 7.95) / 0.3)));
  // hand on hip stays for most of dialogue (left), gestures with right
  const hipL = smooth((t - 8.0) / 0.4) * (1 - smooth((t - 15.4) / 0.4));
  aL = blendHand(aL, {x: -112, y: -302, bend: 1}, hipL);
  const beck = pulse(t, 8.0, 9.0, 0.2);
  aR = blendHand(aR, {x: 150 + Math.sin((t - 8) * 12) * 18, y: -470 + Math.abs(Math.sin((t - 8) * 12)) * 14, bend: -1, finger: false}, beck);
  const pointE = pulse(t, 10.35, 11.5, 0.2);
  aR = blendHand(aR, {x: 190, y: -392, bend: -1, finger: true}, pointE);
  const wagL = pulse(t, 12.85, 13.9, 0.2);
  aR = blendHand(aR, {x: 168 + Math.sin((t - 12.85) * 15) * 14, y: -440, bend: -1, finger: true}, wagL);
  const openG = pulse(t, 15.1, 16.4, 0.25);
  aR = blendHand(aR, {x: 175, y: -340, bend: -1, finger: true}, openG);
  aL = blendHand(aL, {x: -100, y: -330, bend: 1}, openG * 0);
  const wl = pulse(t, 17.4, 19.9, 0.2);
  aR = blendHand(aR, {x: 46, y: -296 + Math.sin(t * 12) * 6, bend: 1, behind: false, finger: false}, wl);
  aL = blendHand(aL, {x: -46, y: -296 + Math.sin(t * 12) * 6, bend: 1, behind: false}, wl);
  p.armR = aR; p.armL = aL;
  return p;
};

const camShots: [number, number, number, number][] = [
  [0, 960, 540, 1.0], [2.4, 840, 560, 1.1], [3.2, 800, 590, 1.22], [4.0, 830, 590, 1.15], [5.4, 1080, 570, 1.12],
  [6.0, 990, 560, 1.28], [6.45, 1010, 500, 1.5], [6.8, 760, 600, 1.62], [7.7, 780, 590, 1.55], [8.0, 1000, 500, 1.45],
  [9.0, 1000, 500, 1.45], [9.15, 790, 570, 1.55], [10.2, 790, 570, 1.55], [10.35, 1010, 500, 1.5], [11.4, 1010, 500, 1.5],
  [11.65, 790, 570, 1.62], [12.7, 790, 570, 1.62], [12.85, 1010, 490, 1.55], [13.9, 1010, 490, 1.55], [14.05, 790, 570, 1.68],
  [14.95, 880, 540, 1.4], [15.1, 900, 520, 1.5], [16.2, 790, 600, 1.85], [16.85, 730, 590, 2.2], [17.5, 730, 590, 2.2],
  [18.0, 830, 560, 1.5], [19.0, 880, 540, 1.38], [20, 880, 540, 1.3],
];

const camAt = (t: number) => {
  const ch = (i: number): Key[] => camShots.map((s) => [s[0], s[i]] as Key);
  const z = kf(t, ch(3));
  let cx = kf(t, ch(1)) + Math.sin(t * 0.9) * 5;
  let cy = kf(t, ch(2)) + Math.sin(t * 0.7 + 1) * 3;
  cx = clamp(cx, 960 / z, 1920 - 960 / z);
  cy = clamp(cy, 540 / z, 1080 - 540 / z);
  return {cx, cy, z};
};

const Exclaim: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-17} y={-80} width={34} height={92} rx={14} fill="#FF3B30" stroke={OUTC} strokeWidth={6} />
    <circle cx={0} cy={36} r={17} fill="#FF3B30" stroke={OUTC} strokeWidth={6} />
    <rect x={-6} y={-68} width={7} height={46} rx={3.5} fill="#fff" opacity={0.6} />
  </g>
);

const Question: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <text x={0} y={0} textAnchor="middle" fontSize={96} fontWeight={900} fontFamily={FONT} fill="#FFB020" stroke={OUTC} strokeWidth={7} paintOrder="stroke">?</text>
  </g>
);

const Note: React.FC<{x: number; y: number; s: number; o: number; rot: number}> = ({x, y, s, o, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <ellipse cx={0} cy={0} rx={13} ry={10} fill="#7E57C2" stroke={OUTC} strokeWidth={4} transform="rotate(-20)" />
    <path d="M10 -3 L10 -44 Q 24 -36 30 -24" stroke={OUTC} strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M10 -3 L10 -44 Q 24 -36 30 -24" stroke="#7E57C2" strokeWidth={3} fill="none" strokeLinecap="round" />
  </g>
);

const Sweat: React.FC<{x: number; y: number; s: number; o: number}> = ({x, y, s, o}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <path d="M0 -26 Q 16 0 0 12 Q -16 0 0 -26 Z" fill="#7FD6FF" stroke={OUTC} strokeWidth={4} />
    <ellipse cx={-4} cy={-2} rx={3} ry={6} fill="#fff" opacity={0.8} />
  </g>
);

const Pop: React.FC<{x: number; y: number; t: number; t0: number; text: string; color: string; size?: number}> = ({x, y, t, t0, text, color, size = 62}) => {
  const u = t - t0;
  if (u < 0 || u > 1.9) return null;
  const s = easeOutBack(u / 0.25) * (1 - smooth((u - 1.5) / 0.4));
  return (
    <g transform={`translate(${x} ${y - Math.abs(Math.sin(u * 9)) * 10 * Math.min(1, u * 2)}) rotate(${Math.sin(u * 14) * 5}) scale(${s})`}>
      <text textAnchor="middle" fontSize={size} fontWeight={900} fontFamily={FONT} fill={color} stroke={OUTC} strokeWidth={9} paintOrder="stroke">{text}</text>
    </g>
  );
};

const Star: React.FC<{x: number; y: number; s: number; rot: number; fill: string; o?: number}> = ({x, y, s, rot, fill, o = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o}>
    <path d="M0 -20 L5 -6 L20 0 L5 6 L0 20 L-5 6 L-20 0 L-5 -6 Z" fill={fill} stroke={OUTC} strokeWidth={2.5} strokeLinejoin="round" />
  </g>
);

const Confetti: React.FC<{t: number}> = ({t}) => {
  const u = t - 19.0;
  if (u < 0) return null;
  const cols = ['#FF3B30', '#FFCC00', '#34C759', '#0A84FF', '#FF2D92', '#AF52DE', '#FF9500'];
  return (
    <g>
      {[...Array(46)].map((_, i) => {
        const ang = (i * 137.5 * Math.PI) / 180;
        const sp = 260 + ((i * 53) % 420);
        const x = 960 + Math.cos(ang) * sp * u * 1.3;
        const y = 470 + Math.sin(ang) * sp * u * 0.9 + 500 * u * u;
        const o = 1 - smooth((u - 0.7) / 0.3);
        if (i % 3 === 0) return <Star key={i} x={x} y={y} s={0.6 + (i % 4) * 0.2} rot={u * 300 + i * 20} fill={cols[i % cols.length]} o={o} />;
        return <rect key={i} x={x} y={y} width={16} height={9} rx={2} fill={cols[i % cols.length]} opacity={o} transform={`rotate(${u * 540 + i * 40} ${x} ${y})`} />;
      })}
    </g>
  );
};

export const JohnnyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const cam = camAt(t);
  const jp = johnnyPose(t, frame);
  const pp = papaPose(t, frame);
  const sugarLevel = kf(t, [[3.4, 24], [4.7, 18], [5.5, 14], [5.9, 12]]);

  const jHead = {x: jp.x, y: 900 - 296 * J_SCALE};
  const pHeadTopY = 900 - 560 * P_SCALE;
  const capt = (captions as {id: string; who: string; text: string; start: number; end: number}[]).find((c) => t >= c.start - 0.05 && t <= c.end + 0.2);
  const irisR = kf(t, [[0, 0], [0.9, 1300]]);

  const excU = (t - 6.05) / 0.35;
  const sweatFall = (t0: number) => ((t - t0) % 1.1) / 1.1;

  return (
    <AbsoluteFill style={{backgroundColor: '#FFC93C'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <clipPath id="iris"><circle cx={960} cy={540} r={irisR} /></clipPath>
          <radialGradient id="vig" cx="50%" cy="50%" r="75%">
            <stop offset="0.6" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#3a1a00" stopOpacity="0.35" />
          </radialGradient>
        </defs>
        <g clipPath={t < 0.95 ? 'url(#iris)' : undefined}>
          <g transform={`translate(960 540) scale(${cam.z}) translate(${-cam.cx} ${-cam.cy})`}>
            <Kitchen t={t} sugarLevel={sugarLevel} />
            <Character cfg={JOHNNY} pose={jp} />
            <Character cfg={PAPA} pose={pp} />
            {/* effects */}
            {excU > 0 && t < 7.2 && <Exclaim x={pp.x} y={pHeadTopY - 30 - Math.sin(Math.min(1, excU) * Math.PI) * 14} s={easeOutBack(excU) * (1 - smooth((t - 6.8) / 0.4)) * 0.9} />}
            {[[6.2, 8.0], [14.2, 15.7]].map(([a, b], i) => t > a && t < b && (
              <Sweat key={i} x={jHead.x + 82 + (i ? 4 : 0)} y={jHead.y - 55 + sweatFall(a) * 60} s={0.9} o={1 - sweatFall(a) * 0.6} />
            ))}
            {[0, 1, 2].map((i) => {
              const u = (t - 6.85 - i * 0.38) / 1.0;
              if (u < 0 || u > 1 || t > 8.2) return null;
              return <Note key={i} x={jHead.x + 50 + Math.sin(u * 6 + i) * 24} y={jHead.y + 10 - u * 140} s={0.8} o={1 - smooth((u - 0.7) / 0.3)} rot={Math.sin(u * 5) * 18} />;
            })}
            {[8.0, 10.35, 12.85].map((q, i) => {
              const u = (t - q) / 0.35;
              if (t < q || t > q + 1.1) return null;
              return <Question key={i} x={pp.x - 90} y={pHeadTopY + 10} s={easeOutBack(u) * (1 - smooth((t - q - 0.85) / 0.25)) * 0.8} rot={-12} />;
            })}
            <Pop x={pp.x + 150} y={pHeadTopY + 90} t={t} t0={17.5} text="HA HA HA!" color="#FFCC00" />
            <Pop x={jp.x + 20} y={jHead.y - 150} t={t} t0={17.7} text="HEE HEE!" color="#FF6FB5" size={54} />
            {/* sugar falling from Johnny's open mouth */}
            {t > 16.5 && t < 17.9 && [...Array(7)].map((_, i) => {
              const u = ((t - 16.55 - i * 0.08) % 0.8) / 0.8;
              return <circle key={i} cx={jHead.x + 8 + (i - 3) * 6} cy={jHead.y + 55 + u * 70} r={3.2} fill="#fff" stroke="#B9CDE6" strokeWidth={1} opacity={1 - u} />;
            })}
          </g>
          {/* reveal speed lines + flash */}
          {t > 16.78 && t < 17.3 && (
            <g opacity={pulse(t, 16.78, 17.3, 0.12) * 0.22}>
              {[...Array(28)].map((_, i) => (
                <polygon key={i} points="960,540 1000,-200 920,-200" fill="#fff" transform={`rotate(${i * (360 / 28)} 960 540)`} />
              ))}
            </g>
          )}
          <rect width={1920} height={1080} fill="#fff" opacity={pulse(t, 16.82, 16.95, 0.04) * 0.55} />
          <Confetti t={t} />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const u = t - 19.0 - i * 0.06;
            if (u < 0 || u > 0.9) return null;
            return <Star key={i} x={300 + i * 260} y={220 + ((i * 97) % 300)} s={easeOutBack(u / 0.25) * (1 - smooth((u - 0.5) / 0.4)) * 1.4} rot={u * 160} fill="#FFE55C" />;
          })}
          <rect width={1920} height={1080} fill="url(#vig)" />
          {/* captions */}
          {capt && (
            <g transform="translate(960 975)">
              <rect x={-330} y={-52} width={660} height={96} rx={48} fill="#fff" opacity={0.93} stroke={OUTC} strokeWidth={6} />
              <text textAnchor="middle" y={22} fontSize={64} fontWeight={900} fontFamily={FONT}
                fill={capt.who === 'papa' ? '#2E7D32' : '#E65100'}>{capt.text}</text>
            </g>
          )}
        </g>
      </svg>
      <Audio src={staticFile('audio/mix.wav')} />
    </AbsoluteFill>
  );
};
