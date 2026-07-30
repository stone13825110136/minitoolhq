import {
  AWD_LIMITS_IN_LB,
  AWD_UNIT_MAX_IN_LB,
  FBA_LIMITS_IN_LB,
  IN_TO_CM,
  LB_TO_KG,
  type CartonInput,
  type CheckResult,
  type Program,
  type RuleLimits,
  type SortedDims,
  type UnitSystem,
} from "./types";

export function sortDims(a: number, b: number, c: number): SortedDims {
  const sides = [a, b, c].sort((x, y) => y - x);
  return { length: sides[0], width: sides[1], height: sides[2] };
}

export function toImperial(
  length: number,
  width: number,
  height: number,
  weight: number,
  units: UnitSystem,
): { dims: SortedDims; weightLb: number } {
  if (units === "imperial") {
    return { dims: sortDims(length, width, height), weightLb: weight };
  }
  return {
    dims: sortDims(length / IN_TO_CM, width / IN_TO_CM, height / IN_TO_CM),
    weightLb: weight / LB_TO_KG,
  };
}

export function fromImperialDims(dims: SortedDims, units: UnitSystem): SortedDims {
  if (units === "imperial") return dims;
  return {
    length: dims.length * IN_TO_CM,
    width: dims.width * IN_TO_CM,
    height: dims.height * IN_TO_CM,
  };
}

export function fromImperialWeight(weightLb: number, units: UnitSystem): number {
  return units === "imperial" ? weightLb : weightLb * LB_TO_KG;
}

export function limitsFor(program: Program): RuleLimits {
  return program === "awd" ? AWD_LIMITS_IN_LB : FBA_LIMITS_IN_LB;
}

export function checkCarton(
  input: CartonInput,
  program: Program,
  units: UnitSystem,
): CheckResult {
  const { dims, weightLb } = toImperial(
    input.length,
    input.width,
    input.height,
    input.weight,
    units,
  );
  const limits = limitsFor(program);
  const failures: string[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];

  const label = program === "awd" ? "AWD" : "FBA";

  if (dims.length > limits.maxLength + 1e-9) {
    failures.push(
      `Longest side ${fmt(dims.length, "in")} exceeds ${label} max length ${limits.maxLength} in` +
        (program === "fba"
          ? " (single oversized-item exceptions may apply — confirm in Seller Central)"
          : ""),
    );
  }
  if (dims.width > limits.maxWidth + 1e-9) {
    failures.push(
      `Median side ${fmt(dims.width, "in")} exceeds ${label} max width ${limits.maxWidth} in`,
    );
  }
  if (dims.height > limits.maxHeight + 1e-9) {
    failures.push(
      `Shortest side ${fmt(dims.height, "in")} exceeds ${label} max height ${limits.maxHeight} in`,
    );
  }

  if (weightLb > limits.maxWeight + 1e-9) {
    failures.push(
      `Weight ${fmt(weightLb, "lb")} exceeds standard ${label} max ${limits.maxWeight} lb`,
    );
    if (program === "fba") {
      if (weightLb > 100) {
        notes.push(
          "Single oversized/heavy unit over 100 lb typically needs a Mechanical Lift label on top and sides — confirm Seller Central; this tool does not auto-approve exceptions.",
        );
      } else {
        notes.push(
          "Single oversized/heavy unit over 50 lb may be allowed with Team Lift labels on top and sides (some help texts also cite an upper band around ~65 lb / ~30 kg for that exception). Multi-unit cartons over 50 lb are not on the standard path — confirm Seller Central.",
        );
      }
    } else {
      notes.push(
        "AWD cartons over 50 lb are outside the standard carton weight cap — confirm AWD inbound help in Seller Central.",
      );
    }
  } else if (weightLb > 50 - 1e-9 && weightLb <= 50 + 1e-9) {
    /* at exactly 50: pass */
  }

  if (
    dims.length + 1e-9 < limits.minLength ||
    dims.width + 1e-9 < limits.minWidth ||
    dims.height + 1e-9 < limits.minHeight
  ) {
    warnings.push(
      `Below common minimum guide ${limits.minLength}×${limits.minWidth}×${limits.minHeight} in — small cartons can delay receiving.`,
    );
  }
  if (weightLb + 1e-9 < limits.minWeightGuide) {
    warnings.push(
      `Under ~${limits.minWeightGuide} lb guide weight — very light boxes may see receiving delays.`,
    );
  }

  if (program === "fba" && dims.length > 25 + 1e-9 && dims.length <= 36 + 1e-9) {
    notes.push(
      "Length is between 25–36 in (allowed for FBA since Jun 20, 2025). AWD carton outer limits stay at 25 in — confirm destination program.",
    );
  }

  if (program === "awd") {
    notes.push(
      `AWD carton outer limits (typically 25×25×25 in / 50 lb) are separate from unit/SKU eligibility. From ${AWD_UNIT_MAX_IN_LB.effectiveDate}, new US AWD inbounds generally require sortable units smaller than ${AWD_UNIT_MAX_IN_LB.maxLengthExclusive}×${AWD_UNIT_MAX_IN_LB.maxWidthExclusive}×${AWD_UNIT_MAX_IN_LB.maxHeightExclusive} in and under ${AWD_UNIT_MAX_IN_LB.maxWeightExclusive} lb — confirm Seller Central.`,
    );
  }

  return {
    id: input.id,
    program,
    units,
    input,
    sorted: dims,
    sortedDisplay: fromImperialDims(dims, units),
    weightDisplay: fromImperialWeight(weightLb, units),
    pass: failures.length === 0,
    failures,
    warnings,
    notes,
  };
}

