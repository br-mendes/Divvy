import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const divvyId = searchParams.get('divvyId');
    const expenseId = searchParams.get('id');
    const userId = searchParams.get('userId');

    // User authentication
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabaseAdmin
      .from('expenses')
      .select(`
        *,
        expense_categories (name, color),
        user_profiles!expenses_paidbyuserid_fkey (fullname, email),
        expensesplits (
          participantuserid,
          amountowed,
          created_at
        ),
        expense_attachments (file_name, file_size)
      `);

    if (divvyId) {
      query = query.eq('divvyid', divvyId);
    }

    if (expenseId) {
      query = query.eq('id', expenseId);
    }

    if (userId) {
      query = query.eq('paidbyuserid', userId);
    }

    const { data, error } = await query.order('createdat', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      divvyId, 
      paidByUserId, 
      amount, 
      category_id, 
      description, 
      date,
      splits 
    } = body;

    // User authentication
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validation
    if (!divvyId || !paidByUserId || !amount || !description || !date || !splits) {
      return NextResponse.json({ 
        error: 'Required fields: divvyId, paidByUserId, amount, description, date, splits' 
      }, { status: 400 });
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

    // Start transaction
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .insert([{
        divvyid: divvyId,
        paidbyuserid: paidByUserId,
        amount,
        category_id,
        description: description.trim(),
        date: date || new Date().toISOString().split('T')[0],
      }])
      .select()
      .single();

    if (expenseError) {
      return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }

    // Create expense splits
    const splitInserts = splits.map((split: any) => ({
      expenseid: expense.id,
      participantuserid: split.participantuserid,
      amountowed: split.amountowed,
    }));

    const { data: splitData, error: splitError } = await supabaseAdmin
      .from('expensesplits')
      .insert(splitInserts);

    if (splitError) {
      console.error('Error creating expense splits:', splitError);
      // Try to rollback expense
      await supabaseAdmin.from('expenses').delete().eq('id', expense.id);
      return NextResponse.json({ error: 'Failed to create expense splits' }, { status: 500 });
    }

    return NextResponse.json({ data: expense }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ 
        error: 'id and updates are required' 
      }, { status: 400 });
    }

    // User authentication
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update expense
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating expense:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // User authentication
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check expense ownership
    const { data: expense, error: expenseError } = await supabaseAdmin
      .from('expenses')
      .select('paidbyuserid, divvyid')
      .eq('id', id)
      .single();

    if (expenseError || !expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Check if user is member of divvy
    const { data: memberCheck, error: memberError } = await supabaseAdmin
      .from('divvymembers')
      .select('userid, role')
      .eq('divvyid', expense.divvyid)
      .eq('userid', user.id)
      .single();

    if (memberError || !memberCheck || (expense.paidbyuserid !== user.id && memberCheck.role !== 'admin')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete expense (splits will cascade delete)
    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting expense:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}