import { describe, it, expect, vi } from 'vitest';
import { FallbackOrchestrator } from '../../../src/services/ai/orchestrator.js';
import { CircuitBreaker } from '../../../src/services/ai/circuitBreaker.js';
import { ModelQuotaError, ModelUnavailableError } from '../../../src/utils/errors.js';
import type { SingleViewDetectionInput, RawModelResponse, VisionGrader } from '../../../src/services/ai/clients/types.js';

function cleanResponse(modelUsed: 'gemini' | 'gemma'): RawModelResponse {
  return {
    modelUsed,
    text: JSON.stringify({
      damages: [],
      itemMatchesCategory: true,
      visibilityIssues: [],
      imageQualityScore: 0.9,
    }),
  };
}

function fencedResponse(modelUsed: 'gemini' | 'gemma'): RawModelResponse {
  return { modelUsed, text: '```json\n' + cleanResponse(modelUsed).text + '\n```' };
}

function baseSingleViewInput(): SingleViewDetectionInput {
  return {
    requestId: 'req-1',
    category: 'electronics',
    returnReason: 'test',
    customerNotes: '',
    image: { view: 'front', buffer: Buffer.from('a'), mimetype: 'image/jpeg' },
  };
}

class FakeGrader implements VisionGrader {
  callCount = 0;
  constructor(
    public readonly name: 'gemini' | 'gemma',
    private readonly behavior: (call: number) => Promise<RawModelResponse>
  ) {}
  async detectSingleView(): Promise<RawModelResponse> {
    this.callCount += 1;
    return this.behavior(this.callCount);
  }
}

describe('FallbackOrchestrator', () => {
  it('returns the primary model result on a clean first response', async () => {
    const gemini = new FakeGrader('gemini', async () => cleanResponse('gemini'));
    const gemma = new FakeGrader('gemma', async () => cleanResponse('gemma'));
    const orch = new FallbackOrchestrator(gemini, gemma);

    const result = await orch.detectSingleView(baseSingleViewInput());
    expect(result.modelUsed).toBe('gemini');
    expect(gemma.callCount).toBe(0);
  });

  it('repairs fenced JSON without falling back to the secondary model', async () => {
    const gemini = new FakeGrader('gemini', async () => fencedResponse('gemini'));
    const gemma = new FakeGrader('gemma', async () => cleanResponse('gemma'));
    const orch = new FallbackOrchestrator(gemini, gemma);

    const result = await orch.detectSingleView(baseSingleViewInput());
    expect(result.modelUsed).toBe('gemini');
    expect(gemma.callCount).toBe(0);
  });

  it('falls back to gemma when gemini returns truncated JSON on both attempts', async () => {
    const gemini = new FakeGrader('gemini', async () => ({ modelUsed: 'gemini', text: '{"damages": [' }));
    const gemma = new FakeGrader('gemma', async () => cleanResponse('gemma'));
    const orch = new FallbackOrchestrator(gemini, gemma);

    const result = await orch.detectSingleView(baseSingleViewInput());
    expect(result.modelUsed).toBe('gemma');
  });

  it('falls back to gemma on a 429 quota error from gemini', async () => {
    const gemini = new FakeGrader('gemini', async () => {
      throw new ModelQuotaError('quota exceeded');
    });
    const gemma = new FakeGrader('gemma', async () => cleanResponse('gemma'));
    const orch = new FallbackOrchestrator(gemini, gemma);

    const result = await orch.detectSingleView(baseSingleViewInput());
    expect(result.modelUsed).toBe('gemma');
  });

  it('falls back to gemma when gemini times out', async () => {
    const gemini = new FakeGrader('gemini', async () => {
      throw new ModelUnavailableError('timed out');
    });
    const gemma = new FakeGrader('gemma', async () => cleanResponse('gemma'));
    const orch = new FallbackOrchestrator(gemini, gemma, new CircuitBreaker(999, 999999));

    const result = await orch.detectSingleView(baseSingleViewInput());
    expect(result.modelUsed).toBe('gemma');
  });

  it('throws when both models fail', async () => {
    const gemini = new FakeGrader('gemini', async () => {
      throw new ModelUnavailableError('gemini down');
    });
    const gemma = new FakeGrader('gemma', async () => {
      throw new ModelUnavailableError('gemma down');
    });
    const orch = new FallbackOrchestrator(gemini, gemma, new CircuitBreaker(999, 999999));

    await expect(orch.detectSingleView(baseSingleViewInput())).rejects.toThrow();
  });

  it('opens the circuit after consecutive failures and skips the primary entirely', async () => {
    const gemini = new FakeGrader('gemini', async () => {
      throw new ModelUnavailableError('gemini down');
    });
    const gemma = new FakeGrader('gemma', async () => cleanResponse('gemma'));
    const breaker = new CircuitBreaker(2, 60000);
    const orch = new FallbackOrchestrator(gemini, gemma, breaker);

    await orch.detectSingleView(baseSingleViewInput()); // failure 1
    await orch.detectSingleView(baseSingleViewInput()); // failure 2 -> breaker opens
    expect(breaker.state).toBe('open');

    const callsBeforeSkip = gemini.callCount;
    await orch.detectSingleView(baseSingleViewInput()); // should skip gemini entirely
    expect(gemini.callCount).toBe(callsBeforeSkip); // unchanged — primary was skipped
  });

  it('does not fall back on non-model errors from programming bugs', async () => {
    const gemini = new FakeGrader('gemini', async () => {
      throw new Error('unexpected programming error, not a model error');
    });
    const gemma = new FakeGrader('gemma', async () => cleanResponse('gemma'));
    const orch = new FallbackOrchestrator(gemini, gemma);

    await expect(orch.detectSingleView(baseSingleViewInput())).rejects.toThrow(/programming error/);
    expect(gemma.callCount).toBe(0);
  });
});

describe('CircuitBreaker', () => {
  it('starts closed', () => {
    const b = new CircuitBreaker(3, 1000);
    expect(b.state).toBe('closed');
  });

  it('opens after reaching the failure threshold', () => {
    const b = new CircuitBreaker(2, 100000);
    b.recordFailure();
    expect(b.state).toBe('closed');
    b.recordFailure();
    expect(b.state).toBe('open');
  });

  it('resets on success', () => {
    const b = new CircuitBreaker(2, 100000);
    b.recordFailure();
    b.recordSuccess();
    b.recordFailure();
    expect(b.state).toBe('closed');
  });

  it('half-opens after the cooldown elapses', async () => {
    vi.useFakeTimers();
    const b = new CircuitBreaker(1, 50);
    b.recordFailure();
    expect(b.state).toBe('open');
    vi.advanceTimersByTime(60);
    expect(b.state).toBe('closed');
    vi.useRealTimers();
  });
});
