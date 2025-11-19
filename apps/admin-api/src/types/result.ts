/**
 * Result type for service layer operations
 * Provides explicit success/failure handling without exceptions
 *
 * @example
 * ```typescript
 * async function getUser(id: string): Promise<Result<User>> {
 *   try {
 *     const user = await db.user.findUnique({ where: { id } });
 *     if (!user) {
 *       return { ok: false, error: new Error('User not found') };
 *     }
 *     return { ok: true, data: user };
 *   } catch (err) {
 *     return { ok: false, error: err as Error };
 *   }
 * }
 *
 * // Usage
 * const result = await getUser('123');
 * if (result.ok) {
 *   console.log(result.data.name);
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/**
 * Helper to create a successful Result
 */
export function success<T>(data: T): Result<T> {
  return { ok: true, data };
}

/**
 * Helper to create a failed Result
 */
export function failure<E = Error>(error: E): Result<never, E> {
  return { ok: false, error };
}
