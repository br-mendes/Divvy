-- Phase 2 Missing Tables - Safe Creation
-- Based on database analysis, these tables are missing for complete Phase 2 functionality

DO $$
BEGIN
    -- Create recurring_expenses table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recurring_expenses' AND table_schema = 'public') THEN
        CREATE TABLE recurring_expenses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            divvy_id UUID REFERENCES divvies(id) ON DELETE CASCADE,
            paid_by_user_id UUID REFERENCES user_profiles(id),
            amount DECIMAL(10,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'BRL',
            category_id UUID REFERENCES expense_categories(id),
            description TEXT NOT NULL,
            frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
            interval_value INTEGER DEFAULT 1,
            start_date DATE NOT NULL,
            end_date DATE,
            is_active BOOLEAN DEFAULT true,
            last_generated_at TIMESTAMP WITH TIME ZONE,
            next_due_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Indexes for performance
        CREATE INDEX idx_recurring_expenses_divvy_id ON recurring_expenses(divvy_id);
        CREATE INDEX idx_recurring_expenses_paid_by ON recurring_expenses(paid_by_user_id);
        CREATE INDEX idx_recurring_expenses_next_due ON recurring_expenses(next_due_at) WHERE is_active = true;
        
        RAISE NOTICE 'Created recurring_expenses table';
    END IF;

    -- Create settlement_proposals table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settlement_proposals' AND table_schema = 'public') THEN
        CREATE TABLE settlement_proposals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            divvy_id UUID REFERENCES divvies(id) ON DELETE CASCADE,
            created_by UUID REFERENCES user_profiles(id),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            optimization_algorithm VARCHAR(50) DEFAULT 'minimum_transactions',
            total_amount DECIMAL(10,2),
            transaction_count INTEGER,
            proposed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
            accepted_by UUID[],
            accepted_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Indexes
        CREATE INDEX idx_settlement_proposals_divvy ON settlement_proposals(divvy_id);
        CREATE INDEX idx_settlement_proposals_status ON settlement_proposals(status);
        
        RAISE NOTICE 'Created settlement_proposals table';
    END IF;

    -- Create settlement_transactions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settlement_transactions' AND table_schema = 'public') THEN
        CREATE TABLE settlement_transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            proposal_id UUID REFERENCES settlement_proposals(id) ON DELETE CASCADE,
            from_user_id UUID REFERENCES user_profiles(id),
            to_user_id UUID REFERENCES user_profiles(id),
            amount DECIMAL(10,2) NOT NULL,
            payment_method_id UUID REFERENCES payment_methods(id),
            due_date DATE,
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed')),
            confirmed_at TIMESTAMP WITH TIME ZONE,
            confirmed_by UUID REFERENCES user_profiles(id),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Indexes
        CREATE INDEX idx_settlement_transactions_proposal ON settlement_transactions(proposal_id);
        CREATE INDEX idx_settlement_transactions_status ON settlement_transactions(status);
        
        RAISE NOTICE 'Created settlement_transactions table';
    END IF;

    -- Create user_balances table
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_balances' AND table_schema = 'public') THEN
        CREATE TABLE user_balances (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
            divvy_id UUID REFERENCES divvies(id) ON DELETE CASCADE,
            balance_amount DECIMAL(10,2) DEFAULT 0, -- Positive = owed to user, Negative = user owes
            last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, divvy_id)
        );
        
        -- Indexes
        CREATE INDEX idx_user_balances_user_divvy ON user_balances(user_id, divvy_id);
        CREATE INDEX idx_user_balances_amount ON user_balances(balance_amount);
        
        RAISE NOTICE 'Created user_balances table';
    END IF;

    -- Add missing columns to existing tables safely
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'category_id' AND table_schema = 'public') THEN
        ALTER TABLE expenses ADD COLUMN category_id UUID REFERENCES expense_categories(id);
        CREATE INDEX idx_expenses_category ON expenses(category_id);
        RAISE NOTICE 'Added category_id to expenses table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'is_recurring' AND table_schema = 'public') THEN
        ALTER TABLE expenses ADD COLUMN is_recurring BOOLEAN DEFAULT false;
        ALTER TABLE expenses ADD COLUMN recurring_expense_id UUID REFERENCES recurring_expenses(id);
        ALTER TABLE expenses ADD COLUMN location VARCHAR(255);
        ALTER TABLE expenses ADD COLUMN tags TEXT[];
        ALTER TABLE expenses ADD COLUMN attachments_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added recurring and attachment columns to expenses table';
    END IF;

    -- Update existing transactions table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'settlement_proposal_id' AND table_schema = 'public') THEN
        ALTER TABLE transactions ADD COLUMN settlement_proposal_id UUID REFERENCES settlement_proposals(id);
        ALTER TABLE transactions ADD COLUMN due_date DATE;
        ALTER TABLE transactions ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id);
        ALTER TABLE transactions ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added settlement columns to transactions table';
    END IF;

END $$;

-- Create updated_at trigger function for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recurring_expenses' AND table_schema = 'public') THEN
        CREATE TRIGGER update_recurring_expenses_updated_at BEFORE UPDATE ON recurring_expenses 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'settlement_proposals' AND table_schema = 'public') THEN
        CREATE TRIGGER update_settlement_proposals_updated_at BEFORE UPDATE ON settlement_proposals 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;