import { useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import type { Theme } from '../hooks/useTheme';

interface Props {
  theme: Theme;
}

export function EquationsPanel({ theme }: Props) {
  const [expanded, setExpanded] = useState(false);
  const isDark = theme === 'dark';

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider cursor-pointer ${
          isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-600'
        }`}
      >
        <svg
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
        Key Equations
      </button>

      {expanded && (
        <div className={`mt-3 space-y-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <div>
            <p className="mb-1 font-medium">SINR Constraints:</p>
            <BlockMath math="\text{SINR}_1 = \frac{P_1 g_{11}}{P_2 g_{21} + N_1} \geq \theta, \quad \text{SINR}_2 = \frac{P_2 g_{22}}{P_1 g_{12} + N_2} \geq \theta" />
          </div>

          <div>
            <p className="mb-1 font-medium">Rearranged as linear constraints:</p>
            <BlockMath math="P_1 \geq a P_2 + b, \quad P_2 \geq c P_1 + d" />
            <p className="mt-1 text-xs">
              where <InlineMath math="a = \theta g_{21}/g_{11}" />, <InlineMath math="b = \theta N_1/g_{11}" />,{' '}
              <InlineMath math="c = \theta g_{12}/g_{22}" />, <InlineMath math="d = \theta N_2/g_{22}" />
            </p>
          </div>

          <div>
            <p className="mb-1 font-medium">Feasibility condition:</p>
            <BlockMath math="\rho(\mathbf{F}) = \sqrt{ac} < 1 \quad \Leftrightarrow \quad ac < 1" />
          </div>

          <div>
            <p className="mb-1 font-medium">Minimum power (intersection point):</p>
            <BlockMath math="P_1^* = \frac{ad + b}{1 - ac}, \quad P_2^* = \frac{cb + d}{1 - ac}" />
          </div>

          <div>
            <p className="mb-1 font-medium">Foschini-Miljanic iteration:</p>
            <BlockMath math="P_1(t+1) = a \cdot P_2(t) + b, \quad P_2(t+1) = c \cdot P_1(t) + d" />
            <p className="mt-1 text-xs">
              Converges to <InlineMath math="(P_1^*, P_2^*)" /> when feasible (<InlineMath math="ac < 1" />), diverges otherwise.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
