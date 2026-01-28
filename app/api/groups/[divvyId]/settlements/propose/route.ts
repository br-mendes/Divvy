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

    // User authentication
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

    // Get settlement proposals with related data
    const { data, error } = await supabaseAdmin
      .from('settlement_proposals')
      .select(`
        *,
        user_profiles!settlement_proposals_created_by_fkey (fullname, email),
        settlement_transactions(
          *,
          from_user:user_profiles!settlement_transactions_from_user_id_fkey (fullname, email),
          to_user:user_profiles!settlement_transactions_to_user_id_fkey (fullname, email)
        )
      `)
      .eq('divvy_id', divvyId)
      .order('proposed_at', { ascending: false });

    if (error) {
      console.error('Error fetching settlement proposals:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { divvyId: string } }) {
  try {
    const divvyId = params.divvyId;
    const body = await request.json();
    const { title, description, optimization_algorithm = 'minimum_transactions' } = body;

    // User authentication
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

    // Get current balances
    const { data: balances, error: balanceError } = await supabaseAdmin
      .from('user_balances')
      .select('*')
      .eq('divvy_id', divvyId);

    if (balanceError) {
      return NextResponse.json({ error: 'Failed to fetch balances' }, { status: 500 });
    }

    if (!balances || balances.length === 0) {
      return NextResponse.json({ error: 'No balances found for this divvy' }, { status: 404 });
    }

    // Generate optimized settlement
    const settlementTransactions = generateSettlementTransactions(balances, optimization_algorithm);

    // Create settlement proposal
    const { data: proposal, error: proposalError } = await supabaseAdmin
      .from('settlement_proposals')
      .insert([{
        divvy_id: divvyId,
        created_by: user.id,
        title: title || 'Settlement Proposal',
        description,
        optimization_algorithm,
        total_amount: settlementTransactions.reduce((sum, t) => sum + t.amount, 0),
        transaction_count: settlementTransactions.length,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }])
      .select()
      .single();

    if (proposalError) {
      return NextResponse.json({ error: 'Failed to create proposal' }, { status: 500 });
    }

    // Create settlement transactions
    const transactionInserts = settlementTransactions.map(transaction => ({
      proposal_id: proposal.id,
      from_user_id: transaction.from_user_id,
      to_user_id: transaction.to_user_id,
      amount: transaction.amount,
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    }));

    const { data: transactions, error: transactionError } = await supabaseAdmin
      .from('settlement_transactions')
      .insert(transactionInserts)
      .select(`
        *,
        from_user:user_profiles!settlement_transactions_from_user_id_fkey (fullname, email),
        to_user:user_profiles!settlement_transactions_to_user_id_fkey (fullname, email)
      `);

    if (transactionError) {
      return NextResponse.json({ error: 'Failed to create transactions' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: {
        proposal,
        transactions
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { divvyId: string } }) {
  try {
    const body = await request.json();
    const { proposalId, action, notes } = body;

    if (!proposalId || !action) {
      return NextResponse.json({ 
        error: 'proposalId and action are required' 
      }, { status: 400 });
    }

    // User authentication
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let updateData: any = {};
    
    if (action === 'accept') {
      updateData = {
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: [user.id], // In a real implementation, this would be an array
        notes: notes || null
      };
    } else if (action === 'reject') {
      updateData = {
        status: 'rejected',
        notes: notes || null
      };
    } else {
      return NextResponse.json({ error: 'Invalid action. Must be accept or reject' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('settlement_proposals')
      .update(updateData)
      .eq('id', proposalId)
      .select()
      .single();

    if (error) {
      console.error('Error updating settlement proposal:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateSettlementTransactions(balances: any[], algorithm: string): any[] {
  const transactions: any[] = [];
  
  // Separate debtors and creditors
  const debtors = balances.filter(b => b.balance_amount < 0);
  const creditors = balances.filter(b => b.balance_amount > 0);

  // Simple minimum transactions algorithm
  if (algorithm === 'minimum_transactions') {
    // Process debtors
    debtors.forEach(debtor => {
      let remainingDebt = Math.abs(debtor.balance_amount);
      
      // Match with creditors
      creditors.forEach(creditor => {
        if (remainingDebt > 0 && creditor.balance_amount > 0) {
          const amount = Math.min(remainingDebt, creditor.balance_amount);
          
          if (amount > 0) {
            transactions.push({
              from_user_id: debtor.user_id,
              to_user_id: creditor.user_id,
              amount: amount
            });
            
            remainingDebt -= amount;
            creditor.balance_amount -= amount;
          }
        }
      });
    });
  }

  return transactions;
}