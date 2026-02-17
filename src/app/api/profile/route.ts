import { NextRequest, NextResponse } from 'next/server';
import {
  getProfileBalances,
  listTransfers,
  listDepositInstructions,
} from '@/lib/paxos/client';

export async function GET(req: NextRequest) {
  try {
    const profileId = req.nextUrl.searchParams.get('profile_id');
    if (!profileId) {
      return NextResponse.json({ error: 'profile_id required' }, { status: 400 });
    }

    const [balancesRes, transfersRes, depositRes] = await Promise.allSettled([
      getProfileBalances(profileId),
      listTransfers(profileId),
      listDepositInstructions(profileId),
    ]);

    return NextResponse.json({
      balances:
        balancesRes.status === 'fulfilled' ? balancesRes.value.items : [],
      transfers:
        transfersRes.status === 'fulfilled' ? transfersRes.value.items : [],
      deposit_instructions:
        depositRes.status === 'fulfilled' ? depositRes.value.items : [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
