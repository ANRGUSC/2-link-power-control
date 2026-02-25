import type { Theme } from '../hooks/useTheme';
import type { Preset, IterationState } from '../types';
import { PRESETS } from '../hooks/usePowerControl';

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  isDark: boolean;
  color?: string;
}

function SliderRow({ label, value, onChange, min, max, step, isDark, color }: SliderRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between text-xs">
        <span className={color ? '' : (isDark ? 'text-slate-400' : 'text-slate-500')} style={color ? { color } : undefined}>{label}</span>
        <span className={`font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

interface ControlsProps {
  theme: Theme;
  // Parameters
  g11: number; setG11: (v: number) => void;
  g22: number; setG22: (v: number) => void;
  g12: number; setG12: (v: number) => void;
  g21: number; setG21: (v: number) => void;
  N1: number; setN1: (v: number) => void;
  N2: number; setN2: (v: number) => void;
  theta: number; setTheta: (v: number) => void;
  // Options
  sameNoise: boolean; setSameNoise: (v: boolean) => void;
  powerCapEnabled: boolean; setPowerCapEnabled: (v: boolean) => void;
  powerCap: number; setPowerCap: (v: number) => void;
  // Presets
  applyPreset: (p: Preset) => void;
  // Actions
  setToMinFeasible: () => void;
  feasible: boolean;
  // Iteration
  iteration: IterationState;
  runIteration: () => void;
  clearIteration: () => void;
}

export function Controls({
  theme,
  g11, setG11, g22, setG22,
  g12, setG12, g21, setG21,
  N1, setN1, N2, setN2,
  theta, setTheta,
  sameNoise, setSameNoise,
  powerCapEnabled, setPowerCapEnabled,
  powerCap, setPowerCap,
  applyPreset,
  setToMinFeasible, feasible,
  iteration, runIteration, clearIteration,
}: ControlsProps) {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col gap-4 text-sm overflow-y-auto max-h-[calc(100vh-160px)]">
      {/* Presets */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Presets
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className={`px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                isDark
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* SINR Target */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          SINR Target
        </h3>
        <SliderRow label="θ (SINR target)" value={theta} onChange={setTheta} min={0.1} max={10} step={0.1} isDark={isDark} color="#22d3ee" />
      </div>

      {/* Direct Gains */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Direct Gains
        </h3>
        <div className="flex flex-col gap-2">
          <SliderRow label="g₁₁ (Tx1→Rx1)" value={g11} onChange={setG11} min={0.1} max={5} step={0.1} isDark={isDark} color="#4ade80" />
          <SliderRow label="g₂₂ (Tx2→Rx2)" value={g22} onChange={setG22} min={0.1} max={5} step={0.1} isDark={isDark} color="#4ade80" />
        </div>
      </div>

      {/* Cross Gains */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Cross Gains (Interference)
        </h3>
        <div className="flex flex-col gap-2">
          <SliderRow label="g₂₁ (Tx2→Rx1)" value={g21} onChange={setG21} min={0.01} max={3} step={0.01} isDark={isDark} color="#f87171" />
          <SliderRow label="g₁₂ (Tx1→Rx2)" value={g12} onChange={setG12} min={0.01} max={3} step={0.01} isDark={isDark} color="#f87171" />
        </div>
      </div>

      {/* Noise */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Noise
        </h3>
        <label className={`flex items-center gap-2 mb-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <input
            type="checkbox"
            checked={sameNoise}
            onChange={(e) => setSameNoise(e.target.checked)}
            className="cursor-pointer"
          />
          Same noise both links
        </label>
        <div className="flex flex-col gap-2">
          <SliderRow label="N₁" value={N1} onChange={setN1} min={0.01} max={2} step={0.01} isDark={isDark} />
          {!sameNoise && (
            <SliderRow label="N₂" value={N2} onChange={setN2} min={0.01} max={2} step={0.01} isDark={isDark} />
          )}
        </div>
      </div>

      {/* Power Cap */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Power Cap
        </h3>
        <label className={`flex items-center gap-2 mb-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          <input
            type="checkbox"
            checked={powerCapEnabled}
            onChange={(e) => setPowerCapEnabled(e.target.checked)}
            className="cursor-pointer"
          />
          Enable power cap
        </label>
        {powerCapEnabled && (
          <SliderRow label="P_max" value={powerCap} onChange={setPowerCap} min={1} max={50} step={0.5} isDark={isDark} />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={setToMinFeasible}
          disabled={!feasible}
          className={`w-full px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
            feasible
              ? isDark
                ? 'bg-cyan-700 hover:bg-cyan-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
              : isDark
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Set to Min Feasible Power
        </button>
      </div>

      {/* Iteration */}
      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Foschini-Miljanic Iteration
        </h3>
        <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Click on the plot to set initial power levels, then run the iteration.
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={runIteration}
            disabled={iteration.trajectory.length > 0}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
              iteration.trajectory.length > 0
                ? isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isDark ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-500 text-white'
            }`}
          >
            Run Iteration
          </button>
          <button
            onClick={clearIteration}
            disabled={iteration.trajectory.length === 0}
            className={`flex-1 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
              iteration.trajectory.length === 0
                ? isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : isDark ? 'bg-slate-600 hover:bg-slate-500 text-slate-300' : 'bg-slate-300 hover:bg-slate-400 text-slate-700'
            }`}
          >
            Clear
          </button>
        </div>
        {iteration.trajectory.length > 0 && (
          <div className={`mt-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Steps: {iteration.stepCount}
            {iteration.converged && <span className="text-green-400 ml-2">Converged!</span>}
            {iteration.diverged && <span className="text-red-400 ml-2">Diverged!</span>}
          </div>
        )}
      </div>
    </div>
  );
}
