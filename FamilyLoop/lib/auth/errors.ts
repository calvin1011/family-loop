export function formatAuthError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = String((error as { message?: string }).message);
    if (msg) return msg;
  }
  if (typeof error === 'string') return error;
  return 'Something went wrong. Please try again.';
}
