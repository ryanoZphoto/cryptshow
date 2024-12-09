"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
async function testDatabase() {
    dotenv.config();
    const pool = new pg_1.Pool({
        user: 'postgres',
        password: 'Verizon23!',
        host: 'localhost',
        port: 5432,
        database: 'token_monitor'
    });
    try {
        console.log('Testing token submission and transaction tracking...');
        // First, insert the token submission
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
            ) RETURNING id, token_address;
        `);
        console.log('✅ Token submitted with ID:', tokenSubmission.rows[0].id);
        // Then, insert the transaction
        const transaction = await pool.query(`
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
                'sender123',
                'receiver456',
                '1000000000',
                '1000000',
                '0x123456789abcdef',
                12345678,
                false,
                NOW()
            ) RETURNING id;
        `, [tokenSubmission.rows[0].token_address]);
        console.log('✅ Transaction recorded with ID:', transaction.rows[0].id);
        // Query both tables to show relationship
        const results = await pool.query(`
            SELECT 
                t.id as transaction_id,
                t.amount,
                t.fee,
                t.fee_collected,
                ts.token_name,
                ts.token_symbol
            FROM transactions t
            JOIN token_submissions ts 
                ON t.token_address = ts.token_address
            WHERE t.id = $1
        `, [transaction.rows[0].id]);
        console.log('\nTransaction Data with Token Info:');
        console.log(results.rows[0]);
        // Clean up test data (in correct order due to foreign key)
        await pool.query('DELETE FROM transactions WHERE id = $1', [transaction.rows[0].id]);
        await pool.query('DELETE FROM token_submissions WHERE id = $1', [tokenSubmission.rows[0].id]);
        console.log('\n✅ Test data cleaned up');
        await pool.end();
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        if (error.detail)
            console.error('Detail:', error.detail);
        // Attempt to clean up any partial data
        try {
            await pool.query('DELETE FROM transactions WHERE token_address = $1', ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']);
            await pool.query('DELETE FROM token_submissions WHERE token_address = $1', ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v']);
        }
        catch (cleanupError) {
            console.error('Cleanup failed:', cleanupError.message);
        }
        await pool.end();
    }
}
testDatabase();
