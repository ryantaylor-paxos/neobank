'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  LogOut,
  Zap,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/payin', label: 'Pay In', icon: ArrowDownToLine },
  { href: '/dashboard/payout', label: 'Pay Out', icon: ArrowUpFromLine },
  { href: '/dashboard/friends', label: 'Friends', icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearUser } = useAppStore();

  return (
    <aside className="w-64 h-screen flex flex-col glass border-r border-white/8 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg gradient-text">NeoBank</span>
        </div>
      </div>

      {/* User info */}
      {user && (
        <div className="px-4 py-4 border-b border-white/8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-blue-500/30 flex items-center justify-center border border-white/10 shrink-0">
              <span className="text-sm font-semibold text-white">
                {user.first_name[0]}{user.last_name[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-white/40 truncate">Active account</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-violet-500/15 text-violet-300 border border-violet-500/20'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/8">
        <button
          onClick={clearUser}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
