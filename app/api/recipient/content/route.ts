import { NextResponse } from "next/server";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  if (!(await getSession("recipient"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pub = { where: { status: "PUBLISHED" as const }, orderBy: { position: "asc" as const } };
  const exp = await prisma.birthdayExperience.findFirst({
    where: { state: "PUBLISHED" },
    include: {
      recipient: { select: { fullName: true } }, settings: true,
      chapters: pub,
      memories: pub, wishes: pub, reasons: pub,
      gifts: { ...pub, select: { id: true, title: true, description: true, selectable: true, selected: true } },
      media: {
        where: { inGallery: true },
        orderBy: [{ position: "asc" as const }, { createdAt: "asc" as const }],
        select: { id: true, mimeType: true, kind: true, caption: true },
      },
    },
  });
  if (!exp) return NextResponse.json({ maintenance: true });
  const message = await prisma.birthdayMessage.findFirst({ where: { experienceId: exp.id, status: "PUBLISHED" }, select: { body: true, signature: true } });
  return NextResponse.json({ ...exp, message, media: exp.media.map((item) => ({ ...item, url: `/api/recipient/media/${item.id}` })) });
}
