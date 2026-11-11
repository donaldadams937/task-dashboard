const CACHE_DURATION = 15 * 60 * 1000;
let cachedIdentity;
let cachedAt = 0;
let identityPromise;

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

async function fetchGitHubProfile() {
  const response = await fetch('https://api.github.com/users/donaldadams937', {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error('GitHub profile lookup failed.');
  const profile = await response.json();

  return [
    'Confirmed public GitHub profile for the current user:',
    `- Name: ${clean(profile.name) || 'Donald Adams'}`,
    '- GitHub username: donaldadams937',
    clean(profile.bio) && `- Bio: ${clean(profile.bio)}`,
    clean(profile.company) && `- Company: ${clean(profile.company)}`,
    clean(profile.location) && `- Location: ${clean(profile.location)}`,
    clean(profile.blog) && `- Website: ${clean(profile.blog)}`,
    `- Public repositories: ${profile.public_repos ?? 'unknown'}`,
    `- GitHub profile: ${clean(profile.html_url) || 'https://github.com/donaldadams937'}`,
  ].filter(Boolean).join('\n');
}

async function fetchWikipediaResults() {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: '"Donald Adams"',
    gsrlimit: '3',
    prop: 'extracts',
    exintro: '1',
    explaintext: '1',
    exsentences: '3',
    format: 'json',
    origin: '*',
  });
  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
  if (!response.ok) throw new Error('Wikipedia lookup failed.');
  const data = await response.json();
  const pages = Object.values(data.query?.pages ?? {});
  if (!pages.length) return '';

  return [
    'Public Wikipedia search results for other people or topics named Donald Adams:',
    ...pages.map((page) => `- ${page.title}: ${clean(page.extract) || 'No summary available.'}`),
  ].join('\n');
}

export async function getDonaldAdamsContext({ force = false } = {}) {
  if (!force && cachedIdentity && Date.now() - cachedAt < CACHE_DURATION) {
    return cachedIdentity;
  }

  if (!identityPromise || force) {
    identityPromise = Promise.allSettled([
      fetchGitHubProfile(),
      fetchWikipediaResults(),
    ]).then((results) => {
      const context = results
        .filter((result) => result.status === 'fulfilled' && result.value)
        .map((result) => result.value)
        .join('\n\n');

      if (!context) throw new Error('Public identity sources are currently unavailable.');
      cachedIdentity = context;
      cachedAt = Date.now();
      return context;
    }).finally(() => {
      identityPromise = undefined;
    });
  }

  return identityPromise;
}

export function shouldLoadIdentityContext(prompt) {
  return /\b(donald\s+adams|donaldadams937|who\s+am\s+i|about\s+me|my\s+profile)\b/i.test(prompt);
}

export function preloadPublicIdentity() {
  return getDonaldAdamsContext().catch(() => '');
}
