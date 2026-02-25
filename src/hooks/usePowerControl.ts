import { useState, useMemo, useCallback, useEffect } from 'react';
import type { GainParams, DerivedParams, FeasibilityResult, PowerPoint, SINRValues, IterationState, Preset } from '../types';
import { computeDerived, computeFeasibility, computeSINR } from '../utils/powercontrol';

export const PRESETS: Preset[] = [
  { name: 'Low Interference', params: { g11: 1.0, g22: 1.0, g12: 0.1, g21: 0.1, N1: 0.1, N2: 0.1, theta: 2.0 } },
  { name: 'High Interference', params: { g11: 1.0, g22: 1.0, g12: 0.5, g21: 0.5, N1: 0.1, N2: 0.1, theta: 2.0 } },
  { name: 'Near Infeasible', params: { g11: 1.0, g22: 1.0, g12: 0.4, g21: 0.4, N1: 0.1, N2: 0.1, theta: 2.0 } },
  { name: 'Asymmetric', params: { g11: 2.0, g22: 0.5, g12: 0.3, g21: 0.6, N1: 0.1, N2: 0.2, theta: 1.5 } },
  { name: 'Infeasible', params: { g11: 1.0, g22: 1.0, g12: 0.8, g21: 0.8, N1: 0.1, N2: 0.1, theta: 2.0 } },
];

const DEFAULT_PARAMS = PRESETS[0].params;
const MAX_ITERATIONS = 20;

export function usePowerControl() {
  // Gain parameters
  const [g11, setG11] = useState(DEFAULT_PARAMS.g11);
  const [g22, setG22] = useState(DEFAULT_PARAMS.g22);
  const [g12, setG12] = useState(DEFAULT_PARAMS.g12);
  const [g21, setG21] = useState(DEFAULT_PARAMS.g21);
  const [N1, setN1] = useState(DEFAULT_PARAMS.N1);
  const [N2, setN2] = useState(DEFAULT_PARAMS.N2);
  const [theta, setTheta] = useState(DEFAULT_PARAMS.theta);

  // Options
  const [sameNoise, setSameNoise] = useState(true);
  const [powerCapEnabled, setPowerCapEnabled] = useState(false);
  const [powerCap, setPowerCap] = useState(10);

  // User-draggable point (initial power levels)
  const [userPoint, setUserPoint] = useState<PowerPoint>({ P1: 1, P2: 1 });

  // Iteration state
  const [iteration, setIteration] = useState<IterationState>({
    running: false,
    trajectory: [],
    stepCount: 0,
    converged: false,
    diverged: false,
  });

  // Assemble params
  const params: GainParams = useMemo(() => ({
    g11, g22, g12, g21, N1, N2, theta,
  }), [g11, g22, g12, g21, N1, N2, theta]);

  // Derived values
  const derived: DerivedParams = useMemo(() => computeDerived(params), [params]);

  // Feasibility
  const feasibility: FeasibilityResult = useMemo(() => computeFeasibility(derived), [derived]);

  // SINR at user point
  const userSINR: SINRValues = useMemo(() => computeSINR(userPoint, params), [userPoint, params]);

  // Sync noise if sameNoise
  const handleSetN1 = useCallback((val: number) => {
    setN1(val);
    if (sameNoise) setN2(val);
  }, [sameNoise]);

  const handleSetN2 = useCallback((val: number) => {
    setN2(val);
    if (sameNoise) setN1(val);
  }, [sameNoise]);

  const handleSetSameNoise = useCallback((val: boolean) => {
    setSameNoise(val);
    if (val) setN2(N1);
  }, [N1]);

  // Apply preset
  const applyPreset = useCallback((preset: Preset) => {
    const p = preset.params;
    setG11(p.g11);
    setG22(p.g22);
    setG12(p.g12);
    setG21(p.g21);
    setN1(p.N1);
    setN2(p.N2);
    setTheta(p.theta);
    setSameNoise(p.N1 === p.N2);
    setIteration({ running: false, trajectory: [], stepCount: 0, converged: false, diverged: false });
    setUserPoint({ P1: 1, P2: 1 });
  }, []);

  // Move user point to minimum feasible power
  const setToMinFeasible = useCallback(() => {
    if (feasibility.feasible && isFinite(feasibility.P1star) && isFinite(feasibility.P2star)) {
      setUserPoint({ P1: feasibility.P1star, P2: feasibility.P2star });
    }
  }, [feasibility]);

  // Run all iterations at once from user point.
  // Alternates: Tx1 updates P1 (horizontal move), then Tx2 updates P2 (vertical move).
  const runIteration = useCallback(() => {
    const trajectory: PowerPoint[] = [userPoint];
    let current = userPoint;
    let converged = false;
    let diverged = false;
    const cap = powerCapEnabled ? powerCap : undefined;
    const { a, b, c, d } = derived;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      // Half-step 1: Tx1 updates P1 (horizontal move, P2 stays)
      let newP1 = a * current.P2 + b;
      if (cap !== undefined) newP1 = Math.min(newP1, cap);
      const mid: PowerPoint = { P1: newP1, P2: current.P2 };
      trajectory.push(mid);

      if (newP1 > 1e6 || !isFinite(newP1)) { diverged = true; break; }

      // Half-step 2: Tx2 updates P2 (vertical move, P1 stays)
      let newP2 = c * mid.P1 + d;
      if (cap !== undefined) newP2 = Math.min(newP2, cap);
      const next: PowerPoint = { P1: mid.P1, P2: newP2 };
      trajectory.push(next);

      if (newP2 > 1e6 || !isFinite(newP2)) { diverged = true; break; }

      // Check convergence
      const dP1 = Math.abs(next.P1 - current.P1);
      const dP2 = Math.abs(next.P2 - current.P2);
      if (dP1 < 1e-6 && dP2 < 1e-6) { converged = true; break; }

      current = next;
    }

    setIteration({
      running: false,
      trajectory,
      stepCount: Math.floor((trajectory.length - 1) / 2), // full rounds
      converged,
      diverged,
    });
  }, [userPoint, derived, powerCapEnabled, powerCap]);

  // Clear iteration
  const clearIteration = useCallback(() => {
    setIteration({ running: false, trajectory: [], stepCount: 0, converged: false, diverged: false });
  }, []);

  // Clear iteration when user moves the point
  const handleSetUserPoint = useCallback((pt: PowerPoint) => {
    setUserPoint(pt);
    setIteration({ running: false, trajectory: [], stepCount: 0, converged: false, diverged: false });
  }, []);

  // Reset iteration when params change
  useEffect(() => {
    clearIteration();
  }, [g11, g22, g12, g21, N1, N2, theta, clearIteration]);

  return {
    // Parameters
    params,
    g11, setG11,
    g22, setG22,
    g12, setG12,
    g21, setG21,
    N1, setN1: handleSetN1,
    N2, setN2: handleSetN2,
    theta, setTheta,

    // Options
    sameNoise, setSameNoise: handleSetSameNoise,
    powerCapEnabled, setPowerCapEnabled,
    powerCap, setPowerCap,

    // Derived
    derived,
    feasibility,

    // User point
    userPoint, setUserPoint: handleSetUserPoint,
    userSINR,
    setToMinFeasible,

    // Iteration
    iteration,
    runIteration,
    clearIteration,

    // Presets
    applyPreset,
  };
}
