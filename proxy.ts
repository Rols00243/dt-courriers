import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname === "/login"

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|public|uploads|favicon.ico|manifest.webmanifest|icon.svg|icon\\.png|apple-icon|robots.txt|sw.js).*)",
  ],
}
