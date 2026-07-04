import type { ConditionAnswers } from '../../schemas/condition-answers.schema.js';

export interface NormalizedAnswers {
  coreFunction: 'yes' | 'partial' | 'no';
  completeness: 'yes' | 'partial' | 'no';
  structure: 'yes' | 'partial' | 'no';
  usage: 'yes' | 'partial' | 'no';
  originality: 'yes' | 'partial' | 'no';
}

const DIMENSIONS: (keyof ConditionAnswers)[] = [
  'coreFunction',
  'completeness',
  'structure',
  'usage',
  'originality',
];

export function computeQuestionScore(answers: ConditionAnswers | undefined): {
  questionScore: number;
  anyAnswered: boolean;
  answers: NormalizedAnswers;
} {
  let anyAnswered = false;
  const normalized: NormalizedAnswers = {
    coreFunction: 'yes',
    completeness: 'yes',
    structure: 'yes',
    usage: 'yes',
    originality: 'yes',
  };

  let score = 0;

  for (const dim of DIMENSIONS) {
    const val = answers?.[dim];
    if (val !== undefined && val !== null) {
      anyAnswered = true;
      normalized[dim] = val;
    } else {
      normalized[dim] = 'yes'; // Unanswered defaults to 'yes'
    }

    // Scoring: yes = 20, partial = 10, no = 0
    const answerVal = normalized[dim];
    if (answerVal === 'yes') {
      score += 20;
    } else if (answerVal === 'partial') {
      score += 10;
    } else if (answerVal === 'no') {
      score += 0;
    }
  }

  return {
    questionScore: score,
    anyAnswered,
    answers: normalized,
  };
}
