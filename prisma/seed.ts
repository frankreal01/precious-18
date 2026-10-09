import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const p = new PrismaClient();
(async () => {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email) throw new Error("ADMIN_EMAIL is missing from .env.");
  if (!password || password.length < 12)
    throw new Error("ADMIN_PASSWORD must be at least 12 characters. Update it in .env, then run npm.cmd run db:seed again.");

  const passwordHash = await bcrypt.hash(password, 12);
  const existingAdmin = await p.admin.findFirst({ orderBy: { createdAt: "asc" } });
  if (existingAdmin) {
    await p.admin.update({ where: { id: existingAdmin.id }, data: { email, passwordHash } });
  } else {
    await p.admin.create({ data: { email, passwordHash } });
  }
  if (!(await p.recipient.findFirst())) {
    const r = await p.recipient.create({ data: { fullName: "PRECIOUS MELIKAM CHISOM", birthDate: new Date("2008-11-23T00:00:00Z") } });
    const e = await p.birthdayExperience.create({ data: { recipientId: r.id } });
    await p.experienceSettings.create({ data: { experienceId: e.id, closingMessage: "Edit this closing message in /admin/settings." } });
  }
})().finally(() => p.$disconnect());
