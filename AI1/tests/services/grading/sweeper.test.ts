import { describe, it, expect, vi, beforeEach } from 'vitest';

const findStuckAnalyzing = vi.fn();
const transitionStatus = vi.fn();

vi.mock('../../../src/services/db/repository.js', () => ({
  gradingRepository: {
    findStuckAnalyzing: (...args: unknown[]) => findStuckAnalyzing(...args),
    transitionStatus: (...args: unknown[]) => transitionStatus(...args),
  },
}));

const { sweepStuckRequests } = await import('../../../src/services/grading/sweeper.js');

function stuckRecord(requestId: string) {
  return {
    requestId,
    customerId: 'c1',
    category: 'electronics' as const,
    returnReason: 'x',
    customerNotes: '',
    status: 'ANALYZING' as const,
    statusHistory: [],
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('sweepStuckRequests', () => {
  beforeEach(() => {
    findStuckAnalyzing.mockReset();
    transitionStatus.mockReset();
  });

  it('marks each stuck request as FAILED', async () => {
    findStuckAnalyzing.mockResolvedValue([stuckRecord('req-1'), stuckRecord('req-2')]);
    transitionStatus.mockResolvedValue(undefined);

    const swept = await sweepStuckRequests();

    expect(swept).toBe(2);
    expect(transitionStatus).toHaveBeenCalledTimes(2);
    expect(transitionStatus).toHaveBeenCalledWith(
      'req-1',
      'ANALYZING',
      'FAILED',
      expect.objectContaining({ failureCode: 'MODEL_UNAVAILABLE' })
    );
  });

  it('returns 0 when nothing is stuck', async () => {
    findStuckAnalyzing.mockResolvedValue([]);
    const swept = await sweepStuckRequests();
    expect(swept).toBe(0);
    expect(transitionStatus).not.toHaveBeenCalled();
  });

  it('continues sweeping remaining requests if one transition fails', async () => {
    findStuckAnalyzing.mockResolvedValue([stuckRecord('req-1'), stuckRecord('req-2')]);
    transitionStatus.mockRejectedValueOnce(new Error('conditional write failed')).mockResolvedValueOnce(undefined);

    const swept = await sweepStuckRequests();

    expect(swept).toBe(1);
    expect(transitionStatus).toHaveBeenCalledTimes(2);
  });
});
