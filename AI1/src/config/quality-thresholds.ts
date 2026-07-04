import type { Category } from './required-views.js';

export interface QualityThresholds {
  minWidth: number;
  minHeight: number;
  minBrightness: number;
  maxBrightness: number;
  minContrast: number;
  minBlurVariance: number;
  blankPixelFractionMax: number;
}

const DEFAULT_THRESHOLDS: QualityThresholds = {
  minWidth: 800,
  minHeight: 800,
  minBrightness: 40,
  maxBrightness: 215,
  minContrast: 25,
  minBlurVariance: 100,
  blankPixelFractionMax: 0.9,
};

// Per-category overrides. Populate from calibration data collected via the
// `qualityScores` log line emitted for every processed image — see
// services/validation/quality.ts. Starting with sane, conservative defaults.
const CATEGORY_OVERRIDES: Partial<Record<Category, Partial<QualityThresholds>>> = {
  books: { minWidth: 600, minHeight: 600, minBlurVariance: 60 },
  apparel: { minBlurVariance: 80 },
};

export function getQualityThresholds(category?: Category): QualityThresholds {
  if (!category) return DEFAULT_THRESHOLDS;
  const override = CATEGORY_OVERRIDES[category];
  return override ? { ...DEFAULT_THRESHOLDS, ...override } : DEFAULT_THRESHOLDS;
}

// Fixed width every image is resized to before computing Laplacian variance,
// so resolution differences don't skew the blur score.
export const BLUR_NORMALIZE_WIDTH = 1000;
