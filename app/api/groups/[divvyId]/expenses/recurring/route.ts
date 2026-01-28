import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createServerSupabase } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { divvyId: string } }) {
  try {
    const divvyId = params.divvyId;
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // User authentication and authorization
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

    let query = supabaseAdmin
      .from('recurring_expenses')
      .select(`
        *,
        expense_categories (name, color),
        user_profiles!recurring_expenses_paid_by_user_id_fkey (fullname, email)
      `)
      .eq('divvy_id', divvyId);

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recurring expenses:', error);
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
    const { 
      paid_by_user_id, 
      amount, 
      category_id, 
      description, 
      frequency, 
      interval_value, 
      start_date, 
      end_date 
    } = body;

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

    // Validation
    if (!divvyId || !paid_by_user_id || !amount || !description || !frequency || !start_date) {
      return NextResponse.json({ 
        error: 'Required fields: paid_by_user_id, amount, description, frequency, start_date' 
      }, { status: 400 });
    }

    // Calculate next due date
    const nextDue = calculateNextDueDate(frequency, interval_value || 1, start_date);

    const { data, error } = await supabaseAdmin
      .from('recurring_expenses')
      .insert([{
        divvy_id: divvyId,
        paid_by_user_id,
        amount,
        category_id,
        description: description.trim(),
        frequency,
        interval_value: interval_value || 1,
        start_date,
        end_date,
        next_due_at: nextDue,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring expense:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { divvyId: string } }) {
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

    const { data, error } = await supabaseAdmin
      .from('recurring_expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating recurring expense:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { divvyId: string } }) {
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

    const { error } = await supabaseAdmin
      .from('recurring_expenses')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting recurring expense:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateNextDueDate(frequency: string, interval: number, startDate: string): string {
  const start = new Date(startDate);
  const nextDue = new Date(start);

  switch (frequency) {
    case 'daily':
      nextDue.setDate(nextDue.getDate() + interval);
      break;
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + (7 * interval));
      break;
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + interval);
      break;
    case 'yearly':
      nextDue.setFullYear(nextDue.getFullYear() + interval);
      break;
    default:
      nextDue.setDate(nextDue.getDate() + interval);
  }

  return nextDue.toISOString();
}