import React from 'react';
import {ik2, lerp} from './anim';

export type Hand = {x: number; y: number; bend: number; behind?: boolean; finger?: boolean};

export type Pose = {
  x: number; y: number; scale: number; facing: 1 | -1;
  walkPhase: number; walkAmt: number;
  crouch: number; lean: number; bob: number; squash: number;
  headTilt: number; headTurn: number; look: [number, number];
  blink: number; eyeWide: number; eyesHappy: number;
  brow: number; browRaise: number;
  smile: number; mouthOpen: number; mouthWide: number;
  sugar: number; sparkle: number;
  armL: Hand; armR: Hand;
  spoon: {on: boolean; angle: number; loaded: boolean};
  opacity: number;
};

type Cfg = {
  kind: 'johnny' | 'papa';
  hipY: number; hipW: number; thigh: number; shin: number; stride: number; lift: number;
  shoulderY: number; shoulderX: number; upper: number; fore: number;
  torsoW: number; torsoTop: number; torsoBot: number;
  headCy: number; headRx: number; headRy: number; neckY: number;
  armW: number; legW: number; hand: number;
  skin: string; shirt: string; pants: string; shoe: string; hair: string;
};

const OUT = '#3b2418';

export const JOHNNY: Cfg = {
  kind: 'johnny', hipY: -108, hipW: 24, thigh: 56, shin: 56, stride: 55, lift: 24,
  shoulderY: -206, shoulderX: 44, upper: 62, fore: 62,
  torsoW: 52, torsoTop: -222, torsoBot: -112,
  headCy: -296, headRx: 98, headRy: 92, neckY: -214,
  armW: 24, legW: 24, hand: 14,
  skin: '#FFD3A8', shirt: '#FFD93B', pants: '#2F7BE0', shoe: '#E5493A', hair: '#6B3F1D',
};

export const PAPA: Cfg = {
  kind: 'papa', hipY: -236, hipW: 32, thigh: 119, shin: 119, stride: 70, lift: 34,
  shoulderY: -398, shoulderX: 74, upper: 105, fore: 105,
  torsoW: 82, torsoTop: -424, torsoBot: -232,
  headCy: -476, headRx: 64, headRy: 70, neckY: -414,
  armW: 30, legW: 40, hand: 17,
  skin: '#F1B88A', shirt: '#3DA35D', pants: '#8B5A2B', shoe: '#4A2C17', hair: '#3A2314',
};

const Limb: React.FC<{pts: [number, number][]; w: number; color: string; outline?: boolean}> = ({pts, w, color, outline = true}) => {
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <>
      {outline && <path d={d} stroke={OUT} strokeWidth={w + 7} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
      <path d={d} stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  );
};

const mix = (a: [number, number], b: [number, number], u: number): [number, number] => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

const Arm: React.FC<{cfg: Cfg; side: 1 | -1; hand: Hand; pose: Pose; withSpoon?: boolean}> = ({cfg, side, hand, pose, withSpoon}) => {
  const sx = side * cfg.shoulderX, sy = cfg.shoulderY;
  const sign = hand.bend * (side === 1 ? -1 : 1);
  const r = ik2(sx, sy, hand.x, hand.y, cfg.upper, cfg.fore, sign);
  const S: [number, number] = [sx, sy], E: [number, number] = [r.ex, r.ey], H: [number, number] = [r.hx, r.hy];
  const sleeveEnd = cfg.kind === 'johnny' ? mix(S, E, 0.5) : mix(S, E, 0.92);
  const fAng = Math.atan2(H[1] - E[1], H[0] - E[0]);
  return (
    <g>
      <Limb pts={[S, E, H]} w={cfg.armW} color={cfg.skin} />
      <Limb pts={[S, sleeveEnd]} w={cfg.armW + 9} color={cfg.shirt} />
      {hand.finger && (
        <ellipse cx={H[0] + Math.cos(fAng) * cfg.hand * 1.3} cy={H[1] + Math.sin(fAng) * cfg.hand * 1.3}
          rx={cfg.hand * 0.55} ry={cfg.hand * 0.4} fill={cfg.skin} stroke={OUT} strokeWidth={3}
          transform={`rotate(${(fAng * 180) / Math.PI} ${H[0] + Math.cos(fAng) * cfg.hand * 1.3} ${H[1] + Math.sin(fAng) * cfg.hand * 1.3})`} />
      )}
      {withSpoon && pose.spoon.on && (
        <g transform={`translate(${H[0]} ${H[1]}) rotate(${pose.spoon.angle})`}>
          <rect x={-3.5} y={-60} width={7} height={70} rx={3.5} fill="#C9CED6" stroke={OUT} strokeWidth={2.5} />
          <ellipse cx={0} cy={-68} rx={13} ry={17} fill="#DDE2E8" stroke={OUT} strokeWidth={2.5} />
          {pose.spoon.loaded && (
            <>
              <ellipse cx={0} cy={-74} rx={11} ry={11} fill="#FFFFFF" stroke="#B9CDE6" strokeWidth={1.5} />
              <circle cx={-4} cy={-78} r={2} fill="#B9CDE6" />
              <circle cx={4} cy={-72} r={1.6} fill="#B9CDE6" />
            </>
          )}
        </g>
      )}
      <circle cx={H[0]} cy={H[1]} r={cfg.hand} fill={cfg.skin} stroke={OUT} strokeWidth={3} />
      {withSpoon && !pose.spoon.on && pose.spoon.loaded &&
        [[-9, -12], [4, -17], [14, -6], [-14, 2], [8, 10], [-2, -4]].map(([a, b], i) => (
          <circle key={i} cx={H[0] + a} cy={H[1] + b} r={4 - (i % 2)} fill="#fff" stroke="#B9CDE6" strokeWidth={1.2} />
        ))}
      {cfg.kind === 'papa' && <circle cx={H[0] + 7} cy={H[1] - 6} r={6} fill={cfg.skin} />}
    </g>
  );
};

