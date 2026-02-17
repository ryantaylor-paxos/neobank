import { NextRequest, NextResponse } from 'next/server';
import { createFiatWithdrawalAccount, listFiatAccounts } from '@/lib/paxos/client';

export async function GET(req: NextRequest) {
  try {
    const profileId = req.nextUrl.searchParams.get('profile_id');
    if (!profileId) {
      return NextResponse.json({ error: 'profile_id required' }, { status: 400 });
    }
    const result = await listFiatAccounts(profileId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const account = await createFiatWithdrawalAccount(body);
    return NextResponse.json(account);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
