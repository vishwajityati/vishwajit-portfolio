import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { checkLoginRateLimit, recordFailedLogin } from "@/lib/auth-rate-limit";
import { hasAdminAccess } from "@/lib/permissions";
import { getClientAddress, hasSameOrigin } from "@/lib/security";
import { normalizeAccessCode } from "@/lib/access-code";
import { decryptTotpSecret, encryptTotpSecret, createTotpSecret, createTotpUri, verifyTotpCode } from "@/lib/totp";
import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { id: 1 }, select: { totpEnabled: true } });
    if (!admin) return NextResponse.json({ error: "Admin account could not be found." }, { status: 404 });
    return NextResponse.json({ enabled: admin.totpEnabled });
  } catch (error) {
    console.error("Failed to load authenticator status:", error);
    return NextResponse.json({ error: "Authenticator status could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  try {
    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.action !== "string") {
      return NextResponse.json({ error: "Choose an authenticator action." }, { status: 400 });
    }

    if (body.action === "verify-login") {
      const address = getClientAddress(request);
      if (!(await checkLoginRateLimit(address))) {
        return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
      }
      const session = await getAdminSession();
      if (session.pendingAdminId !== 1 || !session.pendingTotpUntil || session.pendingTotpUntil < Date.now()) {
        session.pendingAdminId = undefined;
        session.pendingTotpUntil = undefined;
        await session.save();
        return NextResponse.json({ error: "Sign-in expired. Enter your access code again." }, { status: 401 });
      }

      const admin = await prisma.admin.findUnique({ where: { id: 1 }, select: { totpEnabled: true, totpSecret: true, lastTotpStep: true, sessionVersion: true } });
      if (!admin?.totpEnabled || !admin.totpSecret) {
        return NextResponse.json({ error: "Authenticator setup changed. Sign in again." }, { status: 401 });
      }

      const code = typeof body.code === "string" ? body.code.trim() : "";
      const step = verifyTotpCode(decryptTotpSecret(admin.totpSecret), code);
      if (step === null) {
        await recordFailedLogin(address);
        return NextResponse.json({ error: "Authenticator code is incorrect." }, { status: 401 });
      }

      const advanced = await prisma.admin.updateMany({
        where: {
          id: 1,
          totpEnabled: true,
          OR: [{ lastTotpStep: null }, { lastTotpStep: { lt: step } }]
        },
        data: { lastTotpStep: step }
      });
      if (advanced.count !== 1) {
        await recordFailedLogin(address);
        return NextResponse.json({ error: "That authenticator code was already used. Wait for a new code." }, { status: 401 });
      }

      session.adminId = 1;
      session.pendingAdminId = undefined;
      session.pendingTotpUntil = undefined;
      session.sessionVersion = admin.sessionVersion;
      await session.save();
      return NextResponse.json({ authenticated: true });
    }

    if (!(await hasAdminAccess())) {
      return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
    }

    if (typeof body.currentCode !== "string") {
      return NextResponse.json({ error: "Enter your current access code to continue." }, { status: 400 });
    }
    const admin = await prisma.admin.findUnique({ where: { id: 1 } });
    if (!admin || !(await bcrypt.compare(normalizeAccessCode(body.currentCode), admin.accessCodeHash))) {
      await recordFailedLogin(getClientAddress(request));
      return NextResponse.json({ error: "Current access code is incorrect." }, { status: 401 });
    }

    if (body.action === "begin") {
      if (admin.totpEnabled) {
        return NextResponse.json({ error: "Authenticator app verification is already enabled." }, { status: 409 });
      }
      const secret = createTotpSecret();
      // Email is optional with access-code sign-in, so fall back to a neutral label for
      // the authenticator entry.
      return NextResponse.json({ secret, uri: createTotpUri(secret, admin.email ?? "Portfolio Admin") });
    }

    if (body.action === "enable") {
      if (admin.totpEnabled) return NextResponse.json({ error: "Authenticator app verification is already enabled." }, { status: 409 });
      const secret = typeof body.secret === "string" ? body.secret : "";
      const code = typeof body.code === "string" ? body.code.trim() : "";
      if (!/^[A-Z2-7]{32}$/.test(secret)) {
        return NextResponse.json({ error: "Authenticator setup expired. Start setup again." }, { status: 400 });
      }
      const step = verifyTotpCode(secret, code);
      if (step === null) {
        await recordFailedLogin(getClientAddress(request));
        return NextResponse.json({ error: "Authenticator code is incorrect. Check the time on your device and try again." }, { status: 401 });
      }
      await prisma.admin.update({
        where: { id: 1 },
        data: { totpEnabled: true, totpSecret: encryptTotpSecret(secret), lastTotpStep: step }
      });
      return NextResponse.json({ enabled: true });
    }

    if (body.action === "disable") {
      if (!admin.totpEnabled || !admin.totpSecret) {
        return NextResponse.json({ error: "Authenticator app verification is not enabled." }, { status: 409 });
      }
      const code = typeof body.code === "string" ? body.code.trim() : "";
      const step = verifyTotpCode(decryptTotpSecret(admin.totpSecret), code);
      if (step === null) {
        await recordFailedLogin(getClientAddress(request));
        return NextResponse.json({ error: "Authenticator code is incorrect." }, { status: 401 });
      }
      const disabled = await prisma.admin.updateMany({
        where: {
          id: 1,
          totpEnabled: true,
          OR: [{ lastTotpStep: null }, { lastTotpStep: { lt: step } }]
        },
        data: { totpEnabled: false, totpSecret: null, lastTotpStep: null }
      });
      if (disabled.count !== 1) {
        await recordFailedLogin(getClientAddress(request));
        return NextResponse.json({ error: "That authenticator code was already used. Wait for a new code." }, { status: 401 });
      }
      return NextResponse.json({ enabled: false });
    }

    return NextResponse.json({ error: "Choose a valid authenticator action." }, { status: 400 });
  } catch (error) {
    console.error("Failed to update authenticator settings:", error);
    return NextResponse.json({ error: "Authenticator settings could not be updated." }, { status: 500 });
  }
}
