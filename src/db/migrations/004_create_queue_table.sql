CREATE TABLE IF NOT EXISTS queue (
    id SERIAL PRIMARY KEY,
    token_address VARCHAR(255) NOT NULL,
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('premium', 'standard', 'free')),
    position INTEGER NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(token_address)
);