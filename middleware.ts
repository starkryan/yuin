import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define routes that should be publicly accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/', // Home page should be public
  '/sign-in(.*)', // Sign-in pages
  '/sign-up(.*)', // Sign-up pages
  '/api/webhook(.*)', // Webhooks should usually be public
  '/pricing', // Making pricing page public
  // Add any other public pages here
])

export default clerkMiddleware(async (auth, req) => {
  // For non-public routes, require authentication
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}