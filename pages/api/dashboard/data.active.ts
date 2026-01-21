
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '../../../lib/supabaseServer';
import { authorizeUser } from '../../../lib/serverAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Validar Token do Usuário
    const user = await authorizeUser(req, res);
    
    // 2. Usar cliente com Service Role para bypassar RLS e evitar recursão infinita
    const supabase = createServerSupabaseClient(); 

    // 3. Buscar Grupos Criados pelo Usuário
    const { data: createdGroups, error: createdError } = await supabase
        .from('divvies')
        .select('*')
        .eq('creatorid', user.id);
    
    if (createdError) throw createdError;

    // 4. Buscar Grupos onde o Usuário é Membro
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

    // 5. Unificar Listas
    const allGroups = [...(createdGroups || []), ...joinedGroups];
    // Remover duplicatas (caso seja criador e membro ao mesmo tempo)
    const uniqueGroupsMap = new Map();
    allGroups.forEach(g => uniqueGroupsMap.set(g.id, g));
    const uniqueGroups = Array.from(uniqueGroupsMap.values());
    
    const groupIds = uniqueGroups.map((g: any) => g.id);

    // 6. Buscar Membros desses grupos (Join manual ou via relação)
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
            
            // Normalizar perfil (Supabase pode retornar array ou objeto dependendo da relação)
            const profile = Array.isArray(m.userprofiles) ? m.userprofiles[0] : m.userprofiles;
            
            membersByGroup[m.divvyid].push({
                ...m,
                userprofiles: profile
            });
        });
    }

    // 7. Buscar despesas e splits para cálculo de totais por membro
    const memberTotalsByGroup: Record<string, Record<string, { paid: number; owed: number }>> = {};
    const expenseGroupById = new Map<string, string>();

    groupIds.forEach((groupId: string) => {
        memberTotalsByGroup[groupId] = {};
        (membersByGroup[groupId] || []).forEach((member: any) => {
            memberTotalsByGroup[groupId][member.userid] = { paid: 0, owed: 0 };
        });
    });

    if (groupIds.length > 0) {
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('id, divvyid, paidbyuserid, amount')
            .in('divvyid', groupIds);

        if (expensesError) throw expensesError;

        (expenses || []).forEach((expense: any) => {
            expenseGroupById.set(expense.id, expense.divvyid);
            const groupTotals = memberTotalsByGroup[expense.divvyid] || {};
            if (!groupTotals[expense.paidbyuserid]) {
                groupTotals[expense.paidbyuserid] = { paid: 0, owed: 0 };
            }
            groupTotals[expense.paidbyuserid].paid += Number(expense.amount || 0);
            memberTotalsByGroup[expense.divvyid] = groupTotals;
        });

        const expenseIds = (expenses || []).map((expense: any) => expense.id);
        if (expenseIds.length > 0) {
            const { data: splits, error: splitsError } = await supabase
                .from('expensesplits')
                .select('expenseid, participantuserid, amountowed')
                .in('expenseid', expenseIds);

            if (splitsError) throw splitsError;

            (splits || []).forEach((split: any) => {
                const groupId = expenseGroupById.get(split.expenseid);
                if (!groupId) return;
                const groupTotals = memberTotalsByGroup[groupId] || {};
                if (!groupTotals[split.participantuserid]) {
                    groupTotals[split.participantuserid] = { paid: 0, owed: 0 };
                }
                groupTotals[split.participantuserid].owed += Number(split.amountowed || 0);
                memberTotalsByGroup[groupId] = groupTotals;
            });
        }
    }

    // 8. Montar Resposta Final
    const enrichedDivvies = uniqueGroups.map((g: any) => {
        const groupMembers = membersByGroup[g.id] || [];
        const memberTotals = groupMembers.map((member: any) => {
            const totals = memberTotalsByGroup[g.id]?.[member.userid] || { paid: 0, owed: 0 };
            return {
                userid: member.userid,
                paid: totals.paid,
                owed: totals.owed,
                email: member.email,
                userprofiles: member.userprofiles
            };
        });
        return {
            ...g,
            members: groupMembers,
            member_count: Math.max(groupMembers.length, 1),
            member_totals: memberTotals
        };
    });

    // Ordenar por data de criação (mais recente primeiro)
    enrichedDivvies.sort((a: any, b: any) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime());

    return res.status(200).json(enrichedDivvies);

  } catch (error: any) {
    console.error('Dashboard Data API Error:', error);
    return res.status(500).json({ error: error.message || 'Falha ao carregar dashboard' });
  }
}
