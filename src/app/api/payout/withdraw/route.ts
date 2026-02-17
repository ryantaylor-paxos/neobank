import { NextRequest, NextResponse } from 'next/server';
import { createFiatWithdrawal } from '@/lib/paxos/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile_id, fiat_account_id, amount } = body;
    if (!profile_id || !fiat_account_id || !amount) {
      return NextResponse.json(
        { error: 'profile_id, fiat_account_id, and amount required' },
        { status: 400 },
      );
    }
    const ref_id = `withdraw_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const result = await createFiatWithdrawal({
      profile_id,
      fiat_account_id,
      amount,
      ref_id,
    });
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
