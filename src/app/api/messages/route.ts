import { NextRequest, NextResponse } from "next/server";
import { consumeContactMessageRateLimit } from "@/lib/auth-rate-limit";
import { getContactEmailConfigurationStatus, sendContactEmail } from "@/lib/contact-email";
import { hasAdminAccess } from "@/lib/permissions";
import { exceedsDeclaredSize, exceedsSerializedSize, getClientAddress, hasSameOrigin } from "@/lib/security";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32_000;
const MAX_MESSAGE_LENGTH = 30_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function GET(request: NextRequest) {
  try {
    if (!(await hasAdminAccess())) {
      return NextResponse.json({ error: "Please sign in to view messages." }, { status: 401 });
    }

    const unreadFilter = { readAt: null };
    const summaryOnly = request.nextUrl.searchParams.get("summary") === "1";
    const emailConfiguration = getContactEmailConfigurationStatus();
    const [messages, unreadCount, emailNotificationsEnabled] = await Promise.all([
      summaryOnly
        ? Promise.resolve(null)
        : prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.contactMessage.count({ where: unreadFilter }),
      Promise.resolve(emailConfiguration.configured)
    ]);

    return NextResponse.json({
      messages,
      unreadCount,
      emailNotificationsEnabled,
      emailNotificationMissingSettings: emailConfiguration.missingSettings
    });
  } catch (error) {
    console.error("Failed to load contact messages:", error);
    return NextResponse.json({ error: "Messages could not be loaded." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  if (exceedsDeclaredSize(request, MAX_BODY_BYTES)) {
    return NextResponse.json({ error: "Your message is too large." }, { status: 413 });
  }

  const clientAddress = getClientAddress(request);
  try {
    if (!(await consumeContactMessageRateLimit(clientAddress))) {
      return NextResponse.json({ error: "Too many messages were sent. Please try again later." }, { status: 429 });
    }

    const body: unknown = await request.json();
    if (!isRecord(body)) {
      return NextResponse.json({ error: "Enter your name, a valid email, and a message." }, { status: 400 });
    }
    if (exceedsSerializedSize(body, MAX_BODY_BYTES)) {
      return NextResponse.json({ error: "Your message is too large." }, { status: 413 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const website = typeof body.website === "string" ? body.website.trim() : "";

    if (website || name.length < 1 || name.length > 100 || /[\u0000-\u001f\u007f]/.test(name) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !/^\d{0,10}$/.test(phone) || message.length > MAX_MESSAGE_LENGTH || !message.trim()) {
      return NextResponse.json({ error: "Enter a valid name and email, use at most 10 digits for your phone, and enter a message." }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { id: 1 }, select: { email: true } });
    if (!admin) {
      return NextResponse.json({ error: "The portfolio owner is not currently accepting messages." }, { status: 503 });
    }

    const submission = { name, email, phone, message };
    const savedMessage = await prisma.contactMessage.create({ data: submission });

    let notificationSent = false;
    const emailConfiguration = getContactEmailConfigurationStatus();
    // The admin email is optional now that sign-in uses an access code, so it can no longer
    // be assumed to be a usable recipient. CONTACT_EMAIL_TO still takes precedence.
    const recipient = process.env.CONTACT_EMAIL_TO?.trim() || admin.email || "";
    const emailNotificationsEnabled = emailConfiguration.configured && recipient.length > 0;
    try {
      if (emailNotificationsEnabled) {
        notificationSent = await sendContactEmail(recipient, submission);
        if (notificationSent) {
          await prisma.contactMessage.update({
            where: { id: savedMessage.id },
            data: { notificationSent: true }
          });
        }
      }
    } catch (error) {
      const errorDetails = typeof error === "object" && error !== null
        ? {
            name: "name" in error && typeof error.name === "string" ? error.name : "Error",
            code: "code" in error && typeof error.code === "string" ? error.code : "unknown",
            command: "command" in error && typeof error.command === "string" ? error.command : undefined,
            responseCode: "responseCode" in error && typeof error.responseCode === "number" ? error.responseCode : undefined
          }
        : { name: "Error", code: "unknown" };
      console.error("Contact message was saved, but email notification failed.", errorDetails);
    }

    return NextResponse.json({
      received: true,
      notificationSent,
      emailNotificationsEnabled,
      emailNotificationMissingSettings: emailConfiguration.missingSettings
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to receive contact message:", error);
    return NextResponse.json({ error: "Your message could not be sent. Please try again later." }, { status: 500 });
  }
}
