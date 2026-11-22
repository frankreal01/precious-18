import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { isConfigured } from "@/lib/storage/s3";
import { serveMedia } from "@/lib/storage/serve";

export async function GET(req: Request, { params }: { params: Promise<{ resource: string; id: string }> }) {
  try {
    await requireAdmin();
    const { resource, id } = await params;
    if (resource !== "media") return new NextResponse("Not found", { status: 404 });
    if (!isConfigured()) return new NextResponse("Media storage is not configured", { status: 503 });

    const media = await prisma.media.findFirst({
      where: { id },
      select: { storageKey: true, mimeType: true },
    });
    if (!media) return new NextResponse("Not found", { status: 404 });
    return await serveMedia(req, media.storageKey, media.mimeType);
  } catch (error) {
    if (error instanceof Response) return error;
    return new NextResponse("Unable to load media", { status: 502 });
  }
}
