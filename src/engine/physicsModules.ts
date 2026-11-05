import { rk4Integrate } from "./rk4";

export type ModuleId = "oscillator" | "pendulum";

export interface Vector2D {
  x: number;
  y: number;
}

export interface PhasePoint {
  q: number; // Position (x or theta of tip/first bob)
  p: number; // Velocity (v or omega of tip/first bob)
  t: number;
}

export interface EnergySnapshot {
  kinetic: number;
  potential: number;
  thermal: number;
  total: number;
}

// ==========================================
// MODULE 1: DAMPED & DRIVEN HARMONIC OSCILLATOR
// ==========================================
export interface OscillatorParams {
  mass: number;       // m (kg)
  stiffness: number;  // k (N/m)
  damping: number;    // c (N·s/m)
  driveAmp: number;   // F0 (N)
  driveFreq: number;  // omega_ext (rad/s)
}

export interface OscillatorState {
  t: number;
  x: number;          // Displacement (m)
  v: number;          // Velocity (m/s)
  a: number;          // Acceleration (m/s^2)
  fNet: number;       // Net Force (N)
  fSpring: number;    // -kx
  fDamper: number;    // -cv
  fDrive: number;     // F0 cos(omega_ext * t)
  thermalEnergy: number;
  initialEnergy: number;
  trail: { t: number; x: number; v: number }[];
}

export interface OscillatorDerived {
  omega0: number;     // sqrt(k/m)
  zeta: number;       // c / (2 * sqrt(m*k))
  omegaD: number;     // omega0 * sqrt(1 - zeta^2)
  period: number | null;
  halfPeriod: number | null;
  qualityFactor: number | null;
  resonanceAmp: number;
  regime: "undamped" | "underdamped" | "critical" | "overdamped";
  isResonant: boolean;
}

export function computeOscillatorDerived(p: OscillatorParams): OscillatorDerived {
  const omega0 = Math.sqrt(p.stiffness / Math.max(0.01, p.mass));
  const criticalC = 2 * Math.sqrt(p.mass * p.stiffness);
  const zeta = p.damping / Math.max(1e-6, criticalC);
  const omegaD = zeta < 1 ? omega0 * Math.sqrt(Math.max(0, 1 - zeta * zeta)) : 0;
  const period = zeta < 1 && omegaD > 1e-5 ? (2 * Math.PI) / omegaD : null;
  const halfPeriod = zeta < 1 && omegaD > 1e-5 ? Math.PI / omegaD : null;
  const qualityFactor = p.damping > 1e-4 ? Math.sqrt(p.mass * p.stiffness) / p.damping : null;

  const denom = Math.sqrt(
    Math.pow(omega0 * omega0 - p.driveFreq * p.driveFreq, 2) +
      Math.pow(2 * zeta * omega0 * p.driveFreq, 2)
  );
  const resonanceAmp =
    p.driveAmp > 0
      ? (p.driveAmp / p.mass) / Math.max(0.05, denom)
      : 0;

  let regime: OscillatorDerived["regime"] = "underdamped";
  if (zeta < 0.005) {
    regime = "undamped";
  } else if (Math.abs(zeta - 1.0) <= 0.04) {
    regime = "critical";
  } else if (zeta > 1.04) {
    regime = "overdamped";
  } else {
    regime = "underdamped";
  }

  const isResonant =
    p.driveAmp > 0.1 && Math.abs(p.driveFreq - omega0) / Math.max(0.1, omega0) < 0.12;

  return {
    omega0,
    zeta,
    omegaD,
    period,
    halfPeriod,
    qualityFactor,
    resonanceAmp,
    regime,
    isResonant,
  };
}

