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

  it('aggregates itemMatchesCategory as logical AND and halts the pipeline on mismatch', async () => {
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
        modelUsed: 'python',
        result: {
          damages: [],
          itemMatchesCategory: true,
          visibilityIssues: [],
          imageQualityScore: 0.85,
        },
      })
      .mockResolvedValueOnce({
        modelUsed: 'python',
        result: {
          damages: [],
          itemMatchesCategory: false,
          visibilityIssues: [],
          imageQualityScore: 0.72,
        },
      });

    await processRequest('test-req');

    // Mismatch must halt the pipeline before grading: no GRADED transition,
    // and the request is marked FAILED with a CATEGORY_MISMATCH failure code.
    expect(transitionStatusMock).not.toHaveBeenCalledWith(
      'test-req',
      'ANALYZING',
      'GRADED',
      expect.anything()
    );
    expect(transitionStatusMock).toHaveBeenCalledWith(
      'test-req',
      'VALIDATED',
      'FAILED',
      expect.objectContaining({
        failureCode: 'CATEGORY_MISMATCH',
      })
    );
  });

  it('halts the pipeline instead of faking success when a view detection call fails', async () => {
    getMock.mockResolvedValue({
      requestId: 'test-req',
      customerId: 'cust-1',
      category: 'books',
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

    // Simulate the Python AI engine being unreachable for one view.
    detectSingleViewMock
      .mockResolvedValueOnce({
        modelUsed: 'python',
        result: {
          damages: [],
          itemMatchesCategory: true,
          visibilityIssues: [],
          imageQualityScore: 0.9,
        },
      })
      .mockRejectedValueOnce(new Error('Python AI engine is unreachable or returned an error.'));

    await processRequest('test-req');

    // A failed detection call must never be papered over as a match/pass —
    // the request should fail outright rather than producing a fabricated grade.
    expect(transitionStatusMock).not.toHaveBeenCalledWith(
      'test-req',
      'ANALYZING',
      'GRADED',
      expect.anything()
    );
    expect(transitionStatusMock).toHaveBeenCalledWith(
      'test-req',
      'VALIDATED',
      'FAILED',
      expect.objectContaining({
        failureReason: expect.stringContaining('unreachable'),
      })
    );
  });
});
