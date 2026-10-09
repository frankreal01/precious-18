import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { getSession } from "@/lib/auth/session";

const Body = z.object({ message: z.string().trim().max(2000).optional(), reaction: z.string().max(8).optional(), giftId: z.string().max(40).optional() });

export async function POST(req: Request) {
  const s = await getSession("recipient");
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = Body.safeParse(await req.json().catch(() => null));
  if (!b.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { message, reaction, giftId } = b.data; // React escapes output; stored as plain text
  if (giftId) {
    const g = await prisma.gift.findFirst({ where: { id: giftId, status: "PUBLISHED", selectable: true } });
    if (!g) return NextResponse.json({ error: "Gift not available" }, { status: 404 });
    await prisma.$transaction([prisma.gift.updateMany({ data: { selected: false } }), prisma.gift.update({ where: { id: g.id }, data: { selected: true, selectedAt: new Date() } })]);
  }
  if (message || reaction) await prisma.recipientResponse.create({ data: { recipientId: String(s.sub), message, reaction } });
  return NextResponse.json({ ok: true });
}
