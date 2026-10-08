import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { checkLoginRateLimit, recordFailedLogin } from "@/lib/auth-rate-limit";
import { getClientAddress, hasSameOrigin } from "@/lib/security";
import { normalizeAccessCode } from "@/lib/access-code";
import { prisma } from "@/lib/prisma";
import { withDatabaseRetry } from "@/lib/db-retry";

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  try {
    const clientAddress = getClientAddress(request);
    if (!(await checkLoginRateLimit(clientAddress))) {
      return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    }

    const body: unknown = await request.json();
    const code = typeof body === "object" && body !== null && "code" in body && typeof body.code === "string"
      ? normalizeAccessCode(body.code)
      : "";

    // The generic message is deliberate: it must not reveal whether an account exists,
    // because this endpoint is reachable without prior authentication.
    if (!code) {
      return NextResponse.json({ error: "Enter your access code." }, { status: 400 });
    }

    const admin = await withDatabaseRetry(
      () => prisma.admin.findUnique({
        where: { id: 1 },
        select: { accessCodeHash: true, totpEnabled: true, sessionVersion: true }
      }),
      { label: "sign-in credential read" }
    );
    if (!admin || !(await bcrypt.compare(code, admin.accessCodeHash))) {
      await recordFailedLogin(clientAddress);
      return NextResponse.json({ error: "That access code is not correct." }, { status: 401 });
    }

    const session = await getAdminSession();
    if (admin.totpEnabled) {
      session.adminId = undefined;
      session.pendingAdminId = 1;
      session.pendingTotpUntil = Date.now() + 5 * 60 * 1000;
      await session.save();
      return NextResponse.json({ authenticated: false, requiresTotp: true });
    }

    session.pendingAdminId = undefined;
    session.pendingTotpUntil = undefined;
    session.adminId = 1;
    session.sessionVersion = admin.sessionVersion;
    await session.save();
    return NextResponse.json({ authenticated: true, requiresTotp: false });
  } catch (error) {
    console.error("Failed to sign in:", error);
    return NextResponse.json({ error: "Sign in could not be completed." }, { status: 500 });
  }
}
