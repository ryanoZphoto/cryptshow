-- Create the database if it doesn't exist
CREATE DATABASE token_monitor;

-- Connect to the database
\c token_monitor;

-- Create tables
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS token_submissions;

CREATE TABLE token_submissions (
    id SERIAL PRIMARY KEY,
    token_address VARCHAR(44) NOT NULL UNIQUE,
    token_name VARCHAR(100) NOT NULL,
    token_symbol VARCHAR(20) NOT NULL,
    token_decimals INTEGER NOT NULL,
    website_url VARCHAR(255),
    twitter_url VARCHAR(255),
    telegram_url VARCHAR(255),
    discord_url VARCHAR(255),
    description TEXT,
    logo_url VARCHAR(255),
    submitter_address VARCHAR(44) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    fee_percentage INTEGER DEFAULT 10 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    token_address VARCHAR(44) NOT NULL,
    from_address VARCHAR(44) NOT NULL,
    to_address VARCHAR(44) NOT NULL,
    amount VARCHAR NOT NULL,
    fee VARCHAR NOT NULL,
    transaction_hash VARCHAR(88) UNIQUE NOT NULL,
    block_number BIGINT NOT NULL,
    fee_collected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (token_address) REFERENCES token_submissions(token_address)
); 