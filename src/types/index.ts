export interface GainParams {
  g11: number; // direct gain, link 1
  g22: number; // direct gain, link 2
  g12: number; // cross gain, Tx1 → Rx2
  g21: number; // cross gain, Tx2 → Rx1
  N1: number;  // noise at Rx1
  N2: number;  // noise at Rx2
  theta: number; // SINR target (linear)
}

export interface DerivedParams {
  a: number; // θ * g21 / g11
  b: number; // θ * N1 / g11
  c: number; // θ * g12 / g22
  d: number; // θ * N2 / g22
  ac: number; // a * c (spectral radius squared)
  rhoF: number; // √(ac) — spectral radius of F
}

export interface FeasibilityResult {
  feasible: boolean;
  P1star: number; // min-power intersection P1
  P2star: number; // min-power intersection P2
}

export interface PowerPoint {
  P1: number;
  P2: number;
}

export interface SINRValues {
  sinr1: number;
  sinr2: number;
  sinr1Met: boolean;
  sinr2Met: boolean;
}

export interface IterationState {
  running: boolean;
  trajectory: PowerPoint[];
  stepCount: number;
  converged: boolean;
  diverged: boolean;
}

export interface Preset {
  name: string;
  params: GainParams;
}