export function createInitialOscillatorState(
  params: OscillatorParams,
  x0: number = 2.0,
  v0: number = 0
): OscillatorState {
  const fSpring = -params.stiffness * x0;
  const fDamper = -params.damping * v0;
  const fDrive = params.driveAmp * Math.cos(0);
  const fNet = fSpring + fDamper + fDrive;
  const a = fNet / params.mass;
  const initialEnergy = 0.5 * params.mass * v0 * v0 + 0.5 * params.stiffness * x0 * x0;

  return {
    t: 0,
    x: x0,
    v: v0,
    a,
    fNet,
    fSpring,
    fDamper,
    fDrive,
    thermalEnergy: 0,
    initialEnergy,
    trail: [{ t: 0, x: x0, v: v0 }],
  };
}

export function stepOscillatorRK4(
  state: OscillatorState,
  params: OscillatorParams,
  dt: number
): OscillatorState {
  const y0 = [state.x, state.v, state.thermalEnergy];

  const deriv = (t: number, y: number[]): number[] => {
    const x = y[0];
    const v = y[1];
    const fDrive = params.driveAmp * Math.cos(params.driveFreq * t);
    const fSpring = -params.stiffness * x;
    const fDamper = -params.damping * v;
    const a = (fDrive + fSpring + fDamper) / params.mass;
    const dThermal = params.damping * v * v;
    return [v, a, dThermal];
  };

  const res = rk4Integrate(state.t, y0, dt, deriv, 1 / 240);
  const [x, v, thermalEnergy] = res.y;
  const t = res.t;

  const fSpring = -params.stiffness * x;
  const fDamper = -params.damping * v;
  const fDrive = params.driveAmp * Math.cos(params.driveFreq * t);
  const fNet = fSpring + fDamper + fDrive;
  const a = fNet / params.mass;

  const nextTrail = [...state.trail, { t, x, v }];
  if (nextTrail.length > 360) nextTrail.shift();

  return {
    t,
    x,
    v,
    a,
    fNet,
    fSpring,
    fDamper,
    fDrive,
    thermalEnergy,
    initialEnergy: state.initialEnergy,
    trail: nextTrail,
  };
}

export function computeOscillatorEnergy(
  state: OscillatorState,
  params: OscillatorParams
): EnergySnapshot {
  const kinetic = 0.5 * params.mass * state.v * state.v;
  const potential = 0.5 * params.stiffness * state.x * state.x;
  const thermal = Math.max(0, state.thermalEnergy);
  const total = kinetic + potential + thermal;
  return { kinetic, potential, thermal, total };
}

// ============================================================
// MODULE 2: N-LINK PENDULUM (1 TO 6 MASSES) & CHAOS SANDBOX
// ============================================================
export interface PendulumParams {
  count: number;       // Number of linked pendulum bobs: 1 <= count <= 6
  masses: number[];    // Masses [m1, m2, ..., m6] (kg)
  lengths: number[];   // Rod lengths [L1, L2, ..., L6] (m)
  g: number;           // Gravity (m/s^2)
  damping: number;     // Joint damping c (1/s)
  ghostEnabled: boolean;
  ghostDelta: number;  // Default 0.001 rad
}

export interface PendulumState {
  t: number;
  thetas: number[];      // Angles [theta_1, ..., theta_N] (rad)
  omegas: number[];      // Angular velocities [omega_1, ..., omega_N] (rad/s)
  alphas: number[];      // Angular accelerations [alpha_1, ..., alpha_N] (rad/s^2)
  // Ghost twin N-pendulum state (offset by +0.001 rad on tip/first bob)
  ghostThetas: number[];
  ghostOmegas: number[];
  initialEnergy: number;
  tipTrail: Vector2D[];       // Trail of the last bob (m_N)
  ghostTipTrail: Vector2D[];  // Trail of the ghost twin's last bob
}

export interface BobColorPalette {
  fill: string;
  stroke: string;
  light: string;
  dark: string;
  glow: string;
  nameTr: string;
  nameEn: string;
}

