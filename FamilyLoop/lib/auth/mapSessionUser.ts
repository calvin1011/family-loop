import type { AppUser } from '@/types';

export function mapSessionUser(sessionUser: {
  id: string;
  email?: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
}): AppUser {
  const meta = sessionUser.user_metadata ?? {};
  const fullName =
    (meta.full_name as string | undefined) ??
    (meta.name as string | undefined) ??
    (meta.display_name as string | undefined) ??
    null;

  return {
    id: sessionUser.id,
    email: sessionUser.email,
    phone: sessionUser.phone,
    displayName: fullName,
    avatarUrl: (meta.avatar_url as string | undefined) ?? null,
    provider: (sessionUser.app_metadata?.provider as string | undefined) ?? null,
  };
}
