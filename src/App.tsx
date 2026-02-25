import { usePowerControl } from './hooks/usePowerControl';
import { useTheme } from './hooks/useTheme';
import { Controls } from './components/Controls';
import { NetworkDiagram } from './components/NetworkDiagram';
import { FeasibilityPlane } from './components/FeasibilityPlane';
import { StatsPanel } from './components/StatsPanel';
import { EquationsPanel } from './components/EquationsPanel';

export function App() {
  const pc = usePowerControl();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`px-6 py-4 border-b flex items-center justify-between ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-cyan-400' : 'text-teal-600'}`}>
            2-Link Power Control
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            EE 597 Wireless Networks &mdash; USC
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </header>

      {/* Main content */}
      <main className="p-6">
        <div className="grid grid-cols-[300px_1fr] gap-6">
          {/* Left: Controls + Stats */}
          <div className={`rounded-lg p-4 border flex flex-col gap-4 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <Controls
              theme={theme}
              g11={pc.g11} setG11={pc.setG11}
              g22={pc.g22} setG22={pc.setG22}
              g12={pc.g12} setG12={pc.setG12}
              g21={pc.g21} setG21={pc.setG21}
              N1={pc.N1} setN1={pc.setN1}
              N2={pc.N2} setN2={pc.setN2}
              theta={pc.theta} setTheta={pc.setTheta}
              sameNoise={pc.sameNoise} setSameNoise={pc.setSameNoise}
              powerCapEnabled={pc.powerCapEnabled} setPowerCapEnabled={pc.setPowerCapEnabled}
              powerCap={pc.powerCap} setPowerCap={pc.setPowerCap}
              applyPreset={pc.applyPreset}
              setToMinFeasible={pc.setToMinFeasible}
              feasible={pc.feasibility.feasible}
              iteration={pc.iteration}
              runIteration={pc.runIteration}
              clearIteration={pc.clearIteration}
            />

            <div className={`border-t pt-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <StatsPanel
                theme={theme}
                derived={pc.derived}
                feasibility={pc.feasibility}
                userPoint={pc.userPoint}
                userSINR={pc.userSINR}
                theta={pc.theta}
              />
            </div>
          </div>

          {/* Right: Diagram + Canvas + Equations stacked */}
          <div className="flex flex-col gap-6">
            {/* Network Diagram */}
            <div className={`rounded-lg border p-2 ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <NetworkDiagram params={pc.params} theme={theme} />
            </div>

            {/* Feasibility Plane */}
            <div className={`rounded-lg border h-[500px] ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <FeasibilityPlane
                theme={theme}
                derived={pc.derived}
                feasibility={pc.feasibility}
                userPoint={pc.userPoint}
                setUserPoint={pc.setUserPoint}
                iteration={pc.iteration}
                powerCapEnabled={pc.powerCapEnabled}
                powerCap={pc.powerCap}
              />
            </div>

            {/* Equations */}
            <div className={`rounded-lg p-4 border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <EquationsPanel theme={theme} />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`px-6 py-3 text-center text-xs border-t ${
        isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-200'
      }`}>
        EE 597 Wireless Networks &mdash; Bhaskar Krishnamachari, USC &mdash; Developed with Claude Code
      </footer>
    </div>
  );
}
