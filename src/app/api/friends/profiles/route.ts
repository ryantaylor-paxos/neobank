import { NextResponse } from 'next/server';
import { listProfiles } from '@/lib/paxos/client';

export async function GET() {
  try {
    const result = await listProfiles();
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
