import { createHash } from "crypto";
import { prisma } from "../database/prisma";
export const hashIp = (ip: string) =>
  createHash("sha256").update(ip + process.env.SESSION_SECRET).digest("hex");
// Lock after 5 failures in 15 minutes per IP hash.
export async function isLocked(ipHash: string) {
  const since = new Date(Date.now() - 15 * 60_000);
  const fails = await prisma.verificationAttempt.count({ where: { ipHash, success: false, createdAt: { gte: since } } });
  return fails >= 5;
}
export const record = (ipHash: string, success: boolean) =>
  prisma.verificationAttempt.create({ data: { ipHash, success } });
