import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  const session = await getAdminSession();
  if (session.adminId !== 1) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  session.destroy();
  return new NextResponse(null, { status: 204 });
}
