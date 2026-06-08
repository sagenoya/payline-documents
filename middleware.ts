import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/',
  '/dashboard(.*)',
  '/documents(.*)',
  '/folders(.*)',
  '/search(.*)',
  '/activity(.*)',
  '/settings(.*)',
  '/onboarding(.*)',
  '/api/documents(.*)',
  '/api/folders(.*)',
  '/api/profile(.*)',
  '/api/activity(.*)',
  '/api/dashboard(.*)',
  '/api/users(.*)',
  '/api/settings(.*)',
  '/api/notifications(.*)',
  '/api/access-requests(.*)',
  // NOTE: /api/uploadthing is NOT protected here because UploadThing's
  // server sends a callback POST with no Clerk session. Auth is handled
  // inside the UploadThing middleware function in core.ts instead.
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)', '/(api|trpc)(.*)'],
};
