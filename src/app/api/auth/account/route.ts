import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/permissions";
import { checkLoginRateLimit, recordFailedLogin } from "@/lib/auth-rate-limit";
import { getAdminSession } from "@/lib/auth";
import { getClientAddress, hasSameOrigin } from "@/lib/security";
import { getAccessCodePolicyError, normalizeAccessCode } from "@/lib/access-code";
import { prisma } from "@/lib/prisma";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUniqueEmailError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function isTransactionTimeoutError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2028";
}

export async function GET() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { id: 1 }, select: { email: true } });
    if (!admin) return NextResponse.json({ error: "Admin account could not be found." }, { status: 404 });
    return NextResponse.json({ email: admin.email });
  } catch (error) {
    console.error("Failed to load admin account:", error);
    return NextResponse.json({ error: "Admin account could not be loaded." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }

  try {
    const clientAddress = getClientAddress(request);
    if (!(await checkLoginRateLimit(clientAddress))) {
      return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    }

    const body: unknown = await request.json();
    if (!isRecord(body) || typeof body.currentCode !== "string") {
      return NextResponse.json({ error: "Enter your current access code." }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { id: 1 } });
    if (!admin || !(await bcrypt.compare(normalizeAccessCode(body.currentCode), admin.accessCodeHash))) {
      await recordFailedLogin(clientAddress);
      return NextResponse.json({ error: "Current access code is incorrect." }, { status: 401 });
    }

    if (body.action === "email") {
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      // Email is optional now that sign-in uses an access code. An empty string is stored
      // as NULL so the unique index does not prevent a second account-less row.
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
      }

      const updated = await prisma.admin.update({
        where: { id: 1 },
        data: { email: email || null },
        select: { email: true }
      });
      return NextResponse.json({ email: updated.email });
    }

    if (body.action === "accessCode") {
      const newCode = typeof body.newCode === "string" ? normalizeAccessCode(body.newCode) : "";
      const policyError = getAccessCodePolicyError(newCode);
      if (policyError) {
        return NextResponse.json({ error: policyError }, { status: 400 });
      }

      // Incrementing sessionVersion invalidates every other signed-in device, and
      // destroying the current cookie signs the caller out of this one.
      await prisma.admin.update({
        where: { id: 1 },
        data: {
          accessCodeHash: await bcrypt.hash(newCode, 12),
          sessionVersion: { increment: 1 }
        }
      });
      const session = await getAdminSession();
      session.destroy();
      return NextResponse.json({ accessCodeUpdated: true, reauthenticate: true });
    }

    return NextResponse.json({ error: "Choose an email or access code update." }, { status: 400 });
  } catch (error) {
    if (isUniqueEmailError(error)) {
      return NextResponse.json({ error: "That email address is already in use." }, { status: 409 });
    }
    console.error("Failed to update admin account:", error);
    if (isTransactionTimeoutError(error)) {
      return NextResponse.json({ error: "The database is temporarily busy. Wait a moment, then try again." }, { status: 503 });
    }
    return NextResponse.json({ error: "Admin account could not be updated." }, { status: 500 });
  }
}
