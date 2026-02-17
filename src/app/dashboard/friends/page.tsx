'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Users, Send, ChevronRight, Search } from 'lucide-react';
import { formatUSD } from '@/lib/utils';

interface Profile {
  id: string;
  nickname: string;
  status: string;
}

export default function FriendsPage() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filtered, setFiltered] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchProfiles = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/friends/profiles');
      const data = await res.json();
      if (res.ok) {
        // Filter out current user's profile
        const others = (data.items || []).filter(
          (p: Profile) => p.id !== user?.profile_id,
        );
        setProfiles(others);
        setFiltered(others);
      }
    } catch {
      // silently handle
    } finally {
      setFetching(false);
    }
  }, [user?.profile_id]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? profiles.filter((p) => p.nickname.toLowerCase().includes(q)) : profiles,
    );
  }, [search, profiles]);

  const sendMoney = async () => {
    if (!user || !selected || !amount) return;
    setLoading(true);
    try {
      const res = await fetch('/api/friends/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source_profile_id: user.profile_id,
          destination_profile_id: selected.id,
          amount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(
        `Sent ${formatUSD(amount)} to ${selected.nickname}!`,
        'success',
      );
      setSelected(null);
      setAmount('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Send Money</h1>
        <p className="text-white/40 text-sm">
          Transfer funds instantly to other NeoBank users
        </p>
      </div>

      {selected ? (
        /* Send money form */
        <div className="space-y-4">
          <Card>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/8">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center">
                <span className="font-bold text-sm text-white">
                  {getInitials(selected.nickname)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-white">{selected.nickname}</p>
                <p className="text-xs text-white/40 font-mono truncate max-w-[200px]">
                  {selected.id}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="ml-auto text-white/30 hover:text-white/60 text-sm transition-colors"
              >
                Change
              </button>
            </div>

            <div className="space-y-4">
              <Input
                label="Amount (USD)"
                type="number"
                placeholder="50.00"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />

              {amount && parseFloat(amount) > 0 && (
                <div className="text-center py-2">
                  <p className="text-3xl font-bold text-white">
                    {formatUSD(amount)}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    to {selected.nickname}
                  </p>
                </div>
              )}

              <Button
                onClick={sendMoney}
                loading={loading}
                disabled={!amount || parseFloat(amount) <= 0}
                className="w-full"
                size="lg"
              >
                <Send size={16} className="mr-2" />
                Send money
              </Button>
            </div>
          </Card>

          <div className="glass rounded-xl p-4 border border-emerald-500/15 bg-emerald-500/5">
            <p className="text-xs text-emerald-300/70 leading-relaxed">
              Internal transfers between NeoBank accounts are instant and free. The recipient will see the funds immediately.
            </p>
          </div>
        </div>
      ) : (
        /* Profile list */
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
            />
            <input
              className="input-field pl-10"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {fetching ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-16 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="text-center py-12">
              <Users size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm mb-1">
                {search ? 'No users found' : 'No other users yet'}
              </p>
              <p className="text-white/20 text-xs">
                {search
                  ? 'Try a different search'
                  : 'Other NeoBank users will appear here'}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((profile) => (
                <Card
                  key={profile.id}
                  hover
                  onClick={() => setSelected(profile)}
                  className="flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">
                      {getInitials(profile.nickname)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">
                      {profile.nickname}
                    </p>
                    <p className="text-xs text-white/30 font-mono truncate">
                      {profile.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        profile.status === 'ACTIVE'
                          ? 'bg-emerald-400'
                          : 'bg-white/20'
                      }`}
                    />
                    <ChevronRight size={16} className="text-white/30" />
                  </div>
                </Card>
              ))}
            </div>
          )}

          <p className="text-xs text-white/20 text-center">
            {filtered.length} user{filtered.length !== 1 ? 's' : ''} available
          </p>
        </div>
      )}
    </div>
  );
}
