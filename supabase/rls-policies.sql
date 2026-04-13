-- Row Level Security Policies

-- Enable RLS on the table
ALTER TABLE your_table_name ENABLE ROW LEVEL SECURITY;

-- Create a policy
CREATE POLICY your_policy_name
    ON your_table_name
    FOR SELECT
    USING (user_id = auth.uid());