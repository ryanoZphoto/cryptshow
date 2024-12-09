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
exports.TokenMonitorService = void 0;
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
class TokenMonitorService {
    constructor() {
        dotenv.config();
        this.pool = new pg_1.Pool({
            user: 'postgres',
            password: 'Verizon23!',
            host: 'localhost',
            port: 5432,
            database: 'token_monitor'
        });
    }
    async submitToken(token) {
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
    async recordTransaction(tx) {
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
    async getTokenSummary(tokenAddress) {
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
exports.TokenMonitorService = TokenMonitorService;
