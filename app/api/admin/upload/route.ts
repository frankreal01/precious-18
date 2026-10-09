import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/database/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { isConfigured, put } from "@/lib/storage/s3";

const OK: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "audio/mpeg": "mp3" };
const MAX = 25 * 1024 * 1024;
const sniff = (b: Buffer, t: string) => // check magic bytes, not just the declared type
  t === "image/jpeg" ? b[0] === 0xff && b[1] === 0xd8 : t === "image/png" ? b.subarray(1, 4).toString() === "PNG"
  : t === "image/webp" ? b.subarray(8, 12).toString() === "WEBP" : t === "video/mp4" ? b.subarray(4, 8).toString() === "ftyp"
  : b.subarray(0, 3).toString() === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0);

export async function POST(req: NextRequest) {
  try {
    const s = await requireAdmin();
    if (!isConfigured()) return NextResponse.json({ error: "Media storage is not configured. Add the S3 settings to .env first." }, { status: 503 });
    const f = (await req.formData()).get("file");
    if (!(f instanceof File) || !OK[f.type] || f.size > MAX) return NextResponse.json({ error: "Use JPG, PNG, WebP, MP4 or MP3 under 25 MB." }, { status: 400 });
    const buf = Buffer.from(await f.arrayBuffer());
    if (!sniff(buf, f.type)) return NextResponse.json({ error: "File contents don't match its type." }, { status: 400 });
    const key = `media/${randomUUID()}.${OK[f.type]}`; await put(key, buf, f.type);
    const exp = await prisma.birthdayExperience.findFirstOrThrow();
    const m = await prisma.media.create({ data: { experienceId: exp.id, storageKey: key, mimeType: f.type, sizeBytes: f.size, kind: f.type.split("/")[0] } });
    await prisma.activityLog.create({ data: { adminId: String(s.sub), action: "media.upload", entity: m.id } });
    return NextResponse.json(m);
  } catch (e) { return e instanceof Response ? e : NextResponse.json({ error: "Upload failed" }, { status: 500 }); }
}
