import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { divvyId: string } }) {
  try {
    const divvyId = params.divvyId;
    
    if (!divvyId) {
      return NextResponse.json({ error: 'divvyId is required' }, { status: 400 });
    }

    // Get user from request
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is member of divvy
    const { data: memberCheck, error: memberError } = await supabaseAdmin
      .from('divvymembers')
      .select('userid, role')
      .eq('divvyid', divvyId)
      .eq('userid', user.id)
      .single();

    if (memberError || !memberCheck) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all expenses for the divvy
    const { data: expenses, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .select(`
        *,
        expense_categories (name, color),
        user_profiles!expenses_paidbyuserid_fkey (fullname, email)
      `)
      .eq('divvyid', divvyId)
      .order('createdat', { ascending: false });

    if (expenseError) {
      console.error('Error fetching expenses:', expenseError);
      return NextResponse.json({ error: expenseError.message }, { status: 500 });
    }

    // Get all members with user profiles
    const { data: members, error: membersError } = await supabaseAdmin
      .from('divvymembers')
      .select('userid, role, userprofiles(*)')
      .eq('divvyid', divvyId);

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: membersError.message }, { status: 500 });
    }

    // Calculate balances
    const memberBalances = calculateMemberBalances(expenses || [], members || []);
    
    // Update user_balances table
    await updateUserBalances(divvyId, memberBalances);

    return NextResponse.json({
      data: {
        member_balances: memberBalances,
        total_expenses: expenses?.length || 0,
        calculation_date: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Unexpected error in balance calculation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateMemberBalances(expenses: any[], members: any[]) {
  const memberExpenses: { [key: string]: { paid: number; owes: number; } } = {};
  const memberBalances: any[] = [];

  // Initialize member tracking
  members.forEach(member => {
    memberExpenses[member.userid] = { paid: 0, owes: 0 };
  });

  // Calculate what each member paid and owes
  expenses.forEach(expense => {
    const splitAmount = expense.amount / members.length;
    
    // Track who paid
    memberExpenses[expense.paidbyuserid].paid = (memberExpenses[expense.paidbyuserid]?.paid || 0) + expense.amount;
    
    // Track what each member owes
    members.forEach(member => {
      memberExpenses[member.userid].owes = (memberExpenses[member.userid]?.owes || 0) + splitAmount;
    });
  });

  // Calculate net balances
  members.forEach(member => {
    const { paid, owes } = memberExpenses[member.userid];
    const netBalance = paid - owes;
    
    memberBalances.push({
      user_id: member.userid,
      full_name: member.user_profiles?.fullname || 'Unknown',
      email: member.user_profiles?.email || 'unknown@example.com',
      role: member.role,
      total_paid: paid,
      total_owes: owes,
      net_balance: netBalance,
      // Positive = Someone owes them, Negative = They owe someone
      balance_amount: netBalance,
      color: netBalance > 0 ? 'green' : netBalance < 0 ? 'red' : 'gray'
    });
  });

  return memberBalances.sort((a, b) => b.net_balance - a.net_balance);
}

async function updateUserBalances(divvyId: string, balances: any[]) {
  try {
    // Clear existing balances
    await supabaseAdmin
      .from('user_balances')
      .delete()
      .eq('divvy_id', divvyId);

    // Insert new balances
    const balanceInserts = balances.map(balance => ({
      user_id: balance.user_id,
      divvy_id: divvyId,
      balance_amount: balance.net_balance,
      last_calculated_at: new Date().toISOString()
    }));

    const { error } = await supabaseAdmin
      .from('user_balances')
      .insert(balanceInserts);

    if (error) {
      console.error('Error updating user balances:', error);
    }
  } catch (error) {
    console.error('Unexpected error updating balances:', error);
  }
}