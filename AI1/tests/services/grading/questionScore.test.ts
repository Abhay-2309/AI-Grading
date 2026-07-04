import { describe, it, expect } from 'vitest';
import { computeQuestionScore } from '../../../src/services/grading/questionScore.js';

describe('computeQuestionScore universal dimensions', () => {
  it('scores 100 for all-yes answers', () => {
    const res = computeQuestionScore({
      coreFunction: 'yes',
      completeness: 'yes',
      structure: 'yes',
      usage: 'yes',
      originality: 'yes',
    });
    expect(res.questionScore).toBe(100);
    expect(res.anyAnswered).toBe(true);
    expect(res.answers.coreFunction).toBe('yes');
  });

  it('defaults unanswered to yes (20) but sets anyAnswered to false if all empty', () => {
    const res = computeQuestionScore(undefined);
    expect(res.questionScore).toBe(100);
    expect(res.anyAnswered).toBe(false);
    expect(res.answers.coreFunction).toBe('yes');
  });

  it('sets anyAnswered to true if at least one is answered', () => {
    const res = computeQuestionScore({
      completeness: 'no',
    });
    expect(res.questionScore).toBe(80); // completeness = 0, others default to yes (20 * 4) = 80
    expect(res.anyAnswered).toBe(true);
    expect(res.answers.completeness).toBe('no');
    expect(res.answers.coreFunction).toBe('yes');
  });

  it('correctly scores partial answers as 10', () => {
    const res = computeQuestionScore({
      coreFunction: 'partial',
      completeness: 'no',
      structure: 'yes',
    });
    // coreFunction (10) + completeness (0) + structure (20) + usage (20) + originality (20) = 70
    expect(res.questionScore).toBe(70);
    expect(res.anyAnswered).toBe(true);
  });
});
