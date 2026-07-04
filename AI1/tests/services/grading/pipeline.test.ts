import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DetectionResult } from '../../../src/schemas/grading-report.schema.js';

const getMock = vi.fn();
const transitionStatusMock = vi.fn();

vi.mock('../../../src/services/db/repository.js', () => ({
  gradingRepository: {
    get: (...args: unknown[]) => getMock(...args),
    transitionStatus: (...args: unknown[]) => transitionStatusMock(...args),
  },
}));

vi.mock('../../../src/services/storage/s3.js', () => ({
  getObjectBuffer: vi.fn().mockResolvedValue(Buffer.from('dummy-image')),
}));

const detectSingleViewMock = vi.fn();
vi.mock('../../../src/services/ai/orchestrator.js', () => ({
  FallbackOrchestrator: class {
    detectSingleView(...args: unknown[]) {
      return detectSingleViewMock(...args);
    }
  },
}));

const { processRequest } = await import('../../../src/services/grading/pipeline.js');

describe('Grading Pipeline Aggregation logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DETECTION_VOTING_RUNS = '1';
  });

  it('aggregates photoQuality as the minimum and itemMatchesCategory as logical AND', async () => {
    getMock.mockResolvedValue({
      requestId: 'test-req',
      customerId: 'cust-1',
      category: 'electronics',
      returnReason: 'changed mind',
      customerNotes: 'no notes',
      status: 'VALIDATED',
      images: [
        { view: 'front', s3KeyAnalysis: 'key-front' },
        { view: 'back', s3KeyAnalysis: 'key-back' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Mock detection results:
    // View 1 (front): quality 0.85, itemMatchesCategory = true
    // View 2 (back): quality 0.72, itemMatchesCategory = false
    detectSingleViewMock
      .mockResolvedValueOnce({
        modelUsed: 'gemini',
        result: {
          damages: [],
          itemMatchesCategory: true,
          visibilityIssues: [],
          imageQualityScore: 0.85,
        },
      })
      .mockResolvedValueOnce({
        modelUsed: 'gemini',
        result: {
          damages: [],
          itemMatchesCategory: false,
          visibilityIssues: [],
          imageQualityScore: 0.72,
        },
      });

    await processRequest('test-req');

    // Expected transition to 'GRADED' status with finalReport
    expect(transitionStatusMock).toHaveBeenCalledWith(
      'test-req',
      'ANALYZING',
      'GRADED',
      expect.objectContaining({
        finalReport: expect.objectContaining({
          blendWeight: 0.72, // MIN(0.85, 0.72)
          itemMatchesCategory: false, // AND(true, false)
          requiresHumanReview: true,
          humanReviewReason: 'wrong_item_suspected', // Since itemMatchesCategory is false
        }),
      })
    );
  });
});
