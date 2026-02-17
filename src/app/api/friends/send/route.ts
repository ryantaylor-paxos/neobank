import { NextRequest, NextResponse } from 'next/server';
import { createInternalTransfer } from '@/lib/paxos/client';

export async function POST(req: NextRequest) {
  try {
    const { source_profile_id, destination_profile_id, amount } =
      await req.json();
    if (!source_profile_id || !destination_profile_id || !amount) {
      return NextResponse.json(
        { error: 'source_profile_id, destination_profile_id, and amount required' },
        { status: 400 },
      );
    }
    const ref_id = `friend_transfer_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const transfer = await createInternalTransfer({
      source_profile_id,
      destination_profile_id,
      asset: 'USD',
      amount,
      ref_id,
    });
    return NextResponse.json(transfer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
