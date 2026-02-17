import { cn, formatUSD, formatDate } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skipped', 'included')).toBe('base included');
  });

  it('deduplicates conflicting Tailwind classes', () => {
    // tailwind-merge resolves conflicts — last wins
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles undefined and null gracefully', () => {
    expect(cn('foo', undefined, null as unknown as string, 'bar')).toBe('foo bar');
  });

  it('returns empty string for no args', () => {
    expect(cn()).toBe('');
  });
});

describe('formatUSD', () => {
  it('formats a number as USD', () => {
    expect(formatUSD(1000)).toBe('$1,000.00');
  });

  it('formats a string amount', () => {
    expect(formatUSD('250.5')).toBe('$250.50');
  });

  it('formats zero', () => {
    expect(formatUSD(0)).toBe('$0.00');
  });

  it('formats large amounts with commas', () => {
    expect(formatUSD(1234567.89)).toBe('$1,234,567.89');
  });

  it('formats cents correctly', () => {
    expect(formatUSD(0.01)).toBe('$0.01');
  });

  it('formats negative amounts', () => {
    expect(formatUSD(-50)).toBe('-$50.00');
  });
});

describe('formatDate', () => {
  it('formats an ISO date string and returns a recognizable date', () => {
    // Use midday to avoid timezone boundary issues
    const result = formatDate('2024-03-15T12:00:00Z');
    expect(result).toMatch(/Mar 1[45], 2024/);
  });

  it('formats another date correctly', () => {
    const result = formatDate('2023-12-01T12:00:00Z');
    expect(result).toMatch(/Dec 1, 2023/);
  });

  it('returns a string in "Mon D, YYYY" format', () => {
    const result = formatDate('2024-07-04T12:00:00Z');
    expect(result).toMatch(/Jul [34], 2024/);
  });
});