export const PENDULUM_BOB_COLORS: BobColorPalette[] = [
  { fill: "#0284c7", stroke: "#7dd3fc", light: "#38bdf8", dark: "#0c4a6e", glow: "rgba(56, 189, 248, 0.45)", nameTr: "1. Kütle (Kobalt)", nameEn: "Mass 1 (Cobalt)" },
  { fill: "#d97706", stroke: "#fde68a", light: "#fbbf24", dark: "#78350f", glow: "rgba(245, 158, 11, 0.45)", nameTr: "2. Kütle (Pirinç)", nameEn: "Mass 2 (Amber)" },
  { fill: "#059669", stroke: "#6ee7b7", light: "#34d399", dark: "#064e3b", glow: "rgba(16, 185, 129, 0.45)", nameTr: "3. Kütle (Zümrüt)", nameEn: "Mass 3 (Emerald)" },
  { fill: "#7c3aed", stroke: "#c4b5fd", light: "#a78bfa", dark: "#3b0764", glow: "rgba(139, 92, 246, 0.45)", nameTr: "4. Kütle (Ametist)", nameEn: "Mass 4 (Violet)" },
  { fill: "#e11d48", stroke: "#fda4af", light: "#fb7185", dark: "#4c0519", glow: "rgba(244, 63, 94, 0.45)", nameTr: "5. Kütle (Yakut)", nameEn: "Mass 5 (Crimson)" },
  { fill: "#0891b2", stroke: "#67e8f9", light: "#22d3ee", dark: "#164e63", glow: "rgba(6, 182, 212, 0.45)", nameTr: "6. Kütle (Turkuaz)", nameEn: "Mass 6 (Cyan)" },
];

/**
 * Solves an N x N linear system A * x = b using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A: number[][], b: number[], n: number): number[] {
  if (n === 1) {
    return [b[0] / (A[0][0] || 1e-9)];
  }

  // Clone into augmented columns
  const M = new Array<number[]>(n);
  const rhs = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    M[i] = [...A[i]];
    rhs[i] = b[i];
  }

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(M[row][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }
    if (maxRow !== col) {
      const tmpRow = M[col];
      M[col] = M[maxRow];
      M[maxRow] = tmpRow;
      const tmpRhs = rhs[col];
      rhs[col] = rhs[maxRow];
      rhs[maxRow] = tmpRhs;
    }

    const pivot = M[col][col];
    if (Math.abs(pivot) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / pivot;
      rhs[row] -= factor * rhs[col];
      for (let k = col; k < n; k++) {
        M[row][k] -= factor * M[col][k];
      }
    }
  }

  const x = new Array<number>(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = rhs[i];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / (M[i][i] || 1e-9);
  }
  return x;
}

/**
 * Computes exact Euler-Lagrange angular accelerations [alpha_1, ..., alpha_N]
 * for an N-link coupled planar pendulum:
 *   sum_{j=1}^N [ M_{ij} * L_j * cos(theta_i - theta_j) ] * alpha_j
 *     = -M_{ii} * g * sin(theta_i)
 *       - sum_{j=1}^N [ M_{ij} * L_j * sin(theta_i - theta_j) * omega_j^2 ]
 *       - c * M_{ii} * L_i * omega_i
 * where M_{ij} = sum_{k = max(i,j)}^{N-1} m_k
 */
export function computeNPendulumAccelerations(
  thetas: number[],
  omegas: number[],
  p: PendulumParams
): number[] {
  const n = Math.max(1, Math.min(6, p.count));
  const tailMass = new Array<number>(n).fill(0);
  let runningMass = 0;
  for (let k = n - 1; k >= 0; k--) {
    runningMass += p.masses[k] ?? 1.0;
    tailMass[k] = runningMass;
  }

  const A: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const rhs = new Array<number>(n).fill(0);

  for (let i = 0; i < n; i++) {
    const thI = thetas[i];
    const omI = omegas[i];
    const Li = p.lengths[i] ?? 1.0;
    const Mii = tailMass[i];

    let rhsVal = -Mii * p.g * Math.sin(thI) - p.damping * Mii * Li * omI;

    for (let j = 0; j < n; j++) {
      const Mij = tailMass[Math.max(i, j)];
      const Lj = p.lengths[j] ?? 1.0;
      const delta = thI - thetas[j];

      A[i][j] = Mij * Lj * Math.cos(delta);
      if (i !== j) {
        rhsVal -= Mij * Lj * Math.sin(delta) * omegas[j] * omegas[j];
      }
    }

    rhs[i] = rhsVal;
  }

  return solveLinearSystem(A, rhs, n);
}

