import type { GainParams, DerivedParams, FeasibilityResult, PowerPoint, SINRValues } from '../types';

export function computeDerived(p: GainParams): DerivedParams {
  const a = p.theta * p.g21 / p.g11;
  const b = p.theta * p.N1 / p.g11;
  const c = p.theta * p.g12 / p.g22;
  const d = p.theta * p.N2 / p.g22;
  const ac = a * c;
  const rhoF = Math.sqrt(ac);
  return { a, b, c, d, ac, rhoF };
}

export function computeFeasibility(derived: DerivedParams): FeasibilityResult {
  const { a, b, c, d, ac } = derived;
  if (ac >= 1) {
    return { feasible: false, P1star: Infinity, P2star: Infinity };
  }
  const P1star = (a * d + b) / (1 - ac);
  const P2star = (c * b + d) / (1 - ac);
  return { feasible: true, P1star, P2star };
}

export function computeSINR(point: PowerPoint, p: GainParams): SINRValues {
  const sinr1 = (point.P1 * p.g11) / (point.P2 * p.g21 + p.N1);
  const sinr2 = (point.P2 * p.g22) / (point.P1 * p.g12 + p.N2);
  return {
    sinr1,
    sinr2,
    sinr1Met: sinr1 >= p.theta - 1e-9,
    sinr2Met: sinr2 >= p.theta - 1e-9,
  };
}

/** One step of Foschini-Miljanic distributed power control */
export function foschiniMiljanicStep(current: PowerPoint, derived: DerivedParams): PowerPoint {
  const { a, b, c, d } = derived;
  return {
    P1: a * current.P2 + b,
    P2: c * current.P1 + d,
  };
}

/** Run iteration from a starting point, returns full trajectory */
export function runIteration(
  start: PowerPoint,
  derived: DerivedParams,
  maxSteps: number,
  convergenceThreshold: number = 1e-6,
  powerCap?: number,
): { trajectory: PowerPoint[]; converged: boolean; diverged: boolean } {
  const trajectory: PowerPoint[] = [start];
  let current = start;

  for (let i = 0; i < maxSteps; i++) {
    let next = foschiniMiljanicStep(current, derived);

    if (powerCap !== undefined) {
      next = { P1: Math.min(next.P1, powerCap), P2: Math.min(next.P2, powerCap) };
    }

    trajectory.push(next);

    // Check divergence
    if (next.P1 > 1e6 || next.P2 > 1e6 || !isFinite(next.P1) || !isFinite(next.P2)) {
      return { trajectory, converged: false, diverged: true };
    }

    // Check convergence
    const dP1 = Math.abs(next.P1 - current.P1);
    const dP2 = Math.abs(next.P2 - current.P2);
    if (dP1 < convergenceThreshold && dP2 < convergenceThreshold) {
      return { trajectory, converged: true, diverged: false };
    }

    current = next;
  }

  return { trajectory, converged: false, diverged: false };
}

/**
 * Compute the polygon vertices defining the feasible region in the (P1, P2) plane.
 * The feasible region is the intersection of:
 *   P1 >= a*P2 + b  (above line L1)
 *   P2 >= c*P1 + d  (above line L2, i.e. left of L2 when viewed as P1 vs P2)
 * clipped to [0, maxP] x [0, maxP].
 */
export function computeFeasibleRegionPolygon(
  derived: DerivedParams,
  feasibility: FeasibilityResult,
  maxP: number,
): PowerPoint[] {
  if (!feasibility.feasible) return [];

  const { a, b, c, d } = derived;

  // L1: P1 = a*P2 + b → P2 = (P1 - b) / a
  // L2: P2 = c*P1 + d → P1 = (P2 - d) / c

  // The feasible region is bounded by:
  // P1 >= a*P2 + b (right of L1)
  // P2 >= c*P1 + d (above L2)
  // 0 <= P1 <= maxP, 0 <= P2 <= maxP

  // Intersection point
  const { P1star, P2star } = feasibility;

  // We trace the boundary of the feasible region
  const points: PowerPoint[] = [];

  // Start at intersection point (P1*, P2*)
  points.push({ P1: P1star, P2: P2star });

  // Follow L1 (P1 = a*P2 + b) upward: as P2 increases, P1 increases
  // L1 at P2=maxP: P1 = a*maxP + b
  const P1_at_L1_P2max = a * maxP + b;
  if (P1_at_L1_P2max <= maxP) {
    // L1 hits the top edge (P2=maxP)
    points.push({ P1: P1_at_L1_P2max, P2: maxP });
    // Top-right corner
    points.push({ P1: maxP, P2: maxP });
  } else {
    // L1 hits the right edge (P1=maxP): P2 = (maxP - b) / a
    const P2_at_L1_P1max = a > 0 ? (maxP - b) / a : maxP;
    points.push({ P1: maxP, P2: Math.min(P2_at_L1_P1max, maxP) });
    if (P2_at_L1_P1max < maxP) {
      points.push({ P1: maxP, P2: maxP });
    }
  }

  // Follow L2 (P2 = c*P1 + d) rightward: as P1 increases, P2 increases
  // L2 at P1=maxP: P2 = c*maxP + d
  const P2_at_L2_P1max = c * maxP + d;
  if (P2_at_L2_P1max <= maxP) {
    // L2 hits the right edge (P1=maxP)
    // We already have (maxP, maxP), now go down to L2
    points.push({ P1: maxP, P2: P2_at_L2_P1max });
  } else {
    // L2 hits the top edge (P2=maxP): P1 = (maxP - d) / c
    const P1_at_L2_P2max = c > 0 ? (maxP - d) / c : maxP;
    if (P1_at_L2_P2max < maxP) {
      points.push({ P1: Math.min(P1_at_L2_P2max, maxP), P2: maxP });
    }
  }

  // Back to intersection point (polygon closes automatically)
  return points;
}
