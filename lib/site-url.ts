// The app's own absolute base URL (protocol + host + '/dvl' basePath).
//
// Before this file existed, this same value was hardcoded independently in
// about a dozen places — auth-guard layouts, email templates, the jury-link
// generator — and about half of them used 'https://www.sanjayfuloria.tech'
// while others used the bare 'https://sanjayfuloria.tech'. Because the
// session cookie used to be host-only (fixed separately in
// app/api/login/route.ts, which now sets it on the whole '.sanjayfuloria.tech'
// domain), a redirect that landed on the "wrong" variant would silently
// drop the cookie and bounce the person back to login — which is exactly
// what broke login site-wide on 2026-09-03.
//
// Use getBaseUrl() instead of hardcoding the domain anywhere new. It's a
// plain function (no 'use client'/'use server' directive) so it's safe to
// import from Server Components, Route Handlers, AND Client Components —
// NEXT_PUBLIC_* env vars are inlined at build time either way.
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'https://sanjayfuloria.tech/dvl'
}
