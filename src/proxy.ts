import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 1. Define routes that do NOT require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)', // CRITICAL: This allows Clerk and Corsair servers to talk to your API
  '/api/sse(.*)'        // SSE endpoint — public so EventSource can connect
]);

export default clerkMiddleware(async (auth, req) => {
  // 2. If the user tries to access a protected route, bounce them to login
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for Clerk's auto-proxy path
    '/__clerk/:path*',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};