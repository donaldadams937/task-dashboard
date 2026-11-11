import { beforeEach, describe, expect, it, vi } from 'vitest';

const createCompletion = vi.fn();
const createEngine = vi.fn();

vi.mock('@mlc-ai/web-llm', () => ({
  CreateMLCEngine: createEngine,
}));

describe('localAIService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'gpu', {
      configurable: true,
      value: {},
    });
    createCompletion.mockResolvedValue({
      choices: [{ message: { content: 'A local answer.' } }],
    });
    createEngine.mockResolvedValue({
      chat: { completions: { create: createCompletion } },
    });
  });

  it('loads a local model and sends conversation context', async () => {
    const { generateLocalResponse } = await import('./localAIService');
    const onProgress = vi.fn();

    const answer = await generateLocalResponse({
      model: 'UT Flash',
      messages: [{ role: 'user', content: 'Earlier question' }],
      prompt: 'Current question',
      onProgress,
    });

    expect(answer).toBe('A local answer.');
    expect(createEngine).toHaveBeenCalledWith(
      'Qwen3-0.6B-q4f16_1-MLC',
      expect.objectContaining({ initProgressCallback: expect.any(Function) }),
    );
    expect(createCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          { role: 'user', content: 'Current question' },
        ]),
      }),
    );
  });

  it('explains when WebGPU is unavailable', async () => {
    delete navigator.gpu;
    const { generateLocalResponse } = await import('./localAIService');

    await expect(generateLocalResponse({
      model: 'UT Flash',
      messages: [],
      prompt: 'Hello',
    })).rejects.toThrow('Local AI requires WebGPU');
  });
});
