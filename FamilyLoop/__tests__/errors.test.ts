import { formatAuthError } from '@/lib/auth/errors';

describe('formatAuthError', () => {
  it('reads message from Error-like object', () => {
    expect(formatAuthError({ message: 'Invalid login' })).toBe('Invalid login');
  });

  it('returns string as-is', () => {
    expect(formatAuthError('oops')).toBe('oops');
  });

  it('returns fallback for unknown', () => {
    expect(formatAuthError(null)).toContain('Something went wrong');
  });
});
