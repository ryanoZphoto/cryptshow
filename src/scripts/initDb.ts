import { Pool } from 'pg';
import { ConfigService } from '../services/ConfigService';

async function initializeDatabase() {
    const config = new ConfigService();
    const pool = new Pool(config.dbConfig);

    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS token_submissions (
                id SERIAL PRIMARY KEY,
                token_address VARCHAR(255) UNIQUE NOT NULL,
                token_name VARCHAR(255) NOT NULL,
                token_symbol VARCHAR(50) NOT NULL,
                token_decimals INTEGER NOT NULL,
                website_url TEXT,
                description TEXT,
                submitter_address VARCHAR(255) NOT NULL,
                fee_percentage NUMERIC(5,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id SERIAL PRIMARY KEY,
                token_address VARCHAR(255) NOT NULL,
                from_address VARCHAR(255) NOT NULL,
                to_address VARCHAR(255) NOT NULL,
                amount VARCHAR(255) NOT NULL,
                fee VARCHAR(255) NOT NULL,
                transaction_hash VARCHAR(255) UNIQUE NOT NULL,
                block_number BIGINT NOT NULL,
                fee_collected BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (token_address) REFERENCES token_submissions(token_address)
            );
        `);

        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run if this file is executed directly
if (require.main === module) {
    initializeDatabase()
        .then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
} 