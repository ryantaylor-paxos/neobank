import { NextRequest, NextResponse } from 'next/server';
import { createDepositInstructions } from '@/lib/paxos/client';

export async function POST(req: NextRequest) {
  try {
    const { profile_id } = await req.json();
    if (!profile_id) {
      return NextResponse.json({ error: 'profile_id required' }, { status: 400 });
    }
    const instructions = await createDepositInstructions(profile_id);
    return NextResponse.json(instructions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
