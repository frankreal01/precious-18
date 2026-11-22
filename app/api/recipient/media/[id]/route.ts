import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";
import { isConfigured } from "@/lib/storage/s3";
import { serveMedia } from "@/lib/storage/serve";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession("recipient"))) return new NextResponse("Unauthorized", { status: 401 });
  if (!isConfigured()) return new NextResponse("Media storage is not configured", { status: 503 });

  try {
    const { id } = await params;
    const media = await prisma.media.findFirst({
      where: { id, inGallery: true, experience: { state: "PUBLISHED" } },
      select: { storageKey: true, mimeType: true },
    });
    if (!media) return new NextResponse("Not found", { status: 404 });
    return await serveMedia(req, media.storageKey, media.mimeType);
  } catch {
    return new NextResponse("Unable to load media", { status: 502 });
  }
}
