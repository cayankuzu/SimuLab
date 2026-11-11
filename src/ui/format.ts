/**
 * Number formatting for instrument read-outs. A decimal point is used in both
 * interface languages so that displayed values can be typed back into the
 * numeric fields and match the exported data.
 */

const SUPERSCRIPT: Record<string, string> = {
  "-": "⁻",
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};

export const DASH = "—";
const MINUS = "−";

/** Replaces the ASCII hyphen of a negative number by a typographic minus sign. */
function withMinus(text: string): string {
  return text.startsWith("-") ? MINUS + text.slice(1) : text;
}

/** Fixed number of decimals; non-finite values render as a dash. */
export function fixed(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  const rounded = value.toFixed(decimals);
  // Avoid "-0.00".
  return withMinus(Number(rounded) === 0 ? (0).toFixed(decimals) : rounded);
}

/** Scientific notation with a proper multiplication sign and superscript exponent: 3.1 x 10^-12. */
export function scientific(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  if (value === 0) return "0";
  const [mantissa, exponent] = value.toExponential(digits).split("e");
  const power = String(Number(exponent))
    .split("")
    .map((char) => SUPERSCRIPT[char] ?? char)
    .join("");
  return `${withMinus(mantissa)}×10${power}`;
}

/**
 * Chooses fixed or scientific notation so that `significant` digits are shown
 * without long runs of zeros.
 */
export function auto(value: number | null | undefined, significant = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;
  if (value === 0) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= 1e5 || magnitude < 1e-3) return scientific(value, Math.max(0, significant - 1));
  const decimals = Math.max(0, significant - 1 - Math.floor(Math.log10(magnitude)));
  return fixed(value, Math.min(decimals, 6));
}

/**
 * Formats according to a `digits` convention shared with the task read-outs:
 * digits >= 0 means that many decimals, digits < 0 means scientific notation
 * with |digits| - 1 mantissa decimals.
 */
export function byDigits(value: number | null | undefined, digits: number): string {
  return digits >= 0 ? fixed(value, digits) : scientific(value, -digits - 1);
}

export function degrees(radians: number | null | undefined, decimals = 1): string {
  if (radians === null || radians === undefined || !Number.isFinite(radians)) return DASH;
  return `${fixed((radians * 180) / Math.PI, decimals)}°`;
}

/** Signed relative deviation in percent or ppm, e.g. "+0.012 %" or "3 ppm". */
export function deviation(measured: number | null | undefined, reference: number | null | undefined): string {
  if (
    measured === null ||
    measured === undefined ||
    reference === null ||
    reference === undefined ||
    !Number.isFinite(measured) ||
    !Number.isFinite(reference) ||
    reference === 0
  ) {
    return DASH;
  }
  const relative = (measured - reference) / Math.abs(reference);
  const magnitude = Math.abs(relative);
  if (magnitude < 5e-10) return "< 0.001 ppm";
  if (magnitude < 1e-4) return `${withMinus((relative * 1e6).toPrecision(2))} ppm`;
  const sign = relative > 0 ? "+" : "";
  return `${sign}${withMinus((relative * 100).toPrecision(2))} %`;
}

/** "Nice" tick positions covering [min, max] with roughly `target` intervals (1-2-5 progression). */
export function niceTicks(min: number, max: number, target = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];
  const raw = (max - min) / Math.max(1, target);
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const fraction = raw / power;
  const step = (fraction < 1.5 ? 1 : fraction < 3.5 ? 2 : fraction < 7.5 ? 5 : 10) * power;
  const first = Math.ceil(min / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let value = first; value <= max + step * 1e-9 && ticks.length < 64; value += step) {
    ticks.push(Math.abs(value) < step * 1e-9 ? 0 : value);
  }
  return ticks;
}

/** Formats a tick value with just enough decimals for the given tick spacing. */
export function tickLabel(value: number, step: number): string {
  if (!Number.isFinite(value)) return "";
  const magnitude = Math.abs(step);
  if (magnitude >= 1e5 || (magnitude > 0 && magnitude < 1e-4)) return scientific(value, 0);
  const decimals = Math.max(0, Math.min(6, Math.ceil(-Math.log10(magnitude) - 1e-9)));
  return fixed(value, decimals);
}

/** Decimal notation: optional sign, digits with a point or a comma, optional exponent. */
const DECIMAL = /^[+-]?(?:\d+[.,]?\d*|[.,]\d+)(?:e[+-]?\d+)?$/i;

/**
 * The number written in a numeric field, or NaN if the text is not decimal
 * notation. A decimal comma and the typographic minus of the read-outs are
 * accepted; an empty text, words, digit grouping (1.234,5) and the other
 * notations that Number() would silently accept (0x10, Infinity) are not.
 */
export function parseDecimal(text: string): number {
  const entered = text.trim().replace(MINUS, "-");
  return DECIMAL.test(entered) ? Number(entered.replace(",", ".")) : Number.NaN;
}
