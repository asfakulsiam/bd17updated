
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
  const { userId } = await auth();
  
  if (!userId && isProtectedRoute(req)) {
    return (await auth()).redirectToSignIn();
  }
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
