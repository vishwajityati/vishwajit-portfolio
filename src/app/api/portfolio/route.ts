import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/permissions";
import {
  getPortfolioService,
  updatePortfolioService,
} from "@/services/portfolio.service";
import { exceedsDeclaredSize, exceedsSerializedSize, hasSameOrigin } from "@/lib/security";
import { isPortfolioContent } from "@/lib/validations";

export const dynamic = "force-dynamic";

/** Generous ceiling for the whole portfolio document; the live record is a few KB. */
const MAX_BODY_BYTES = 256_000;

export async function GET() {
  try {
    const content = await getPortfolioService();
    return NextResponse.json(content);
  } catch (error) {
    console.error("Failed to load portfolio content:", error);
    return NextResponse.json({ error: "Portfolio content could not be loaded." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Please sign in to continue." }, { status: 401 });
  }
  if (exceedsDeclaredSize(request, MAX_BODY_BYTES)) {
    return NextResponse.json({ error: "Portfolio content is too large to save." }, { status: 413 });
  }
  try {
    const body: unknown = await request.json();
    if (exceedsSerializedSize(body, MAX_BODY_BYTES)) {
      return NextResponse.json({ error: "Portfolio content is too large to save." }, { status: 413 });
    }
    const content = typeof body === "object" && body !== null && "content" in body ? body.content : null;
    if (!isPortfolioContent(content)) {
      return NextResponse.json({ error: "Portfolio data is invalid or missing required sections." }, { status: 400 });
    }
    const savedContent = await updatePortfolioService(content);
    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error("Failed to save portfolio content:", error);
    return NextResponse.json({ error: "Portfolio changes could not be saved." }, { status: 500 });
  }
}
