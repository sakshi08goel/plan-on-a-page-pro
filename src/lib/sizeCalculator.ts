/**
 * Sprint estimation by size.
 */

export enum Size {
  XS = "XS",
  S = "S",
  M = "M",
  L = "L",
  XL = "XL",
  XXL = "XXL",
}

export type SprintEstimate = {
  size: Size;
  label: string;
  exampleTasks: string[];
  /** Minimum sprints expected */
  min: number;
  /** Maximum sprints expected; for XXL we use Number.POSITIVE_INFINITY to indicate 8+ */
  max: number;
  /** Notes for special handling (e.g., XXL should be broken down) */
  notes?: string;
};

const SPRINT_ESTIMATES: Record<Size, SprintEstimate> = {
  [Size.XS]: {
    size: Size.XS,
    label: "Extra Small",
    exampleTasks: ["Small bug fixes", "Minor UI tweaks", "Single-point edit"],
    min: 1,
    max: 2,
  },
  [Size.S]: {
    size: Size.S,
    label: "Small",
    exampleTasks: ["Simple API integration", "Small feature updates"],
    min: 2,
    max: 3,
  },
  [Size.M]: {
    size: Size.M,
    label: "Medium",
    exampleTasks: [
      "New UI pages",
      "MFA on a login screen",
      "Moderate integration",
    ],
    min: 3,
    max: 4,
  },
  [Size.L]: {
    size: Size.L,
    label: "Large",
    exampleTasks: [
      "Full journey implementation",
      "Multi-team features",
      "Major API enhancements",
    ],
    min: 4,
    max: 6,
  },
  [Size.XL]: {
    size: Size.XL,
    label: "Extra Large",
    exampleTasks: [
      "Large-scale features",
      "Deep system integration",
      "Feature-rich dashboard",
    ],
    min: 6,
    max: 8,
  },
  [Size.XXL]: {
    size: Size.XXL,
    label: "XXL",
    exampleTasks: [
      "Major module",
      "Suite of new features",
      "Too large for single estimate",
    ],
    min: 8,
    max: 10,
    notes:
      "This size likely needs to be broken down into smaller epics/stories before estimation.",
  },
};

export type OutputFormat = "range" | "minmax" | "average" | "raw" | "max";

/**
 * Returns number of sprints required for a given size.
 * @param size - One of XS, S, M, L, XL, XXL (case-insensitive string or Size enum)
 * @param format - Output format: 'range' | 'minmax' | 'average' | 'raw'
 * @returns Depending on format:
 *  - 'range': string like "1–2 sprints" (XXL -> "8+ sprints")
 *  - 'minmax': { min: number; max: number | 'Infinity' }
 *  - 'average': number (midpoint; XXL returns NaN)
 *  - 'raw': full SprintEstimate object
 *  * - 'max': { max: number}
 * @throws Error if size is invalid
 */
export function getSprintsRequired(
  size: string | Size,
  format: OutputFormat = "range"
):
  | string
  | { min: number; max: number | "Infinity" }
  | number
  | SprintEstimate {
  const normalized = normalizeSize(size);
  const estimate = SPRINT_ESTIMATES[normalized];

  if (!estimate) {
    throw new Error(
      `Invalid size '${size}'. Allowed values: ${Object.values(Size).join(
        ", "
      )}`
    );
  }

  switch (format) {
    case "range": {
      const isInfinity = !isFinite(estimate.max);
      return isInfinity
        ? `${estimate.min}+ sprints`
        : `${estimate.min}–${estimate.max} sprints`;
    }
    case "minmax": {
      return {
        min: estimate.min,
        max: isFinite(estimate.max) ? estimate.max : "Infinity",
      };
    }
    case "max": {
      return estimate.max;
    }
    case "average": {
      // For XXL (8+), average is not meaningful
      if (!isFinite(estimate.max)) return NaN;
      return roundToOneDecimal((estimate.min + estimate.max) / 2);
    }
    case "raw": {
      return estimate;
    }
    default:
      throw new Error(
        `Unsupported format '${format}'. Use 'range' | 'minmax' | 'average' | 'raw'.`
      );
  }
}

/** Helper: normalize size input flexibly */
function normalizeSize(input: string | Size): Size {
  if (Object.values(Size).includes(input as Size)) {
    return input as Size;
  }
  const canonical = String(input).trim().toUpperCase();
  if (Object.values(Size).includes(canonical as Size)) {
    return canonical as Size;
  }
  throw new Error(
    `Invalid size '${input}'. Allowed values: ${Object.values(Size).join(", ")}`
  );
}

/** Helper: round number to 1 decimal place */
function roundToOneDecimal(n: number): number {
  return Math.round(n * 10) / 10;
}
