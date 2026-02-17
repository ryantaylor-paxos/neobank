import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/lib/store';

// next/navigation is aliased via jest moduleNameMapper
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const mockUser = {
  identity_id: 'ident_1',
  profile_id: 'prof_1',
  account_id: 'acc_1',
  first_name: 'Jane',
  last_name: 'Smith',
};

beforeEach(() => {
  useAppStore.setState({ user: mockUser });
});

afterEach(() => {
  useAppStore.setState({ user: null });
});

describe('Sidebar', () => {
  it('renders the NeoBank logo', () => {
    render(<Sidebar />);
    expect(screen.getAllByText('NeoBank').length).toBeGreaterThan(0);
  });

  it('renders all nav links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Pay In')).toBeInTheDocument();
    expect(screen.getByText('Pay Out')).toBeInTheDocument();
    expect(screen.getByText('Friends')).toBeInTheDocument();
  });

  it('links to correct routes', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/dashboard');
    expect(screen.getByText('Pay In').closest('a')).toHaveAttribute('href', '/dashboard/payin');
    expect(screen.getByText('Pay Out').closest('a')).toHaveAttribute('href', '/dashboard/payout');
    expect(screen.getByText('Friends').closest('a')).toHaveAttribute('href', '/dashboard/friends');
  });

  it('displays user initials', () => {
    render(<Sidebar />);
    expect(screen.getByText('JS')).toBeInTheDocument();
  });

  it('displays user full name', () => {
    render(<Sidebar />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders sign out button', () => {
    render(<Sidebar />);
    expect(screen.getByText(/sign out/i)).toBeInTheDocument();
  });

  it('calls clearUser when sign out is clicked', async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByText(/sign out/i));
    expect(useAppStore.getState().user).toBeNull();
  });

  it('highlights the active nav item', () => {
    // usePathname returns '/dashboard' from mock
    render(<Sidebar />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.className).toContain('text-violet-300');
  });

  it('renders without user info section when user is null', () => {
    useAppStore.setState({ user: null });
    render(<Sidebar />);
    // No initials shown
    expect(screen.queryByText('JS')).not.toBeInTheDocument();
  });
});
