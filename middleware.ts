import { NextRequest, NextResponse } from "next/server";
// Coarse gate only. Every /api/admin route ALSO calls requireAdmin() server-side.
export function middleware(req: NextRequest) {
  const p = req.nextUrl.pathname;
  const isLogin = p === "/admin/login" || p === "/api/admin/login";
  if ((p.startsWith("/admin") || p.startsWith("/api/admin")) && !isLogin && !req.cookies.get("adm_session")) {
    return p.startsWith("/api") ? new NextResponse("Unauthorized", { status: 401 }) : NextResponse.redirect(new URL("/admin/login", req.url));
  }
}
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
