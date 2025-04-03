import { clerkMiddleware } from '@clerk/nextjs/server';

// This middleware will protect all routes except the ones specified in the matcher
export default clerkMiddleware();

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api/webhook (webhook endpoints)
     * - api/debug (debug endpoints)
     * - api/countries, api/products, api/operators, api/status (public API endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/webhook|api/debug|api/countries|api/products|api/operators|api/status).*)'
  ],
};