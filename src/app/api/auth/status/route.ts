import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withDatabaseRetry } from "@/lib/db-retry";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [admin, session] = await Promise.all([
      withDatabaseRetry(
        () => prisma.admin.findUnique({ where: { id: 1 }, select: { id: true, sessionVersion: true } }),
        { label: "admin status read" }
      ),
      getAdminSession()
    ]);
    return NextResponse.json({
      setupRequired: !admin,
      authenticated: Boolean(
        admin
        && session.adminId === 1
        && session.sessionVersion === admin.sessionVersion
      )
    });
  } catch (error) {
    console.error("Failed to load admin status:", error);
    return NextResponse.json({ error: "Admin status could not be loaded." }, { status: 500 });
  }
}
