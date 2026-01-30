export type DivvyGroup = {
  id: string;
  name?: string | null;
  type?: string | null;
  creatorid?: string | null;
  created_at?: string | null;
};

export type GroupsResponse = {
  ok: boolean;
  groups?: DivvyGroup[];
  note?: string;
  source?: string;
  meta?: any;
  debug?: any;
};

export async function fetchGroups(): Promise<GroupsResponse> {
  const res = await fetch('/api/groups', {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    return {
      ok: false,
      groups: [],
      note: `HTTP_${res.status}`,
      debug: json ?? null,
    };
  }

  return json as GroupsResponse;
<<<<<<< HEAD
}
=======
}
>>>>>>> 3742ed0ae9e93e68ce111148d75a3f9568b2e852
