import { NextRequest, NextResponse } from 'next/server';
import { sandboxDeposit } from '@/lib/paxos/client';

export async function POST(req: NextRequest) {
  try {
    const { profile_id, amount } = await req.json();
    if (!profile_id || !amount) {
      return NextResponse.json(
        { error: 'profile_id and amount required' },
        { status: 400 },
      );
    }
    const result = await sandboxDeposit(profile_id, amount, 'USD');
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
