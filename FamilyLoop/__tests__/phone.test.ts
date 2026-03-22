import { normalizeToE164 } from '@/lib/phone';

describe('normalizeToE164', () => {
  it('adds US country code for 10 digits', () => {
    expect(normalizeToE164('5551234567')).toBe('+15551234567');
  });

  it('preserves leading + and digits', () => {
    expect(normalizeToE164('+44 20 7946 0958')).toBe('+442079460958');
  });

  it('handles 11-digit US numbers starting with 1', () => {
    expect(normalizeToE164('15551234567')).toBe('+15551234567');
  });

  it('returns empty for empty input', () => {
    expect(normalizeToE164('')).toBe('');
    expect(normalizeToE164('   ')).toBe('');
  });
});
