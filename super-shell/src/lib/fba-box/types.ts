export type Program = "fba" | "awd";
export type UnitSystem = "imperial" | "metric";

export interface CartonInput {
  id: string;
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface SortedDims {
  length: number;
  width: number;
  height: number;
}

export interface RuleLimits {
  maxLength: number;
  maxWidth: number;
  maxHeight: number;
  maxWeight: number;
  minLength: number;
  minWidth: number;
  minHeight: number;
  minWeightGuide: number;
}

export interface CheckResult {
  id: string;
  program: Program;
  units: UnitSystem;
  input: CartonInput;
  sorted: SortedDims;
  sortedDisplay: SortedDims;
  weightDisplay: number;
  pass: boolean;
  failures: string[];
  warnings: string[];
  notes: string[];
}

/** Free: up to this many cartons per check run. */
export const FREE_CARTON_LIMIT = 5;

/** US inbound limits in inches / pounds (as documented in spec). */
export const FBA_LIMITS_IN_LB: RuleLimits = {
  maxLength: 36,
  maxWidth: 25,
  maxHeight: 25,
  maxWeight: 50,
  minLength: 6,
  minWidth: 4,
  minHeight: 1,
  minWeightGuide: 1,
};

export const AWD_LIMITS_IN_LB: RuleLimits = {
  maxLength: 25,
  maxWidth: 25,
  maxHeight: 25,
  maxWeight: 50,
  minLength: 6,
  minWidth: 4,
  minHeight: 1,
  minWeightGuide: 1,
};

export const IN_TO_CM = 2.54;
export const LB_TO_KG = 0.45359237;
