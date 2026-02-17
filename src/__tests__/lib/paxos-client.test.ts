// Mock auth so tests don't need real OAuth
jest.mock('@/lib/paxos/auth', () => ({
  getPaxosToken: jest.fn().mockResolvedValue('mock_bearer_token'),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

function mockApiResponse(data: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    text: async () => JSON.stringify(data),
  } as unknown as Response);
}

function mockApiError(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => message,
  } as unknown as Response);
}

describe('Paxos API client', () => {
  describe('createIdentity', () => {
    it('POSTs to /identity/identities with correct body', async () => {
      const { createIdentity } = await import('@/lib/paxos/client');
      const mockIdentity = { id: 'ident_1', status: 'PENDING', identity_type: 'PERSON' };
      mockApiResponse(mockIdentity);

      const result = await createIdentity({
        ref_id: 'ref_001',
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1990-01-01',
        address1: '123 Main St',
        city: 'New York',
        province: 'NY',
        zip: '10001',
        country: 'USA',
      });

      expect(result).toEqual(mockIdentity);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/identity/identities');
      expect(opts.method).toBe('POST');

      const body = JSON.parse(opts.body);
      expect(body.identity_type).toBe('PERSON');
      expect(body.person_details.first_name).toBe('Jane');
      expect(body.person_details.last_name).toBe('Smith');
      expect(body.person_details.address.city).toBe('New York');
    });

    it('includes tax_id when provided', async () => {
      jest.resetModules();
      jest.mock('@/lib/paxos/auth', () => ({
        getPaxosToken: jest.fn().mockResolvedValue('mock_bearer_token'),
      }));
      mockApiResponse({ id: 'ident_2', status: 'PENDING' });

      const { createIdentity } = await import('@/lib/paxos/client');
      await createIdentity({
        ref_id: 'ref_002',
        first_name: 'Bob',
        last_name: 'Jones',
        date_of_birth: '1985-06-15',
        address1: '456 Oak Ave',
        city: 'Chicago',
        province: 'IL',
        zip: '60601',
        country: 'USA',
        tax_id: '123-45-6789',
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.person_details.tax_id_number).toBe('123-45-6789');
    });

    it('sends Bearer token in Authorization header', async () => {
      jest.resetModules();
      jest.mock('@/lib/paxos/auth', () => ({
        getPaxosToken: jest.fn().mockResolvedValue('mock_bearer_token'),
      }));
      mockApiResponse({ id: 'ident_3' });

      const { createIdentity } = await import('@/lib/paxos/client');
      await createIdentity({
        ref_id: 'ref_003',
        first_name: 'Alice',
        last_name: 'Brown',
        date_of_birth: '1992-03-20',
        address1: '789 Pine Rd',
        city: 'Austin',
        province: 'TX',
        zip: '73301',
        country: 'USA',
      });

      const [, opts] = mockFetch.mock.calls[0];
      expect(opts.headers['Authorization']).toBe('Bearer mock_bearer_token');
    });

    it('throws when API returns error', async () => {
      jest.resetModules();
      jest.mock('@/lib/paxos/auth', () => ({
        getPaxosToken: jest.fn().mockResolvedValue('mock_bearer_token'),
      }));
      mockApiError(400, 'Invalid request');

      const { createIdentity } = await import('@/lib/paxos/client');
      await expect(
        createIdentity({
          ref_id: 'ref_bad',
          first_name: 'Bad',
          last_name: 'Request',
          date_of_birth: '1990-01-01',
          address1: '1 Main St',
          city: 'City',
          province: 'ST',
          zip: '00000',
          country: 'USA',
        }),
      ).rejects.toThrow('400');
    });
  });

  describe('createProfile', () => {
    it('POSTs to /profiles with nickname', async () => {
      jest.resetModules();
      jest.mock('@/lib/paxos/auth', () => ({
        getPaxosToken: jest.fn().mockResolvedValue('mock_bearer_token'),
      }));
      const mockProfile = { id: 'prof_1', nickname: 'Jane Smith', status: 'ACTIVE' };
      mockApiResponse(mockProfile);

      const { createProfile } = await import('@/lib/paxos/client');
      const result = await createProfile('Jane Smith');

      expect(result).toEqual(mockProfile);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/profiles');
      expect(JSON.parse(opts.body).nickname).toBe('Jane Smith');
    });
  });

  describe('createAccount', () => {
    it('POSTs to /accounts with profile_id and identity_id', async () => {
      jest.resetModules();
      jest.mock('@/lib/paxos/auth', () => ({
        getPaxosToken: jest.fn().mockResolvedValue('mock_bearer_token'),
      }));
      const mockAccount = { id: 'acc_1', profile_id: 'prof_1', identity_id: 'ident_1', status: 'ACTIVE' };
      mockApiResponse(mockAccount);

      const { createAccount } = await import('@/lib/paxos/client');
      const result = await createAccount('prof_1', 'ident_1');

      expect(result).toEqual(mockAccount);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.profile_id).toBe('prof_1');
      expect(body.identity_id).toBe('ident_1');
    });
  });

  describe('getProfileBalances', () => {
    it('GETs balances for a profile', async () => {
      jest.resetModules();
      jest.mock('@/lib/paxos/auth', () => ({
        getPaxosToken: jest.fn().mockResolvedValue('mock_bearer_token'),
      }));
      const mockBalances = { items: [{ asset: 'USD', available: '1000.00', trading: '0.00' }] };
      mockApiResponse(mockBalances);

      const { getProfileBalances } = await import('@/lib/paxos/client');
      const result = await getProfileBalances('prof_1');

      expect(result).toEqual(mockBalances);
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('/profiles/prof_1/balances');
    });
  });

  describe('createFiatWithdrawal', () => {
    it('POSTs withdrawal with all required fields', async () => {
      jest.resetModules();
      jest.mock('@/lib/paxos/auth', () => ({
        getPaxosToken: jest.fn().mockResolvedValue('mock_bearer_token'),
      }));
      const mockWithdrawal = { id: 'wd_1', status: 'PENDING', amount: '500.00', currency: 'USD' };
      mockApiResponse(mockWithdrawal);

      const { createFiatWithdrawal } = await import('@/lib/paxos/client');
      const result = await createFiatWithdrawal({
        profile_id: 'prof_1',
        fiat_account_id: 'facct_1',
        amount: '500.00',
        ref_id: 'ref_wd_001',
      });

      expect(result).toEqual(mockWithdrawal);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.profile_id).toBe('prof_1');
      expect(body.fiat_account_id).toBe('facct_1');
      expect(body.amount).toBe('500.00');
      expect(body.currency).toBe('USD');
    });
  });

  describe('createInternalTransfer', () => {
    it('POSTs transfer between profiles', async () => {
      jest.resetModules();
      jest.mock('@/lib/paxos/auth', () => ({
        getPaxosToken: jest.fn().mockResolvedValue('mock_bearer_token'),
      }));
      const mockTransfer = { id: 'xfr_1', status: 'SETTLED', amount: '100.00', asset: 'USD' };
      mockApiResponse(mockTransfer);

      const { createInternalTransfer } = await import('@/lib/paxos/client');
      const result = await createInternalTransfer({
        source_profile_id: 'prof_src',
        destination_profile_id: 'prof_dst',
        asset: 'USD',
        amount: '100.00',
        ref_id: 'ref_xfr_001',
      });

      expect(result).toEqual(mockTransfer);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.source_profile_id).toBe('prof_src');
      expect(body.destination_profile_id).toBe('prof_dst');
      expect(body.asset).toBe('USD');
    });
  });

  describe('sandboxDeposit', () => {
    it('POSTs to sandbox endpoint with USD', async () => {
      jest.resetModules();
      jest.mock('@/lib/paxos/auth', () => ({
        getPaxosToken: jest.fn().mockResolvedValue('mock_bearer_token'),
      }));
      mockApiResponse({ status: 'ok' });

      const { sandboxDeposit } = await import('@/lib/paxos/client');
      await sandboxDeposit('prof_1', '1000.00', 'USD');

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/sandbox/profiles/prof_1/deposit');
      expect(opts.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.asset).toBe('USD');
      expect(body.amount).toBe('1000.00');
    });
  });
});
