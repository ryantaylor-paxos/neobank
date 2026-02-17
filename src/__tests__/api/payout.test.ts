import { NextRequest } from 'next/server';

jest.mock('@/lib/paxos/client', () => ({
  createFiatWithdrawalAccount: jest.fn(),
  listFiatAccounts: jest.fn(),
  createFiatWithdrawal: jest.fn(),
}));

import { GET, POST } from '@/app/api/payout/accounts/route';
import { POST as withdrawPost } from '@/app/api/payout/withdraw/route';
import * as client from '@/lib/paxos/client';

const mockCreateAccount = client.createFiatWithdrawalAccount as jest.Mock;
const mockListAccounts = client.listFiatAccounts as jest.Mock;
const mockCreateWithdrawal = client.createFiatWithdrawal as jest.Mock;

afterEach(() => jest.clearAllMocks());

const mockFiatAccount = {
  id: 'facct_1',
  nickname: 'My Checking',
  account_number_last4: '6789',
  routing_number: '021000021',
  status: 'ACTIVE',
};

const mockWithdrawal = { id: 'wd_1', status: 'PENDING', amount: '500.00', currency: 'USD' };

function makeGet(url: string) {
  return new NextRequest(url);
}
function makePost(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/payout/accounts', () => {
  beforeEach(() => {
    mockListAccounts.mockResolvedValue({ items: [mockFiatAccount] });
  });

  it('returns linked fiat accounts', async () => {
    const res = await GET(makeGet('http://localhost/api/payout/accounts?profile_id=prof_1'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.items[0].nickname).toBe('My Checking');
  });

  it('calls listFiatAccounts with profile_id', async () => {
    await GET(makeGet('http://localhost/api/payout/accounts?profile_id=prof_abc'));
    expect(mockListAccounts).toHaveBeenCalledWith('prof_abc');
  });

  it('returns 400 when profile_id is missing', async () => {
    const res = await GET(makeGet('http://localhost/api/payout/accounts'));
    expect(res.status).toBe(400);
  });

  it('returns 500 on error', async () => {
    mockListAccounts.mockRejectedValueOnce(new Error('DB error'));
    const res = await GET(makeGet('http://localhost/api/payout/accounts?profile_id=prof_1'));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/payout/accounts', () => {
  const validBody = {
    profile_id: 'prof_1',
    nickname: 'My Chase Checking',
    account_owner_name: 'Jane Smith',
    routing_number: '021000021',
    account_number: '000123456789',
    account_type: 'CHECKING',
  };

  beforeEach(() => {
    mockCreateAccount.mockResolvedValue(mockFiatAccount);
  });

  it('creates a fiat account and returns it', async () => {
    const res = await POST(makePost('http://localhost/api/payout/accounts', validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(mockFiatAccount);
  });

  it('passes all fields to createFiatWithdrawalAccount', async () => {
    await POST(makePost('http://localhost/api/payout/accounts', validBody));
    expect(mockCreateAccount).toHaveBeenCalledWith(validBody);
  });

  it('supports SAVINGS account type', async () => {
    const savingsBody = { ...validBody, account_type: 'SAVINGS' };
    await POST(makePost('http://localhost/api/payout/accounts', savingsBody));
    expect(mockCreateAccount).toHaveBeenCalledWith(
      expect.objectContaining({ account_type: 'SAVINGS' }),
    );
  });

  it('returns 500 on error', async () => {
    mockCreateAccount.mockRejectedValueOnce(new Error('Account rejected'));
    const res = await POST(makePost('http://localhost/api/payout/accounts', validBody));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('Account rejected');
  });
});

describe('POST /api/payout/withdraw', () => {
  const validBody = {
    profile_id: 'prof_1',
    fiat_account_id: 'facct_1',
    amount: '500.00',
  };

  beforeEach(() => {
    mockCreateWithdrawal.mockResolvedValue(mockWithdrawal);
  });

  it('creates a withdrawal and returns it', async () => {
    const res = await withdrawPost(makePost('http://localhost/api/payout/withdraw', validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(mockWithdrawal);
  });

  it('generates a unique ref_id starting with withdraw_', async () => {
    await withdrawPost(makePost('http://localhost/api/payout/withdraw', validBody));
    const { ref_id } = mockCreateWithdrawal.mock.calls[0][0];
    expect(ref_id).toMatch(/^withdraw_\d+_/);
  });

  it('returns 400 when profile_id is missing', async () => {
    const res = await withdrawPost(
      makePost('http://localhost/api/payout/withdraw', { fiat_account_id: 'facct_1', amount: '100' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when fiat_account_id is missing', async () => {
    const res = await withdrawPost(
      makePost('http://localhost/api/payout/withdraw', { profile_id: 'prof_1', amount: '100' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is missing', async () => {
    const res = await withdrawPost(
      makePost('http://localhost/api/payout/withdraw', { profile_id: 'prof_1', fiat_account_id: 'facct_1' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 500 when withdrawal fails', async () => {
    mockCreateWithdrawal.mockRejectedValueOnce(new Error('Insufficient funds'));
    const res = await withdrawPost(makePost('http://localhost/api/payout/withdraw', validBody));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('Insufficient funds');
  });
});
