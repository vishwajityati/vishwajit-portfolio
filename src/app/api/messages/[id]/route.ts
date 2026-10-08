import { NextRequest, NextResponse } from "next/server";
import { hasAdminAccess } from "@/lib/permissions";
import { hasSameOrigin } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getMessageId(context: RouteContext): Promise<number | null> {
  const { id } = await context.params;
  const messageId = Number(id);
  return Number.isSafeInteger(messageId) && messageId > 0 ? messageId : null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Please sign in to manage messages." }, { status: 401 });
  }

  const id = await getMessageId(context);
  if (id === null) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || !("read" in body) || typeof body.read !== "boolean") {
      return NextResponse.json({ error: "Choose whether the message should be marked read." }, { status: 400 });
    }

    const message = await prisma.contactMessage.update({
      where: { id },
      data: { readAt: body.read ? new Date() : null }
    });
    return NextResponse.json({ message });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }
    console.error("Failed to update contact message:", error);
    return NextResponse.json({ error: "Message could not be updated." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: "Please sign in to manage messages." }, { status: 401 });
  }

  const id = await getMessageId(context);
  if (id === null) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  try {
    await prisma.contactMessage.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }
    console.error("Failed to delete contact message:", error);
    return NextResponse.json({ error: "Message could not be deleted." }, { status: 500 });
  }
}
