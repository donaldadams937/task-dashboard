import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateGeminiResponse } from './geminiService';

describe('generateGeminiResponse', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends conversation context and returns Gemini text', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'A useful answer.' }] } }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const answer = await generateGeminiResponse({
      apiKey: 'secret-key',
      model: 'UT Flash',
      messages: [{ role: 'user', content: 'Earlier question' }],
      prompt: 'Current question',
    });

    expect(answer).toBe('A useful answer.');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('gemini-3.8-flash:generateContent'),
      expect.objectContaining({
        headers: expect.objectContaining({ 'x-goog-api-key': 'secret-key' }),
      }),
    );
    const request = fetchMock.mock.calls[0][1];
    expect(JSON.parse(request.body).contents).toHaveLength(2);
  });

  it('surfaces Gemini API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'API key is invalid.' } }),
    }));

    await expect(generateGeminiResponse({
      apiKey: 'bad-key',
      model: 'UT Pro',
      messages: [],
      prompt: 'Hello',
    })).rejects.toThrow('API key is invalid.');
  });
});