/**
 * Returns Cartesian positions and velocities of all N pendulum bobs.
 */
export function getNPendulumKinematics(
  thetas: number[],
  omegas: number[],
  lengths: number[],
  count: number
): { positions: Vector2D[]; velocities: Vector2D[] } {
  const n = Math.max(1, Math.min(6, count));
  const positions: Vector2D[] = [];
  const velocities: Vector2D[] = [];

  let curX = 0;
  let curY = 0;
  let curVx = 0;
  let curVy = 0;

  for (let i = 0; i < n; i++) {
    const L = lengths[i] ?? 1.0;
    const th = thetas[i] ?? 0;
    const om = omegas[i] ?? 0;

    curX += L * Math.sin(th);
    curY += L * Math.cos(th);
    curVx += L * om * Math.cos(th);
    curVy += -L * om * Math.sin(th);

    positions.push({ x: curX, y: curY });
    velocities.push({ x: curVx, y: curVy });
  }

  return { positions, velocities };
}

export function computePendulumMechanicalEnergy(
  thetas: number[],
  omegas: number[],
  p: PendulumParams
): { kinetic: number; potential: number } {
  const n = Math.max(1, Math.min(6, p.count));
  const { velocities } = getNPendulumKinematics(thetas, omegas, p.lengths, n);

  let kinetic = 0;
  let potential = 0;

  // Tail mass for potential energy: V = sum_{i=0}^{n-1} M_{ii} * g * L_i * (1 - cos(theta_i))
  let tailM = 0;
  const tailMasses = new Array<number>(n).fill(0);
  for (let k = n - 1; k >= 0; k--) {
    tailM += p.masses[k] ?? 1.0;
    tailMasses[k] = tailM;
  }

  for (let i = 0; i < n; i++) {
    const m = p.masses[i] ?? 1.0;
    const vSq =
      velocities[i].x * velocities[i].x + velocities[i].y * velocities[i].y;
    kinetic += 0.5 * m * vSq;

    const L = p.lengths[i] ?? 1.0;
    potential += tailMasses[i] * p.g * L * (1 - Math.cos(thetas[i] ?? 0));
  }

  return { kinetic, potential };
}

export function createInitialPendulumState(
  params: PendulumParams,
  customThetas?: number[],
  customOmegas?: number[]
): PendulumState {
  const n = Math.max(1, Math.min(6, Math.floor(Number(params?.count) || 2)));
  const defaultAngles = [2.05, 1.65, 1.35, 1.15, 0.95, 0.85];
  const thetas = new Array<number>(n);
  const omegas = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    thetas[i] = customThetas?.[i] ?? defaultAngles[i] ?? 1.2;
    omegas[i] = customOmegas?.[i] ?? 0;
  }

  const alphas = computeNPendulumAccelerations(thetas, omegas, params);
  const ghostThetas = [...thetas];
  ghostThetas[0] += params.ghostDelta;
  const ghostOmegas = [...omegas];

  const mainKin = getNPendulumKinematics(thetas, omegas, params.lengths, n);
  const ghostKin = getNPendulumKinematics(
    ghostThetas,
    ghostOmegas,
    params.lengths,
    n
  );

  const { kinetic, potential } = computePendulumMechanicalEnergy(
    thetas,
    omegas,
    params
  );

  return {
    t: 0,
    thetas,
    omegas,
    alphas,
    ghostThetas,
    ghostOmegas,
    initialEnergy: kinetic + potential,
    tipTrail: [mainKin.positions[n - 1]],
    ghostTipTrail: [ghostKin.positions[n - 1]],
  };
}

