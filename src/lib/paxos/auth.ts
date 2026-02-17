const OAUTH_URL = process.env.PAXOS_OAUTH_URL!;
const CLIENT_ID = process.env.PAXOS_CLIENT_ID!;
const CLIENT_SECRET = process.env.PAXOS_CLIENT_SECRET!;

interface TokenCache {
  access_token: string;
  expires_at: number;
}

let tokenCache: TokenCache | null = null;

const ALL_SCOPES = [
  'identity:read_identity',
  'identity:write_identity',
  'funding:read_profile',
  'funding:write_profile',
  'funding:read_account',
  'funding:write_account',
  'transfer:read_transfer',
  'transfer:write_transfer',
].join(' ');

export async function getPaxosToken(scopes = ALL_SCOPES): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires_at - 60_000) {
    return tokenCache.access_token;
  }

  const form = new URLSearchParams();
  form.append('grant_type', 'client_credentials');
  form.append('client_id', CLIENT_ID);
  form.append('client_secret', CLIENT_SECRET);
  form.append('scope', scopes);

  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    body: form,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paxos auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return tokenCache.access_token;
}
