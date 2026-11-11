/**
 * Colour constants shared by the 3-D scene and the 2-D plots (canvas and
 * WebGL cannot read CSS custom properties cheaply, so the values are mirrored
 * here; src/app/globals.css is the companion definition).
 *
 * Quantity colours follow the Okabe-Ito colour-universal-design palette
 * [okabe2008, wong2011].
 */

export const OKABE_ITO = {
  orange: "#e69f00",
  sky: "#56b4e9",
  green: "#009e73",
  yellow: "#f0e442",
  blue: "#0072b2",
  vermillion: "#d55e00",
  purple: "#cc79a7",
} as const;

export const SURFACE = {
  bg: "#090b0e",
  panel: "#0e1114",
  raised: "#14181d",
  plot: "#0b0d10",
  grid: "rgba(255,255,255,0.055)",
  gridStrong: "rgba(255,255,255,0.13)",
  axis: "rgba(255,255,255,0.22)",
  ink: "#eef1f5",
  ink2: "#c4cad3",
  ink3: "#939ba8",
  ink4: "#6b7482",
} as const;

/** One colour per physical quantity, used consistently in vectors, traces and legends. */
export const QUANTITY = {
  position: OKABE_ITO.sky,
  velocity: OKABE_ITO.green,
  netForce: OKABE_ITO.orange,
  spring: OKABE_ITO.yellow,
  damper: OKABE_ITO.purple,
  drive: OKABE_ITO.vermillion,
  gravity: OKABE_ITO.vermillion,
  tension: OKABE_ITO.sky,
  contact: SURFACE.ink2,
  kinetic: OKABE_ITO.green,
  potential: OKABE_ITO.sky,
  heat: OKABE_ITO.vermillion,
  impact: OKABE_ITO.purple,
  work: OKABE_ITO.yellow,
  total: SURFACE.ink,
  residual: OKABE_ITO.orange,
  twin: OKABE_ITO.purple,
  exact: SURFACE.ink,
  theory: OKABE_ITO.orange,
  lyapunov: OKABE_ITO.orange,
} as const;

/** Colours of pendulum links 1..6 (the twin keeps reddish purple for itself). */
export const LINK_COLORS: readonly string[] = [
  OKABE_ITO.sky,
  OKABE_ITO.orange,
  OKABE_ITO.green,
  OKABE_ITO.yellow,
  "#3d9bd9",
  OKABE_ITO.vermillion,
];
