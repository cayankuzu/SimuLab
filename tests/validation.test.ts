import { describe, expect, it } from "vitest";
import { VALIDATION_SUITE, type ValidationRow } from "@/physics/validation";

function format(row: ValidationRow): string {
  const reference = row.reference === null ? "-" : row.reference.toPrecision(10);
  return `${row.label}: measured ${row.measured.toPrecision(10)} ${row.unit}, reference ${reference}, error ${row.error.toExponential(3)} (${row.metric}, tolerance ${row.tolerance.toExponential(1)})`;
}

describe("verification & validation suite", () => {
  for (const validationCase of VALIDATION_SUITE) {
    it(validationCase.id, () => {
      const rows = validationCase.run();
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        console.log(`[${validationCase.id}] ${format(row)}`);
      }
      const failures = rows.filter((row) => !row.pass).map(format);
      expect(failures).toEqual([]);
    });
  }
});
