import type { Theme } from '../hooks/useTheme';
import type { DerivedParams, FeasibilityResult, SINRValues, PowerPoint } from '../types';

interface Props {
  theme: Theme;
  derived: DerivedParams;
  feasibility: FeasibilityResult;
  userPoint: PowerPoint;
  userSINR: SINRValues;
  theta: number;
}

export function StatsPanel({ theme, derived, feasibility, userPoint, userSINR, theta }: Props) {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Feasibility Badge */}
      <div className="flex items-center gap-2">
        <span className={`px-2 py-0.5 rounded font-semibold text-xs ${
          feasibility.feasible
            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
            : 'bg-red-500/20 text-red-400 border border-red-500/30'
        }`}>
          {feasibility.feasible ? 'FEASIBLE' : 'INFEASIBLE'}
        </span>
        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
          ρ(F) = {derived.rhoF.toFixed(4)}
        </span>
      </div>

      {/* Derived Parameters */}
      <div>
        <h4 className={`font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Derived
        </h4>
        <div className={`grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <span>a = {derived.a.toFixed(4)}</span>
          <span>b = {derived.b.toFixed(4)}</span>
          <span>c = {derived.c.toFixed(4)}</span>
          <span>d = {derived.d.toFixed(4)}</span>
          <span className="col-span-2">ac = {derived.ac.toFixed(4)}</span>
        </div>
      </div>

      {/* Intersection Point */}
      {feasibility.feasible && (
        <div>
          <h4 className={`font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Min Power (P*)
          </h4>
          <div className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            <div>P₁* = {feasibility.P1star.toFixed(4)}</div>
            <div>P₂* = {feasibility.P2star.toFixed(4)}</div>
          </div>
        </div>
      )}

      {/* User Point */}
      <div>
        <h4 className={`font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Current Point
        </h4>
        <div className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <div>P₁ = {userPoint.P1.toFixed(4)}</div>
          <div>P₂ = {userPoint.P2.toFixed(4)}</div>
        </div>
      </div>

      {/* SINR at user point */}
      <div>
        <h4 className={`font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          SINR at Current Point
        </h4>
        <div className="font-mono">
          <div className={userSINR.sinr1Met ? 'text-green-400' : 'text-red-400'}>
            SINR₁ = {userSINR.sinr1.toFixed(4)} {userSINR.sinr1Met ? '≥' : '<'} {theta.toFixed(2)}
          </div>
          <div className={userSINR.sinr2Met ? 'text-green-400' : 'text-red-400'}>
            SINR₂ = {userSINR.sinr2.toFixed(4)} {userSINR.sinr2Met ? '≥' : '<'} {theta.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
