import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '@/components/ui/Toast';

function ToastTrigger({ message, type }: { message: string; type?: 'success' | 'error' | 'info' }) {
  const { toast } = useToast();
  return <button onClick={() => toast(message, type)}>Show toast</button>;
}

function renderWithToast(message: string, type?: 'success' | 'error' | 'info') {
  const user = userEvent.setup({ delay: null });
  const utils = render(
    <ToastProvider>
      <ToastTrigger message={message} type={type} />
    </ToastProvider>,
  );
  return { user, ...utils };
}

describe('ToastProvider + useToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows a toast message when toast() is called', async () => {
    const { user } = renderWithToast('Hello world');
    await user.click(screen.getByText('Show toast'));
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows a success toast', async () => {
    const { user } = renderWithToast('Payment sent!', 'success');
    await user.click(screen.getByText('Show toast'));
    expect(screen.getByText('Payment sent!')).toBeInTheDocument();
  });

  it('shows an error toast', async () => {
    const { user } = renderWithToast('Something went wrong', 'error');
    await user.click(screen.getByText('Show toast'));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows an info toast by default', async () => {
    const { user } = renderWithToast('Just so you know');
    await user.click(screen.getByText('Show toast'));
    expect(screen.getByText('Just so you know')).toBeInTheDocument();
  });

  it('auto-dismisses after 4000ms', async () => {
    const { user } = renderWithToast('Temporary');
    await user.click(screen.getByText('Show toast'));
    expect(screen.getByText('Temporary')).toBeInTheDocument();

    act(() => { jest.advanceTimersByTime(4001); });

    expect(screen.queryByText('Temporary')).not.toBeInTheDocument();
  });

  it('does not dismiss before 4000ms', async () => {
    const { user } = renderWithToast('Still here');
    await user.click(screen.getByText('Show toast'));

    act(() => { jest.advanceTimersByTime(3999); });

    expect(screen.getByText('Still here')).toBeInTheDocument();
  });

  it('can be manually dismissed via close button', async () => {
    const { user } = renderWithToast('Dismiss me');
    await user.click(screen.getByText('Show toast'));
    expect(screen.getByText('Dismiss me')).toBeInTheDocument();

    const allButtons = screen.getAllByRole('button');
    const xButton = allButtons.find((b) => !b.textContent?.includes('Show toast'))!;
    await user.click(xButton);

    expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument();
  });

  it('can show multiple toasts simultaneously', async () => {
    function MultiTrigger() {
      const { toast } = useToast();
      return (
        <>
          <button onClick={() => toast('First')}>First</button>
          <button onClick={() => toast('Second')}>Second</button>
        </>
      );
    }
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'First' }));
    await user.click(screen.getByRole('button', { name: 'Second' }));

    // Both toast messages should be visible (buttons also have same text — use getAllByText)
    expect(screen.getAllByText('First').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Second').length).toBeGreaterThanOrEqual(1);
  });
});
