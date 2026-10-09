import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withDatabaseRetry } from "@/lib/db-retry";
import { getContactEmailConfigurationStatus } from "@/lib/contact-email";
import { getPortfolioContent } from "@/lib/portfolio";

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
    const authenticated = Boolean(
        admin
        && session.adminId === 1
        && session.sessionVersion === admin.sessionVersion
      );

    if (!authenticated) {
      return NextResponse.json({ setupRequired: !admin, authenticated: false });
    }

    const [content, unreadCount] = await Promise.all([
      getPortfolioContent(),
      prisma.contactMessage.count({ where: { readAt: null } })
    ]);

    return NextResponse.json({
      setupRequired: false,
      authenticated: true,
      content,
      inboxSummary: {
        unreadCount,
        emailNotificationsEnabled: getContactEmailConfigurationStatus().configured
      }
    });
  } catch (error) {
    console.error("Failed to load admin status:", error);
    return NextResponse.json({ error: "Admin status could not be loaded." }, { status: 500 });
  }
}
