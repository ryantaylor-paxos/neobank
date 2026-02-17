'use client';
import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import {
  ArrowDownToLine,
  Building2,
  Zap,
  Copy,
  CheckCheck,
} from 'lucide-react';

interface DepositInstructions {
  account_number: string;
  routing_number: string;
  bank_name: string;
  beneficiary_name: string;
  reference_id: string;
}

export default function PayInPage() {
  const { user } = useAppStore();
  const { toast } = useToast();
  const [tab, setTab] = useState<'wire' | 'sandbox'>('wire');
  const [instructions, setInstructions] = useState<DepositInstructions | null>(null);
  const [sandboxAmount, setSandboxAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const getDepositInstructions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch('/api/payin/deposit-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: user.profile_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInstructions(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const simulateDeposit = async () => {
    if (!user || !sandboxAmount) return;
    setLoading(true);
    try {
      const res = await fetch('/api/payin/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id: user.profile_id, amount: sandboxAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`Simulated deposit of $${sandboxAmount} initiated!`, 'success');
      setSandboxAmount('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Add Funds</h1>
        <p className="text-white/40 text-sm">
          Deposit money into your NeoBank account
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/8 w-fit">
        {[
          { key: 'wire', label: 'Wire Transfer', icon: Building2 },
          { key: 'sandbox', label: 'Test Deposit', icon: Zap },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as 'wire' | 'sandbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/20'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Wire Transfer */}
      {tab === 'wire' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Wire Transfer</h3>
                <p className="text-sm text-white/40">
                  Generate banking instructions to wire funds from your bank account. Processing time: 1–2 business days.
                </p>
              </div>
            </div>

            {!instructions ? (
              <Button
                onClick={getDepositInstructions}
                loading={loading}
                className="w-full"
              >
                <ArrowDownToLine size={16} className="mr-2" />
                Generate deposit instructions
              </Button>
            ) : (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
                  Your Deposit Details
                </h4>
                {[
                  { label: 'Bank Name', value: instructions.bank_name || 'Paxos Trust Company' },
                  { label: 'Account Number', value: instructions.account_number },
                  { label: 'Routing Number', value: instructions.routing_number },
                  { label: 'Beneficiary', value: instructions.beneficiary_name || `${user?.first_name} ${user?.last_name}` },
                  { label: 'Reference ID', value: instructions.reference_id },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-2.5 border-b border-white/6 last:border-0"
                  >
                    <span className="text-sm text-white/40">{label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white font-mono">{value}</span>
                      <button
                        onClick={() => copyToClipboard(value, label)}
                        className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors"
                      >
                        {copied === label ? (
                          <CheckCheck size={13} className="text-emerald-400" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="glass rounded-xl p-4 border border-amber-500/15 bg-amber-500/5">
            <p className="text-xs text-amber-300/70 leading-relaxed">
              <strong className="text-amber-300">Important:</strong> Always include your Reference ID when sending a wire transfer. Funds typically arrive within 1–2 business days.
            </p>
          </div>
        </div>
      )}

      {/* Sandbox Deposit */}
      {tab === 'sandbox' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                <Zap size={20} className="text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Sandbox Test Deposit</h3>
                <p className="text-sm text-white/40">
                  Simulate a deposit instantly for testing. This only works in sandbox environment.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Amount (USD)"
                type="number"
                placeholder="1000.00"
                min="0.01"
                step="0.01"
                value={sandboxAmount}
                onChange={(e) => setSandboxAmount(e.target.value)}
              />

              <Button
                onClick={simulateDeposit}
                loading={loading}
                disabled={!sandboxAmount || parseFloat(sandboxAmount) <= 0}
                className="w-full"
              >
                <Zap size={16} className="mr-2" />
                Simulate deposit
              </Button>
            </div>
          </Card>

          <div className="glass rounded-xl p-4 border border-violet-500/15 bg-violet-500/5">
            <p className="text-xs text-violet-300/70 leading-relaxed">
              Test deposits are reflected in your balance after a short processing period. Refresh your dashboard to see the updated balance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
