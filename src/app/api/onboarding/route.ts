import { NextRequest, NextResponse } from 'next/server';
import {
  createIdentity,
  createProfile,
  createAccount,
} from '@/lib/paxos/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      first_name,
      last_name,
      date_of_birth,
      address1,
      city,
      province,
      zip,
      country,
      tax_id,
    } = body;

    const ref_id = `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // 1. Create identity
    const identity = await createIdentity({
      ref_id,
      first_name,
      last_name,
      date_of_birth,
      address1,
      city,
      province,
      zip,
      country: country || 'USA',
      tax_id,
    });

    // 2. Create profile
    const profile = await createProfile(`${first_name} ${last_name}`);

    // 3. Link identity to profile via account
    const account = await createAccount(profile.id, identity.id);

    return NextResponse.json({ identity, profile, account });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
