import { NextRequest } from 'next/server';

jest.mock('@/lib/paxos/client', () => ({
  createIdentity: jest.fn(),
  createProfile: jest.fn(),
  createAccount: jest.fn(),
}));

import { POST } from '@/app/api/onboarding/route';
import * as client from '@/lib/paxos/client';

const mockCreateIdentity = client.createIdentity as jest.Mock;
const mockCreateProfile = client.createProfile as jest.Mock;
const mockCreateAccount = client.createAccount as jest.Mock;

const validBody = {
  first_name: 'Jane',
  last_name: 'Smith',
  date_of_birth: '1990-01-01',
  address1: '123 Main St',
  city: 'New York',
  province: 'NY',
  zip: '10001',
  country: 'USA',
};

const mockIdentity = { id: 'ident_1', status: 'PENDING', identity_type: 'PERSON' };
const mockProfile = { id: 'prof_1', nickname: 'Jane Smith', status: 'ACTIVE' };
const mockAccount = { id: 'acc_1', profile_id: 'prof_1', identity_id: 'ident_1', status: 'ACTIVE' };

beforeEach(() => {
  mockCreateIdentity.mockResolvedValue(mockIdentity);
  mockCreateProfile.mockResolvedValue(mockProfile);
  mockCreateAccount.mockResolvedValue(mockAccount);
});

afterEach(() => jest.clearAllMocks());

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/onboarding', () => {
  it('returns 200 with identity, profile, and account', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.identity).toEqual(mockIdentity);
    expect(json.profile).toEqual(mockProfile);
    expect(json.account).toEqual(mockAccount);
  });

  it('calls createIdentity with correct data', async () => {
    await POST(makeRequest(validBody));
    expect(mockCreateIdentity).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Jane',
        last_name: 'Smith',
        date_of_birth: '1990-01-01',
        address1: '123 Main St',
        city: 'New York',
        province: 'NY',
        zip: '10001',
        country: 'USA',
      }),
    );
  });

  it('generates a unique ref_id', async () => {
    await POST(makeRequest(validBody));
    const { ref_id } = mockCreateIdentity.mock.calls[0][0];
    expect(ref_id).toMatch(/^user_\d+_/);
  });

  it('calls createProfile with full name', async () => {
    await POST(makeRequest(validBody));
    expect(mockCreateProfile).toHaveBeenCalledWith('Jane Smith');
  });

  it('links account to profile and identity', async () => {
    await POST(makeRequest(validBody));
    expect(mockCreateAccount).toHaveBeenCalledWith('prof_1', 'ident_1');
  });

  it('defaults country to USA if not provided', async () => {
    const bodyNoCountry = { ...validBody, country: undefined };
    await POST(makeRequest(bodyNoCountry));
    expect(mockCreateIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'USA' }),
    );
  });

  it('passes tax_id when provided', async () => {
    await POST(makeRequest({ ...validBody, tax_id: '111-22-3333' }));
    expect(mockCreateIdentity).toHaveBeenCalledWith(
      expect.objectContaining({ tax_id: '111-22-3333' }),
    );
  });

  it('returns 500 when createIdentity throws', async () => {
    mockCreateIdentity.mockRejectedValueOnce(new Error('Paxos error'));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain('Paxos error');
  });

  it('returns 500 when createProfile throws', async () => {
    mockCreateProfile.mockRejectedValueOnce(new Error('Profile creation failed'));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });

  it('returns 500 when createAccount throws', async () => {
    mockCreateAccount.mockRejectedValueOnce(new Error('Account link failed'));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
  });
});
