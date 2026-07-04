import { describe, it, expect } from 'vitest';
import { blendScores } from '../../../src/services/grading/blend.js';

describe('blendScores blending formula', () => {
  it('prefers pure vision when w is 1', () => {
    const res = blendScores(90, 40, 1.0);
    expect(res.finalScore).toBe(90);
    expect(res.weightUsed).toBe(1.0);
  });

  it('prefers pure reason when w is 0', () => {
    const res = blendScores(90, 40, 0.0);
    expect(res.finalScore).toBe(40);
    expect(res.weightUsed).toBe(0.0);
  });

  it('correctly blends values with weight w=0.4', () => {
    // 0.4 * 90 + 0.6 * 40 = 36 + 24 = 60
    const res = blendScores(90, 40, 0.4);
    expect(res.finalScore).toBe(60);
    expect(res.weightUsed).toBe(0.4);
  });

  it('clamps final scores to [0, 100]', () => {
    const low = blendScores(-10, -50, 0.5);
    expect(low.finalScore).toBe(0);

    const high = blendScores(120, 150, 0.5);
    expect(high.finalScore).toBe(100);
  });
});
