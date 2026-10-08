import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { checkLoginRateLimit } from "@/lib/auth-rate-limit";
import { getClientAddress, hasSameOrigin } from "@/lib/security";
import { getAccessCodePolicyError, normalizeAccessCode } from "@/lib/access-code";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  try {
    if (!(await checkLoginRateLimit(getClientAddress(request)))) {
      return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429 });
    }
    const body: unknown = await request.json();
    const code = typeof body === "object" && body !== null && "code" in body && typeof body.code === "string"
      ? normalizeAccessCode(body.code)
      : "";

    const policyError = getAccessCodePolicyError(code);
    if (policyError) {
      return NextResponse.json({ error: policyError }, { status: 400 });
    }

    const admin = await prisma.admin.create({
      data: { id: 1, accessCodeHash: await bcrypt.hash(code, 12) }
    }).catch((error: unknown) => {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return null;
      throw error;
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin setup is already complete. Please sign in." }, { status: 409 });
    }

    const session = await getAdminSession();
    session.adminId = 1;
    session.sessionVersion = admin.sessionVersion;
    await session.save();
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Failed to set up admin account:", error);
    return NextResponse.json({ error: "Admin account could not be set up." }, { status: 500 });
  }
}
