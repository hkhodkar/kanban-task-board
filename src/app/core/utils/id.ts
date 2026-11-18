/** Short random id, good enough for local data. */
export function createId(prefix = ''): string {
  const random = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}-${random}` : random;
}
