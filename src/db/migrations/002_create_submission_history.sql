-- Create submission history table
CREATE TABLE IF NOT EXISTS submission_history (
    id SERIAL PRIMARY KEY,
    token_address TEXT NOT NULL,
    token_name TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    submitter_wallet TEXT NOT NULL,
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL CHECK (status IN ('accepted', 'rejected')),
    rejection_reason TEXT,
    
    -- Create indexes for faster lookups
    CONSTRAINT unique_token_address UNIQUE (token_address),
    CONSTRAINT unique_token_name_symbol UNIQUE (token_name, token_symbol)
);

-- Create index for wallet submission frequency checks
CREATE INDEX idx_wallet_submissions 
ON submission_history (submitter_wallet, submission_time);

-- Create index for token name search
CREATE INDEX idx_token_name 
ON submission_history (token_name); 