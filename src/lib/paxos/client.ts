import { getPaxosToken } from './auth';

const API_URL = process.env.PAXOS_API_URL!;

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getPaxosToken();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Paxos API ${method} ${path} failed: ${res.status} ${text}`);
  }
  return (text ? JSON.parse(text) : null) as T;
}

// ─── Identity ───────────────────────────────────────────────────────────────

export interface PersonIdentity {
  id: string;
  status: string;
  identity_type: string;
  person_details: {
    first_name: string;
    last_name: string;
    date_of_birth: string;
    address: {
      address1: string;
      city: string;
      province: string;
      zip: string;
      country: string;
    };
  };
  metadata?: Record<string, string>;
}

export async function createIdentity(data: {
  ref_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  address1: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  tax_id?: string;
}): Promise<PersonIdentity> {
  return request('POST', '/identity/identities', {
    ref_id: data.ref_id,
    identity_type: 'PERSON',
    person_details: {
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      tax_id_number: data.tax_id,
      address: {
        address1: data.address1,
        city: data.city,
        province: data.province,
        zip: data.zip,
        country: data.country,
      },
    },
  });
}

export async function listIdentities(): Promise<{ items: PersonIdentity[] }> {
  return request('GET', '/identity/identities?limit=100');
}

export async function getIdentity(id: string): Promise<PersonIdentity> {
  return request('GET', `/identity/identities/${id}`);
}

// ─── Profiles ────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  nickname: string;
  status: string;
}

export interface Balance {
  asset: string;
  available: string;
  trading: string;
}

export async function createProfile(nickname: string): Promise<Profile> {
  return request('POST', '/profiles', { nickname });
}

export async function listProfiles(): Promise<{ items: Profile[] }> {
  return request('GET', '/profiles?limit=100');
}

export async function getProfileBalances(
  profileId: string,
): Promise<{ items: Balance[] }> {
  return request('GET', `/profiles/${profileId}/balances`);
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export interface Account {
  id: string;
  profile_id: string;
  identity_id: string;
  status: string;
}

export async function createAccount(
  profileId: string,
  identityId: string,
): Promise<Account> {
  return request('POST', '/accounts', {
    profile_id: profileId,
    identity_id: identityId,
  });
}

export async function listAccounts(): Promise<{ items: Account[] }> {
  return request('GET', '/accounts?limit=100');
}

// ─── Fiat Transfers ──────────────────────────────────────────────────────────

export interface DepositInstructions {
  id: string;
  profile_id: string;
  account_number: string;
  routing_number: string;
  bank_name: string;
  beneficiary_name: string;
  reference_id: string;
}

export async function createDepositInstructions(
  profileId: string,
): Promise<DepositInstructions> {
  return request('POST', '/fiat-transfers/deposit-instructions', {
    profile_id: profileId,
    currency: 'USD',
  });
}

export async function listDepositInstructions(
  profileId: string,
): Promise<{ items: DepositInstructions[] }> {
  return request(
    'GET',
    `/fiat-transfers/deposit-instructions?profile_id=${profileId}`,
  );
}

export interface FiatAccount {
  id: string;
  nickname: string;
  account_number_last4: string;
  routing_number: string;
  status: string;
}

export async function createFiatWithdrawalAccount(data: {
  profile_id: string;
  nickname: string;
  account_owner_name: string;
  routing_number: string;
  account_number: string;
  account_type: 'CHECKING' | 'SAVINGS';
}): Promise<FiatAccount> {
  return request('POST', '/fiat-transfers/accounts', {
    profile_id: data.profile_id,
    nickname: data.nickname,
    account_owner_name: data.account_owner_name,
    routing_number: data.routing_number,
    account_number: data.account_number,
    account_type: data.account_type,
  });
}

export async function listFiatAccounts(
  profileId: string,
): Promise<{ items: FiatAccount[] }> {
  return request('GET', `/fiat-transfers/accounts?profile_id=${profileId}`);
}

export interface FiatWithdrawal {
  id: string;
  status: string;
  amount: string;
  currency: string;
}

export async function createFiatWithdrawal(data: {
  profile_id: string;
  fiat_account_id: string;
  amount: string;
  ref_id: string;
}): Promise<FiatWithdrawal> {
  return request('POST', '/fiat-transfers/withdrawals', {
    profile_id: data.profile_id,
    fiat_account_id: data.fiat_account_id,
    amount: data.amount,
    currency: 'USD',
    ref_id: data.ref_id,
  });
}

// ─── Internal Transfers ───────────────────────────────────────────────────────

export interface Transfer {
  id: string;
  status: string;
  amount: string;
  asset: string;
  direction: string;
  created_at: string;
}

export async function createInternalTransfer(data: {
  source_profile_id: string;
  destination_profile_id: string;
  asset: string;
  amount: string;
  ref_id: string;
}): Promise<Transfer> {
  return request('POST', '/transfers', {
    source_profile_id: data.source_profile_id,
    destination_profile_id: data.destination_profile_id,
    asset: data.asset,
    amount: data.amount,
    ref_id: data.ref_id,
  });
}

export async function listTransfers(
  profileId: string,
): Promise<{ items: Transfer[] }> {
  return request('GET', `/transfers?profile_id=${profileId}&limit=50`);
}

// ─── Sandbox ──────────────────────────────────────────────────────────────────

export async function sandboxDeposit(
  profileId: string,
  amount: string,
  asset = 'USD',
): Promise<unknown> {
  return request('POST', `/sandbox/profiles/${profileId}/deposit`, {
    asset,
    amount,
    crypto_network: asset === 'USD' ? undefined : 'ETHEREUM',
  });
}