export interface UnitCheckInput {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface UnitCheckResult {
  pass: boolean;
  failures: string[];
  notes: string[];
  sorted: SortedDims;
  weightLb: number;
}

/** Check AWD product unit (SKU) eligibility — not carton outer size. */
export function checkAwdUnit(
  input: UnitCheckInput,
  units: UnitSystem,
): UnitCheckResult {
  const { dims, weightLb } = toImperial(
    input.length,
    input.width,
    input.height,
    input.weight,
    units,
  );
  const failures: string[] = [];
  const lim = AWD_UNIT_MAX_IN_LB;

  // Sorted L≥W≥H vs exclusive maxes: map longest→length cap 18, median→14, shortest→8
  if (dims.length + 1e-9 >= lim.maxLengthExclusive) {
    failures.push(
      `Unit longest side ${fmt(dims.length, "in")} is not smaller than ${lim.maxLengthExclusive} in (AWD sortable unit rule from ${lim.effectiveDate})`,
    );
  }
  if (dims.width + 1e-9 >= lim.maxWidthExclusive) {
    failures.push(
      `Unit median side ${fmt(dims.width, "in")} is not smaller than ${lim.maxWidthExclusive} in`,
    );
  }
  if (dims.height + 1e-9 >= lim.maxHeightExclusive) {
    failures.push(
      `Unit shortest side ${fmt(dims.height, "in")} is not smaller than ${lim.maxHeightExclusive} in`,
    );
  }
  if (weightLb + 1e-9 >= lim.maxWeightExclusive) {
    failures.push(
      `Unit weight ${fmt(weightLb, "lb")} is not under ${lim.maxWeightExclusive} lb`,
    );
  }

  return {
    pass: failures.length === 0,
    failures,
    notes: [
      `AWD unit check uses exclusive thresholds (must be smaller than ${lim.maxLengthExclusive}×${lim.maxWidthExclusive}×${lim.maxHeightExclusive} in and under ${lim.maxWeightExclusive} lb) for new US inbounds from ${lim.effectiveDate}. Carton outer limits remain separate. Confirm Seller Central.`,
    ],
    sorted: dims,
    weightLb,
  };
}

function fmt(n: number, unit: string): string {
  const v = Math.round(n * 100) / 100;
  return `${v} ${unit}`;
}
