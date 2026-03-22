import { mapSessionUser } from '@/lib/auth/mapSessionUser';

describe('mapSessionUser', () => {
  it('maps Supabase user fields to AppUser', () => {
    const u = mapSessionUser({
      id: 'uuid-1',
      email: 'a@b.com',
      phone: '+15550001',
      user_metadata: { full_name: 'Test User', avatar_url: 'https://x/y' },
      app_metadata: { provider: 'email' },
    });
    expect(u.id).toBe('uuid-1');
    expect(u.email).toBe('a@b.com');
    expect(u.phone).toBe('+15550001');
    expect(u.displayName).toBe('Test User');
    expect(u.avatarUrl).toBe('https://x/y');
    expect(u.provider).toBe('email');
  });

  it('falls back displayName from name', () => {
    const u = mapSessionUser({
      id: 'x',
      user_metadata: { name: 'Only Name' },
    });
    expect(u.displayName).toBe('Only Name');
  });
});
