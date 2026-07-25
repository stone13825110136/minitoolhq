import {
  AWD_LIMITS_IN_LB,
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
    if (weightLb > 100) {
      notes.push(
        "Over 100 lb typically requires a Mechanical Lift label if the shipment is allowed as a single heavy/oversize unit.",
      );
    } else {
      notes.push(
        "Over 50 lb typically requires a Team Lift label and is only allowed for a single oversized/heavy unit — confirm in Seller Central.",
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
      "Length is between 25–36 in (allowed for FBA since Jun 20, 2025). AWD still caps at 25 in — confirm destination program.",
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

function fmt(n: number, unit: string): string {
  const v = Math.round(n * 100) / 100;
  return `${v} ${unit}`;
}
