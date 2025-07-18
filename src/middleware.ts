import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { config as appConfig } from "@/lib/config";

// List of routes that are considered public and do not require authentication
const publicRoutes = ["/login", "/register", "/verify-email", "/"];

// List of routes that are part of the authentication flow
const authRoutes = ["/login", "/register", "verify-email"];

// List of routes that require admin privileges
const adminRoutes = ["/admin"];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Allow static files and images to pass through
  if (pathname.startsWith("/_next/") || pathname.startsWith("/static/") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Try to get user data if a token exists
  let user = null;
  if (token) {
    try {
      const res = await fetch(`${appConfig.apiUrl}/api/v1/users/me`, {
        headers: {
          Cookie: `token=${token}`,
        },
      });
      if (res.ok) {
        user = await res.json();
      }
    } catch (error) {
      console.error("Failed to fetch user in middleware:", error);
      // If the backend is down, we might want to handle this gracefully
      // For now, we'll proceed as if the user is not logged in
    }
  }

  const isAuthenticated = !!user;
  const is_superuser = user?.is_superuser || false;

  // If the user is authenticated
  if (isAuthenticated) {
    // If trying to access an auth page (like login), redirect to dashboard
    if (authRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // If a non-admin tries to access an admin route, redirect to dashboard
    if (adminRoutes.some(route => pathname.startsWith(route)) && !is_superuser) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } 
  // If the user is not authenticated
  else {
    // Allow access to public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next();
    }
    // For any other route, redirect to the login page
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 