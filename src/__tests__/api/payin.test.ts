import { NextRequest } from 'next/server';

jest.mock('@/lib/paxos/client', () => ({
  createDepositInstructions: jest.fn(),
  sandboxDeposit: jest.fn(),
}));

import { POST as depositInstructionsPost } from '@/app/api/payin/deposit-instructions/route';
import { POST as sandboxPost } from '@/app/api/payin/sandbox/route';
import * as client from '@/lib/paxos/client';

const mockCreateDepositInstructions = client.createDepositInstructions as jest.Mock;
const mockSandboxDeposit = client.sandboxDeposit as jest.Mock;

afterEach(() => jest.clearAllMocks());

function makePost(url: string, body: unknown) {
  return new NextRequest(url, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/payin/deposit-instructions', () => {
  const mockInstructions = {
    id: 'dep_1',
    profile_id: 'prof_1',
    account_number: '123456789',
    routing_number: '021000021',
    bank_name: 'Paxos Trust',
    beneficiary_name: 'Jane Smith',
    reference_id: 'REF_ABC',
  };

  beforeEach(() => {
    mockCreateDepositInstructions.mockResolvedValue(mockInstructions);
  });

  it('returns deposit instructions', async () => {
    const res = await depositInstructionsPost(
      makePost('http://localhost/api/payin/deposit-instructions', { profile_id: 'prof_1' }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(mockInstructions);
  });

  it('calls createDepositInstructions with the profile_id', async () => {
    await depositInstructionsPost(
      makePost('http://localhost/api/payin/deposit-instructions', { profile_id: 'prof_abc' }),
    );
    expect(mockCreateDepositInstructions).toHaveBeenCalledWith('prof_abc');
  });

  it('returns 400 when profile_id is missing', async () => {
    const res = await depositInstructionsPost(
      makePost('http://localhost/api/payin/deposit-instructions', {}),
    );
    expect(res.status).toBe(400);
  });

  it('returns 500 when client throws', async () => {
    mockCreateDepositInstructions.mockRejectedValueOnce(new Error('API down'));
    const res = await depositInstructionsPost(
      makePost('http://localhost/api/payin/deposit-instructions', { profile_id: 'prof_1' }),
    );
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('API down');
  });
});

describe('POST /api/payin/sandbox', () => {
  beforeEach(() => {
    mockSandboxDeposit.mockResolvedValue({ status: 'PENDING' });
  });

  it('calls sandboxDeposit with profile_id and amount', async () => {
    const res = await sandboxPost(
      makePost('http://localhost/api/payin/sandbox', { profile_id: 'prof_1', amount: '500.00' }),
    );
    expect(res.status).toBe(200);
    expect(mockSandboxDeposit).toHaveBeenCalledWith('prof_1', '500.00', 'USD');
  });

  it('returns 400 when profile_id is missing', async () => {
    const res = await sandboxPost(
      makePost('http://localhost/api/payin/sandbox', { amount: '100' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is missing', async () => {
    const res = await sandboxPost(
      makePost('http://localhost/api/payin/sandbox', { profile_id: 'prof_1' }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 500 when sandboxDeposit throws', async () => {
    mockSandboxDeposit.mockRejectedValueOnce(new Error('Sandbox error'));
    const res = await sandboxPost(
      makePost('http://localhost/api/payin/sandbox', { profile_id: 'prof_1', amount: '100' }),
    );
    expect(res.status).toBe(500);
  });
});
