import { Pool } from 'pg';
import * as dotenv from 'dotenv';

async function testTokenMonitoring() {
    dotenv.config();
    
    const pool = new Pool({
        user: 'postgres',
        password: 'Verizon23!',
        host: 'localhost',
        port: 5432,
        database: 'token_monitor'
    });

    try {
        console.log('Testing complete token monitoring flow...\n');

        // 1. Submit a new token
        const tokenSubmission = await pool.query(`
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
            ) VALUES (
                'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                'USDC',
                'USDC',
                6,
                'https://www.circle.com',
                'USD Coin on Solana',
                'submitter123',
                'approved',
                1,
                NOW(),
                NOW()
            ) RETURNING *;
        `);

        console.log('1. Token Submitted:', {
            id: tokenSubmission.rows[0].id,
            name: tokenSubmission.rows[0].token_name,
            status: tokenSubmission.rows[0].status
        });

        // 2. Record multiple transactions
        const transactions = [];
        for (let i = 0; i < 3; i++) {
            const tx = await pool.query(`
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
                ) VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    false,
                    NOW()
                ) RETURNING *;
            `, [
                tokenSubmission.rows[0].token_address,
                `sender${i}`,
                `receiver${i}`,
                (1000000 * (i + 1)).toString(),
                (1000 * (i + 1)).toString(),
                `0x${i}23456789abcdef`,
                12345678 + i
            ]);
            
            transactions.push(tx.rows[0]);
        }

        console.log('\n2. Transactions Recorded:', transactions.length);

        // 3. Get transaction summary
        const summary = await pool.query(`
            SELECT 
                ts.token_name,
                ts.token_symbol,
                COUNT(*) as tx_count,
                SUM(CAST(t.amount AS NUMERIC)) as total_amount,
                SUM(CAST(t.fee AS NUMERIC)) as total_fees
            FROM transactions t
            JOIN token_submissions ts ON t.token_address = ts.token_address
            WHERE t.token_address = $1
            GROUP BY ts.token_name, ts.token_symbol;
        `, [tokenSubmission.rows[0].token_address]);

        console.log('\n3. Transaction Summary:');
        console.log(summary.rows[0]);

        // Clean up
        await pool.query('DELETE FROM transactions WHERE token_address = $1', 
            [tokenSubmission.rows[0].token_address]);
        await pool.query('DELETE FROM token_submissions WHERE id = $1', 
            [tokenSubmission.rows[0].id]);

        console.log('\n✅ Test data cleaned up');
        await pool.end();

    } catch (error) {
        console.error('❌ Test failed:', error);
        if (error.detail) console.error('Detail:', error.detail);
        await pool.end();
    }
}

testTokenMonitoring();