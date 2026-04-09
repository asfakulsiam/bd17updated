
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/policy',
    '/notices(.*)',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/settings',
    '/api/webhooks/clerk',
]);

const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/admin(.*)',
  '/loan(.*)',
  '/payment(.*)',
  '/transactions(.*)',
  '/inbox(.*)',
  '/receipt(.*)',
  '/registration(.*)',
  '/api/((?!settings|webhooks/clerk).*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth().protect();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