export function stepPendulumRK4(
  state: PendulumState,
  params: PendulumParams,
  dt: number
): PendulumState {
  const n = Math.max(1, Math.min(6, params.count));

  // Ensure state arrays match current count n
  const thetas0 = state.thetas.slice(0, n);
  const omegas0 = state.omegas.slice(0, n);
  const gThetas0 = state.ghostThetas.slice(0, n);
  const gOmegas0 = state.ghostOmegas.slice(0, n);
  while (thetas0.length < n) {
    thetas0.push(1.0);
    omegas0.push(0);
    gThetas0.push(1.0);
    gOmegas0.push(0);
  }

  // Pack 4N state vector: [thetas(0..n-1), omegas(0..n-1), ghostThetas(0..n-1), ghostOmegas(0..n-1)]
  const y0 = [...thetas0, ...omegas0, ...gThetas0, ...gOmegas0];

  const deriv = (_t: number, y: number[]): number[] => {
    const th = y.slice(0, n);
    const om = y.slice(n, 2 * n);
    const gTh = y.slice(2 * n, 3 * n);
    const gOm = y.slice(3 * n, 4 * n);

    const al = computeNPendulumAccelerations(th, om, params);
    const gAl = params.ghostEnabled
      ? computeNPendulumAccelerations(gTh, gOm, params)
      : new Array<number>(n).fill(0);

    return [...om, ...al, ...gOm, ...gAl];
  };

  // Use 1/300 s substep for high-N coupled accuracy
  const res = rk4Integrate(state.t, y0, dt, deriv, 1 / 300);
  const thetas = res.y.slice(0, n);
  const omegas = res.y.slice(n, 2 * n);
  const ghostThetas = res.y.slice(2 * n, 3 * n);
  const ghostOmegas = res.y.slice(3 * n, 4 * n);
  const t = res.t;

  const alphas = computeNPendulumAccelerations(thetas, omegas, params);
  const mainKin = getNPendulumKinematics(thetas, omegas, params.lengths, n);
  const ghostKin = getNPendulumKinematics(
    ghostThetas,
    ghostOmegas,
    params.lengths,
    n
  );

  const tipTrail = [...state.tipTrail, mainKin.positions[n - 1]];
  const ghostTipTrail = [...state.ghostTipTrail, ghostKin.positions[n - 1]];
  if (tipTrail.length > 420) tipTrail.shift();
  if (ghostTipTrail.length > 420) ghostTipTrail.shift();

  return {
    t,
    thetas,
    omegas,
    alphas,
    ghostThetas,
    ghostOmegas,
    initialEnergy: state.initialEnergy,
    tipTrail,
    ghostTipTrail,
  };
}

export function computePendulumEnergy(
  state: PendulumState,
  params: PendulumParams
): EnergySnapshot {
  const { kinetic, potential } = computePendulumMechanicalEnergy(
    state.thetas,
    state.omegas,
    params
  );
  const mech = kinetic + potential;
  const thermal =
    params.damping > 0 ? Math.max(0, state.initialEnergy - mech) : 0;
  const total = params.damping > 0 ? Math.max(mech, state.initialEnergy) : mech;
  return { kinetic, potential, thermal, total };
}

export function computePendulumAngularDifferenceDeg(
  state: PendulumState,
  count: number
): number {
  const n = Math.max(1, Math.min(6, count));
  let sumSq = 0;
  for (let i = 0; i < n; i++) {
    const diff = (state.thetas[i] ?? 0) - (state.ghostThetas[i] ?? 0);
    sumSq += diff * diff;
  }
  return (Math.sqrt(sumSq) * 180) / Math.PI;
}
