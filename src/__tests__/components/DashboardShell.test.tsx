import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useAppStore } from '@/lib/store';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/dashboard',
}));
jest.mock('@/components/layout/Sidebar', () => ({
  Sidebar: () => <nav data-testid="sidebar">Sidebar</nav>,
}));

const mockUser = {
  identity_id: 'ident_1',
  profile_id: 'prof_1',
  account_id: 'acc_1',
  first_name: 'Jane',
  last_name: 'Smith',
};

beforeEach(() => {
  mockReplace.mockReset();
});

afterEach(() => {
  useAppStore.setState({ user: null });
});

describe('DashboardShell', () => {
  it('renders children when user is logged in', () => {
    useAppStore.setState({ user: mockUser });
    render(
      <DashboardShell>
        <div>Dashboard content</div>
      </DashboardShell>,
    );
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('renders the sidebar when user is logged in', () => {
    useAppStore.setState({ user: mockUser });
    render(
      <DashboardShell>
        <div>Content</div>
      </DashboardShell>,
    );
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
  });

  it('redirects to / when no user', () => {
    useAppStore.setState({ user: null });
    render(
      <DashboardShell>
        <div>Protected</div>
      </DashboardShell>,
    );
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('does not render children when no user', () => {
    useAppStore.setState({ user: null });
    render(
      <DashboardShell>
        <div>Secret content</div>
      </DashboardShell>,
    );
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });
});
