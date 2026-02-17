'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface FormData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  tax_id: string;
  address1: string;
  city: string;
  province: string;
  zip: string;
  country: string;
}

const STEPS = ['Personal Info', 'Address', 'Review'];

export function OnboardingForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<FormData>({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    tax_id: '',
    address1: '',
    city: '',
    province: '',
    zip: '',
    country: 'USA',
  });

  const { setUser } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();

  const update = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setData((d) => ({ ...d, [field]: e.target.value }));

  const canProceed = () => {
    if (step === 0)
      return data.first_name && data.last_name && data.date_of_birth;
    if (step === 1)
      return data.address1 && data.city && data.province && data.zip;
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Onboarding failed');

      setUser({
        identity_id: json.identity.id,
        profile_id: json.profile.id,
        account_id: json.account.id,
        first_name: data.first_name,
        last_name: data.last_name,
      });

      toast('Account created successfully!', 'success');
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i <= step
                  ? 'bg-gradient-to-br from-violet-500 to-blue-500 text-white'
                  : 'bg-white/10 text-white/30'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs font-medium ${i === step ? 'text-white' : 'text-white/30'}`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px w-8 ${i < step ? 'bg-violet-500' : 'bg-white/10'}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 0: Personal Info */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              placeholder="Jane"
              value={data.first_name}
              onChange={update('first_name')}
            />
            <Input
              label="Last name"
              placeholder="Smith"
              value={data.last_name}
              onChange={update('last_name')}
            />
          </div>
          <Input
            label="Date of birth"
            type="date"
            value={data.date_of_birth}
            onChange={update('date_of_birth')}
          />
          <Input
            label="Social Security Number (optional)"
            placeholder="XXX-XX-XXXX"
            value={data.tax_id}
            onChange={update('tax_id')}
          />
        </div>
      )}

      {/* Step 1: Address */}
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Street address"
            placeholder="123 Main St"
            value={data.address1}
            onChange={update('address1')}
          />
          <Input
            label="City"
            placeholder="New York"
            value={data.city}
            onChange={update('city')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="State"
              placeholder="NY"
              value={data.province}
              onChange={update('province')}
            />
            <Input
              label="ZIP code"
              placeholder="10001"
              value={data.zip}
              onChange={update('zip')}
            />
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="space-y-3">
          <div className="glass-card p-4 space-y-2.5">
            <ReviewRow label="Name" value={`${data.first_name} ${data.last_name}`} />
            <ReviewRow label="Date of birth" value={data.date_of_birth} />
            <ReviewRow
              label="Address"
              value={`${data.address1}, ${data.city}, ${data.province} ${data.zip}`}
            />
          </div>
          <p className="text-xs text-white/30 leading-relaxed">
            By creating an account, you agree to our Terms of Service and Privacy Policy. Your identity will be verified through Paxos&apos; KYC process.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <Button
            variant="secondary"
            onClick={() => setStep((s) => s - 1)}
            className="flex-1"
          >
            <ChevronLeft size={16} className="mr-1" />
            Back
          </Button>
        )}

        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="flex-1"
          >
            Continue
            <ChevronRight size={16} className="ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} loading={loading} className="flex-1">
            Create account
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