const SUGAR: [number, number][] = [
  [-1.08, -0.15], [-0.85, -0.6], [-0.55, -0.78], [-0.2, -0.86], [0.12, -0.8], [0.45, -0.85], [0.75, -0.62], [1.05, -0.25],
  [1.12, 0.3], [0.85, 0.85], [0.5, 1.1], [0.12, 1.15], [-0.3, 1.1], [-0.68, 0.9], [-1.02, 0.42], [0.3, -1.1], [-0.4, -1.12],
];

const Face: React.FC<{cfg: Cfg; pose: Pose}> = ({cfg, pose}) => {
  const j = cfg.kind === 'johnny';
  const rx = cfg.headRx, ry = cfg.headRy;
  const eyeX = j ? 36 : 25, eyeY = j ? -2 : -10;
  const eRx = j ? 22 : 11.5, eRy = (j ? 27 : 14.5) * pose.eyeWide;
  const pupil = j ? 14 : 7.5;
  const turnX = pose.headTurn * rx * 0.28;
  const sy = 1 - pose.blink * 0.93;
  const mx = 0, my = j ? 48 : 36;
  const mw = (j ? 26 : 25) * pose.mouthWide, mh = j ? 22 : 21;
  const corner = -pose.smile * mh * 0.45;
  const topC = corner + pose.smile * mh * 1.1 + 1;
  const open = pose.mouthOpen;
  const H = open * mh * 1.9;
  const botC = topC + H * 2;
  const mouthD = `M ${-mw} ${corner} Q 0 ${topC} ${mw} ${corner} Q 0 ${botC} ${-mw} ${corner} Z`;
  const topMid = corner + (topC - corner) / 2;
  const botMid = corner + (botC - corner) / 2;
  const openH = botMid - topMid;
  const clipId = `mouth-${cfg.kind}`;
  const gs = j ? 1 : 0.75;
  return (
    <g>
      {/* ears */}
      <circle cx={-rx + 4} cy={j ? 8 : 4} r={j ? 18 : 12} fill={cfg.skin} stroke={OUT} strokeWidth={3.5} />
      <circle cx={rx - 4} cy={j ? 8 : 4} r={j ? 18 : 12} fill={cfg.skin} stroke={OUT} strokeWidth={3.5} />
      {/* hair back */}
      {j ? <ellipse cx={0} cy={-10} rx={rx + 5} ry={ry + 3} fill={cfg.hair} stroke={OUT} strokeWidth={3.5} /> : null}
      {/* face */}
      <ellipse cx={0} cy={j ? 8 : 4} rx={rx - 2} ry={ry - (j ? 4 : 2)} fill={cfg.skin} stroke={OUT} strokeWidth={4} />
      <g transform={`translate(${turnX} 0) scale(${1 - Math.abs(pose.headTurn) * 0.08} 1)`}>
        {/* cheeks */}
        <ellipse cx={-eyeX * 1.75} cy={my - 14} rx={j ? 17 : 11} ry={j ? 11 : 7} fill="#FF8FA3" opacity={0.55} />
        <ellipse cx={eyeX * 1.75} cy={my - 14} rx={j ? 17 : 11} ry={j ? 11 : 7} fill="#FF8FA3" opacity={0.55} />
        {/* eyes */}
        {[-1, 1].map((sg) => (
          <g key={sg} transform={`translate(${sg * eyeX + turnX * 0.35} ${eyeY})`}>
            <g opacity={1 - pose.eyesHappy} transform={`scale(1 ${Math.max(0.07, sy)})`}>
              <ellipse rx={eRx} ry={eRy} fill="#fff" stroke={OUT} strokeWidth={3.5} />
              <circle cx={pose.look[0] * (eRx - pupil * 0.8) + pose.headTurn * 3} cy={pose.look[1] * (eRy - pupil) * 0.8} r={pupil}
                fill={j ? '#5a3417' : '#3d2616'} />
              <circle cx={pose.look[0] * (eRx - pupil * 0.8) + pose.headTurn * 3} cy={pose.look[1] * (eRy - pupil) * 0.8} r={pupil * 0.5} fill="#1a0f08" />
              <circle cx={pose.look[0] * (eRx - pupil * 0.8) + pupil * 0.38} cy={pose.look[1] * (eRy - pupil) * 0.8 - pupil * 0.4} r={pupil * 0.33} fill="#fff" />
            </g>
            <path d={`M ${-eRx} 4 Q 0 ${-eRx * 1.25} ${eRx} 4`} stroke={OUT} strokeWidth={5.5} fill="none" strokeLinecap="round"
              opacity={pose.eyesHappy} />
            {pose.blink > 0.6 && pose.eyesHappy < 0.5 && (
              <line x1={-eRx} x2={eRx} y1={0} y2={0} stroke={OUT} strokeWidth={4.5} strokeLinecap="round" />
            )}
            {/* brow */}
            <g transform={`translate(0 ${-eRy - (j ? 15 : 11) - pose.browRaise}) rotate(${sg * pose.brow * 16})`}>
              <line x1={-eRx * 0.95} x2={eRx * 0.95} y1={0} y2={0} stroke={cfg.kind === 'johnny' ? '#4a2a12' : '#2a170c'}
                strokeWidth={j ? 6 : 7} strokeLinecap="round" />
            </g>
          </g>
        ))}
        {/* nose */}
        {j ? (
          <ellipse cx={turnX * 0.4} cy={22} rx={6} ry={5} fill="#F4A87F" stroke={OUT} strokeWidth={2.5} />
        ) : (
          <ellipse cx={turnX * 0.5} cy={10} rx={10} ry={8} fill="#E8A074" stroke={OUT} strokeWidth={3} />
        )}
        {/* mouth */}
        <g transform={`translate(${mx} ${my})`}>
          <defs><clipPath id={clipId}><path d={mouthD} /></clipPath></defs>
          {open > 0.04 && (
            <>
              <path d={mouthD} fill="#8c2b3a" />
              <g clipPath={`url(#${clipId})`}>
                {open > 0.18 && <rect x={-mw} y={topMid - 2} width={mw * 2} height={Math.min(10 * gs, openH * 0.5)} fill="#fff" />}
                {open > 0.3 && <ellipse cx={0} cy={botMid - 1} rx={mw * 0.55} ry={Math.max(2, openH * 0.38)} fill="#ff7b8d" />}
                {pose.sugar > 0.5 && open > 0.6 && (
                  <g>
                    <ellipse cx={-3} cy={botMid - openH * 0.2} rx={mw * 0.34} ry={openH * 0.14} fill="#fff" />
                    <circle cx={6} cy={botMid - openH * 0.3} r={3} fill="#fff" />
                  </g>
                )}
              </g>
            </>
          )}
          <path d={mouthD} fill="none" stroke="#6b2a1c" strokeWidth={4} strokeLinejoin="round" />
          {/* sugar on lips */}
          {pose.sugar > 0.02 && SUGAR.map(([ux, uy], i) => {
            const yy = uy > 0 ? botMid * 0.8 + uy * mh * 0.85 : corner + uy * mh * 0.85;
            const r = (2.4 + (i % 3) * 1.1) * pose.sugar * (j ? 1.15 : 0.9) * (1 + pose.sparkle * 0.35);
            return <circle key={i} cx={ux * mw * 1.05} cy={yy} r={r} fill="#fff" stroke="#B9CDE6" strokeWidth={1.1} />;
          })}
          {pose.sparkle > 0.01 && [[-1.1, -0.9], [0.9, -1.1], [1.15, 0.6], [-0.9, 1.15]].map(([ux, uy], i) => (
            <g key={'s' + i} transform={`translate(${ux * mw * 1.15} ${uy * mh * 1.3}) scale(${pose.sparkle * (0.8 + 0.4 * ((i * 7) % 3) / 2)}) rotate(${i * 20})`}>
              <path d="M0 -9 L2.2 -2.2 L9 0 L2.2 2.2 L0 9 L-2.2 2.2 L-9 0 L-2.2 -2.2 Z" fill="#FFF7B0" stroke="#F2B705" strokeWidth={1} />
            </g>
          ))}
        </g>
      </g>
      {/* hair front */}
      {j ? (
        <>
          <path d={`M ${-rx + 5} -26 Q ${-rx * 0.7} -${ry + 6} 0 -${ry + 2} Q ${rx * 0.7} -${ry + 6} ${rx - 5} -26 Q ${rx * 0.78} -62 ${rx * 0.55} -50 Q ${rx * 0.4} -76 ${rx * 0.15} -54 Q 0 -78 ${-rx * 0.2} -52 Q ${-rx * 0.45} -76 ${-rx * 0.58} -48 Q ${-rx * 0.8} -62 ${-rx + 5} -26 Z`}
            fill={cfg.hair} stroke={OUT} strokeWidth={3.5} strokeLinejoin="round" />
          <path d={`M -8 ${-ry - 2} Q -22 ${-ry - 34} 6 ${-ry - 30} Q 24 ${-ry - 28} 12 ${-ry - 12}`} stroke={OUT} strokeWidth={13} strokeLinecap="round" fill="none" />
          <path d={`M -8 ${-ry - 2} Q -22 ${-ry - 34} 6 ${-ry - 30} Q 24 ${-ry - 28} 12 ${-ry - 12}`} stroke={cfg.hair} strokeWidth={7} strokeLinecap="round" fill="none" />
        </>
      ) : (
        <path d={`M ${-rx + 2} -8 Q ${-rx - 4} -${ry + 4} -8 -${ry + 10} Q ${rx * 0.9} -${ry + 14} ${rx - 2} -8 Q ${rx - 10} -40 ${rx * 0.45} -46 Q ${rx * 0.1} -30 ${-rx * 0.35} -48 Q ${-rx * 0.8} -44 ${-rx + 2} -8 Z`}
          fill={cfg.hair} stroke={OUT} strokeWidth={3.5} strokeLinejoin="round" />
      )}
    </g>
  );
};

