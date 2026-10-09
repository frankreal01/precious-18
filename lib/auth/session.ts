import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const key = (n: string) => new TextEncoder().encode(process.env[n]!);
type Scope = "admin" | "recipient";
const cfg = {
  admin: { name: "adm_session", secret: "SESSION_SECRET", ttl: 60 * 60 * 8 },
  recipient: { name: "rcp_session", secret: "RECIPIENT_COOKIE_SECRET", ttl: 60 * 60 * 24 },
};
export async function createSession(scope: Scope, sub: string) {
  const c = cfg[scope];
  const token = await new SignJWT({ sub, scope }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${c.ttl}s`).sign(key(c.secret));
  (await cookies()).set(c.name, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: c.ttl });
}
export async function getSession(scope: Scope) {
  const c = cfg[scope];
  const t = (await cookies()).get(c.name)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key(c.secret));
    return payload.scope === scope ? payload : null;
  } catch { return null; }
}
export async function requireAdmin() {
  const s = await getSession("admin");
  if (!s) throw new Response("Unauthorized", { status: 401 });
  return s;
}
