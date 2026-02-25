import type { Theme } from '../hooks/useTheme';
import type { GainParams } from '../types';

interface Props {
  params: GainParams;
  theme: Theme;
}

export function NetworkDiagram({ params, theme }: Props) {
  const isDark = theme === 'dark';
  const { g11, g22, g12, g21 } = params;

  const maxGain = Math.max(g11, g22, g12, g21, 0.1);
  const scaleWidth = (g: number) => Math.max(1, (g / maxGain) * 4);

  const textColor = isDark ? '#e2e8f0' : '#1e293b';
  const mutedColor = isDark ? '#94a3b8' : '#64748b';
  const directColor = '#4ade80';
  const crossColor = '#f87171';

  // Positions
  const tx1 = { x: 60, y: 40 };
  const tx2 = { x: 60, y: 120 };
  const rx1 = { x: 340, y: 40 };
  const rx2 = { x: 340, y: 120 };

  return (
    <svg viewBox="0 0 400 160" className="w-full h-full" style={{ maxHeight: '160px' }}>
      {/* Direct links (solid) */}
      <line x1={tx1.x + 20} y1={tx1.y} x2={rx1.x - 20} y2={rx1.y}
        stroke={directColor} strokeWidth={scaleWidth(g11)} strokeOpacity={0.8} />
      <line x1={tx2.x + 20} y1={tx2.y} x2={rx2.x - 20} y2={rx2.y}
        stroke={directColor} strokeWidth={scaleWidth(g22)} strokeOpacity={0.8} />

      {/* Cross links (dashed) */}
      <line x1={tx2.x + 20} y1={tx2.y} x2={rx1.x - 20} y2={rx1.y}
        stroke={crossColor} strokeWidth={scaleWidth(g21)} strokeOpacity={0.6}
        strokeDasharray="6,4" />
      <line x1={tx1.x + 20} y1={tx1.y} x2={rx2.x - 20} y2={rx2.y}
        stroke={crossColor} strokeWidth={scaleWidth(g12)} strokeOpacity={0.6}
        strokeDasharray="6,4" />

      {/* Gain labels */}
      <text x={200} y={32} textAnchor="middle" fill={directColor} fontSize="11" fontWeight="bold">
        g₁₁={g11.toFixed(1)}
      </text>
      <text x={200} y={132} textAnchor="middle" fill={directColor} fontSize="11" fontWeight="bold">
        g₂₂={g22.toFixed(1)}
      </text>
      <text x={155} y={62} textAnchor="middle" fill={crossColor} fontSize="10">
        g₂₁={g21.toFixed(2)}
      </text>
      <text x={245} y={102} textAnchor="middle" fill={crossColor} fontSize="10">
        g₁₂={g12.toFixed(2)}
      </text>

      {/* Tx nodes */}
      <circle cx={tx1.x} cy={tx1.y} r="18" fill={isDark ? '#1e293b' : '#f1f5f9'}
        stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
      <text x={tx1.x} y={tx1.y + 4} textAnchor="middle" fill={textColor} fontSize="11" fontWeight="bold">
        Tx₁
      </text>

      <circle cx={tx2.x} cy={tx2.y} r="18" fill={isDark ? '#1e293b' : '#f1f5f9'}
        stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
      <text x={tx2.x} y={tx2.y + 4} textAnchor="middle" fill={textColor} fontSize="11" fontWeight="bold">
        Tx₂
      </text>

      {/* Rx nodes */}
      <circle cx={rx1.x} cy={rx1.y} r="18" fill={isDark ? '#1e293b' : '#f1f5f9'}
        stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
      <text x={rx1.x} y={rx1.y + 4} textAnchor="middle" fill={textColor} fontSize="11" fontWeight="bold">
        Rx₁
      </text>

      <circle cx={rx2.x} cy={rx2.y} r="18" fill={isDark ? '#1e293b' : '#f1f5f9'}
        stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
      <text x={rx2.x} y={rx2.y + 4} textAnchor="middle" fill={textColor} fontSize="11" fontWeight="bold">
        Rx₂
      </text>

      {/* Legend */}
      <line x1={10} y1={155} x2={30} y2={155} stroke={directColor} strokeWidth="2" />
      <text x={34} y={158} fill={mutedColor} fontSize="9">Direct</text>
      <line x1={80} y1={155} x2={100} y2={155} stroke={crossColor} strokeWidth="2" strokeDasharray="4,3" />
      <text x={104} y={158} fill={mutedColor} fontSize="9">Cross (interference)</text>
    </svg>
  );
}
