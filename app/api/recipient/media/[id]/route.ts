import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { get, isConfigured } from "@/lib/storage/s3";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession("recipient"))) return new NextResponse("Unauthorized", { status: 401 });
  if (!isConfigured()) return new NextResponse("Media storage is not configured", { status: 503 });

  try {
    const { id } = await params;
    const media = await prisma.media.findFirst({
      where: { id, inGallery: true, experience: { state: "PUBLISHED" } },
      select: { storageKey: true, mimeType: true },
    });
    if (!media) return new NextResponse("Not found", { status: 404 });

    const object = await get(media.storageKey);
    if (!object.Body) return new NextResponse("Not found", { status: 404 });
    const bytes = await object.Body.transformToByteArray();
    const body = new Uint8Array(bytes.byteLength);
    body.set(bytes);
    return new NextResponse(body, {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Unable to load media", { status: 502 });
  }
}
