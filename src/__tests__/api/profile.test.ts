import { NextRequest } from 'next/server';

jest.mock('@/lib/paxos/client', () => ({
  getProfileBalances: jest.fn(),
  listTransfers: jest.fn(),
  listDepositInstructions: jest.fn(),
}));

import { GET } from '@/app/api/profile/route';
import * as client from '@/lib/paxos/client';

const mockGetBalances = client.getProfileBalances as jest.Mock;
const mockListTransfers = client.listTransfers as jest.Mock;
const mockListInstructions = client.listDepositInstructions as jest.Mock;

beforeEach(() => {
  mockGetBalances.mockResolvedValue({ items: [{ asset: 'USD', available: '500.00', trading: '0' }] });
  mockListTransfers.mockResolvedValue({ items: [{ id: 'xfr_1', amount: '100', asset: 'USD' }] });
  mockListInstructions.mockResolvedValue({ items: [] });
});

afterEach(() => jest.clearAllMocks());

function makeRequest(profileId?: string) {
  const url = profileId
    ? `http://localhost/api/profile?profile_id=${profileId}`
    : 'http://localhost/api/profile';
  return new NextRequest(url);
}

describe('GET /api/profile', () => {
  it('returns balances, transfers, and deposit instructions', async () => {
    const res = await GET(makeRequest('prof_1'));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.balances).toHaveLength(1);
    expect(json.balances[0].asset).toBe('USD');
    expect(json.transfers).toHaveLength(1);
    expect(json.deposit_instructions).toHaveLength(0);
  });

  it('returns 400 when profile_id is missing', async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('profile_id');
  });

  it('calls all three Paxos functions with correct profile_id', async () => {
    await GET(makeRequest('prof_abc'));
    expect(mockGetBalances).toHaveBeenCalledWith('prof_abc');
    expect(mockListTransfers).toHaveBeenCalledWith('prof_abc');
    expect(mockListInstructions).toHaveBeenCalledWith('prof_abc');
  });

  it('returns empty arrays when individual calls fail (Promise.allSettled)', async () => {
    mockGetBalances.mockRejectedValueOnce(new Error('Balances unavailable'));
    mockListTransfers.mockRejectedValueOnce(new Error('Transfers unavailable'));

    const res = await GET(makeRequest('prof_1'));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.balances).toEqual([]);
    expect(json.transfers).toEqual([]);
    // deposit instructions still succeed
    expect(json.deposit_instructions).toEqual([]);
  });

  it('returns partial data when only one call fails', async () => {
    mockListTransfers.mockRejectedValueOnce(new Error('Transfers down'));

    const res = await GET(makeRequest('prof_1'));
    const json = await res.json();

    expect(json.balances).toHaveLength(1);
    expect(json.transfers).toEqual([]);
  });
});
