'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ArrowUpFromLine, Plus, Building2, ChevronRight } from 'lucide-react';
import { formatUSD } from '@/lib/utils';

interface FiatAccount {
  id: string;
  nickname: string;
  account_number_last4: string;
  routing_number: string;
  status: string;
}

type ViewState = 'list' | 'add-account' | 'withdraw';

export default function PayOutPage() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const [view, setView] = useState<ViewState>('list');
  const [accounts, setAccounts] = useState<FiatAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<FiatAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  // Add account form
  const [form, setForm] = useState({
    nickname: '',
    account_owner_name: '',
    routing_number: '',
    account_number: '',
    account_type: 'CHECKING' as 'CHECKING' | 'SAVINGS',
  });

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/payout/accounts?profile_id=${user.profile_id}`);
      const data = await res.json();
      if (res.ok) setAccounts(data.items || []);
    } catch {
      // silently handle
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/payout/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, profile_id: user.profile_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast('Bank account added!', 'success');
      await fetchAccounts();
      setView('list');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async () => {
    if (!user || !selectedAccount || !amount) return;
    setLoading(true);
    try {
      const res = await fetch('/api/payout/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: user.profile_id,
          fiat_account_id: selectedAccount.id,
          amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Withdrawal of ${formatUSD(amount)} initiated!`, 'success');
      setView('list');
      setAmount('');
      setSelectedAccount(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        {view !== 'list' && (
          <button
            onClick={() => setView('list')}
            className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"
          >
            ←
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">
            {view === 'list' && 'Withdraw Funds'}
            {view === 'add-account' && 'Add Bank Account'}
            {view === 'withdraw' && 'Confirm Withdrawal'}
          </h1>
          <p className="text-white/40 text-sm">
            {view === 'list' && 'Send money to your bank account'}
            {view === 'add-account' && 'Link a new bank account'}
            {view === 'withdraw' && `Withdrawing to ${selectedAccount?.nickname}`}
          </p>
        </div>
      </div>

      {/* Account List */}
      {view === 'list' && (
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <Card className="text-center py-12">
              <Building2 size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm mb-1">No bank accounts linked</p>
              <p className="text-white/20 text-xs mb-4">
                Add a bank account to start withdrawing funds
              </p>
              <Button onClick={() => setView('add-account')}>
                <Plus size={16} className="mr-2" />
                Add bank account
              </Button>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {accounts.map((acc) => (
                  <Card
                    key={acc.id}
                    hover
                    onClick={() => {
                      setSelectedAccount(acc);
                      setView('withdraw');
                    }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white text-sm">{acc.nickname}</p>
                      <p className="text-xs text-white/40">
                        ···· {acc.account_number_last4} · {acc.routing_number}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-white/30" />
                  </Card>
                ))}
              </div>

              <Button
                variant="secondary"
                onClick={() => setView('add-account')}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add another account
              </Button>
            </>
          )}
        </div>
      )}

      {/* Add Account Form */}
      {view === 'add-account' && (
        <Card>
          <div className="space-y-4">
            <Input
              label="Nickname"
              placeholder="My Chase Checking"
              value={form.nickname}
              onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
            />
            <Input
              label="Account owner name"
              placeholder="Jane Smith"
              value={form.account_owner_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, account_owner_name: e.target.value }))
              }
            />
            <Input
              label="Routing number"
              placeholder="021000021"
              value={form.routing_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, routing_number: e.target.value }))
              }
            />
            <Input
              label="Account number"
              placeholder="000123456789"
              value={form.account_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, account_number: e.target.value }))
              }
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60">Account type</label>
              <div className="flex gap-2">
                {(['CHECKING', 'SAVINGS'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm((f) => ({ ...f, account_type: type }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      form.account_type === type
                        ? 'bg-violet-500/20 border-violet-500/30 text-violet-300'
                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={addAccount}
              loading={loading}
              disabled={
                !form.nickname ||
                !form.account_owner_name ||
                !form.routing_number ||
                !form.account_number
              }
              className="w-full"
            >
              Add account
            </Button>
          </div>
        </Card>
      )}

      {/* Withdraw Form */}
      {view === 'withdraw' && selectedAccount && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/8">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Building2 size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-white text-sm">
                  {selectedAccount.nickname}
                </p>
                <p className="text-xs text-white/40">
                  ···· {selectedAccount.account_number_last4}
                </p>
              </div>
            </div>

            <Input
              label="Amount (USD)"
              type="number"
              placeholder="500.00"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            <div className="mt-4">
              <Button
                onClick={withdraw}
                loading={loading}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full"
              >
                <ArrowUpFromLine size={16} className="mr-2" />
                Withdraw {amount ? formatUSD(amount) : 'funds'}
              </Button>
            </div>
          </Card>

          <div className="glass rounded-xl p-4 border border-amber-500/15 bg-amber-500/5">
            <p className="text-xs text-amber-300/70 leading-relaxed">
              Withdrawals typically process within 1–3 business days. Make sure you have sufficient available balance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
