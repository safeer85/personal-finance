import { auth } from "@/src/infra/auth/nextauth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isLoginPage = req.nextUrl.pathname.startsWith("/login");
  const isAuthApi = req.nextUrl.pathname.startsWith("/api/auth");

  if (!isLoggedIn && !isLoginPage && !isAuthApi) {
    const url = new URL("/login", req.nextUrl.origin);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: [
    /*
      Protect everything except:
      - /login
      - /api/auth/*
      - public assets
    */
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