export const Character: React.FC<{cfg: Cfg; pose: Pose}> = ({cfg, pose}) => {
  const j = cfg.kind === 'johnny';
  const hipYc = cfg.hipY + pose.crouch;
  const hipXs = [-cfg.hipW, cfg.hipW];
  const legs = [0, 1].map((i) => {
    const phi = pose.walkPhase + i * Math.PI;
    const standX = hipXs[i] * 1.0 + (i === 0 ? -2 : 2);
    const wx = hipXs[i] + cfg.stride * Math.cos(phi);
    const wy = -cfg.lift * Math.max(0, -Math.sin(phi));
    const fx = lerp(standX, wx, pose.walkAmt);
    const fy = lerp(0, wy, pose.walkAmt);
    const r = ik2(hipXs[i], hipYc, fx, fy - 10, cfg.thigh, cfg.shin, -1);
    return {hip: [hipXs[i], hipYc] as [number, number], knee: [r.ex, r.ey] as [number, number], foot: [r.hx, r.hy + 10] as [number, number], lifted: -wy / cfg.lift * pose.walkAmt};
  });
  const bodyT = `translate(0 ${pose.bob}) rotate(${pose.lean} 0 ${hipYc}) translate(0 ${hipYc}) scale(1 ${1 + pose.squash}) translate(0 ${-hipYc})`;
  const neckY = cfg.neckY + pose.crouch * 0.6;
  const headT = `translate(0 ${neckY}) rotate(${pose.headTilt}) translate(0 ${cfg.headCy - cfg.neckY})`;
  const flip = `translate(${pose.x} ${pose.y}) scale(${pose.facing * pose.scale} ${pose.scale})`;
  const shoeRx = j ? 27 : 36, shoeRy = j ? 15 : 17;
  const backArms = [
    pose.armL.behind ? <Arm key="bl" cfg={cfg} side={-1} hand={pose.armL} pose={pose} /> : null,
    pose.armR.behind ? <Arm key="br" cfg={cfg} side={1} hand={pose.armR} pose={pose} withSpoon /> : null,
  ];
  const frontArms = [
    !pose.armL.behind ? <Arm key="fl" cfg={cfg} side={-1} hand={pose.armL} pose={pose} /> : null,
    !pose.armR.behind ? <Arm key="fr" cfg={cfg} side={1} hand={pose.armR} pose={pose} withSpoon /> : null,
  ];
  return (
    <g transform={flip} opacity={pose.opacity}>
      <ellipse cx={0} cy={4} rx={cfg.hipW * 2.7} ry={12} fill="#000" opacity={0.18} />
      {/* legs */}
      {legs.map((L, i) => (
        <g key={i}>
          <Limb pts={[L.hip, L.knee, L.foot]} w={cfg.legW} color={j ? cfg.skin : cfg.pants} />
          {j && <Limb pts={[L.hip, [lerp(L.hip[0], L.knee[0], 0.55), lerp(L.hip[1], L.knee[1], 0.55)]]} w={cfg.legW + 14} color={cfg.pants} />}
          {j && <Limb pts={[[lerp(L.knee[0], L.foot[0], 0.55), lerp(L.knee[1], L.foot[1], 0.55)], L.foot]} w={cfg.legW - 2} color="#fff" outline={false} />}
          <g transform={`translate(${L.foot[0] + (j ? 9 : 12)} ${L.foot[1] - shoeRy * 0.55}) rotate(${-L.lifted * 22})`}>
            <ellipse rx={shoeRx} ry={shoeRy} fill={cfg.shoe} stroke={OUT} strokeWidth={3.5} />
            <path d={`M ${-shoeRx * 0.8} ${shoeRy * 0.45} L ${shoeRx * 0.95} ${shoeRy * 0.45}`} stroke="#fff" strokeWidth={3} opacity={0.8} />
          </g>
        </g>
      ))}
      <g transform={bodyT}>
        {backArms}
        {/* pelvis */}
        <rect x={-cfg.torsoW + 2} y={hipYc - (j ? 24 : 26)} width={(cfg.torsoW - 2) * 2} height={j ? 46 : 40} rx={14} fill={cfg.pants} stroke={OUT} strokeWidth={4} />
        {/* torso */}
        <rect x={-cfg.torsoW} y={cfg.torsoTop} width={cfg.torsoW * 2} height={cfg.torsoBot - cfg.torsoTop + (j ? 0 : 0)} rx={j ? 30 : 34}
          fill={cfg.shirt} stroke={OUT} strokeWidth={4} />
        {j ? (
          <g>
            <path d={`M -34 ${cfg.torsoTop + 40} L 34 ${cfg.torsoTop + 40}`} stroke="#F2B705" strokeWidth={9} opacity={0.8} strokeLinecap="round" />
            <path d="M0 -176 L5 -164 L18 -163 L8 -154 L12 -141 L0 -148 L-12 -141 L-8 -154 L-18 -163 L-5 -164 Z" fill="#FF7A59" stroke={OUT} strokeWidth={2.5} />
            <rect x={-48} y={hipYc - 18} width={96} height={9} fill="#1F5FC0" opacity={0.7} rx={4} />
          </g>
        ) : (
          <g>
            <path d={`M -26 ${cfg.torsoTop} L 0 ${cfg.torsoTop + 46} L 26 ${cfg.torsoTop} Z`} fill={cfg.skin} stroke={OUT} strokeWidth={3} />
            <path d={`M -34 ${cfg.torsoTop - 2} L -2 ${cfg.torsoTop + 44} L -14 ${cfg.torsoTop + 50} L -44 ${cfg.torsoTop + 6} Z`} fill="#2E8B4B" stroke={OUT} strokeWidth={3} />
            <path d={`M 34 ${cfg.torsoTop - 2} L 2 ${cfg.torsoTop + 44} L 14 ${cfg.torsoTop + 50} L 44 ${cfg.torsoTop + 6} Z`} fill="#2E8B4B" stroke={OUT} strokeWidth={3} />
            {[-360, -330, -300].map((yy) => <circle key={yy} cx={0} cy={yy} r={4.5} fill="#E8F5E9" stroke={OUT} strokeWidth={2} />)}
            <rect x={-cfg.torsoW + 2} y={hipYc - 18} width={(cfg.torsoW - 2) * 2} height={14} fill="#3b2314" rx={4} />
            <rect x={-10} y={hipYc - 20} width={20} height={18} fill="#E0B341" stroke={OUT} strokeWidth={2.5} rx={3} />
          </g>
        )}
        {/* neck */}
        <rect x={-14} y={neckY - 6} width={28} height={22} fill={cfg.skin} stroke={OUT} strokeWidth={3} rx={6} />
        <g transform={headT}><Face cfg={cfg} pose={pose} /></g>
        {frontArms}
      </g>
    </g>
  );
};
