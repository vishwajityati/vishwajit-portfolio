import "server-only";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withDatabaseRetry } from "@/lib/db-retry";

/**
 * Confirms the caller owns an authenticated session that is still current.
 *
 * Comparing the `sessionVersion` captured at sign-in against the stored value means a
 * password change immediately revokes sessions on every other device, without needing
 * a server-side session store.
 */
export async function hasAdminAccess(): Promise<boolean> {
  const session = await getAdminSession();
  if (session.adminId !== 1) return false;

  // Read-only, so a transient connectivity blip must not look like a revoked session.
  const admin = await withDatabaseRetry(
    () => prisma.admin.findUnique({
      where: { id: 1 },
      select: { sessionVersion: true }
    }),
    { label: "session version check" }
  );
  if (!admin) return false;

  return session.sessionVersion === admin.sessionVersion;
}
