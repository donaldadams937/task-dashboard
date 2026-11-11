import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDonaldAdamsContext, shouldLoadIdentityContext } from './knowledgeService';

describe('knowledgeService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('combines the confirmed GitHub profile with public Wikipedia results', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: 'Donald Adams',
          bio: 'Builder',
          location: 'United States',
          public_repos: 12,
          html_url: 'https://github.com/donaldadams937',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          query: {
            pages: {
              1: { title: 'Donald Adams', extract: 'A public biography.' },
            },
          },
        }),
      }));

    const context = await getDonaldAdamsContext({ force: true });

    expect(context).toContain('GitHub username: donaldadams937');
    expect(context).toContain('Bio: Builder');
    expect(context).toContain('A public biography.');
  });

  it('detects identity questions without searching unrelated prompts', () => {
    expect(shouldLoadIdentityContext('Who is Donald Adams?')).toBe(true);
    expect(shouldLoadIdentityContext('Who am I?')).toBe(true);
    expect(shouldLoadIdentityContext('Explain React hooks')).toBe(false);
  });
});
