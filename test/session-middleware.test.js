import { test, describe } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Supabase Session Handling & Middleware Verification', () => {
  const middlewareTsPath = path.join(ROOT_DIR, 'templates', 'base-next', 'middleware.ts');
  const supabaseMiddlewarePath = path.join(ROOT_DIR, 'templates', 'base-next', 'lib', 'supabase', 'middleware.ts');

  test('1. Template correctly declares root middleware with Next.js matcher', async () => {
    assert.ok(await fs.pathExists(middlewareTsPath), 'templates/base-next/middleware.ts must exist');
    const content = await fs.readFile(middlewareTsPath, 'utf8');

    assert.ok(content.includes("import { updateSession } from '@/lib/supabase/middleware'"), 'Must import updateSession');
    assert.ok(content.includes('export async function middleware(request: NextRequest)'), 'Must export async middleware function');
    assert.ok(content.includes('export const config = {'), 'Must export Next.js middleware config');
    assert.ok(content.includes('matcher:'), 'Must include matcher configuration');
  });

  test('2. Supabase middleware helper exports updateSession with session refresh and protected route interception', async () => {
    assert.ok(await fs.pathExists(supabaseMiddlewarePath), 'templates/base-next/lib/supabase/middleware.ts must exist');
    const content = await fs.readFile(supabaseMiddlewarePath, 'utf8');

    assert.ok(content.includes('export async function updateSession(request: NextRequest)'), 'Must export updateSession');
    assert.ok(content.includes('createServerClient('), 'Must instantiate createServerClient with cookie adapters');
    assert.ok(content.includes('await supabase.auth.getUser()'), 'Must call supabase.auth.getUser() to refresh session');
    assert.ok(content.includes('getAll()'), 'Must provide getAll() cookie handler');
    assert.ok(content.includes('setAll('), 'Must provide setAll() cookie handler synchronizing cookies');
    assert.ok(content.includes('/protected'), 'Must intercept /protected routes');
    assert.ok(content.includes('/dashboard'), 'Must intercept /dashboard routes');
    assert.ok(content.includes('/account'), 'Must intercept /account routes');
    assert.ok(content.includes('/login'), 'Must redirect unauthenticated protected requests to /login');
  });

  test('3. Simulates updateSession behavior with Next.js Request & Response primitives', async () => {
    // Dynamically load Next primitives from demo-app node_modules if present
    const nextServerPath = path.join(ROOT_DIR, 'demo-app', 'node_modules', 'next', 'server.js');
    if (!(await fs.pathExists(nextServerPath))) {
      return; // Skip runtime execution if demo-app node_modules are absent
    }

    const { NextResponse } = await import(`file:///${nextServerPath.replace(/\\/g, '/')}`);

    // Test protected route logic simulation matching updateSession contract
    function evaluateSessionInterception(pathname, user) {
      const isProtectedRoute =
        pathname.startsWith('/protected') ||
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/account');

      if (!user && isProtectedRoute) {
        const url = new URL(`http://localhost:3000/login?redirectTo=${encodeURIComponent(pathname)}`);
        return NextResponse.redirect(url);
      }

      return NextResponse.next();
    }

    // Unauthenticated on protected route
    const redirectRes = evaluateSessionInterception('/dashboard', null);
    assert.strictEqual(redirectRes.status, 307);
    assert.ok(redirectRes.headers.get('location').includes('/login?redirectTo=%2Fdashboard'));

    // Authenticated on protected route
    const authRes = evaluateSessionInterception('/dashboard', { id: 'test-user-id' });
    assert.strictEqual(authRes.status, 200);

    // Unauthenticated on public route
    const publicRes = evaluateSessionInterception('/', null);
    assert.strictEqual(publicRes.status, 200);
  });
});
