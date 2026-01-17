import { NextResponse } from 'next/server';
import { getMyRoleInDivvy } from '@/lib/divvy/permissions';
import { isSystemAdminEmail } from '@/lib/auth/admin';

export async function GET(
  _req: Request,
  { params }: { params: { divvyId: string } }
) {
  const divvyId = params.divvyId;

  const { session, role, isCreator } = await getMyRoleInDivvy(divvyId);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isSystemAdmin = isSystemAdminEmail(session.user.email);

  const canManageGroup = isSystemAdmin || isCreator || role === 'admin';

  // Por enquanto:
  // - Convites: criador/admin/system admin
  // - Pedidos de remoção: criador/admin/system admin
  // (membros podem "pedir remoção" via endpoint remove, mas não aprovar)
  return NextResponse.json({
    permissions: {
      isSystemAdmin,
      isCreator,
      role: role ?? 'none',
      canManageInvites: canManageGroup,
      canApproveRemovalRequests: canManageGroup,
    },
  });
}
