'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatUSD, formatDate } from '@/lib/utils';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface Balance {
  asset: string;
  available: string;
  trading: string;
}

interface Transfer {
  id: string;
  status: string;
  amount: string;
  asset: string;
  direction: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAppStore();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile?profile_id=${user.profile_id}`);
      const data = await res.json();
      setBalances(data.balances || []);
      setTransfers(data.transfers || []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const usdBalance = balances.find((b) => b.asset === 'USD');
  const totalBalance = usdBalance ? parseFloat(usdBalance.available) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/40 text-sm mb-1">Good day,</p>
          <h1 className="text-2xl font-bold text-white">
            {user?.first_name} {user?.last_name}
          </h1>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg hover:bg-white/8 text-white/40 hover:text-white transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Balance card */}
      <div className="relative overflow-hidden rounded-2xl p-8" style={{
        background: 'linear-gradient(135deg, #4c1d95 0%, #1e3a8a 50%, #0f172a 100%)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <p className="text-white/50 text-sm mb-2">Total balance</p>
          {loading ? (
            <div className="h-12 w-48 bg-white/10 rounded-xl animate-pulse" />
          ) : (
            <p className="text-5xl font-bold text-white">
              {formatUSD(totalBalance)}
            </p>
          )}
          <p className="text-white/30 text-xs mt-3 font-mono truncate">
            Profile: {user?.profile_id}
          </p>
        </div>

        {/* Quick actions */}
        <div className="relative z-10 flex gap-3 mt-8">
          <Link href="/dashboard/payin">
            <button className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors border border-white/10">
              <ArrowDownToLine size={18} className="text-emerald-400" />
              <span className="text-xs text-white font-medium">Add funds</span>
            </button>
          </Link>
          <Link href="/dashboard/payout">
            <button className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors border border-white/10">
              <ArrowUpFromLine size={18} className="text-sky-400" />
              <span className="text-xs text-white font-medium">Withdraw</span>
            </button>
          </Link>
          <Link href="/dashboard/friends">
            <button className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors border border-white/10">
              <Users size={18} className="text-violet-400" />
              <span className="text-xs text-white font-medium">Send</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Balances breakdown */}
      {balances.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
            Asset Balances
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {balances.map((b) => (
              <Card key={b.asset}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 flex items-center justify-center">
                    <TrendingUp size={12} className="text-violet-400" />
                  </div>
                  <span className="text-xs font-bold text-white/60">{b.asset}</span>
                </div>
                <p className="text-lg font-bold text-white">
                  {b.asset === 'USD' ? formatUSD(b.available) : b.available}
                </p>
                <p className="text-xs text-white/30 mt-0.5">Available</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recent transfers */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
            Recent Activity
          </h2>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-16 animate-pulse" />
            ))}
          </div>
        ) : transfers.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-white/30 text-sm">No transactions yet</p>
            <p className="text-white/20 text-xs mt-1">
              Add funds to get started
            </p>
            <div className="mt-4">
              <Link href="/dashboard/payin">
                <Button size="sm">Add funds</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {transfers.map((t) => (
              <Card key={t.id} className="flex items-center gap-4 py-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    t.direction === 'CREDIT'
                      ? 'bg-emerald-500/15'
                      : 'bg-sky-500/15'
                  }`}
                >
                  {t.direction === 'CREDIT' ? (
                    <ArrowDownToLine size={15} className="text-emerald-400" />
                  ) : (
                    <ArrowUpFromLine size={15} className="text-sky-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {t.direction === 'CREDIT' ? 'Deposit' : 'Withdrawal'}
                  </p>
                  <p className="text-xs text-white/30">
                    {t.created_at ? formatDate(t.created_at) : '—'} · {t.status}
                  </p>
                </div>
                <p
                  className={`font-semibold text-sm ${
                    t.direction === 'CREDIT' ? 'text-emerald-400' : 'text-white'
                  }`}
                >
                  {t.direction === 'CREDIT' ? '+' : '-'}
                  {t.asset === 'USD' ? formatUSD(t.amount) : `${t.amount} ${t.asset}`}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
