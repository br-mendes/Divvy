import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import { authorizeUser } from '@/lib/serverAuth';

export async function GET(request: Request) {
  try {
    const user = await authorizeUser(request);
    const supabase = createServerSupabaseClient();

    const { data: createdGroups, error: createdError } = await supabase
      .from('divvies')
      .select('*')
      .eq('creatorid', user.id);

    if (createdError) throw createdError;

    const { data: memberships, error: memberError } = await supabase
      .from('divvymembers')
      .select('divvyid')
      .eq('userid', user.id);

    if (memberError) throw memberError;

    const joinedIds = (memberships || []).map((m: any) => m.divvyid);

    let joinedGroups: any[] = [];
    if (joinedIds.length > 0) {
      const { data: joined, error: joinedGroupsError } = await supabase
        .from('divvies')
        .select('*')
        .in('id', joinedIds);

      if (joinedGroupsError) throw joinedGroupsError;
      joinedGroups = joined || [];
    }

    const allGroups = [...(createdGroups || []), ...joinedGroups];
    const uniqueGroupsMap = new Map();
    allGroups.forEach(g => uniqueGroupsMap.set(g.id, g));
    const uniqueGroups = Array.from(uniqueGroupsMap.values());

    const groupIds = uniqueGroups.map((g: any) => g.id);

    let membersByGroup: Record<string, any[]> = {};

    if (groupIds.length > 0) {
      const { data: allMembers, error: membersError } = await supabase
        .from('divvymembers')
        .select(`
          *,
          userprofiles (
            id, fullname, displayname, avatarurl
          )
        `)
        .in('divvyid', groupIds);

      if (membersError) throw membersError;

      (allMembers || []).forEach((m: any) => {
        if (!membersByGroup[m.divvyid]) membersByGroup[m.divvyid] = [];

        const profile = Array.isArray(m.userprofiles) ? m.userprofiles[0] : m.userprofiles;

        membersByGroup[m.divvyid].push({
          ...m,
          userprofiles: profile,
        });
      });
    }

    const enrichedDivvies = uniqueGroups.map((g: any) => {
      const groupMembers = membersByGroup[g.id] || [];
      return {
        ...g,
        members: groupMembers,
        member_count: Math.max(groupMembers.length, 1),
      };
    });

    enrichedDivvies.sort((a: any, b: any) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime());

    return NextResponse.json(enrichedDivvies, { status: 200 });
  } catch (error: any) {
    console.error('Dashboard Data API Error:', error);
    return NextResponse.json({ error: error.message || 'Falha ao carregar dashboard' }, { status: 500 });
  }
}
