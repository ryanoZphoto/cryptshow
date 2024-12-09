import { Pool } from 'pg';
import * as dotenv from 'dotenv';

interface TokenSubmission {
    token_address: string;
    token_name: string;
    token_symbol: string;
    token_decimals: number;
    website_url: string;
    description: string;
    submitter_address: string;
    fee_percentage: number;
}

interface Transaction {
    token_address: string;
    from_address: string;
    to_address: string;
    amount: string;
    fee: string;
    transaction_hash: string;
    block_number: number;
}

export class TokenMonitorService {
    private pool: Pool;

    constructor() {
        dotenv.config();
        this.pool = new Pool({
            user: 'postgres',
            password: 'Verizon23!',
            host: 'localhost',
            port: 5432,
            database: 'token_monitor'
        });
    }

    async submitToken(token: TokenSubmission): Promise<number> {
        const result = await this.pool.query(`
            INSERT INTO token_submissions (
                token_address,
                token_name,
                token_symbol,
                token_decimals,
                website_url,
                description,
                submitter_address,
                status,
                fee_percentage,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, NOW(), NOW())
            RETURNING id;
        `, [
            token.token_address,
            token.token_name,
            token.token_symbol,
            token.token_decimals,
            token.website_url,
            token.description,
            token.submitter_address,
            token.fee_percentage
        ]);

        return result.rows[0].id;
    }

    async recordTransaction(tx: Transaction): Promise<number> {
        const result = await this.pool.query(`
            INSERT INTO transactions (
                token_address,
                from_address,
                to_address,
                amount,
                fee,
                transaction_hash,
                block_number,
                fee_collected,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
            RETURNING id;
        `, [
            tx.token_address,
            tx.from_address,
            tx.to_address,
            tx.amount,
            tx.fee,
            tx.transaction_hash,
            tx.block_number
        ]);

        return result.rows[0].id;
    }

    async getTokenSummary(tokenAddress: string) {
        const result = await this.pool.query(`
            SELECT 
                ts.token_name,
                ts.token_symbol,
                ts.status,
                COUNT(t.id) as transaction_count,
                SUM(CAST(t.amount AS NUMERIC)) as total_volume,
                SUM(CAST(t.fee AS NUMERIC)) as total_fees
            FROM token_submissions ts
            LEFT JOIN transactions t ON ts.token_address = t.token_address
            WHERE ts.token_address = $1
            GROUP BY ts.token_name, ts.token_symbol, ts.status;
        `, [tokenAddress]);

        return result.rows[0];
    }

    async close() {
        await this.pool.end();
    }
} 