import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/auth/session";

const Status = z.enum(["DRAFT", "PREVIEW", "PUBLISHED", "UNPUBLISHED"]);
const base = { position: z.number().int().min(0).default(0), status: Status.default("DRAFT") };
const R: Record<string, { model: string; max?: number; schema: z.ZodObject<any> }> = {
  memories: { model: "memory", max: 18, schema: z.object({ title: z.string().max(120), body: z.string().max(4000), ...base }) },
  wishes: { model: "wish", max: 18, schema: z.object({ body: z.string().max(1000), ...base }) },
  reasons: { model: "reason", max: 18, schema: z.object({ body: z.string().max(1000), ...base }) },
  gifts: { model: "gift", schema: z.object({ title: z.string().max(120), description: z.string().max(4000), selectable: z.boolean().default(true), ...base }) },
  chapters: { model: "chapter", max: 18, schema: z.object({ number: z.number().int().min(1).max(18), title: z.string().max(120), kind: z.string().max(40), ...base }) },
  messages: { model: "birthdayMessage", schema: z.object({ body: z.string().max(10000), signature: z.string().max(120).optional(), status: Status.default("DRAFT") }) },
};

async function ctx(req: NextRequest, resource: string) {
  const s = await requireAdmin();
  const exp = await prisma.birthdayExperience.findFirstOrThrow();
  return { adminId: String(s.sub), exp, url: new URL(req.url) };
}
const log = (adminId: string, action: string, entity: string) => prisma.activityLog.create({ data: { adminId, action, entity } });

export async function GET(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await params; const { exp } = await ctx(req, resource);
    if (resource === "dashboard") {
      const [memories, wishes, reasons, gifts, media, responses, logs, rec] = await Promise.all([
        prisma.memory.count(), prisma.wish.count(), prisma.reason.count(), prisma.gift.count(), prisma.media.count(),
        prisma.recipientResponse.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
        prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }), prisma.recipient.findFirst({ select: { fullName: true, birthDate: true } })]);
      return NextResponse.json({ state: exp.state, recipient: rec, counts: { memories, wishes, reasons, gifts, media }, responses, logs });
    }
    const r = R[resource]; if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(await (prisma as any)[r.model].findMany({ where: { experienceId: exp.id }, orderBy: { position: "asc" } }));
  } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await params; const { adminId, exp } = await ctx(req, resource);
    if (resource === "state") { // publish / unpublish / maintenance
      const st = z.enum(["DRAFT", "PREVIEW", "PUBLISHED", "UNPUBLISHED", "MAINTENANCE"]).parse((await req.json()).state);
      await prisma.birthdayExperience.update({ where: { id: exp.id }, data: { state: st } });
      await log(adminId, "experience.state:" + st, "experience"); return NextResponse.json({ ok: true });
    }
    const r = R[resource]; if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = r.schema.parse(await req.json());
    if (r.max && (await (prisma as any)[r.model].count({ where: { experienceId: exp.id } })) >= r.max)
      return NextResponse.json({ error: `Limit of ${r.max} reached.` }, { status: 400 });
    const row = resource === "messages"
      ? await prisma.birthdayMessage.upsert({ where: { experienceId: exp.id }, update: data, create: { ...data, experienceId: exp.id } as any })
      : await (prisma as any)[r.model].create({ data: { ...data, experienceId: exp.id } });
    await log(adminId, `${resource}.create`, row.id); return NextResponse.json(row);
  } catch (e) { return e instanceof Response ? e : e instanceof z.ZodError ? NextResponse.json({ error: "Invalid input" }, { status: 400 }) : NextResponse.json({ error: "Server error" }, { status: 500 }); }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await params; const { adminId, exp, url } = await ctx(req, resource);
    const r = R[resource]; const id = url.searchParams.get("id"); if (!r || !id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = r.schema.partial().parse(await req.json());
    const row = await (prisma as any)[r.model].updateMany({ where: { id, experienceId: exp.id }, data });
    await log(adminId, `${resource}.update`, id); return NextResponse.json(row);
  } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Invalid input" }, { status: 400 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ resource: string }> }) {
  try {
    const { resource } = await params; const { adminId, exp, url } = await ctx(req, resource);
    const r = R[resource]; const id = url.searchParams.get("id"); if (!r || !id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await (prisma as any)[r.model].deleteMany({ where: { id, experienceId: exp.id } });
    await log(adminId, `${resource}.delete`, id); return NextResponse.json({ ok: true });
  } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Server error" }, { status: 500 }); }
}
