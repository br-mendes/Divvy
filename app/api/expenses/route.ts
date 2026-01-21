import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * STUB AUTOMÁTICO PARA DESTRAVAR BUILD
 * - Evita qualquer throw em tempo de import durante next build
 * - Se faltar SUPABASE_SERVICE_ROLE_KEY, retorna 500 dentro do handler
 * - Usa req.url para pathname (evita problemas de backslash no Windows)
 */

function missingEnv(pathname: string) {
  return NextResponse.json(
    { ok: false, code: 'MISSING_ENV', message: 'Missing env SUPABASE_SERVICE_ROLE_KEY', pathname },
    { status: 500 }
  );
}

function ok(pathname: string, method: string) {
  return NextResponse.json({ ok: true, pathname, method, note: 'stub' });
}

function gate(req: Request, method: string) {
  const pathname = new URL(req.url).pathname;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return missingEnv(pathname);
  return ok(pathname, method);
}

export async function GET(req: Request)    { return gate(req, 'GET'); }
export async function POST(req: Request)   { return gate(req, 'POST'); }
export async function PUT(req: Request)    { return gate(req, 'PUT'); }
export async function PATCH(req: Request)  { return gate(req, 'PATCH'); }
export async function DELETE(req: Request) { return gate(req, 'DELETE'); }