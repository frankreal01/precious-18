import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { createSession } from "@/lib/auth/session";
import { hashIp, isLocked, record } from "@/lib/security/attempts";

const Body = z.object({ birthday: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/) });

export async function POST(req: NextRequest) {
  const ip = hashIp(req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown");
  if (await isLocked(ip)) return NextResponse.json({ ok: false, error: "Too many tries. Please wait a while." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  const recipient = await prisma.recipient.findFirst();
  const d = recipient?.birthDate;
  const expected = d ? `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}` : null;
  const ok = !!(parsed.success && expected && parsed.data.birthday === expected);
  await record(ip, ok);
  if (!ok) return NextResponse.json({ ok: false, error: "That isn't it. Try again." }, { status: 401 });
  await createSession("recipient", recipient!.id);
  return NextResponse.json({ ok: true });
}
