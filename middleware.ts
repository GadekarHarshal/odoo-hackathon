export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/environmental/:path*",
    "/social/:path*",
    "/governance/:path*",
    "/gamification/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/notifications/:path*",
  ],
}
