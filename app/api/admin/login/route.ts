import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { createSession } from "@/lib/auth/session";
import { hashIp, isLocked, record } from "@/lib/security/attempts";

const Body = z.object({ email: z.string().email(), password: z.string().min(8).max(200) });

export async function POST(req: NextRequest) {
  const ip = hashIp("admin:" + (req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"));
  if (await isLocked(ip)) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  const p = Body.safeParse(await req.json().catch(() => null));
  const admin = p.success ? await prisma.admin.findUnique({ where: { email: p.data.email } }) : null;
  const ok = !!(admin && p.success && (await bcrypt.compare(p.data.password, admin.passwordHash)));
  await record(ip, ok);
  await prisma.activityLog.create({ data: { adminId: admin?.id, action: ok ? "admin.login" : "admin.login_failed" } });
  if (!ok) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  await createSession("admin", admin!.id);
  return NextResponse.json({ ok: true });
}
