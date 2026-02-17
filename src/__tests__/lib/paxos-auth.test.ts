// We test the auth module in isolation by mocking the env and global fetch.
// We use jest.isolateModules() so each test gets a fresh module with a clean token cache.

const CLIENT_ID = 'test-client-id';
const CLIENT_SECRET = 'test-client-secret';
const OAUTH_URL = 'https://oauth.sandbox.paxos.com/oauth2/token';

process.env.PAXOS_CLIENT_ID = CLIENT_ID;
process.env.PAXOS_CLIENT_SECRET = CLIENT_SECRET;
process.env.PAXOS_OAUTH_URL = OAUTH_URL;
process.env.PAXOS_API_URL = 'https://api.sandbox.paxos.com/v2';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

const mockTokenResponse = {
  access_token: 'test_token_abc123',
  expires_in: 3600,
  token_type: 'bearer',
  scope: 'identity:read_identity',
};

function mockSuccessfulAuth() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => mockTokenResponse,
  } as unknown as Response);
}

describe('getPaxosToken', () => {
  it('fetches a token and returns access_token', async () => {
    mockSuccessfulAuth();
    await jest.isolateModulesAsync(async () => {
      const { getPaxosToken } = await import('@/lib/paxos/auth');
      const token = await getPaxosToken();
      expect(token).toBe('test_token_abc123');
    });
  });

  it('calls the OAuth URL from environment', async () => {
    mockSuccessfulAuth();
    await jest.isolateModulesAsync(async () => {
      const { getPaxosToken } = await import('@/lib/paxos/auth');
      await getPaxosToken();
      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe(OAUTH_URL);
    });
  });

  it('sends client_credentials grant type', async () => {
    mockSuccessfulAuth();
    await jest.isolateModulesAsync(async () => {
      const { getPaxosToken } = await import('@/lib/paxos/auth');
      await getPaxosToken();
      const [, options] = mockFetch.mock.calls[0];
      const body = options.body.toString();
      expect(body).toContain('grant_type=client_credentials');
    });
  });

  it('sends client_id and client_secret from env', async () => {
    mockSuccessfulAuth();
    await jest.isolateModulesAsync(async () => {
      const { getPaxosToken } = await import('@/lib/paxos/auth');
      await getPaxosToken();
      const [, options] = mockFetch.mock.calls[0];
      const body = options.body.toString();
      expect(body).toContain(`client_id=${CLIENT_ID}`);
      expect(body).toContain(`client_secret=${CLIENT_SECRET}`);
    });
  });

  it('throws on failed OAuth response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    } as unknown as Response);

    await jest.isolateModulesAsync(async () => {
      const { getPaxosToken } = await import('@/lib/paxos/auth');
      await expect(getPaxosToken()).rejects.toThrow('Paxos auth failed');
    });
  });

  it('uses Content-Type application/x-www-form-urlencoded', async () => {
    mockSuccessfulAuth();
    await jest.isolateModulesAsync(async () => {
      const { getPaxosToken } = await import('@/lib/paxos/auth');
      await getPaxosToken();
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    });
  });

  it('caches the token and avoids extra fetch calls within the same module instance', async () => {
    mockSuccessfulAuth();
    await jest.isolateModulesAsync(async () => {
      const { getPaxosToken } = await import('@/lib/paxos/auth');
      const t1 = await getPaxosToken();
      const t2 = await getPaxosToken();
      expect(t1).toBe(t2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
