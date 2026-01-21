import { InvitesPanel } from '@/components/groups/InvitesPanel';

async function fetchGroup(divvyId: string) {
  const res = await fetch(
    `${process.env.APP_URL ?? 'http://localhost:3000'}/api/groups/${divvyId}`,
    {
      cache: 'no-store',
      headers: {
        // Em muitos apps com auth via cookies, o fetch no server pode precisar repassar cookies.
        // Se o seu /api/groups/[id] exigir cookie e isso falhar, trocamos para buscar direto no Supabase server client.
      },
    }
  );

  // Se falhar por autenticação/cookies no server, você vai ver aqui.
  if (!res.ok) return null;
  return res.json();
}

export default async function GroupDetailPage({
  params,
}: {
  params: { divvyId: string };
}) {
  const data = await fetchGroup(params.divvyId);

  // fallback simples (se a API não funcionar via server fetch)
  if (!data?.divvy) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Grupo</h1>
        <p className="opacity-70">
          Não foi possível carregar o grupo. Se isso acontecer, me diga e eu ajusto para buscar
          direto via Supabase server client.
        </p>

        <div className="mt-6">
          <InvitesPanel divvyId={params.divvyId} />
        </div>
      </div>
    );
  }

  const { divvy, members } = data;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="border rounded p-4">
        <h1 className="text-2xl font-bold">{divvy.name}</h1>
        {divvy.description && <p className="opacity-70 mt-1">{divvy.description}</p>}
        <p className="text-sm opacity-70 mt-2">
          Tipo: <b>{divvy.type}</b>
        </p>
      </div>

      <div className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Membros</h2>
        <div className="space-y-2">
          {(members ?? []).map((m: any) => (
            <div key={m.id} className="border rounded p-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium truncate">{m.email}</div>
                <div className="text-xs opacity-70">
                  role: <b>{m.role}</b>
                </div>
              </div>
            </div>
          ))}
          {(members ?? []).length === 0 && <p className="opacity-70">Nenhum membro encontrado.</p>}
        </div>
      </div>

      {/*  Aqui entra a seção de Convites (melhor lugar) */}
      <InvitesPanel divvyId={params.divvyId} />
    </div>
  );
}
