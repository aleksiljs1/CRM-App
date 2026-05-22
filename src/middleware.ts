import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;

  // Redirect authenticated users away from login
  if (pathname.startsWith("/login") && token) {
    const role = token.role as string;
    const redirectUrl = getDefaultDashboard(role);
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For hackathon simplicity: basic role checks
    const role = token.role as string;

    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(
        new URL(getDefaultDashboard(role), request.url)
      );
    }

    if (
      pathname.startsWith("/dashboard/client") &&
      role !== "CLIENT" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL(getDefaultDashboard(role), request.url)
      );
    }

    if (
      pathname.startsWith("/dashboard/partner") &&
      role !== "PARTNER" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL(getDefaultDashboard(role), request.url)
      );
    }

    if (
      pathname.startsWith("/dashboard/manager") &&
      !["ADMIN", "PARTNER", "MANAGER"].includes(role)
    ) {
      return NextResponse.redirect(
        new URL("/dashboard/hr", request.url)
      );
    }
  }

  return NextResponse.next();
}

function getDefaultDashboard(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/dashboard/admin";
    case "PARTNER":
      return "/dashboard/partner";
    case "CLIENT":
      return "/dashboard/client";
    case "MANAGER":
      return "/dashboard/manager";
    default:
      return "/dashboard/hr";
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
