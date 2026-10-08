import { handleUpload } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/permissions";
import { hasSameOrigin } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    if (!hasSameOrigin(request)) {
      return NextResponse.json(
        { success: false, message: "Request origin is not allowed." },
        { status: 403 },
      );
    }

    if (!(await hasAdminAccess())) {
      return NextResponse.json(
        { success: false, message: "Unauthorized." },
        { status: 401 },
      );
    }

    const session = await getAdminSession();

    const body = await request.json();

    const response = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async () => ({
        allowedContentTypes: [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/avif",
          "application/pdf",
        ],

        maximumSizeInBytes: 10 * 1024 * 1024,

        addRandomSuffix: true,

        tokenPayload: JSON.stringify({
          adminId: session.adminId,
          kind: "portfolio-file",
        }),
      }),
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Blob client upload token failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to prepare the file upload.",
      },
      { status: 500 },
    );
  }
}
