-- ===========================
-- DIVVY DB AUDIT / VERIFY
-- ===========================

-- Tabelas críticas
select 'table' as kind, t.table_name
from information_schema.tables t
where t.table_schema='public'
  and t.table_name in (
    'divvies','divvymembers','expenses','expense_splits',
    'payments','divvy_periods',
    'expense_categories','expense_attachments'
  )
order by t.table_name;

-- Colunas críticas: expenses.categoryid
select 'column' as kind, c.table_name, c.column_name, c.data_type
from information_schema.columns c
where c.table_schema='public'
  and c.table_name='expenses'
  and c.column_name in ('categoryid','category','expense_date','payeruserid')
order by c.column_name;

-- Colunas críticas: payments
select 'column' as kind, c.table_name, c.column_name, c.data_type
from information_schema.columns c
where c.table_schema='public'
  and c.table_name='payments'
  and c.column_name in ('from_userid','to_userid','amount_cents','paid_at')
order by c.column_name;

-- Tabelas de categorias/anexos
select 'column' as kind, c.table_name, c.column_name
from information_schema.columns c
where c.table_schema='public'
  and c.table_name in ('expense_categories','expense_attachments')
order by c.table_name, c.column_name;

-- Funções esperadas (ajuste nomes se você tiver versões diferentes)
select 'function' as kind, p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public'
  and p.proname in ('is_divvy_member','is_divvy_admin_or_creator','seed_expense_categories')
order by p.proname;

-- Policies (categorias/anexos)
select 'policy' as kind, schemaname, tablename, policyname
from pg_policies
where schemaname='public'
  and tablename in ('expense_categories','expense_attachments','divvy_periods')
order by tablename, policyname;
