import React from 'react';
import {kf, smooth} from './anim';

const OUT = '#3b2418';

export const Kitchen: React.FC<{t: number; sugarLevel: number}> = ({t, sugarLevel}) => {
  const doorU = smooth((t - 3.7) / 0.6);
  const doorW = 240 * (1 - 0.86 * doorU);
  const lampSwing = Math.sin(t * 1.7) * 3.5;
  const clouds = [0, 1, 2].map((i) => ((t * (10 + i * 4) + i * 150) % 520) - 120);
  const steam = [0, 1, 2, 3].map((i) => {
    const u = ((t * 0.7 + i * 0.25) % 1);
    return {x: 902 + Math.sin(u * 8 + i) * 8, y: 585 - u * 90, r: 8 + u * 16, o: 0.55 * (1 - u)};
  });
  const handAng = (t / 20) * 360 * 2;
  const sway = Math.sin(t * 1.3);
  const bird = kf(t, [[1.5, -60], [5.5, 560]]);
  const dust = [0, 1, 2, 3, 4, 5].map((i) => ({
    x: 300 + ((i * 197 + t * 14) % 520), y: 260 + ((i * 131 - t * 9 + 1000) % 360), o: 0.35 + 0.25 * Math.sin(t * 2 + i),
  }));
  return (
    <g>
      <defs>
        <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFEFC4" /><stop offset="1" stopColor="#FFD596" />
        </linearGradient>
        <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5CC8F5" /><stop offset="1" stopColor="#CDF1FF" />
        </linearGradient>
        <linearGradient id="hallG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#35457C" /><stop offset="1" stopColor="#6C7FC0" />
        </linearGradient>
        <pattern id="dots" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="4" fill="#FFC77A" opacity="0.55" />
          <circle cx="45" cy="45" r="4" fill="#FFC77A" opacity="0.55" />
          <path d="M45 10 l4 8 l-8 0 z" fill="#FFB35C" opacity="0.4" />
        </pattern>
        <pattern id="tiles" width="120" height="70" patternUnits="userSpaceOnUse">
          <rect width="120" height="70" fill="#F6E4C4" />
          <rect width="60" height="35" fill="#E8C896" />
          <rect x="60" y="35" width="60" height="35" fill="#E8C896" />
        </pattern>
        <pattern id="check" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#FFF5F0" />
          <rect width="20" height="20" fill="#F0453A" />
          <rect x="20" y="20" width="20" height="20" fill="#F0453A" />
        </pattern>
        <clipPath id="winClip"><rect x="190" y="140" width="270" height="280" rx="6" /></clipPath>
      </defs>

      {/* wall */}
      <rect x={0} y={0} width={1920} height={850} fill="url(#wallG)" />
      <rect x={0} y={0} width={1920} height={850} fill="url(#dots)" />
      <rect x={0} y={690} width={1920} height={160} fill="#8FD6C5" />
      <rect x={0} y={684} width={1920} height={12} fill="#FFFFFF" stroke={OUT} strokeWidth={3} />
      {[...Array(24)].map((_, i) => <line key={i} x1={i * 85 + 20} x2={i * 85 + 20} y1={696} y2={850} stroke="#6DBFAC" strokeWidth={4} />)}
      {/* floor */}
      <rect x={0} y={850} width={1920} height={230} fill="url(#tiles)" />
      <rect x={0} y={850} width={1920} height={14} fill="#B9874F" />
      <rect x={0} y={864} width={1920} height={40} fill="#000" opacity={0.07} />
      {/* rug */}
      <ellipse cx={780} cy={960} rx={470} ry={62} fill="#FF8A8A" stroke={OUT} strokeWidth={4} opacity={0.95} />
      <ellipse cx={780} cy={960} rx={420} ry={48} fill="none" stroke="#fff" strokeWidth={5} strokeDasharray="14 12" />

      {/* window */}
      <g>
        <rect x={176} y={126} width={298} height={308} rx={12} fill="#fff" stroke={OUT} strokeWidth={6} />
        <g clipPath="url(#winClip)">
          <rect x={190} y={140} width={270} height={280} fill="url(#skyG)" />
          <g transform={`translate(325 230) rotate(${t * 8})`}>
            {[...Array(10)].map((_, i) => <polygon key={i} points="-6,-70 6,-70 0,-130" fill="#FFF3A0" opacity={0.5} transform={`rotate(${i * 36})`} />)}
          </g>
          <circle cx={400} cy={190} r={34} fill="#FFE44D" stroke="#F7B500" strokeWidth={4} />
          {clouds.map((cx, i) => (
            <g key={i} transform={`translate(${190 + cx} ${185 + i * 55})`} opacity={0.95}>
              <ellipse rx={42} ry={16} fill="#fff" /><ellipse cx={-20} cy={-10} rx={22} ry={16} fill="#fff" /><ellipse cx={14} cy={-14} rx={26} ry={18} fill="#fff" />
            </g>
          ))}
          <g transform={`translate(${190 + bird} ${220 + Math.sin(t * 5) * 6})`}>
            <path d={`M0 0 Q 8 ${-8 * Math.sin(t * 14)} 16 0 Q 24 ${-8 * Math.sin(t * 14)} 32 0`} stroke="#333" strokeWidth={3} fill="none" strokeLinecap="round" />
          </g>
          <path d="M190 360 Q 260 310 330 350 Q 400 310 460 350 L460 420 L190 420 Z" fill="#7BCB6C" />
          <g transform={`translate(250 360) rotate(${sway * 3} 0 0)`}>
            <rect x={-6} y={-60} width={12} height={60} fill="#8B5A2B" />
            <circle cy={-78} r={36} fill="#3FA34D" /><circle cx={-18} cy={-60} r={24} fill="#4DB85C" /><circle cx={20} cy={-62} r={24} fill="#4DB85C" />
          </g>
          <g transform={`translate(400 366) rotate(${-sway * 3} 0 0)`}>
            <rect x={-5} y={-48} width={10} height={48} fill="#8B5A2B" />
            <circle cy={-64} r={28} fill="#3FA34D" /><circle cx={-15} cy={-48} r={19} fill="#4DB85C" /><circle cx={16} cy={-50} r={19} fill="#4DB85C" />
          </g>
        </g>
        <line x1={325} x2={325} y1={140} y2={420} stroke="#fff" strokeWidth={8} />
        <line x1={190} x2={460} y1={280} y2={280} stroke="#fff" strokeWidth={8} />
        <rect x={168} y={430} width={314} height={22} rx={6} fill="#fff" stroke={OUT} strokeWidth={5} />
        {/* curtains */}
        <path d={`M176 120 L260 120 Q ${230 + sway * 6} 280 ${252 + sway * 8} 430 L176 430 Z`} fill="#FF6B6B" stroke={OUT} strokeWidth={4} />
        <path d={`M474 120 L390 120 Q ${420 - sway * 6} 280 ${398 - sway * 8} 430 L474 430 Z`} fill="#FF6B6B" stroke={OUT} strokeWidth={4} />
        <rect x={160} y={108} width={330} height={16} rx={8} fill="#8B5A2B" stroke={OUT} strokeWidth={4} />
        {/* plant on sill */}
        <g transform="translate(240 430)">
          <path d="M-22 0 L-16 -34 L16 -34 L22 0 Z" fill="#E56B3C" stroke={OUT} strokeWidth={4} />
          {[-1, 0, 1].map((k) => <ellipse key={k} cx={k * 14} cy={-58 - Math.abs(k) * -6} rx={9} ry={28} fill="#3FA34D" stroke={OUT} strokeWidth={3}
            transform={`rotate(${k * 24 + Math.sin(t * 1.6 + k) * 3} ${k * 14} -34)`} />)}
        </g>
      </g>

      {/* clock */}
      <g transform="translate(640 200)">
        <circle r={58} fill="#fff" stroke={OUT} strokeWidth={6} />
        <circle r={50} fill="#FFF8E1" stroke="#E5A94A" strokeWidth={3} />
        {[...Array(12)].map((_, i) => <line key={i} x1={0} x2={0} y1={-44} y2={-38} stroke={OUT} strokeWidth={3} transform={`rotate(${i * 30})`} />)}
        <line x1={0} y1={0} x2={0} y2={-26} stroke={OUT} strokeWidth={6} strokeLinecap="round" transform={`rotate(${handAng / 12 + 40})`} />
        <line x1={0} y1={0} x2={0} y2={-38} stroke={OUT} strokeWidth={4} strokeLinecap="round" transform={`rotate(${handAng})`} />
        <line x1={0} y1={0} x2={0} y2={-42} stroke="#E53935" strokeWidth={2.5} strokeLinecap="round" transform={`rotate(${handAng * 6})`} />
        <circle r={5} fill={OUT} />
      </g>

      {/* upper cabinets + counter */}
      <g>
        <rect x={800} y={90} width={620} height={230} rx={10} fill="#D9954B" stroke={OUT} strokeWidth={5} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={816 + i * 200} y={106} width={188} height={198} rx={8} fill="#E9AC62" stroke={OUT} strokeWidth={3.5} />
            <rect x={832 + i * 200} y={122} width={156} height={166} rx={6} fill="none" stroke="#C47F35" strokeWidth={3} />
            <circle cx={i % 2 ? 836 + i * 200 : 984 + i * 200} cy={290} r={7} fill="#FFE08A" stroke={OUT} strokeWidth={2.5} />
          </g>
        ))}
        <rect x={800} y={625} width={640} height={230} rx={8} fill="#C77D3B" stroke={OUT} strokeWidth={5} />
        <rect x={786} y={605} width={668} height={32} rx={8} fill="#8E5A2B" stroke={OUT} strokeWidth={5} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={818 + i * 205} y={652} width={190} height={180} rx={8} fill="#D88F48" stroke={OUT} strokeWidth={3.5} />
            <circle cx={994 + i * 205 - 20} cy={700} r={7} fill="#FFE08A" stroke={OUT} strokeWidth={2.5} />
          </g>
        ))}
        {/* kettle + steam */}
        <g transform="translate(902 604)">
          <path d="M-34 0 Q-40 -50 -10 -58 L10 -58 Q40 -50 34 0 Z" fill="#B8C4D6" stroke={OUT} strokeWidth={4} />
          <path d="M34 -24 Q70 -40 54 -62" stroke={OUT} strokeWidth={9} fill="none" strokeLinecap="round" />
          <path d="M34 -24 Q70 -40 54 -62" stroke="#B8C4D6" strokeWidth={4} fill="none" strokeLinecap="round" />
          <circle cy={-66} r={8} fill="#F0453A" stroke={OUT} strokeWidth={3} />
        </g>
        {steam.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />)}
        {/* fruit bowl */}
        <g transform="translate(1290 604)">
          <path d="M-60 -26 Q0 20 60 -26 Z" fill="#6AA0E8" stroke={OUT} strokeWidth={4} />
          <circle cx={-26} cy={-34} r={18} fill="#F0453A" stroke={OUT} strokeWidth={3.5} />
          <circle cx={6} cy={-40} r={18} fill="#FFB020" stroke={OUT} strokeWidth={3.5} />
          <circle cx={36} cy={-32} r={16} fill="#7BCB4C" stroke={OUT} strokeWidth={3.5} />
        </g>
      </g>

      {/* lamp */}
      <g transform={`translate(790 0) rotate(${lampSwing} 0 0)`}>
        <line x1={0} y1={0} x2={0} y2={250} stroke={OUT} strokeWidth={5} />
        <path d="M-58 320 Q-44 258 0 252 Q44 258 58 320 Z" fill="#FFCF4A" stroke={OUT} strokeWidth={5} />
        <ellipse cx={0} cy={322} rx={58} ry={9} fill="#FFF3B0" stroke={OUT} strokeWidth={4} />
        <ellipse cx={0} cy={560} rx={150} ry={28} fill="#FFF3B0" opacity={0.12} />
      </g>

      {/* door + hallway */}
      <g>
        <rect x={1488} y={206} width={264} height={650} rx={8} fill="#fff" stroke={OUT} strokeWidth={6} />
        <rect x={1500} y={220} width={240} height={636} fill="url(#hallG)" />
        <rect x={1500} y={760} width={240} height={96} fill="#2A3560" opacity={0.7} />
        <g transform={`translate(${1740 - doorW} 220)`}>
          <rect width={doorW} height={636} fill="#B5702F" stroke={OUT} strokeWidth={5} />
          {doorW > 60 && <>
            <rect x={20} y={30} width={doorW - 40} height={240} rx={6} fill="none" stroke="#8E5A2B" strokeWidth={4} />
            <rect x={20} y={320} width={doorW - 40} height={270} rx={6} fill="none" stroke="#8E5A2B" strokeWidth={4} />
            <circle cx={24} cy={330} r={9} fill="#FFE08A" stroke={OUT} strokeWidth={3} />
          </>}
        </g>
      </g>

      {/* table */}
      <g>
        <rect x={528} y={690} width={20} height={190} fill="#8E5A2B" stroke={OUT} strokeWidth={4} />
        <rect x={992} y={690} width={20} height={190} fill="#8E5A2B" stroke={OUT} strokeWidth={4} />
        <path d="M500 700 L1040 700 L1004 664 L536 664 Z" fill="#FFF5F0" stroke={OUT} strokeWidth={5} />
        <path d="M500 700 L1040 700 L1004 664 L536 664 Z" fill="url(#check)" opacity={0.95} />
        <path d="M500 700 L1040 700 L1040 806 Q 1000 826 960 806 Q 920 826 880 806 Q 840 826 800 806 Q 760 826 720 806 Q 680 826 640 806 Q 600 826 560 806 Q 530 820 500 806 Z"
          fill="url(#check)" stroke={OUT} strokeWidth={5} />
        <rect x={500} y={696} width={540} height={10} fill="#C42C22" stroke={OUT} strokeWidth={3} />
        {/* cup and plate */}
        <g transform="translate(920 690)">
          <ellipse cx={0} cy={0} rx={46} ry={9} fill="#fff" stroke={OUT} strokeWidth={3.5} />
          <circle cx={-14} cy={-12} r={13} fill="#F0453A" stroke={OUT} strokeWidth={3} />
          <circle cx={14} cy={-12} r={13} fill="#FFB020" stroke={OUT} strokeWidth={3} />
        </g>
        <g transform="translate(588 688)">
          <path d="M-20 0 L-18 -34 L18 -34 L20 0 Z" fill="#fff" stroke={OUT} strokeWidth={3.5} />
          <rect x={-18} y={-26} width={36} height={14} fill="#6AA0E8" />
          <ellipse cy={-34} rx={18} ry={5} fill="#7a4a2a" />
        </g>
        {/* sugar bowl */}
        <g transform="translate(760 0)">
          <ellipse cx={0} cy={692} rx={44} ry={9} fill="#000" opacity={0.15} />
          <path d="M-46 654 Q-50 690 -30 696 L30 696 Q50 690 46 654 Z" fill="#fff" stroke={OUT} strokeWidth={4.5} />
          <path d="M-47 668 Q0 678 47 668 L46 680 Q0 690 -46 680 Z" fill="#6AA0E8" opacity={0.9} />
          <ellipse cx={0} cy={654} rx={48} ry={11} fill="#fff" stroke={OUT} strokeWidth={4.5} />
          <ellipse cx={0} cy={655 - 5} rx={42} ry={8} fill="#F3F7FB" />
          <path d={`M-40 654 Q0 ${654 - sugarLevel * 1.9} 40 654 Z`} fill="#fff" stroke="#C5D6EA" strokeWidth={2} />
          {[[-16, -4], [8, -9], [20, -2], [-4, -2]].map(([a, b], i) => <circle key={i} cx={a} cy={650 + b} r={1.8} fill="#B9CDE6" />)}
          <g opacity={0.9 * (0.5 + 0.5 * Math.sin(t * 5))} transform={`translate(18 ${644 - sugarLevel * 0.5})`}>
            <path d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z" fill="#fff" stroke="#F2B705" strokeWidth={1} />
          </g>
        </g>
      </g>
      {/* dust motes in sun beam */}
      {dust.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={3} fill="#fff" opacity={d.o} />)}
    </g>
  );
};
