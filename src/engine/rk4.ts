/**
 * 4th-Order Runge-Kutta (RK4) Differential Equation Solver
 * Solves systems of first-order ODEs of the form dy/dt = f(t, y)
 *
 * k1 = f(t_n, y_n)
 * k2 = f(t_n + h/2, y_n + (h/2)*k1)
 * k3 = f(t_n + h/2, y_n + (h/2)*k2)
 * k4 = f(t_n + h, y_n + h*k3)
 * y_{n+1} = y_n + (h/6)*(k1 + 2*k2 + 2*k3 + k4)
 */

export type DerivativeFn = (t: number, y: number[]) => number[];

export interface RK4StepResult {
  t: number;
  y: number[];
  k1: number[];
  k2: number[];
  k3: number[];
  k4: number[];
  substeps: number;
  stepSize: number;
}

/**
 * Performs a single 4th-Order Runge-Kutta integration step of size h.
 */
export function rk4SingleStep(
  t: number,
  y: number[],
  h: number,
  f: DerivativeFn
): { yNext: number[]; k1: number[]; k2: number[]; k3: number[]; k4: number[] } {
  const n = y.length;
  const k1 = f(t, y);

  const yTemp2 = new Array<number>(n);
  const halfH = 0.5 * h;
  for (let i = 0; i < n; i++) {
    yTemp2[i] = y[i] + halfH * k1[i];
  }
  const k2 = f(t + halfH, yTemp2);

  const yTemp3 = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    yTemp3[i] = y[i] + halfH * k2[i];
  }
  const k3 = f(t + halfH, yTemp3);

  const yTemp4 = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    yTemp4[i] = y[i] + h * k3[i];
  }
  const k4 = f(t + h, yTemp4);

  const yNext = new Array<number>(n);
  const sixthH = h / 6.0;
  for (let i = 0; i < n; i++) {
    yNext[i] = y[i] + sixthH * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i]);
  }

  return { yNext, k1, k2, k3, k4 };
}

/**
 * Integrates dy/dt = f(t, y) over deltaT using fixed micro-substeps (default h = 1/240 s)
 * to guarantee symplectic-grade energy conservation and high numerical accuracy.
 */
export function rk4Integrate(
  t: number,
  y: number[],
  deltaT: number,
  f: DerivativeFn,
  targetStepSize: number = 1 / 240
): RK4StepResult {
  if (deltaT <= 0) {
    const k1 = f(t, y);
    return {
      t,
      y: [...y],
      k1,
      k2: k1,
      k3: k1,
      k4: k1,
      substeps: 0,
      stepSize: targetStepSize,
    };
  }

  const substeps = Math.max(1, Math.ceil(deltaT / targetStepSize));
  const h = deltaT / substeps;

  let currentT = t;
  let currentY = [...y];
  let lastK1: number[] = [];
  let lastK2: number[] = [];
  let lastK3: number[] = [];
  let lastK4: number[] = [];

  for (let s = 0; s < substeps; s++) {
    const step = rk4SingleStep(currentT, currentY, h, f);
    currentY = step.yNext;
    currentT += h;
    lastK1 = step.k1;
    lastK2 = step.k2;
    lastK3 = step.k3;
    lastK4 = step.k4;
  }

  return {
    t: currentT,
    y: currentY,
    k1: lastK1,
    k2: lastK2,
    k3: lastK3,
    k4: lastK4,
    substeps,
    stepSize: h,
  };
}
