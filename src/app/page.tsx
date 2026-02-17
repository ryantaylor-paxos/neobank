'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { OnboardingForm } from '@/components/onboarding/OnboardingForm';
import { ToastProvider } from '@/components/ui/Toast';
import { Zap } from 'lucide-react';

export default function Home() {
  const { user } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  return (
    <ToastProvider>
      <div className="min-h-screen flex">
        {/* Left hero panel */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-blue-900/20 to-transparent" />
          <div className="absolute top-20 left-10 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">NeoBank</span>
            </div>

            <h1 className="text-5xl font-bold text-white leading-tight mb-6">
              Banking for the
              <br />
              <span className="gradient-text">next generation</span>
            </h1>
            <p className="text-white/50 text-lg max-w-sm leading-relaxed">
              Open your account in minutes. Send money to friends, receive payments, and manage your finances — all in one place.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            {[
              { emoji: '⚡', title: 'Instant transfers', desc: 'Send & receive money in seconds' },
              { emoji: '🔒', title: 'Bank-grade security', desc: 'Powered by Paxos infrastructure' },
              { emoji: '🌍', title: 'Global reach', desc: 'Fiat & digital asset support' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <span className="text-2xl">{f.emoji}</span>
                <div>
                  <p className="font-semibold text-white text-sm">{f.title}</p>
                  <p className="text-white/40 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="flex items-center gap-2.5 mb-8 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">NeoBank</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Create your account</h2>
              <p className="text-white/40">
                Takes about 2 minutes. We need some basic details to verify your identity.
              </p>
            </div>

            <OnboardingForm />
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
