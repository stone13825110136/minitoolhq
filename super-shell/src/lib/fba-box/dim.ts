import { LB_TO_KG, type SortedDims, type UnitSystem } from "./types";

/** Common US Amazon planning divisor for dimensional weight (confirm Seller Central). */
export const DIM_DIVISOR_IN = 139;

export interface DimWeightRef {
  /** DIM in pounds from inch dimensions ÷ 139 */
  dimLb: number;
  /** max(actual lb, DIM lb) — planning reference only, not a fee quote */
  billableRefLb: number;
  dimDisplay: number;
  billableRefDisplay: number;
  actualDisplay: number;
  divisor: number;
}

function weightDisplay(weightLb: number, units: UnitSystem): number {
  return units === "imperial" ? weightLb : weightLb * LB_TO_KG;
}

/**
 * Planning DIM from sorted inch dimensions. Does not affect Pass/Fail inbound checks.
 */
export function dimWeightRef(
  sortedInches: SortedDims,
  weightLb: number,
  units: UnitSystem,
): DimWeightRef {
  const volume = sortedInches.length * sortedInches.width * sortedInches.height;
  const dimLb = volume / DIM_DIVISOR_IN;
  const billableRefLb = Math.max(weightLb, dimLb);
  return {
    dimLb,
    billableRefLb,
    dimDisplay: weightDisplay(dimLb, units),
    billableRefDisplay: weightDisplay(billableRefLb, units),
    actualDisplay: weightDisplay(weightLb, units),
    divisor: DIM_DIVISOR_IN,
  };
}
