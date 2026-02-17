import { NextRequest } from 'next/server';

jest.mock('@/lib/paxos/client', () => ({
  listProfiles: jest.fn(),
  createInternalTransfer: jest.fn(),
}));

import { GET } from '@/app/api/friends/profiles/route';
import { POST } from '@/app/api/friends/send/route';
import * as client from '@/lib/paxos/client';

const mockListProfiles = client.listProfiles as jest.Mock;
const mockCreateTransfer = client.createInternalTransfer as jest.Mock;

afterEach(() => jest.clearAllMocks());

const mockProfiles = [
  { id: 'prof_1', nickname: 'Jane Smith', status: 'ACTIVE' },
  { id: 'prof_2', nickname: 'Bob Jones', status: 'ACTIVE' },
];

const mockTransfer = {
  id: 'xfr_1',
  status: 'SETTLED',
  amount: '50.00',
  asset: 'USD',
  direction: 'DEBIT',
  created_at: '2024-01-15T10:00:00Z',
};

function makePost(body: unknown) {
  return new NextRequest('http://localhost/api/friends/send', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/friends/profiles', () => {
  beforeEach(() => {
    mockListProfiles.mockResolvedValue({ items: mockProfiles });
  });

  it('returns all profiles', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.items).toHaveLength(2);
  });

  it('returns profiles with expected fields', async () => {
    const res = await GET();
    const json = await res.json();
    expect(json.items[0]).toMatchObject({ id: 'prof_1', nickname: 'Jane Smith', status: 'ACTIVE' });
  });

  it('returns 500 when listProfiles fails', async () => {
    mockListProfiles.mockRejectedValueOnce(new Error('Paxos down'));
    const res = await GET();
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('Paxos down');
  });

  it('returns empty items when no profiles exist', async () => {
    mockListProfiles.mockResolvedValueOnce({ items: [] });
    const res = await GET();
    const json = await res.json();
    expect(json.items).toHaveLength(0);
  });
});

describe('POST /api/friends/send', () => {
  const validBody = {
    source_profile_id: 'prof_1',
    destination_profile_id: 'prof_2',
    amount: '50.00',
  };

  beforeEach(() => {
    mockCreateTransfer.mockResolvedValue(mockTransfer);
  });

  it('creates and returns a transfer', async () => {
    const res = await POST(makePost(validBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(mockTransfer);
  });

  it('always transfers USD asset', async () => {
    await POST(makePost(validBody));
    expect(mockCreateTransfer).toHaveBeenCalledWith(
      expect.objectContaining({ asset: 'USD' }),
    );
  });

  it('generates a unique ref_id starting with friend_transfer_', async () => {
    await POST(makePost(validBody));
    const { ref_id } = mockCreateTransfer.mock.calls[0][0];
    expect(ref_id).toMatch(/^friend_transfer_\d+_/);
  });

  it('passes source and destination correctly', async () => {
    await POST(makePost(validBody));
    expect(mockCreateTransfer).toHaveBeenCalledWith(
      expect.objectContaining({
        source_profile_id: 'prof_1',
        destination_profile_id: 'prof_2',
        amount: '50.00',
      }),
    );
  });

  it('returns 400 when source_profile_id is missing', async () => {
    const res = await POST(makePost({ destination_profile_id: 'prof_2', amount: '50' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when destination_profile_id is missing', async () => {
    const res = await POST(makePost({ source_profile_id: 'prof_1', amount: '50' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when amount is missing', async () => {
    const res = await POST(makePost({ source_profile_id: 'prof_1', destination_profile_id: 'prof_2' }));
    expect(res.status).toBe(400);
  });

  it('returns 500 when transfer fails', async () => {
    mockCreateTransfer.mockRejectedValueOnce(new Error('Insufficient balance'));
    const res = await POST(makePost(validBody));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('Insufficient balance');
  });
});
